const databasePool = require("../config/database");

// ================================
// GET REPORT
// ================================
const getReport = async (req, res) => {

    try {

        const period = req.query.period || "today";

        let dateFilter = "";

        switch (period) {

            case "today":
                dateFilter = "DATE(s.created_at) = CURRENT_DATE";
                break;

            case "week":
                dateFilter = "s.created_at >= CURRENT_DATE - INTERVAL '7 days'";
                break;

            case "month":
                dateFilter =
                    "DATE_TRUNC('month', s.created_at) = DATE_TRUNC('month', CURRENT_DATE)";
                break;

            default:
                dateFilter = "DATE(s.created_at) = CURRENT_DATE";

        }

        // ==================================
        // SUMMARY
        // ==================================

        const summaryResult = await databasePool.query(`
            SELECT

                COUNT(*) AS transactions,

                COALESCE(SUM(total),0) AS total_sales,

                COALESCE(SUM(cash_amount),0) AS cash_sales,

                COALESCE(SUM(card_amount),0) AS card_sales,

                COALESCE(
                    SUM(
                        CASE
                            WHEN cash_amount > 0
                             AND card_amount > 0
                            THEN total
                            ELSE 0
                        END
                    ),0
                ) AS split_sales

            FROM sales s

            WHERE ${dateFilter}
        `);

        // ==================================
        // ITEMS SOLD
        // ==================================

        const itemsResult = await databasePool.query(`
            SELECT

                COALESCE(SUM(quantity),0) AS items_sold

            FROM sale_items

            WHERE sale_id IN (

                SELECT sale_id

                FROM sales s

                WHERE ${dateFilter}

            )
        `);

        // ==================================
        // TOP PRODUCTS
        // ==================================

        const topProducts = await databasePool.query(`
            SELECT

                p.item_name,

                SUM(si.quantity) AS quantity,

                SUM(si.line_total) AS revenue

            FROM sale_items si

            JOIN products p
                ON p.product_id = si.product_id

            JOIN sales s
                ON s.sale_id = si.sale_id

            WHERE ${dateFilter}

            GROUP BY p.item_name

            ORDER BY SUM(si.quantity) DESC

            LIMIT 10
        `);

        // ==================================
        // LEAST PRODUCTS
        // ==================================

        const leastProducts = await databasePool.query(`
            SELECT

                p.item_name,

                SUM(si.quantity) AS quantity

            FROM sale_items si

            JOIN products p
                ON p.product_id = si.product_id

            JOIN sales s
                ON s.sale_id = si.sale_id

            WHERE ${dateFilter}

            GROUP BY p.item_name

            ORDER BY SUM(si.quantity) ASC

            LIMIT 10
        `);

        // ==================================
        // SALES HISTORY
        // ==================================

        const salesResult = await databasePool.query(`
            SELECT

                s.sale_id,
                s.receipt_number,
                s.created_at,
                COALESCE(c.name,'Walk-in Customer') AS customer,
                s.payment_method,
                s.total,

                p.item_name,
                si.quantity,
                si.selling_price,
                    si.line_total

            FROM sales s

            LEFT JOIN customers c
                ON c.customer_id = s.customer_id

            LEFT JOIN sale_items si
                ON si.sale_id = s.sale_id

            LEFT JOIN products p
                ON p.product_id = si.product_id

            WHERE ${dateFilter}

            ORDER BY
                s.created_at DESC,
                s.sale_id DESC
        `);

        // ==================================
        // GROUP SALES
        // ==================================

        const salesMap = new Map();

        salesResult.rows.forEach(row => {

            if (!salesMap.has(row.sale_id)) {

                salesMap.set(row.sale_id, {

                    sale_id: row.sale_id,
                    receipt_number: row.receipt_number,
                    created_at: row.created_at,
                    customer: row.customer,
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

        const sales = [...salesMap.values()];

        // ==================================
        // RESPONSE
        // ==================================

        res.json({

            summary: {

                transactions:
                    Number(summaryResult.rows[0].transactions),

                totalSales:
                    Number(summaryResult.rows[0].total_sales),

                cashSales:
                    Number(summaryResult.rows[0].cash_sales),

                cardSales:
                    Number(summaryResult.rows[0].card_sales),

                splitSales:
                    Number(summaryResult.rows[0].split_sales),

                itemsSold:
                    Number(itemsResult.rows[0].items_sold)

            },

            sales,

            topProducts:
                topProducts.rows,

            leastProducts:
                leastProducts.rows

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

    getReport

};