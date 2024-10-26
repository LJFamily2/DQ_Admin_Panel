// utils/getChangedFields.js
const getChangedFields = (oldData, newData) => {
  const changedFields = {};
  for (const key in newData) {
    if (newData[key] !== oldData[key]) {
      changedFields[key] = {
        oldValue: oldData[key],
        newValue: newData[key],
      };
    }
  }
  return changedFields;
};

module.exports = getChangedFields;
