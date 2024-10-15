function updatePricesAndRatios(data, start, end, prices, ratios, supplierId = null) {
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
        
        // Update the ratio split for each material
        if (ratios && ratios[material.name]) {
          material.ratioSplit = ratios[material.name]; // Assuming ratios is an object with material names as keys
        }
        
        return material;
      });
    }
    return entry;
  });
}

module.exports = updatePricesAndRatios;
