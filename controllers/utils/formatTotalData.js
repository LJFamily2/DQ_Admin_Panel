const formatTotalData = totalData => {
  const formatItem = item => {
    const fieldsToFormat = [
      'dryRubber',
      'income',
      'mixedQuantity',
      'product',
      'spend',
      'profit',
    ];
    fieldsToFormat.forEach(field => {
      item[field] = {
        raw: item[field], 
        formatted: item[field], 
      };
    });
    return item;
  };

  return totalData.map(item => formatItem(item.toObject()));
};

module.exports = formatTotalData;
