const mongoose = require('mongoose');

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
    slug: {
        type: String,
        unique: true
    }
});

// Pre-save middleware to generate a unique slug
saleSchema.pre('save', function(next) {
    if (!this.isModified('code') && !this.isNew) {
        return next();
    }

    const dateString = this.date.toISOString().split('T')[0];
    this.slug = `${this.code.toLowerCase()}-${dateString}`.replace(/[^a-z0-9]+/g, '-');
    next();
});

const saleModel = mongoose.model('Sales', saleSchema);

module.exports = saleModel;
