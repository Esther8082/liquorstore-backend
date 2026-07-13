import { API_BASE_URL } from "../config/api.js";

export async function createCustomer(customer) {

    const response = await fetch(`${API_BASE_URL}/customers`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(customer)

    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error);
    }

    return data;
}