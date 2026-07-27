const axios = require("axios");

async function sendEmail(

    senderEmail,
    brevoApiKey,
    to,
    subject,
    html

) {

    const response = await axios.post(

        "https://api.brevo.com/v3/smtp/email",

        {

            sender: {

                name: "LiquorStore POS",

                email: senderEmail

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

                "api-key": brevoApiKey,

                "Content-Type": "application/json"

            }

        }

    );

    return response.data;

}

module.exports = {

    sendEmail

};