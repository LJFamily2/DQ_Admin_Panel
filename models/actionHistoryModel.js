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
    ref: 'Accounts'
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  details: { 
    type: String, 
    default: '' 
  },
  oldValues: { 
    type: Object, 
  },
  newValues: { 
    type: Object, 
  },
  isRead: {
    type: Boolean,
    default: false,
  },
});

// Create the ActionHistory model
const ActionHistory = mongoose.model('ActionHistory', actionHistorySchema);

module.exports = ActionHistory;