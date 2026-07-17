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
        // SALES LIST
        // ==================================

        const salesResult = await databasePool.query(`
            SELECT

                s.sale_id,

                s.receipt_number,

                s.created_at,

                COALESCE(c.name,'Walk-in Customer') AS customer,

                s.payment_method,

                s.total

            FROM sales s

            LEFT JOIN customers c

                ON c.customer_id = s.customer_id

            WHERE ${dateFilter}

            ORDER BY s.created_at DESC
        `);

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

            sales: salesResult.rows,

            topProducts: topProducts.rows,

            leastProducts: leastProducts.rows

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