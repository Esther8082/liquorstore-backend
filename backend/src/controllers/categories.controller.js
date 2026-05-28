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

module.exports = { fetchCategories };