import {

    getSettings,
    updateSettings, 
    sendTestEmail

} from "../api/settings.api.js";

// =========================
// ELEMENTS
// =========================

const managerEmail =
document.getElementById("manager-email");

const dailyReports =
document.getElementById("daily-reports-enabled");

const reportTime =
document.getElementById("report-time");

const saveButton =
document.getElementById("save-settings-btn");

const testEmailBtn =
document.getElementById("test-email-btn");
// =========================
// LOAD SETTINGS
// =========================

async function loadSettings() {

    try {

        const settings =
        await getSettings();

        managerEmail.value =
        settings.manager_email || "";

        dailyReports.checked =
        settings.daily_reports_enabled;

        reportTime.value =
        settings.report_time;

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}

// =========================
// SAVE SETTINGS
// =========================

saveButton.addEventListener("click", async () => {

    try {

        await updateSettings({

            manager_email:
            managerEmail.value.trim(),

            daily_reports_enabled:
            dailyReports.checked,

            report_time:
            reportTime.value

        });

        alert("Settings saved successfully.");

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});

testEmailBtn.addEventListener("click", async () => {

    try {

        testEmailBtn.disabled = true;

        testEmailBtn.textContent =
            "Sending...";

        const result =
            await sendTestEmail();

        alert(result.message);

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

    finally {

        testEmailBtn.disabled = false;

        testEmailBtn.textContent =
            "📧 Send Test Email";

    }

});

// =========================
// INITIAL LOAD
// =========================

loadSettings();