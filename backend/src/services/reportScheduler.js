const cron = require("node-cron");
const databasePool = require("../config/database");

function startReportScheduler() {

    console.log("📧 Daily Report Scheduler Started");

    // Runs every minute
    cron.schedule("* * * * *", async () => {

        try {

            const result = await databasePool.query(`
                SELECT
                    sender_email,
                    brevo_api_key,
                    manager_email,
                    daily_reports_enabled,
                    report_time,
                    last_report_sent
                FROM settings
                WHERE setting_id = 1
            `);

            if (!result.rows.length) {

                console.log("⚠ No settings found.");

                return;

            }

            const settings = result.rows[0];

            const now = new Date();

const currentTime =
    now.toTimeString().slice(0, 5); // HH:mm

const reportTime =
    settings.report_time.slice(0, 5);

const today =
    now.toISOString().split("T")[0];

           console.log("──────────────");
console.log("Current :", currentTime);
console.log("Report  :", reportTime);
console.log("Enabled :", settings.daily_reports_enabled);
console.log("Last    :", settings.last_report_sent);
console.log("──────────────");

if (!settings.daily_reports_enabled) {

    console.log("Reports disabled.");

    return;

}

if (currentTime !== reportTime) {

    console.log("Not report time yet.");

    return;

}

if (
    settings.last_report_sent &&
    settings.last_report_sent.toISOString().split("T")[0] === today
) {

    console.log("Today's report already sent.");

    return;

}

console.log("✅ Time to send today's report!");
        }

        catch (error) {

            console.error("Scheduler Error:", error.message);

        }

    });

}

module.exports = {
    startReportScheduler
};