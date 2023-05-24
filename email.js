require('dotenv').config();

const nodeMailer = require('nodemailer');
const {createTransport} = require("nodemailer");
const findUserByEmail = require('./user').findUserByEmail;



async function sendResetPasswordEmail(email, code) {
    const user = await findUserByEmail(email);
    const name = user.username;
    const html = `
    <div style="background-color: #f4f4f4; padding: 10px;">
        <img src="/img/favicon.png" alt="KitchenGenie Logo" class="logo" />
        <h1 style="color: #333;">Hello ${name}, you have requested a password reset</h1>
        <h2 style="color: #333;">Reset Your Password</h2>
        <p style="color: #333;">Please enter the following code on the website:</p>
        <h3>${code}</h3>
    </div>
`;

    const transporter = nodeMailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAILJS_USER,
            pass: process.env.NODEMAILER_PW
        }
    });

    const info = await transporter.sendMail({
        from: `"KitchenGenie" <kitchengenievancouver@gmail.com>`,
        to: email,
        subject: `Reset Your Password`,
        html: html,
    });

    console.log("Message sent: %s", info.messageId);
}

module.exports = sendResetPasswordEmail;