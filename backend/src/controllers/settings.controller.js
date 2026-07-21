const databasePool = require("../config/database");

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

module.exports = {

    getSettings,
    updateSettings

};