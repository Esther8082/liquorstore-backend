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

export async function updateCustomer(customerId, customer) {

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

    if (!response.ok) {

        const error = await response.json();

        throw new Error(error.error);

    }

    return await response.json();

}