const databasePool = require("../config/database");

const fetchCategories = async (req, res) => {

    try {

        const result = await databasePool.query(

            `SELECT
                c.category_id,
                c.category_name,
                COUNT(p.product_id) AS product_count
             FROM categories c
             LEFT JOIN products p
                ON c.category_id = p.category_id
             GROUP BY
                c.category_id,
                c.category_name
             ORDER BY
                c.category_id ASC`

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

// =========================
// CREATE CATEGORY
// =========================
const createCategory = async (req, res) => {

    try {

        const { category_name } = req.body;

        if (!category_name || category_name.trim() === "") {

            return res.status(400).json({
                error: "Category name is required."
            });

        }

        // Check if category already exists
        const existing = await databasePool.query(

            `SELECT *
             FROM categories
             WHERE LOWER(category_name)=LOWER($1)`,

            [category_name]

        );

        if (existing.rows.length > 0) {

            return res.status(409).json({
                error: "Category already exists."
            });

        }

        const result = await databasePool.query(

            `INSERT INTO categories(category_name)
             VALUES($1)
             RETURNING *`,

            [category_name]

        );

        res.status(201).json(result.rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

};

// =========================
// UPDATE CATEGORY
// =========================
const updateCategory = async (req, res) => {

    try {

        const { id } = req.params;
        const { category_name } = req.body;

        const result = await databasePool.query(

            `UPDATE categories
             SET category_name = $1
             WHERE category_id = $2
             RETURNING *`,

            [category_name, id]

        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                error: "Category not found."
            });

        }

        res.json(result.rows[0]);

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }

};

// =========================
// DELETE CATEGORY
// =========================
const deleteCategory = async (req, res) => {

    try {

        const { id } = req.params;

        const products = await databasePool.query(

            `SELECT *
             FROM products
             WHERE category_id = $1`,

            [id]

        );

        if (products.rows.length > 0) {

            return res.status(400).json({
                error: "Cannot delete a category that still contains products."
            });

        }

        const result = await databasePool.query(

            `DELETE FROM categories
             WHERE category_id = $1
             RETURNING *`,

            [id]

        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                error: "Category not found."
            });

        }

        res.json({
            message: "Category deleted."
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }

};

module.exports = {
    fetchCategories,
    fetchCategoryProducts,
    createCategory,
     updateCategory,
    deleteCategory
};