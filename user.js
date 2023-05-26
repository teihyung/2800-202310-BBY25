/**
 * This code is used to find and update user information in the database.
 *
 * @author Bingdi Zhou, Tae Hyung Lee
 */


/**
 * instance variable database to the database connection instance created by the MongoClient constructor.
 *
 * @type {{genSaltSync?: function(*, *): *, genSalt?: function(*, *, *): (*|undefined), hashSync?: function(*, *): *, hash?: function(*, *, *): (void), compareSync?: function(*, *): *, compare?: function(*, *, *): (void), getRounds?: function(*): *}}
 */
const bcrypt = require('bcrypt');
const saltRounds = 12;
const dotenv = require('dotenv');
dotenv.config();
const {database} = include('databaseConnection');


const userCollection = database.db(process.env.MONGODB_DATABASE).collection('users');

/**
 *  Insert a new user into the 'users' collection
 *
 * @param email as user's email
 * @param username as user's username
 * @param password as user's password
 * @returns {Promise<void>}
 */
async function createUser(email, username, password) {
    var hashedPassword = await bcrypt.hash(password, saltRounds);
    await userCollection.insertOne({email: email, username: username, password: hashedPassword, user_type: "user"});
    console.log("Inserted user");
}

/**
 * find a user by email and get relevant fields
 *
 * @param email as user's email
 * @returns {Promise<*|null>}
 */
async function findUserByEmail(email) {
    const result = await userCollection.find({email: email}).project({email: 1,username:1, password: 1, user_type: 1,resetCodeExpiration:1, resetCode:1}).toArray();
    if (result.length == 1) {
        return result[0];
    }
    else {
        return null;
    }
}

/**
 * update user type
 *
 * @param email as user's email
 * @param user_type as user's type
 * @returns {Promise<void>}
 */
async function updateUserType(email, user_type) {
    await userCollection.updateOne({email: email}, {$set: {user_type: user_type}});
}


/**
 * update user info
 *
 * @param email as user's email
 * @param changes as user's changes
 * @returns {Promise<void>}
 */
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

