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

// Update the createWithSlug method to handle date formatting properly
saleSchema.statics.createWithSlug = async function(docs) {
  const processedDocs = docs.map(doc => {
    const dateString = doc.date instanceof Date 
      ? doc.date.toISOString().split('T')[0]
      : new Date(doc.date).toISOString().split('T')[0];
      
    return {
      ...doc,
      status: doc.status || 'active',
      slug: `${doc.code.toLowerCase()}-${dateString}`.replace(/[^a-z0-9]+/g, '-')
    };
  });

  // Add error handling for bulk creation
  try {
    return await this.create(processedDocs);
  } catch (error) {
    console.error('Error in createWithSlug:', error);
    throw new Error(`Failed to create sales: ${error.message}`);
  }
};

const saleModel = mongoose.model('Sales', saleSchema);

module.exports = saleModel;
