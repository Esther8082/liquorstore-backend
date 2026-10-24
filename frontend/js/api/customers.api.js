
import { API_BASE_URL } from "../config/api.js";

// =========================================================
// CHECK LOCAL DATABASE AVAILABILITY
// =========================================================

function hasLocalDatabase() {
    return (
        typeof window !== "undefined" &&
        window.posDatabase &&
        typeof window.posDatabase.createLocalCustomer === "function"
    );
}

// =========================================================
// CREATE CUSTOMER
// Online: save to server.
// Offline: save to local SQLite database.
// =========================================================

export async function createCustomer(customer) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/customers`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(customer)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Failed to create customer."
            );
        }

        return data;

    } catch (error) {
        // Only use offline fallback for network failures.
        // Server validation errors should still be reported.
        if (error instanceof TypeError && hasLocalDatabase()) {
            return await window.posDatabase.createLocalCustomer(
                customer
            );
        }

        throw error;
    }
}

// =========================================================
// UPDATE CUSTOMER
// Online: update the server.
// Offline: update local SQLite.
// =========================================================

export async function updateCustomer(customerId, customer) {
    // Negative IDs belong to customers created locally.
    if (Number(customerId) < 0) {
        if (!hasLocalDatabase()) {
            throw new Error(
                "The local customer database is unavailable."
            );
        }

        return await window.posDatabase.updateLocalCustomer(
            Number(customerId),
            customer
        );
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/customers/${customerId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(customer)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Failed to update customer."
            );
        }

        return data;

    } catch (error) {
        if (error instanceof TypeError && hasLocalDatabase()) {
            return await window.posDatabase.updateLocalCustomer(
                Number(customerId),
                customer
            );
        }

        throw error;
    }
}
