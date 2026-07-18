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
// =========================
// CUSTOMER PURCHASE HISTORY
// =========================
const fetchCustomerHistory = async (req, res) => {

    try {

        const { id } = req.params;

        // Customer details
        const customerResult = await databasePool.query(
            `
            SELECT
                customer_id,
                name,
                phone_number,
                email,
                customer_type
            FROM customers
            WHERE customer_id = $1
            `,
            [id]
        );

        if (customerResult.rows.length === 0) {

            return res.status(404).json({
                error: "Customer not found."
            });

        }

        // Sales
        const salesResult = await databasePool.query(
            `
            SELECT
                s.sale_id,
                s.receipt_number,
                s.created_at,
                s.payment_method,
                s.total,

                si.quantity,
                si.selling_price,
                si.line_total,

                p.item_name

            FROM sales s

            LEFT JOIN sale_items si
                ON s.sale_id = si.sale_id

            LEFT JOIN products p
                ON p.product_id = si.product_id

            WHERE s.customer_id = $1

            ORDER BY
                s.created_at DESC,
                s.sale_id DESC
            `,
            [id]
        );

        const salesMap = new Map();

        salesResult.rows.forEach(row => {

            if (!salesMap.has(row.sale_id)) {

                salesMap.set(row.sale_id, {

                    sale_id: row.sale_id,
                    receipt_number: row.receipt_number,
                    created_at: row.created_at,
                    payment_method: row.payment_method,
                    total: Number(row.total),

                    items: []

                });

            }

            if (row.item_name) {

                salesMap.get(row.sale_id).items.push({

                    item_name: row.item_name,
                    quantity: Number(row.quantity),
                    selling_price: Number(row.selling_price),
                    line_total: Number(row.line_total)

                });

            }

        });

        res.json({

            customer: customerResult.rows[0],

            sales: [...salesMap.values()]

        });

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
    createCustomer,
    fetchCustomerHistory
};