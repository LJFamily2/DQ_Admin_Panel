// utils/getChangedFields.js
const getChangedFields = (oldData, newData) => {
  const changedFields = {};
  for (const key in newData) {
    if (oldData === null || newData[key] !== oldData[key]) {
      changedFields[key] = {
        oldValue: oldData ? oldData[key] : null, // Set oldValue to null if oldData is null
        newValue: newData[key],
      };
    }
  }
  return changedFields;
};

module.exports = getChangedFields;
