const mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
mongoose.plugin(slug);

const saleSchema = new mongoose.Schema({
    code: String,
    products:[{
        name: String, 
        quantity: Number,
        percentage: Number,
        price: Number,
        date: Date, 
    }],
    date: Date, 
    status: {
        type: String,
        enum: ["active", "closed"]
    },
    notes: String,
    slug:{
        type: String,
        slug: 'code'
    }
});

const saleModel = mongoose.model('Sales', saleSchema);

module.exports = saleModel;
 