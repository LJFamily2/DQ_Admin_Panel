// utils/getChangedFields.js
const getChangedFields = (newData, oldData) => {
    const changedFields = {};
    for (const key in newData) {
      if (newData[key] !== oldData[key]) {
        changedFields[key] = newData[key];
      }
    }
    return changedFields;
  };
  
  module.exports = getChangedFields;