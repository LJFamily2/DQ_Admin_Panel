const formatNumberForDisplay = require('./formatNumberForDisplay');

const formatTotalData = (totalData) => {
  const formatItem = item => {
    const fieldsToFormat = ['dryRubber', 'income', 'mixedQuantity', 'product'];
    fieldsToFormat.forEach(field => {
      item[field] = {
        raw: item[field], // Store the raw value
        formatted: formatNumberForDisplay(item[field]) // Store the formatted value
      };
    });
    return item;
  };

  return totalData.map(item => formatItem(item.toObject()));
};

module.exports = formatTotalData;