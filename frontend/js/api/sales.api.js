import { API_BASE_URL } from "../config/api.js";

export async function createSale(sale) {

    const response = await fetch(`${API_BASE_URL}/sales`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(sale)

    });

    const data = await response.json();

    if (!response.ok) {

        throw new Error(data.error);

    }

    return data;

}