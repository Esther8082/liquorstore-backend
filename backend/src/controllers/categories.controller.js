const databasePool = require("../config/database");

const fetchCategories = async (req, res) => {
    try {

        const result = await databasePool.query(
            "SELECT * FROM categories ORDER BY category_id ASC"
        );

        res.status(200).json(result.rows);

    } catch (error) {

        console.error("FETCH CATEGORIES ERROR:", error);

        res.status(500).json({
            error: error.message
        });
    }
};


// =========================
// FETCH PRODUCTS BY CATEGORY
// =========================
const fetchCategoryProducts = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await databasePool.query(

            `SELECT
                product_id,
                barcode,
                item_name,
                item_size,
                price,
                quantity_in_stock
             FROM products
             WHERE category_id = $1
             ORDER BY item_name ASC`,

            [id]

        );

        res.status(200).json(result.rows);

    } catch (error) {

        console.error("FETCH CATEGORY PRODUCTS ERROR:", error);

        res.status(500).json({
            error: error.message
        });

    }

};

module.exports = {
    fetchCategories,
    fetchCategoryProducts
};