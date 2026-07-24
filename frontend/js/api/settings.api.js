 import { API_BASE_URL } from "../config/api.js";

// =========================
// GET SETTINGS
// =========================

export async function getSettings() {

    const response = await fetch(
        `${API_BASE_URL}/settings`
    );

    if (!response.ok) {

        throw new Error("Unable to load settings.");

    }

    return await response.json();

}

// =========================
// UPDATE SETTINGS
// =========================

export async function updateSettings(settings) {

    const response = await fetch(
        `${API_BASE_URL}/settings`,
        {

            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(settings)

        }
    );

    if (!response.ok) {

        const error = await response.json();

        throw new Error(error.error);

    }

    return await response.json();

};

export async function sendTestEmail() {

    const response = await fetch(

        `${API_BASE_URL}/settings/test-email`,

        {

            method: "POST"

        }

    );

    const result = await response.json();

    if (!response.ok) {

        throw new Error(result.error);

    }

    return result;

}