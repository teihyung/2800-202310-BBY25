require('dotenv').config();

const nodeMailer = require('nodemailer');
const {createTransport} = require("nodemailer");



async function sendResetPasswordEmail(email, code) {

    const html = `
    <h1>Reset Your Password</h1>
    <p>Please put your code in the website:</p>
    <h3>${code}</h3>
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
        from: `"Kitchen Genie" <kitchengenievancouver@gmail.com>`,
        to: email,
        subject: `Reset Your Password`,
        html: html,
    });

    console.log("Message sent: %s", info.messageId);
}

module.exports = sendResetPasswordEmail;