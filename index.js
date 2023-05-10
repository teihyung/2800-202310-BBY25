require("./utils.js");

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const saltRounds = 12;

const port = process.env.PORT || 3000;

const app = express();

const Joi = require("joi");

const {ObjectId} = require('mongodb');


const expireTime = 1 * 60 * 60 * 1000; //expires after 1 day  (hours * minutes * seconds * millis)


const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const openaiConfiguration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(openaiConfiguration);

app.get('/', (req, res) => {
    res.render("main");
});

// app.get('/members', async (req, res) => {
//
//     const ingredient = req.query.ingredient;
//
//     if (!ingredient) {
//       res.render('index', { recipes: [] });
//       return;
//     }
//
//     const messages = [
//       { role: 'system', content: 'You are a helpful assistant that suggests recipes based on given ingredients.' },
//       { role: 'user', content: `Give me some recipes with ${ingredient}.` },
//     ];
//
//     try {
//       const completion = await openai.createChatCompletion({
//         model: 'gpt-3.5-turbo',
//         messages: messages,
//       });
//
//       const completionText = completion.data.choices[0].message.content;
//       const recipes = completionText.split('\n').filter(recipe => recipe.trim() !== '');
//       res.render('search', { recipes: recipes });
//     } catch (error) {
//       console.log(error);
//       res.status(500).send('Error retrieving recipes.');
//     }
//   });





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

    await userCollection.insertOne({email: email, username: username, password: hashedPassword, user_type: "user"});
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

    if (result.length != 1) {
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

        res.redirect('/members');
        return;
    } else {
        console.log("incorrect password");
        var errorMsg = "Incorrect email or password.";
        errorMsg += "<a href='/login'>try again</a>";
        res.send(errorMsg);
        return;
    }
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

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.render("logout");
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

app.get('/members', async (req, res) => {
    if (req.session.authenticated) {
        try {
            const ingredient = req.query.ingredient;

            if (!ingredient) {
                res.render('index', { recipes: [] });
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
                password: 1
            }).toArray();
            res.render("profile", {username: result[0].username, email: result[0].email, password: result[0].password});
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