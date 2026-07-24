const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({

    host: "smtp.gmail.com",
    port: 587,
    secure: false,

    auth: {

        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD

    },

    tls: {
        rejectUnauthorized: false
    }

});

transporter.verify((error) => {

    if (error) {
        console.error("Email configuration error:", error);
    } else {
        console.log("Email server is ready.");
    }

});

async function sendEmail(to, subject, html) {

    return await transporter.sendMail({

        from: `"LiquorStore POS" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html

    });

}

module.exports = {
    sendEmail
};