// require dotenv
require('dotenv').config();

// import nodeMailer and function to find user by email
const nodeMailer = require('nodemailer');
const {createTransport} = require("nodemailer");
const findUserByEmail = require('./user').findUserByEmail;



// function to send email to user with password reset code
async function sendResetPasswordEmail(email, code) {
    const user = await findUserByEmail(email);
    const name = user.username;
    const html = `
    <div style="background-color: #f4f4f4; padding: 10px;">
        <div style="background-color: #ffc107; padding: 10px; display: flex; align-items: center; justify-content: space-between; height: 50px;">
            <div style="display: flex; align-items: center;">
                <img src="https://cdn.discordapp.com/attachments/1064691949744967791/1111045379820097616/favicon_2.png" alt="KitchenGenie Logo" class="logo" style="width: 50px; height: 50px;"/>
                <h2 style="color: #333; margin-left: 10px;">KitchenGenie</h2>
            </div>
        </div>
        
        <br>
        <br>
        <div style="text-align: center;">  
        <h1 style="color: #333;">Hello ${name}, you have requested a password reset</h1>
        <h2 style="color: #333;">Reset Your Password</h2>
        <p style="color: #333;">Please enter the following code on the website:</p>
        <h3>${code}</h3>
        <br>
        <br>
        <br>
            <p style="color: #333;">Code expires in 10 minutes.</p>
            <p style="color: #333;">We will never share your password with anyone else.</p>   
        </div>
        
         <br>
        <br>
        <br>
        <div style="background-color: #ffc107; padding: 10px; display: flex; align-items: center; justify-content: center; height: 30px;">
            <p style="color: #333;">©KitchenGenie 2022-2023</p>
        </div>
    </div>
`;


    // create transporter object using nodemailer
    const transporter = nodeMailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAILJS_USER,
            pass: process.env.NODEMAILER_PW
        }
    });

    // info of email sender and receiver
    const info = await transporter.sendMail({
        from: `"KitchenGenie" <kitchengenievancouver@gmail.com>`,
        to: email,
        subject: `Reset Your Password`,
        html: html,
    });

    console.log("Message sent: %s", info.messageId);
}


module.exports = sendResetPasswordEmail;