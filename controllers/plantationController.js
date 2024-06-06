const PlantationModel = require("../models/plantationModel");
const handleResponse = require("./utils/handleResponse");

async function renderPage(req, res) {
    try {
        const plantations = await PlantationModel.find({});
        res.render("src/plantationPage", {
        layout: "./layouts/defaultLayout",
        title: "Quản lý vườn",
        plantations,
        messages: req.flash(),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
module.exports = {
//   createProduct,
//   updateProduct,
//   deleteProduct,
//   deleteAllProducts,
//   getProducts,
  renderPage,
};
