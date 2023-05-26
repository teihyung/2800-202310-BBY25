/**
 * requirement imports for the project and instance variables
 *
 * @type {module:fs}
 * @type {module:express}
 * @type {module:express-session}
 * @type {module:connect-mongo}
 * @type {module:bcrypt}
 * @type {number}
 * @type {module:openai}
 * @type {module:dotenv}
 * @type {module:csv-parser}
 *
 */
require("./utils.js");

require("dotenv").config();

const csv = require("csv-parser");
const fs = require("fs");
const sendResetPasswordEmail = require("./email.js");
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcrypt");
const saltRounds = 12;

const port = process.env.PORT || 3000;

const app = express();

const Joi = require("joi");

const { ObjectId } = require("mongodb");

app.use(express.json()); // This line is important

const expireTime = 1 * 60 * 60 * 1000; //expires after 1 day  (hours * minutes * seconds * millis)

const { Configuration, OpenAIApi } = require("openai");
const { findUserByEmail } = require("./user.js");
require("dotenv").config();

const openaiConfiguration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(openaiConfiguration);

/**
 * This is a page that renders the first page of the website
 *
 * @version 1.0
 * @author Tae Hyung Lee, Yeju Jung, Bingdi Zhou, Taehyuk Chung
 */
app.get("/", (req, res) => {
  res.render("main");
});

/* secret information section */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const node_session_secret = process.env.NODE_SESSION_SECRET;
/* END secret section */

var { database } = include("databaseConnection");

const userCollection = database.db(mongodb_database).collection("users");

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: false }));
app.use("/img", express.static("./img"));

var mongoStore = MongoStore.create({
  mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
  crypto: {
    secret: mongodb_session_secret,
  },
});

app.use(
  session({
    secret: node_session_secret,
    store: mongoStore, //default is memory store
    saveUninitialized: false,
    resave: true,
  })
);

/**
 *  update the session expiration time on each request and update the code for resetPassword.
 *
 * @param email as user's email
 * @param code as user's reset code
 * @returns {Promise<void>}
 */
async function saveResetCode(email, code) {
  const expirationTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  // Update the user's document in MongoDB with the reset code
  await userCollection.updateOne(
    { email: email },
    { $set: { resetCode: code, resetCodeExpiration: expirationTime } }
  );
}

/**
 * update the password for the user that was validated with the reset code
 *
 * @param email as user's email
 * @param password as user's password
 * @returns {Promise<void>}
 */
async function updatePassword(email, password) {
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Update the user's document in MongoDB with the new password
  await userCollection.updateOne(
    { email: email },
    { $set: { password: hashedPassword } }
  );
}

/**
 * code generator for the reset code
 *
 * @returns {number} the reset code
 */
function generateRandomCode() {
  // Generate a random 6-digit number
  return Math.floor(100000 + Math.random() * 900000);
}

/**
 * middleware returns boolean value to check if the user has a valid session
 *
 * @param req request object
 * @returns {boolean} true if the user has a valid session, false otherwise
 */
function isValidSession(req) {
  if (req.session.authenticated) {
    return true;
  }
  return false;
}

/**
 * middleware that checks if the user is valid to be in the session
 *
 * @param req request object
 * @param res response object
 * @param next next function
 */
function sessionValidation(req, res, next) {
  if (isValidSession(req)) {
    next();
  } else {
    res.redirect("/login");
  }
}

/**
 * nosql injection attack code
 *
 * @param res response object
 * @param req request object
 */
app.get("/nosql-injection", async (req, res) => {
  var username = req.query.user;

  if (!username) {
    res.send(
      `<h3>no user provided - try /nosql-injection?user=name</h3> <h3>or /nosql-injection?user[$ne]=name</h3>`
    );
    return;
  }
  console.log("user: " + username);

  const schema = Joi.string().max(20).required();
  const validationResult = schema.validate(username);

  //If we didn't use Joi to validate and check for a valid URL parameter below
  // we could run our userCollection.find and it would be possible to attack.
  // A URL parameter of user[$ne]=name would get executed as a MongoDB command
  // and may result in revealing information about all users or a successful
  // login without knowing the correct password.
  if (validationResult.error != null) {
    console.log(validationResult.error);
    res.send(
      "<h1 style='color:darkred;'>A NoSQL injection attack was detected!!</h1>"
    );
    return;
  }

  const result = await userCollection
    .find({ username: username })
    .project({
      username: 1,
      password: 1,
      _id: 1,
    })
    .toArray();

  res.send(`<h1>Hello ${username}</h1>`);
});

/**
 * app.get function that renders to the create user page
 *
 * @param req request object
 * @param res response object
 */
app.get("/createUser", (req, res) => {
  res.render("createUser");
});

/**
 * app.get function that renders user to members if logged in, else renders to login page
 *
 * @param req request object
 * @param res response object
 */
app.get("/login", (req, res) => {
  if (req.session.authenticated) {
    res.redirect("/members");
  } else {
    res.render("login");
  }
});

/**
 * create user function that creates a user and stores it in the database
 *
 * @param req request object
 * @param res response object
 */
app.post("/submitUser", async (req, res) => {
  var email = req.body.email;
  var username = req.body.username;
  var password = req.body.password;
  var status_user = req.body.status;

  const user = await findUserByEmail(email);

  if (user) {
    res.render("createUser", { error: "Email already exists" });
    return;
  }

  const schema = Joi.object({
    email: Joi.string().email().required(),
    username: Joi.string()
      .regex(
        /^[\w!@#$%^&*()\-=_+[\]{}|\\;:'",.<>/?]+(?: [\w!@#$%^&*()\-=_+[\]{}|\\;:'",.<>/?]+)*$/
      )
      .max(20)
      .required(),
    password: Joi.string().max(20).required(),
  });

  const validationResult = schema.validate({ email, username, password });
  if (validationResult.error != null) {
    const error = validationResult.error.details[0].message;
    console.log(error);
    res.render("createUser", { error: error });
    return;
  }

  var hashedPassword = await bcrypt.hash(password, saltRounds);

  try {
    await userCollection.insertOne({
      email: email,
      username: username,
      password: hashedPassword,
      user_type: "user",
      status_user: status_user,

      bookmarks: [],
      search_history: [], // Add the search_history field

      shoppinglist: [],
    });
    console.log("Inserted user");

    req.session.authenticated = true;
    req.session.email = email;
    req.session.cookie.maxAge = expireTime;
    res.redirect("/members");
  } catch (error) {
    console.error("Failed to insert user: ", error);
    // Handle the error here. You may want to redirect to an error page or show a message to the user.
    res.status(500).send("Error creating user.");
  }
});

/**
 * validate user function that checks if the user is valid when logging in
 *
 * @param req request object
 * @param res response object
 */
app.post("/loggingin", async (req, res) => {
  var email = req.body.email;
  var username = req.body.username;
  var password = req.body.password;

  const schema = Joi.object({
    email: Joi.string().email().required(),
    username: Joi.string().alphanum().max(20).required(),
    password: Joi.string().max(20).required(),
  });

  const validationResult = schema.validate(username);
  if (validationResult.error != null) {
    console.log(validationResult.error);
    res.redirect("/login");
    return;
  }

  const result = await userCollection
    .find({ email: email })
    .project({ email: 1, password: 1, user_type: 1 })
    .toArray();
  // const user = await userCollection.findOne({ username });

  if (result.length !== 1) {
    console.log("user not found");
    const error = "Incorrect email or password";
    res.render("login", { error: error });
    return;
  }
  if (await bcrypt.compare(password, result[0].password)) {
    console.log("correct password");
    req.session.user_type = result[0].user_type === "admin" ? "admin" : "user";
    req.session.authenticated = true;
    req.session.email = email;
    req.session.cookie.maxAge = expireTime;
    req.session.username = username;

    res.redirect("/members");
    return;
  } else {
    const error = "Incorrect email or password";
    res.render("login", { error: error });
    return;
  }
});

/**
 * logout function that logs the user out
 *
 * @param req The request object
 * @param res The response object
 */
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.render("logout");
});

/**
 * app.get function that renders user to members if logged in, else renders to login page
 *
 * @param req The request object
 * @param res The response object
 */
app.get("/loggedin", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/login");
  }
  res.render("loggedin");
});

/**
 * render to forgot password page
 *
 * @param req The request object
 * @param res The response object
 */
app.get("/forgot-password", (req, res) => {
  res.render("forgot-password");
});

/**
 * post function that sends the reset password email
 *
 * @param req The request object
 * @param res The response object
 */
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  // Check if the user exists in the database
  const user = await findUserByEmail(email);

  if (user) {
    req.session.forgotPassword = true;
    const code = generateRandomCode();

    req.session.email = email;

    await sendResetPasswordEmail(email, code);

    await saveResetCode(email, code);
    // User exists, proceed with password reset logic
    // Generate and save a password reset token or code (optional)
    // Send a password reset email to the user (optional)
    // Redirect the user to a password reset form or page
    res.render("reset-password", { email });
  } else {
    // User does not exist, display an error message or handle as desired
    const error = "User not found";
    console.log("Error:", error);
    res.render("forgot-password", { error: "User not found" });
  }
});

/**
 * render to reset password page that checks if the user put in the correct code
 *
 * @param req The request object
 * @param res The response object
 */
app.get("/reset-password", async (req, res) => {
  if (req.session.forgotPassword) {
    // User not authorized, redirect to an error page or appropriate route
    return res.redirect("/error");
  }

  const user = await findUserByEmail(req.session.email);

  if (!user && user.resetCodeExpiration < new Date()) {
    // Invalid or expired reset code
    const error = "Invalid or expired reset code";
    console.log("Error:", error);
    return res.render("reset-password", { error });
  }
  res.render("reset-password");
});

/**
 * post function that checks if the user put in the correct code
 *
 * @param req The request object
 * @param res The response object
 */
app.post("/reset-password", async (req, res) => {
  const { email, code } = req.body;
  const user = await findUserByEmail(req.session.email);
  // console.log('Email:', email);
  // console.log('Code:', code);
  const userCode = parseInt(code, 10);
  const dbCode = parseInt(user.resetCode, 10);

  // Check if the user exists in the database
  console.log(userCode === dbCode);
  console.log(code);
  console.log(user.resetCode);
  console.log(user.resetCodeExpiration);
  console.log(new Date());

  if (userCode === dbCode && user.resetCodeExpiration > new Date()) {
    // User exists and the entered code matches the saved reset code
    res.redirect("/change_password");
  } else {
    // Invalid code or user not found
    const error = "Invalid code or time expired";
    console.log("Error:", error);
    res.render("reset-password", { email, error });
  }
});

/**
 * get random recipes function that gets 5 random recipes from the dataset
 * @param data from the csv file
 * @param count the number of random recipes to get
 * @returns {*} the random recipes
 */
function getRandomRecipes(data, count) {
  const shuffledData = data.sort(() => 0.5 - Math.random());
  return shuffledData.slice(0, count);
}

/**
 * parse the csv file and get the random recipes
 *
 * @returns {Promise<unknown>} The promise that resolves to the random recipes
 */
function getRandomRecipeSuggestions() {
  return new Promise((resolve, reject) => {
    const csvFilePath = "dataset.csv";
    const data = [];

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (row) => {
        data.push(row);
      })
      .on("end", () => {
        const randomRecipes = getRandomRecipes(data, 5);
        resolve(randomRecipes);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

let randomRecipes;

/**
 * Easter egg function that renders the genie page in the search bar
 *
 * @param req The request object
 * @param res The response object
 */
app.get("/kitchenGenie", (req, res) => {
  res.render("kitchenGenie"); // Render the "Genie" view
});

/**
 * members page when user logs in the website
 *
 * @param req The request object
 * @param res The response object
 */
app.get("/members", async (req, res) => {
  if (req.session.authenticated) {
    try {
      const ingredient = req.query.ingredient;

      if (ingredient === "kitchenGenie") {
        // Redirect to a different route
        res.redirect("/kitchenGenie");
        return;
      }

      // Retrieve the user's search history from the database
      const result = await userCollection.findOne({ email: req.session.email });

      const userData = {
        username: result.username,
        search_history: result.search_history,
      };

      if (!ingredient) {
        try {
          randomRecipes = await getRandomRecipeSuggestions();

          res.render("index", {
            userData: userData,
            randomRecipes: randomRecipes,
            searchHistory: userData.search_history,
          });

          console.log(req.session.username);
        } catch (error) {
          console.error(error);
          res.status(500).send("Error retrieving random recipe suggestions.");
        }
        return;
      }

      // Update the user's search history in the database
      await userCollection.updateOne(
        { email: req.session.email },
        { $addToSet: { search_history: ingredient } }
      );

      const messages = [
        {
          role: "system",
          content:
            "You are a helpful assistant that suggests recipes based on given ingredients.",
        },
        {
          role: "user",
          content: `Give me some recipe options with ${ingredient}. Only the names please`,
        },
      ];

      try {
        const completion = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: messages,
        });

        const completionText = completion.data.choices[0].message.content;
        const recipes = completionText
          .split("\n")
          .filter((recipe) => recipe.trim() !== "");
        res.render("search", { userData, recipes: recipes }); // Send the user's search history to the frontend
      } catch (error) {
        console.log(error);
        next(error); // Pass the error to the error handling middleware
      }
      return;
    } catch (error) {
      console.log(error);
      res.redirect("/login");
    }
  } else {
    res.redirect("/login");
    return;
  }
});

/**
 * error page when unexpected error occurs
 *
 * @param req The request object
 * @param res The response object
 */
app.use((error, req, res, next) => {
  res.status(500).render("error", { error: error.message });
});



/**
 * profile page that shows the user's profile including username, email, hidden password, and status
 *
 * @param req The request object
 * @param res The response object
 */
app.get("/profile", async (req, res) => {
  if (req.session.authenticated) {
    try {
      const result = await userCollection
        .find({ email: req.session.email })
        .project({
          username: 1,
          email: 1,
          password: 1,
          status_user: 1,
        })
        .toArray();

      const userData = {
        username: result[0].username,
        email: result[0].email,
        password: result[0].password,
        status_user: result[0].status_user, // Assign the status_user field value
      };

      res.render("profile", userData);
      return;
    } catch (error) {
      console.log(error);
      res.redirect("/login");
    }
  } else {
    res.redirect("/login");
    return;
  }
});

/**
 * Save user profile status.
 *
 * @param req The HTTP request object.
 * @param res The HTTP response object.
 */
app.post("/saveProfile", async (req, res) => {
  if (req.session.authenticated) {
    try {
      const { status, customStatus } = req.body;
      const userEmail = req.session.email;
      console.log({ status, customStatus });

      await userCollection.updateOne(
        { email: userEmail },
        { $set: { status_user: status === "Other" ? customStatus : status } }
      );

      res.sendStatus(200);
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  } else {
    res.sendStatus(401);
  }
});


/**
 * Retrieve recipe information and instructions.
 *
 * @param req The HTTP request object.
 * @param res The HTTP response object.
 */
app.get("/recipe/:name", async (req, res) => {
  const recipeName = req.params.name.replace(/^\d+\.\s*/, "");
  const userIngredients = req.query.userIngredients
    ? req.query.userIngredients.split(",")
    : [];

  const messages = [
    {
      role: "system",
      content:
        "You are a helpful assistant that provides detailed instructions for a given recipe.",
    },
    {
      role: "user",
      content: `Provide a list of ingredients and step-by-step instructions on how to make ${recipeName}. Please have the number before each line. No blank line between two items.`,
    },
  ];

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: messages,
    });

    const completionText = completion.data.choices[0].message.content;
    const itemsRegex = /(\d+\..*\n?)+/g;

    const itemsMatch = completionText.match(itemsRegex);

    if (!itemsMatch) {
      res.status(500).send("Error retrieving items from the completion text.");
      return;
    }

    const ingredientsText = itemsMatch[0].trim().split("\n");
    const shoppingList = ingredientsText.filter(
      (ingredient) => !userIngredients.includes(ingredient)
    );

    const instructionsText = itemsMatch[1]
      .trim()
      .split("\n")
      .filter((line) => line.trim() !== "");

    const instructions = [];

    instructionsText.forEach((line) => {
      const stepMatch = line.match(/^\d+/);
      if (stepMatch) {
        const currentStep = parseInt(stepMatch[0]);
        const instruction = line.replace(/^\d+\.\s/, "").trim();
        instructions.push({ step: currentStep, instruction });
      }
    });

    res.render("recipe", {
      name: recipeName,
      shoppingList: shoppingList,
      instructions: instructionsText,
      userIngredients: req.query.userIngredients || "",
      originalUrl: req.originalUrl,
    });
  } catch (error) {
    console.log(error);
    res.render("error", { error: error });
  }
});


/**
 * Display the instruction page for a random recipe.
 *
 * @param req The HTTP request object.
 * @param res The HTTP response object.
 */
app.get("/recipe_ran/:title", (req, res) => {
  try {
    const recipeTitle = req.params.title;

    // Find the recipe with matching title from the randomRecipes variable
    const recipe = randomRecipes.find((recipe) => recipe.Title === recipeTitle);

    if (!recipe) {
      res.status(404).send("Recipe not found.");
      return;
    }

    const recipeInstructions = recipe.Instructions.split("\n").filter(
      (instruction) => instruction.trim() !== ""
    );
    const recipeIngredients = recipe.Ingredients.split(",").map((ingredient) =>
      ingredient.trim()
    );
    const formattedIngredients = recipeIngredients
      .join("\n")
      .replace(/[\[\]']/g, "")
      .replace(/plus more|and/g, "");

    // Render the 'recipe' template and pass the recipeTitle, recipeInstructions, and recipeIngredients variables
    res.render("random_recipe", {
      recipeImage: recipe.Image_Name,
      recipeTitle: recipe.Title,
      recipeInstructions: recipeInstructions,
      recipeIngredients: formattedIngredients,
      originalUrl: req.originalUrl,
      userId: req.session._id,
      isBookmarksPage: false,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving recipe instructions.");
  }
});


/**
 * Add ingredients from random recipes to the shopping list.
 *
 * @param req The HTTP request object.
 * @param res The HTTP response object.
 */
app.post("/shoppingList/add", sessionValidation, async (req, res) => {
  if (req.session.authenticated) {
    try {
      const { title, ingredients } = req.body; // Extract the userId and ingredients from the request body
      const userEmail = req.session.email;
      const user = await userCollection.findOne({ email: userEmail });
      const existingListIndex = user.shoppinglist.findIndex(
        (list) => list.title === title
      );

      if (existingListIndex === -1) {
        if (title != null && ingredients != null) {
          const result = await userCollection.updateOne(
            { email: userEmail },
            { $push: { shoppinglist: { title, ingredients } } }
          );

          res.status(200).send("List added successfully.");
        } else {
          res.status(400).send("Invalid title or ingredients.");
        }
      } else {
        res.status(400).send("List already exists.");
      }
    } catch (error) {
      console.log("Internal server error:", error);
      res.status(500).send("Internal server error");
    }
  } else {
    res.sendStatus(401);
  }
});


/**
 * Remove a list from the shopping list page.
 *
 * @param req The HTTP request object.
 * @param res The HTTP response object.
 */
app.post("/shoppingList/delete", sessionValidation, async (req, res) => {
  if (req.session.authenticated) {
    try {
      const { title, ingredients } = req.body; // Extract the userId and ingredients from the request body
      const userEmail = req.session.email;
      const user = await userCollection.findOne({ email: userEmail });
      const existingListIndex = user.shoppinglist.findIndex(
        (list) => list.title === title
      );

      if (existingListIndex !== -1) {
        const result = await userCollection.updateOne(
          { email: userEmail },
          { $pull: { shoppinglist: { title } } }
        );

        // console.log(result);
        res
          .status(200)
          .json({
            message: "List deleted successfully",
            deletedListTitle: title,
          });
      } else {
        // List already exists
        res.status(400).send("List already exists");
      }
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal server error");
    }
  } else {
    res.status(401).send("Unauthorized");
  }
});


/**
 * Add a bookmark to the user's bookmarks.
 *
 * @param req The HTTP request object.
 * @param res The HTTP response object.
 */
app.post("/bookmarks/add", sessionValidation, async (req, res) => {
  if (req.session.authenticated) {
    try {
      const { title, ingredients, instructions, url, isBookmarked } = req.body;
      const userEmail = req.session.email;
      const user = await userCollection.findOne({ email: userEmail });
      const existingBookmarkIndex = user.bookmarks.findIndex(
        (bookmark) => bookmark.url === url
      );

      if (existingBookmarkIndex === -1) {
        // Bookmark does not exist, add it
        const result = await userCollection.updateOne(
          { email: userEmail },
          {
            $push: {
              bookmarks: {
                title,
                ingredients,
                instructions,
                url,
                isBookmarked,
              },
            },
          }
        );

        console.log(result);
        res.status(200).send("Bookmark added successfully");
      } else {
        // Bookmark already exists
        res.status(400).send("Bookmark already exists");
      }
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal server error");
    }
  } else {
    res.status(401).send("Unauthorized");
  }
});


/**
 * Remove a bookmark from the user's bookmarks.
 *
 * @param req The HTTP request object.
 * @param res The HTTP response object.
 */
app.post("/bookmarks/remove", sessionValidation, async (req, res) => {
  if (req.session.authenticated) {
    try {
      const { title } = req.body;
      const userEmail = req.session.email;

      const user = await userCollection.findOne({ email: userEmail });
      const existingBookmarkIndex = user.bookmarks.findIndex(
        (bookmark) => bookmark.title === title
      );

      if (existingBookmarkIndex !== -1) {
        const result = await userCollection.updateOne(
          { email: userEmail },
          { $pull: { bookmarks: { title } } }
        );

        console.log(result);
        res.status(200).send("Bookmark removed successfully");
      } else {
        res.status(400).send("Bookmark does not exist");
      }
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal server error");
    }
  } else {
    res.status(401).send("Unauthorized");
  }
});


/**
 * Render the change password page.
 *
 * @param req The HTTP request object.
 * @param res The HTTP response object.
 */
app.get("/change_password", (req, res) => {
  if (!req.session.forgotPassword) {
    // User not authorized, redirect to an error page or appropriate route
    return res.redirect("/error");
  }
  res.render("change_password");
});


/**
 * Handle the change password request.
 *
 * @param req The HTTP request object.
 * @param res The HTTP response object.
 */
app.post("/change_password", async (req, res) => {
  const { password, confirmPassword } = req.body;
  const email = req.session.email;

  const user = await findUserByEmail(email);
  const previousPassword = user.password;

  if (password === confirmPassword) {
    const isSameOldPassword = await bcrypt.compare(password, previousPassword);
    // Passwords match
    if (isSameOldPassword) {
      // New password is the same as the previous password
      const error = "New password cannot be the same as the previous password";
      console.log("Error:", error);
      return res.render("change_password", { error });
    }
    await updatePassword(email, password); // Replace 'updatePassword' with your function to update the password in the database
    req.session.destroy(); // Destroy the session so that the user can login again
    // Redirect the user to the login page or any other appropriate page
    return res.render("login");
  } else {
    const error = "Passwords do not match";
    console.log("Error:", error);
    return res.render("change_password", { error });
  }
});


/**
 * Render the bookmarks page.
 *
 * @param req The HTTP request object.
 * @param res The HTTP response object.
 */
app.get("/bookmarks", sessionValidation, async (req, res) => {
  if (req.session.authenticated) {
    try {
      const userEmail = req.session.email;
      const user = await userCollection.findOne({ email: userEmail });

      if (user) {
        res.render("bookmarks", {
          bookmarks: user.bookmarks,
          isBookmarksPage: true, // Add this line
        });
      } else {
        res.status(404).send("User not found");
      }
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal server error");
    }
  } else {
    res.status(401).send("Unauthorized");
  }
});

/////////////////
app.get("/bookmarks_page", sessionValidation, async (req, res) => {
  if (req.session.authenticated) {
    try {
      const userEmail = req.session.email;
      const user = await userCollection.findOne({ email: userEmail });

      if (user) {
        res.render("bookmarks", {
          bookmarks: user.bookmarks,
          isBookmarksPage: true,
        });
      } else {
        res.status(404).send("User not found");
      }
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal server error");
    }
  } else {
    res.status(401).send("Unauthorized");
  }
});


/**
 * Render the bookmarks page with specific bookmark details.
 *
 * @param req The HTTP request object.
 * @param res The HTTP response object.
 */
app.get("/bookmarks_page/:title", sessionValidation, async (req, res) => {
  if (req.session.authenticated) {
    try {
      const userEmail = req.session.email;
      const bookmarkTitle = req.params.title;
      const user = await userCollection.findOne({ email: userEmail });

      if (user) {
        const bookmark = user.bookmarks.find(
          (bookmark) => bookmark.title === bookmarkTitle
        );
        if (bookmark) {
          res.render("bookmarks_page", { bookmark });
        } else {
          res.status(404).send("Bookmark not found");
        }
      } else {
        res.status(404).send("User not found");
      }
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal server error");
    }
  } else {
    res.status(401).send("Unauthorized");
  }
});


/**
 * Render the shopping list page.
 *
 * @param req The HTTP request object.
 * @param res The HTTP response object.
 */
app.get("/shoppingList", sessionValidation, async (req, res) => {
  if (req.session.authenticated) {
    try {
      const userEmail = req.session.email;
      const user = await userCollection.findOne({ email: userEmail });

      if (user) {
        //   console.log(user.shoppinglist);
        res.render("shoppingList", { shoppinglist: user.shoppinglist });
      } else {
        res.status(404).send("User not found");
      }
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal server error");
    }
  } else {
    res.status(401).send("Unauthorized");
  }
});


/**
 * Render the filter page.
 *
 * @param req The HTTP request object.
 * @param res The HTTP response object.
 */
app.get("/filter", async (req, res) => {
  res.render("filter");
});


/**
 * Handle the filter request and display recommended recipes.
 *
 * @param req The HTTP request object.
 * @param res The HTTP response object.
 */
app.post("/filter", async (req, res) => {
  const { servings, time, cuisine, spicy } = req.body;
  const messages = [
    {
      role: "system",
      content:
        "You are a helpful assistant that suggests name of foods based on given filters.",
    },
    {
      role: "user",
      content: `For week for lunch and dinner, Give me a list of some food that is ${cuisine} cuisine, ${spicy} spicy, for ${servings} servings, and within ${time} cooking time. Only the names please`,
    },
  ];

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: messages,
    });

    const completionText = completion.data.choices[0].message.content;
    const recipes = completionText
      .split("\n")
      .filter((recipe) => recipe.trim() !== "");
    res.render("filteredRecommendation", { recipes: recipes });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error retrieving recipe recommendations.");
  }
});


/**
 * Render the filtered recommendation page.
 *
 * @param req The HTTP request object.
 * @param res The HTTP response object.
 */
app.get("/filteredRecommendation", async (req, res) => {
  res.render("filteredRecommendation");
});


/**
 * Serve static files from the "public" directory.
 */
app.use(express.static(__dirname + "/public"));


/**
 * Handle the wildcard route and render the 404 page.
 *
 * @param req The HTTP request object.
 * @param res The HTTP response object.
 */
app.get("*", (req, res) => {
  res.status(404);
  res.render("404");
});


/**
 * Start the Node application and listen on the specified port.
 *
 * @param port The port number to listen on.
 */
app.listen(port, () => {
  console.log("Node application listening on port " + port);
});
