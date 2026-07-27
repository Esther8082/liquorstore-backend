const nodemailer = require("nodemailer");

console.log("EMAIL_HOST =", process.env.EMAIL_HOST);
console.log("EMAIL_PORT =", process.env.EMAIL_PORT);
console.log("EMAIL_USER =", process.env.EMAIL_USER);

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000
});

// Verify SMTP when the server starts
transporter.verify((error, success) => {

    if (error) {

        console.error("SMTP VERIFY FAILED");
        console.error(error);

    } else {

        console.log("SMTP VERIFY SUCCESS");

    }

});

async function sendEmail(to, subject, html) {

    return transporter.sendMail({

        from: `"LiquorStore POS" <${process.env.EMAIL_USER}>`,

        to,

        subject,

        html

    });

}

module.exports = { sendEmail };