const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
    date: Date,
    notes: String,
    products: {
        dryQuantity: Number,
        dryPercentage: Number,
        mixedQuantity: Number,
    },
});

const dataModel = mongoose.model('Dữ liệu', dataSchema);

module.exports = dataModel;
 