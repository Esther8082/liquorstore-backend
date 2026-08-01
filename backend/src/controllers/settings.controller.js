const databasePool = require("../config/database");

const { sendEmail } =
require("../services/email.service");

// =========================
// GET SETTINGS
// =========================

const getSettings = async (req, res) => {

    try {

        const result = await databasePool.query(`
            SELECT
                setting_id,
                sender_email,
                brevo_api_key,
                manager_email,
                daily_reports_enabled,
                report_time
            FROM settings
            LIMIT 1
        `);

        res.json(result.rows[0]);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

};

// =========================
// UPDATE SETTINGS
// =========================

const updateSettings = async (req, res) => {

    try {

        const {

            sender_email,
            brevo_api_key,
            manager_email,
            daily_reports_enabled,
            report_time

        } = req.body;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(sender_email)) {

    return res.status(400).json({

        error: "Invalid sender email."

    });

}

if (!emailRegex.test(manager_email)) {

    return res.status(400).json({

        error: "Invalid manager email."

    });

}

const [hours, minutes] = report_time.split(":").map(Number);

const totalMinutes = (hours * 60) + minutes;

const earliest = (8 * 60) + 30;   // 08:30
const latest = (17 * 60) + 30;    // 17:30

if (totalMinutes < earliest || totalMinutes > latest) {

    return res.status(400).json({

        error: "Report time must be between 08:30 and 17:30."

    });

}

        const result = await databasePool.query(

            `
            UPDATE settings
            SET
                sender_email = $1,
                brevo_api_key = $2,
                manager_email = $3,
                daily_reports_enabled = $4,
                report_time = $5
            WHERE setting_id = 1
            RETURNING *
            `,

            [

                sender_email,
                brevo_api_key,
                manager_email,
                daily_reports_enabled,
                report_time

            ]

        );

        res.json(result.rows[0]);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            error: error.message

        });

    }

};

// =========================
// SEND TEST EMAIL
// =========================

const sendTestEmail = async (req, res) => {

    try {

        const result = await databasePool.query(`

            SELECT
                sender_email,
                brevo_api_key,
                manager_email
            FROM settings
            WHERE setting_id = 1

        `);

        if (!result.rows.length) {

            return res.status(404).json({

                error: "Settings not found."

            });

        }

        const settings = result.rows[0];

        if (!settings.manager_email) {

            return res.status(400).json({

                error: "Manager email is not configured."

            });

        }

        if (!settings.sender_email) {

            return res.status(400).json({

                error: "Sender email is not configured."

            });

        }

        if (!settings.brevo_api_key) {

            return res.status(400).json({

                error: "Brevo API Key is not configured."

            });

        }

        await sendEmail(

            settings.sender_email,
            settings.brevo_api_key,
            settings.manager_email,

            "LiquorStore POS Test Email",

            `
            <h2>LiquorStore POS</h2>

            <p>

                This is a test email from your
                LiquorStore POS.

            </p>

            <p>

                Your email configuration is working correctly.

            </p>

            <hr>

            <small>

                LiquorStore POS

            </small>
            `

        );

        res.json({

            message: "Test email sent successfully."

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            error: error.message

        });

    }

};

module.exports = {

    getSettings,
    updateSettings,
    sendTestEmail

};