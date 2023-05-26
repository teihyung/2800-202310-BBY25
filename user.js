// instance variable database to the database connection instance created by the MongoClient constructor.
const bcrypt = require('bcrypt');
const saltRounds = 12;
const dotenv = require('dotenv');
dotenv.config();
const {database} = include('databaseConnection');


// Create a new collection called 'users'
const userCollection = database.db(process.env.MONGODB_DATABASE).collection('users');

// Insert a new user into the 'users' collection
async function createUser(email, username, password) {
    var hashedPassword = await bcrypt.hash(password, saltRounds);
    await userCollection.insertOne({email: email, username: username, password: hashedPassword, user_type: "user"});
    console.log("Inserted user");
}

// find a user by email and get relevant fields
async function findUserByEmail(email) {
    const result = await userCollection.find({email: email}).project({email: 1,username:1, password: 1, user_type: 1,resetCodeExpiration:1, resetCode:1}).toArray();
    if (result.length == 1) {
        return result[0];
    }
    else {
        return null;
    }
}

// update user type
async function updateUserType(email, user_type) {
    await userCollection.updateOne({email: email}, {$set: {user_type: user_type}});
}



// update user info
async function updateUser(email, changes) {
    await userCollection.updateOne({ email: email }, { $set: changes });
}


// export functions
module.exports = {
    createUser,
    findUserByEmail,
    updateUserType,
    updateUser, // Add this line
};

