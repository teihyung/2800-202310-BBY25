require('dotenv').config();

const nodeMailer = require('nodemailer');
const {createTransport} = require("nodemailer");

const html = `<h1>Hi</h1>
    <p>Thank you for subscribing</p>
`;

async function main(){

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
        to: `teihyung@gmail.com`,
        subject: `Welcome to Kitchen Genie`,
        html: html,
    })

    console.log("Message sent: %s", info.messageId);
}

main().catch(e=>console.log(e));
