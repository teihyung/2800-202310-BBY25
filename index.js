
require("./utils.js");

require('dotenv').config();

const csv = require('csv-parser');
const fs = require('fs');
const sendResetPasswordEmail = require('./email.js');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const saltRounds = 12;

const port = process.env.PORT || 3000;

const app = express();

const Joi = require("joi");

const {ObjectId} = require('mongodb');

app.use(express.json());  // This line is important



const expireTime = 1 * 60 * 60 * 1000; //expires after 1 day  (hours * minutes * seconds * millis)


const { Configuration, OpenAIApi } = require('openai');
const {findUserByEmail} = require("./user");
require('dotenv').config();

const openaiConfiguration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(openaiConfiguration);

app.get('/', (req, res) => {
    res.render("main");
});

app.get('/recipe/:name', async (req, res) => {
    const recipeName = req.params.name;

    const messages = [
        { role: 'system', content: 'You are a helpful assistant that provides detailed instructions for a given recipe.' },
        { role: 'user', content: `How do I make ${recipeName}?` },
    ];

    try {
        const completion = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: messages,
        });

        const completionText = completion.data.choices[0].message.content;
        res.render('recipe', { name: recipeName, instructions: completionText });
    } catch (error) {
        console.log(error);
        res.status(500).send('Error retrieving recipe instructions.');
    }
});



/* secret information section */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const node_session_secret = process.env.NODE_SESSION_SECRET;
/* END secret section */

var {database} = include('databaseConnection');

const userCollection = database.db(mongodb_database).collection('users');

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: false}));

var mongoStore = MongoStore.create({
    mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
    crypto: {
        secret: mongodb_session_secret
    }
})

app.use(session({
        secret: node_session_secret,
        store: mongoStore, //default is memory store
        saveUninitialized: false,
        resave: true
    }
));


async function saveResetCode(email, code) {
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    // Update the user's document in MongoDB with the reset code
    await userCollection.updateOne(
        { email: email },
        { $set: { resetCode: code, resetCodeExpiration: expirationTime } }
    );
}

async function updatePassword(email, password) {
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update the user's document in MongoDB with the new password
    await userCollection.updateOne(
        { email: email },
        { $set: { password: hashedPassword } }
    );
}

function generateRandomCode() {
    // Generate a random 6-digit number
    return Math.floor(100000 + Math.random() * 900000);
}

function isValidSession(req) {
    if (req.session.authenticated) {
        return true;
    }
    return false;
}

function sessionValidation(req, res, next) {
    if (isValidSession(req)) {
        next();
    } else {
        res.redirect('/login');
    }
}


function isAdmin(req) {
    return req.session.user_type === 'admin';
}

function adminAuthorization(req, res, next) {
    if (!isAdmin(req)) {
        res.status(403);
        res.render("errorMessage", {error: "Not Authorized"});
        return;
    } else {
        next();
    }
}



app.get('/nosql-injection', async (req, res) => {
    var username = req.query.user;

    if (!username) {
        res.send(`<h3>no user provided - try /nosql-injection?user=name</h3> <h3>or /nosql-injection?user[$ne]=name</h3>`);
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
        res.send("<h1 style='color:darkred;'>A NoSQL injection attack was detected!!</h1>");
        return;
    }

    const result = await userCollection.find({username: username}).project({
        username: 1,
        password: 1,
        _id: 1
    }).toArray();

    res.send(`<h1>Hello ${username}</h1>`);
});

app.get('/about', (req, res) => {
    var color = req.query.color;

    res.render("about", {color: color});
});

app.get('/contact', (req, res) => {
    var missingEmail = req.query.missing;

    res.render("contact", {missing: missingEmail});
});

app.post('/submitEmail', (req, res) => {
    var email = req.body.email;
    if (!email) {
        res.redirect('/contact?missing=1');
    } else {
        res.render("submitEmail", {email: email});
    }
});


app.get('/createUser', (req, res) => {
    res.render("createUser");
});


app.get('/login', (req, res) => {
    if (req.session.authenticated) {
        res.redirect('/members');
    } else {
        res.render("login");
    }
});

app.post('/submitUser', async (req, res) => {

    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var status_user = req.body.status;


    const schema = Joi.object(
        {
            email: Joi.string().email().required(),
            username: Joi.string().alphanum().max(20).required(),
            password: Joi.string().max(20).required(),
        });

    const validationResult = schema.validate({email, username, password});
    if (validationResult.error != null) {
        console.log(validationResult.error);
        res.redirect("/createUser");
        return;
    }

    var hashedPassword = await bcrypt.hash(password, saltRounds);

    await userCollection.insertOne({
        email: email,
        username: username,
        password: hashedPassword,
        user_type: "user",
        status_user: status_user
    });
    console.log("Inserted user");

    req.session.authenticated = true;
    req.session.email = email;
    req.session.cookie.maxAge = expireTime;
    res.redirect('/members');
});

app.post('/loggingin', async (req, res) => {
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;

    const schema = Joi.object(
        {
            email: Joi.string().email().required(),
            username: Joi.string().alphanum().max(20).required(),
            password: Joi.string().max(20).required()
        });

    const validationResult = schema.validate(username);
    if (validationResult.error != null) {
        console.log(validationResult.error);
        res.redirect("/login");
        return;
    }

    const result = await userCollection.find({email: email}).project({email: 1, password: 1, user_type: 1}).toArray();
    // const user = await userCollection.findOne({ username });

    if (result.length !== 1) {
        console.log("user not found");
        res.redirect("/wrongPw");
        return;
    }
    if (await bcrypt.compare(password, result[0].password)) {
        console.log("correct password");
        req.session.user_type = (result[0].user_type === 'admin') ? 'admin' : 'user';
        req.session.authenticated = true;
        req.session.email = email;
        req.session.cookie.maxAge = expireTime;
        req.session.username = username;

        res.redirect('/members');
        return;
    } else {
        console.log("incorrect password");
        res.redirect('/wrongPw');
        return;
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.render("logout");
});

app.get('/wrongPw', (req, res) => {
    res.render("wrongPw");
});

app.use('/loggedin', sessionValidation);
app.get('/loggedin', (req, res) => {
    if (!req.session.authenticated) {
        res.redirect('/login');
    }
    res.render("loggedin");
});

app.get('/loggedin/info', (req, res) => {
    res.render("loggedin-info");
});

app.get('/forgot-password', (req, res) => {
    res.render("forgot-password");
});

app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    // Check if the user exists in the database
    const user = await findUserByEmail(email);

    if (user) {
        req.session.forgotPassword = true;
        const code = generateRandomCode();

        req.session.email = email;

        await sendResetPasswordEmail(email,code);

        await saveResetCode(email, code);
        // User exists, proceed with password reset logic
        // Generate and save a password reset token or code (optional)
        // Send a password reset email to the user (optional)
        // Redirect the user to a password reset form or page
        res.render('reset-password',{email});
    } else {
        // User does not exist, display an error message or handle as desired
        const error = 'User not found';
        console.log('Error:', error);
        res.render('forgot-password', { error: 'User not found' });
    }
});

app.get('/reset-password', async (req, res) => {
    if (req.session.forgotPassword) {
        // User not authorized, redirect to an error page or appropriate route
        return res.redirect('/error');
    }

    const user = await findUserByEmail(req.session.email);

    if (!user || user.resetCodeExpiration < new Date()) {
        // Invalid or expired reset code
        const error = 'Invalid or expired reset code';
        console.log('Error:', error);
        return res.render('reset-password', { error });
    }
    res.render("reset-password");
});

app.post('/reset-password', async (req, res) => {
    const { email, code } = req.body;
    // console.log('Email:', email);
    // console.log('Code:', code);

    // Check if the user exists in the database
    const user = await findUserByEmail(req.session.email);
    user.resetCode = code;
    console.log(user.resetCodeExpiration);
    console.log(new Date());

    if (user && user.resetCode === code && user.resetCodeExpiration > new Date()) {
        // User exists and the entered code matches the saved reset code
        res.redirect('/change_password');
    } else {
        // Invalid code or user not found
        const error = 'Invalid code';
        console.log('Error:', error);
        res.render('reset-password', { email, error });
    }
});


app.get('/admin', sessionValidation, adminAuthorization, async (req, res) => {
    const result = await userCollection.find().project({username: 1, email: 1, user_type: 1}).toArray();

    res.render("admin", {users: result});

    app.post('/promote/:id', async (req, res) => {
        const userId = req.params.id;
        await userCollection.updateOne({_id: ObjectId(userId)}, {$set: {user_type: 'admin'}});
        res.redirect('/admin');
    });

    app.post('/demote/:id', async (req, res) => {
        const userId = req.params.id;
        await userCollection.updateOne({_id: ObjectId(userId)}, {$set: {user_type: 'user'}});
        res.redirect('/admin');
    });
});

function getRandomRecipes(data, count) {
    const shuffledData = data.sort(() => 0.5 - Math.random());
    return shuffledData.slice(0, count);
  }
  
  
  function getRandomRecipeSuggestions() {
    return new Promise((resolve, reject) => {
    const csvFilePath = 'dataset.csv';
    const data = [];

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        data.push(row);
      })
      .on('end', () => {
        const randomRecipes = getRandomRecipes(data, 5);
        resolve(randomRecipes);
      })
      .on('error', (error) => {
        reject(error);
      });
    })
  }
    
  app.get('/members', async (req, res) => {
    if (req.session.authenticated) {
        try {    
              
           const ingredient = req.query.ingredient;

           const result = await userCollection.find({email: req.session.email}).project({
            username: 1}).toArray();

        const userData = {
            username: result[0].username
        }
  
            if (!ingredient) {
                try {
                    const randomRecipes = await getRandomRecipeSuggestions(); 
                    res.render('index', { userData, randomRecipes: randomRecipes });
                    console.log(req.session.username);
  
                } catch (error) {
                    console.error(error);
                    res.status(500).send('Error retrieving random recipe suggestions.');
                }
                return;
            }      
  
            const messages = [
                { role: 'system', content: 'You are a helpful assistant that suggests recipes based on given ingredients.' },
                { role: 'user', content: `Give me some recipes with ${ingredient}.` },
            ];
  
            try {
                const completion = await openai.createChatCompletion({
                    model: 'gpt-3.5-turbo',
                    messages: messages,
                });
  
                const completionText = completion.data.choices[0].message.content;
                const recipes = completionText.split('\n').filter(recipe => recipe.trim() !== '');
                res.render('search', { recipes: recipes });
            } catch (error) {
                console.log(error);
                res.status(500).send('Error retrieving recipes.');
            }
            return;
        } catch (error) {
            console.log(error);
            res.redirect('/login');
        }
  
    } else {
        res.redirect('/login');
        return;
    }
  });


app.get('/profile', async (req, res) => {
    if (req.session.authenticated) {
        try {
            const result = await userCollection.find({email: req.session.email}).project({
                username: 1,
                email: 1,
                password: 1,
                status_user: 1
            }).toArray();

            const userData = {
                username: result[0].username,
                email: result[0].email,
                password: result[0].password,
                status_user: result[0].status_user // Assign the status_user field value
            };

            res.render("profile", userData);
            return;
        } catch (error) {
            console.log(error);
            res.redirect('/login');
        }
    } else {
        res.redirect('/login');
        return;
    }

});

app.post('/saveProfile', async (req, res) => {

    if (req.session.authenticated) {
        try {
            const { status, customStatus } = req.body;
            const userEmail = req.session.email;
            console.log({ status, customStatus });


            await userCollection.updateOne(
                { email: userEmail },
                { $set: { status_user: status === 'Other' ? customStatus : status } }
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


app.post('/bookmarks/add', sessionValidation, async (req, res) => {
    if (req.session.authenticated) {
        try {
            const {title, url} = req.body;   // ???
            const userId = req.session.userId;

            await database.db(mongodb_database).collection('bookmarks').insertOne({
                    username: username,
                    title: title,
                    url: url
                }
            );
            console.log("Inserted user");


            res.status(200).send('Bookmark added successfully');
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    } else {
        res.status(401).send('Unauthorized');
    }
})

app.get('/change_password', (req, res) => {
    if(!req.session.forgotPassword){
        // User not authorized, redirect to an error page or appropriate route
        return res.redirect('/error');
    }
    res.render('change_password');
});

app.post('/change_password', async (req, res) => {
    const { password, confirmPassword } = req.body;
    const email = req.session.email;

    const user = await findUserByEmail(email);
    const previousPassword = user.password;

    if (password === confirmPassword) {
        const isSameOldPassword = await bcrypt.compare(password, previousPassword);
        // Passwords match
        if (isSameOldPassword) {
            // New password is the same as the previous password
            const error = 'New password cannot be the same as the previous password';
            console.log('Error:', error);
            return res.render('change_password', { error });
        }
        await updatePassword(email, password); // Replace 'updatePassword' with your function to update the password in the database
        req.session.destroy(); // Destroy the session so that the user can login again
        // Redirect the user to the login page or any other appropriate page
        return res.render('login');
    } else {
        // Passwords do not match
        const error = 'Passwords do not match';
        console.log('Error:', error);
        return res.render('change_password', { error });
    }
});

app.get('/bookmarks', sessionValidation, async (req, res) => {
    if (req.session.authenticated) {
        //   try {
        //     const userId = req.session.userId;

        //     const bookmarks = await database.db(mongodb_database).collection('bookmarks').find({ userId }).toArray();

        //     res.status(200).json(bookmarks);
        //   } catch (error) {
        //     console.log(error);
        //     res.status(500).send('Internal server error');
        //   }
        res.render("bookmarks")
    } else {
        res.status(401).send('Unauthorized');
    }
});

app.get('/ingredientsList', sessionValidation, async (req, res) => {
    if (req.session.authenticated) {
        res.render("ingredientsList")
    } else {
        res.status(401).send('Unauthorized');
    }
});

app.use(express.static(__dirname + "/public"));

app.get("*", (req, res) => {
    res.status(404);
    res.render("404");
})

app.listen(port, () => {
    console.log("Node application listening on port " + port);
}); 