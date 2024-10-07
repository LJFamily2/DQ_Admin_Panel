function updatePrices(data, start, end, prices, supplierId = null) {
  const priceMap = {
    'Mủ nước': 'dryPrice',
    'Mủ tạp': 'mixedPrice',
    'Mủ ké': 'kePrice',
    'Mủ đông': 'dongPrice'
  };

  return data.map(entry => {
    const entryDate = new Date(entry.date);
    if (entryDate >= start && entryDate <= end && (!supplierId || entry.supplier.equals(supplierId))) {
      entry.rawMaterial = entry.rawMaterial.map(material => {
        const priceKey = priceMap[material.name];
        if (priceKey && prices[priceKey] > 0) {
          material.price = prices[priceKey];
        }
        return material;
      });
    }
    return entry;
  });
}

module.exports = updatePrices;