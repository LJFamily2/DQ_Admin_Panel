const PlantationModel = require("../models/plantationModel");
const handleResponse = require("./utils/handleResponse");
const AreaModel = require('../models/areaModel')

async function renderPage(req, res) {
    try {
        const plantations = await PlantationModel.find({});
        const areas = await AreaModel.find({});
        res.render("src/plantationPage", {
        layout: "./layouts/defaultLayout",
        title: "Quản lý vườn",
        plantations,
        areas,
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
