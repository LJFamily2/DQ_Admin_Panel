const mongoose = require('mongoose');

// Define the schema for action history
const actionHistorySchema = new mongoose.Schema({
  actionType: { 
    type: String, 
    required: true,
    enum: ['create', 'update', 'delete'], 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'User' // Reference to the User model
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  details: { 
    type: String, 
    default: '' 
  },
  oldDocument: { 
    type: Object, 
    default: {} 
  },
  newDocument: { 
    type: Object,
    default: {} 
  },
});

// Create the ActionHistory model
const ActionHistory = mongoose.model('ActionHistory', actionHistorySchema);

module.exports = ActionHistory;