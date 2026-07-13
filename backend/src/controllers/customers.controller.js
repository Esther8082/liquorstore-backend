const databasePool = require("../config/database");

// =========================
// FETCH ALL CUSTOMERS
// =========================
const fetchCustomers = async (req, res) => {

    try {

        const result = await databasePool.query(`

            SELECT
                customer_id,
                name,
                phone_number,
                email,
                customer_type,
                created_at
            FROM customers
            ORDER BY name ASC

        `);

        res.status(200).json(result.rows);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

};

// =========================
// CREATE CUSTOMER
// =========================
const createCustomer = async (req, res) => {

    try {

        const {
            name,
            phone_number,
            email,
            customer_type
        } = req.body;

        if (!name || name.trim() === "") {

            return res.status(400).json({
                error: "Customer name is required."
            });

        }

        const result = await databasePool.query(

            `
            INSERT INTO customers
            (
                name,
                phone_number,
                email,
                customer_type
            )
            VALUES
            (
                $1,$2,$3,$4
            )
            RETURNING *
            `,

            [
                name,
                phone_number,
                email,
                customer_type
            ]

        );

        res.status(201).json(result.rows[0]);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

};

module.exports = {
    fetchCustomers,
    createCustomer
};