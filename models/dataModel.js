const mongoose = require('mongoose');

const rawMaterialSchema = new mongoose.Schema({
    name: String,
    unit: String,
    quantity: Number,
    percentage: Number,
});

const dataSchema = new mongoose.Schema({
    date: Date,
    notes: String,
    rawMaterial: [rawMaterialSchema]
});

const dataModel = mongoose.model('Dữ liệu', dataSchema);

module.exports = dataModel;
 