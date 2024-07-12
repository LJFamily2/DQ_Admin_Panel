const mongoose = require('mongoose');

const rawMaterialSchema = new mongoose.Schema({
    date: Date,
    notes: String,
    products: {
        dryQuantity: Number,
        dryPercentage: Number,
        keQuantity: Number,
        mixedQuantity: Number,
    },
});

const rawMaterialModel = mongoose.model('Raw Materials', rawMaterialSchema);

module.exports = rawMaterialModel;
 