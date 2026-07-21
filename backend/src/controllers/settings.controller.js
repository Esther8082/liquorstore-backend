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

            manager_email,
            daily_reports_enabled,
            report_time

        } = req.body;

        const result = await databasePool.query(

            `
            UPDATE settings
            SET
                manager_email = $1,
                daily_reports_enabled = $2,
                report_time = $3
            WHERE setting_id = 1
            RETURNING *
            `,

            [

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

            SELECT manager_email

            FROM settings

            WHERE setting_id = 1

        `);

        if (!result.rows.length) {

            return res.status(404).json({

                error: "Settings not found."

            });

        }

        const email =
            result.rows[0].manager_email;

        if (!email) {

            return res.status(400).json({

                error: "Manager email is not configured."

            });

        }

        await sendEmail(

            email,

            "LiquorStore POS Test Email",

            `
            <h2>LiquorStore POS</h2>

            <p>

                This is a test email from your
                LiquorStore POS.

            </p>

            <p>

                If you received this email,
                your email configuration is
                working correctly.

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