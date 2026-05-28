const databasePool = require("../config/database");

const createProduct = async (req, res) => {
    try {

        const {
            item_name,
            item_size,
            quantity_in_stock,
            price,
            category_id,
            barcode
        } = req.body;
 if (
            !item_name ||
            !item_size ||
            !price ||
            !quantity_in_stock ||
            !category_id
        ) {
            return res.status(400).json({
                error: "Missing required fields"
            });
        }

         let image_url = null;

        if (req.file) {
            image_url = `/uploads/productimages/${req.file.filename}`;  }


        const createdProduct = await databasePool.query(
            `INSERT INTO products
            (
                item_name,
                item_size,
                quantity_in_stock,
                price,
                category_id,
                barcode,
                image_url
            )
           VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING *`,
            [
                item_name,
                item_size,
                quantity_in_stock,
                price,
                category_id,
                barcode,
                image_url
                     ]
        );

        res.status(201).json({
            message: "Product successfully saved",
            productData: createdProduct.rows[0]
        });

    } catch (databaseError) {

        console.error("CREATE PRODUCT ERROR:", databaseError);

        if (databaseError.code === "23505") {
            return res.status(400).json({
                error: "Barcode already exists"
            });
        }

        res.status(500).json({
            error: databaseError.message
        });
    }
};

const fetchAllProducts = async (req, res) => {
    try {

        const fetchedProducts = await databasePool.query(
            `SELECT 
                products.*,
                categories.category_name
            FROM products
            LEFT JOIN categories
            ON products.category_id = categories.category_id
            ORDER BY products.product_id DESC`
        );

        res.status(200).json(fetchedProducts.rows);

    } catch (databaseError) {

        console.error("FETCH PRODUCTS ERROR:", databaseError);

        res.status(500).json({
            error: databaseError.message
        });
    }
};

const updateProduct = async (req, res) => {
    try {

        const { id } = req.params;

        const {
            item_name,
            item_size,
            quantity_in_stock,
            price,
            category_id,
            barcode
        } = req.body;

        let image_url = null;

if (req.file) {
    image_url = `/uploads/productimages/${req.file.filename}`;
}


        const updated = await databasePool.query(
            `UPDATE products
            SET item_name = $1,
    item_size = $2,
    quantity_in_stock = $3,
    price = $4,
    category_id = $5,
    barcode = $6,
    image_url = COALESCE($8, image_url)
WHERE product_id = $7
             RETURNING *`,
            [
                item_name,
                item_size,
                quantity_in_stock,
                price,
                category_id,
                barcode,
                id,
                image_url
            ]
        );

        res.status(200).json({
            message: "Product updated successfully",
            product: updated.rows[0]
        });

    } catch (error) {
        console.error("UPDATE PRODUCT ERROR:", error);

        res.status(500).json({
            error: error.message
        });
    }
};


const deleteProduct = async (req, res) => {

    try {

        const { id } = req.params;

        await databasePool.query(
            `
            DELETE FROM products
            WHERE product_id = $1
            `,
            [id]
        );

        res.json({
            success: true,
            message: "Product deleted"
        });

    } catch (error) {

        console.error("DELETE PRODUCT ERROR:", error);

        res.status(500).json({
            success: false
        });
    }
};
const deleteProductImage = async (req, res) => {

    try {

        const { id } = req.params;

        await databasePool.query(
            `
            UPDATE products
            SET image_url = NULL
            WHERE product_id = $1
            `,
            [id]
        );

        res.json({
            success: true,
            message: "Image deleted"
        });

    } catch (error) {

        console.error("DELETE IMAGE ERROR:", error);

        res.status(500).json({
            success: false
        });
    }
};

module.exports = {
    createProduct,
    fetchAllProducts,
    updateProduct,
    deleteProduct,
    deleteProductImage
};