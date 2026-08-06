require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log("Starting email test...");
    try {
        const transporter = nodemailer.createTransport({
            host: 'mail.spacemail.com',
            port: 465,
            secure: true, 
            auth: {
                user: 'info@tokenbounty.io',
                pass: 'Guney51080.' 
            },
            logger: true,
            debug: true 
        });

        console.log("Transporter created, verifying connection...");
        await transporter.verify();
        console.log("Connection verified successfully!");

        const info = await transporter.sendMail({
            from: '"TokenBounty Admin" <info@tokenbounty.io>',
            to: 'tasarim.guney@gmail.com',
            subject: 'SMTP TEST - TokenBounty.io',
            text: 'This is a raw SMTP test to see if Spacemail actually delivers messages.',
        });

        console.log("Email sent successfully!");
        console.log("Message ID:", info.messageId);
        console.log("Response:", info.response);
    } catch (err) {
        console.error("Test failed with error:", err);
    }
}

testEmail();
