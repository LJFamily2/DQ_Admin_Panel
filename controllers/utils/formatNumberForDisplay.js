function formatNumberForDisplay(number) {
  if (isNaN(number) || number === null || number === undefined) {
    return ''; // Return empty string if the number is invalid
  }
  
  const formatter = new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: number <= 0 ? 0 : 2,
  });

  return formatter.format(number);
}

module.exports = formatNumberForDisplay;
