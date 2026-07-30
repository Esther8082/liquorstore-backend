import {
    getSettings,
    updateSettings,
    sendTestEmail
} from "../api/settings.api.js";

/* ============================================
   ELEMENTS
============================================ */

const senderEmail = document.getElementById("sender-email");
const brevoApiKey = document.getElementById("brevo-api-key");
const managerEmail = document.getElementById("manager-email");
const reportTime = document.getElementById("report-time");
const dailyReports = document.getElementById("daily-reports-enabled");

const saveButton = document.getElementById("save-settings-btn");
const testEmailBtn = document.getElementById("test-email-btn");

const emailTestSection =
document.getElementById("email-test-section");

const successSection =
document.getElementById("email-success-section");

const summaryEmail =
document.getElementById("summary-email");

const summaryTime =
document.getElementById("summary-time");

const progressTest =
document.getElementById("progress-test");

const progressComplete =
document.getElementById("progress-complete");

/* ============================================
   EMAIL VALIDATION
============================================ */

function isValidEmail(email){

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

}

/* ============================================
   NOTIFICATION
============================================ */

function showNotification(message, type = "success"){

    const notification =
    document.getElementById("notification");

    const text =
    document.getElementById("notification-message");

    notification.className =
    `notification ${type}`;

    text.textContent = message;

    notification.classList.remove("hidden");

    setTimeout(() => {

        notification.classList.add("hidden");

    }, 5000);

}

/* ============================================
   LOAD SETTINGS
============================================ */

async function loadSettings(){

    try{

        const settings =
        await getSettings();

        senderEmail.value =
        settings.sender_email || "";

        brevoApiKey.value =
        settings.brevo_api_key || "";

        managerEmail.value =
        settings.manager_email || "";

        reportTime.value =
        settings.report_time || "21:00";

        dailyReports.checked =
        settings.daily_reports_enabled;

        if(settings.sender_email && settings.brevo_api_key){

            emailTestSection.classList.remove("hidden");

            progressTest.classList.add("active");

        }

    }

    catch(error){

        console.error(error);

        showNotification(
            error.message,
            "error"
        );

    }

}

/* ============================================
   SAVE SETTINGS
============================================ */

saveButton.addEventListener(

    "click",

    async () => {

        /* -----------------------------
           VALIDATION
        ------------------------------ */

        if(!isValidEmail(senderEmail.value.trim())){

            showNotification(
                "Please enter a valid Sender Email.",
                "error"
            );

            senderEmail.focus();

            return;

        }

        if(!brevoApiKey.value.trim()){

            showNotification(
                "Please enter your Brevo API Key.",
                "error"
            );

            brevoApiKey.focus();

            return;

        }

        if(!isValidEmail(managerEmail.value.trim())){

            showNotification(
                "Please enter a valid Manager Email.",
                "error"
            );

            managerEmail.focus();

            return;

        }

        try{

            saveButton.disabled = true;

            saveButton.textContent =
            "Saving...";

            await updateSettings({

                sender_email:
                senderEmail.value.trim(),

                brevo_api_key:
                brevoApiKey.value.trim(),

                manager_email:
                managerEmail.value.trim(),

                report_time:
                reportTime.value,

                daily_reports_enabled:
                dailyReports.checked

            });

            emailTestSection.classList.remove("hidden");

            progressTest.classList.add("active");

            emailTestSection.scrollIntoView({

                behavior:"smooth"

            });

            showNotification(
                "Configuration saved successfully."
            );

        }

        catch(error){

            console.error(error);

            showNotification(
                error.message,
                "error"
            );

        }

        finally{

            saveButton.disabled = false;

            saveButton.textContent =
            "💾 Save Configuration";

        }

    }

);

/* ============================================
   TEST EMAIL
============================================ */

testEmailBtn.addEventListener(

    "click",

    async () => {

        try{

            testEmailBtn.disabled = true;

            testEmailBtn.textContent =
            "Sending...";

            const result =
            await sendTestEmail();

            successSection.classList.remove("hidden");

            progressComplete.classList.add("active");
            progressComplete.classList.add("complete");

            summaryEmail.textContent =
            managerEmail.value;

            summaryTime.textContent =
            reportTime.value;

            successSection.scrollIntoView({

                behavior:"smooth"

            });

            showNotification(result.message);

        }

        catch(error){

            console.error(error);

            showNotification(
                error.message,
                "error"
            );

        }

        finally{

            testEmailBtn.disabled = false;

            testEmailBtn.textContent =
            "📧 Send Test Email";

        }

    }

);

/* ============================================
   INITIAL LOAD
============================================ */

loadSettings();