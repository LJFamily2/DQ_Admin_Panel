const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
    date: Date,
    notes: String,
    products: {
        dryRubber: String,
        dryQuantity: Number,
        dryPercentage: Number,
        mixedRubber: String,
        mixedQuantity: Number,
    },
    sell: String,
});

const dataModel = mongoose.model('Dữ liệu', dataSchema);

module.exports = dataModel;
