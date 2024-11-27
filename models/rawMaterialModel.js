const mongoose = require('mongoose');

const rawMaterialSchema = new mongoose.Schema({
    date: Date,
    notes: String,
    products: {
        dryQuantity: {type: Number, default: 0},
        dryPercentage: {type: Number, default: 0},
        keQuantity: {type: Number, default: 0},
        kePercentage: {type: Number, default: 0},
        mixedQuantity: {type: Number, default: 0},
    },
});

const rawMaterialModel = mongoose.model('Raw Materials', rawMaterialSchema);

module.exports = rawMaterialModel;
 