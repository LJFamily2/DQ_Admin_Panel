const mongoose = require('mongoose');

const totalSchema = new mongoose.Schema({
    dryTotal: Number,
    mixedTotal: Number,
    productTotal: Number,
});

const totalModel = mongoose.model('Tổng', totalSchema);

module.exports = totalModel;
 