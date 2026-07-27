const axios = require("axios");

async function sendEmail(to, subject, html) {

    const response = await axios.post(

        "https://api.brevo.com/v3/smtp/email",

        {

            sender: {

                name: "LiquorStore POS",

                email: "estherakindele09@gmail.com"

            },

            to: [

                {

                    email: to

                }

            ],

            subject,

            htmlContent: html

        },

        {

            headers: {

                "api-key": process.env.BREVO_API_KEY,

                "Content-Type": "application/json"

            }

        }

    );

    return response.data;

}

module.exports = {

    sendEmail

};