const databasePool = require("../config/database");

// =========================
// GENERATE RECEIPT NUMBER
// =========================
async function generateReceiptNumber() {

    const result = await databasePool.query(`
        SELECT receipt_number
        FROM sales
        ORDER BY sale_id DESC
        LIMIT 1
    `);

    if (result.rows.length === 0) {
        return "R000001";
    }

    const lastReceipt = result.rows[0].receipt_number;

    const number =
        parseInt(lastReceipt.replace("R", ""), 10) + 1;

    return "R" + number.toString().padStart(6, "0");
}

// =========================
// CREATE SALE
// =========================
const createSale = async (req, res) => {

    const client = await databasePool.connect();

    try {

        await client.query("BEGIN");

        const {
            customer_id,
            payment_method,
            subtotal,
            total,
            amount_paid,
            change_given,
            items
        } = req.body;

        const receiptNumber =
            await generateReceiptNumber();

        // =========================
        // SAVE SALE
        // =========================
        const saleResult = await client.query(

            `
            INSERT INTO sales
            (
                receipt_number,
                customer_id,
                payment_method,
                subtotal,
                total,
                amount_paid,
                change_given,
                sale_status
            )
            VALUES
            (
                $1,$2,$3,$4,$5,$6,$7,$8
            )
            RETURNING sale_id
            `,

            [
                receiptNumber,
                customer_id,
                payment_method,
                subtotal,
                total,
                amount_paid,
                change_given,
                "Completed"
            ]

        );

        const saleId =
            saleResult.rows[0].sale_id;

        await client.query("COMMIT");

        res.status(201).json({

            message: "Sale completed.",

            sale_id: saleId,

            receipt_number: receiptNumber

        });

    }
    catch (error) {

        await client.query("ROLLBACK");

        console.error(error);

        res.status(500).json({

            error: error.message

        });

    }
    finally {

        client.release();

    }

};

module.exports = {
    createSale
};