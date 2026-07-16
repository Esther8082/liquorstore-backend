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

                dateFilter =
                    "DATE(created_at) = CURRENT_DATE";

                break;

            case "week":

                dateFilter =
                    "created_at >= CURRENT_DATE - INTERVAL '7 days'";

                break;

            case "month":

                dateFilter =
                    "DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)";

                break;

            default:

                dateFilter =
                    "DATE(created_at) = CURRENT_DATE";

        }

        // ============================
        // SUMMARY
        // ============================

        const summaryResult = await databasePool.query(

            `
            SELECT

                COUNT(*) AS transactions,

                COALESCE(SUM(total),0) AS total_sales,

                COALESCE(SUM(cash_amount),0) AS cash_sales,

                COALESCE(SUM(card_amount),0) AS card_sales,

                COALESCE(SUM(amount_paid),0) AS amount_paid,

                COALESCE(AVG(total),0) AS average_sale

            FROM sales

            WHERE ${dateFilter}
            `

        );

        // ============================
        // ITEMS SOLD
        // ============================

        const itemsResult = await databasePool.query(

            `
            SELECT

                COALESCE(SUM(quantity),0) AS items_sold

            FROM sale_items

            WHERE sale_id IN (

                SELECT sale_id

                FROM sales

                WHERE ${dateFilter}

            )
            `

        );

        // ============================
        // TOP PRODUCTS
        // ============================

        const topProducts = await databasePool.query(

            `
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

            ORDER BY quantity DESC

            LIMIT 10
            `

        );

        // ============================
        // LEAST PRODUCTS
        // ============================

        const leastProducts = await databasePool.query(

            `
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

            ORDER BY quantity ASC

            LIMIT 10
            `

        );

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

                averageSale:
                    Number(summaryResult.rows[0].average_sale),

                itemsSold:
                    Number(itemsResult.rows[0].items_sold)

            },

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