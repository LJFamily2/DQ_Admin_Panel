function formatNumberForDisplay(number) {
  if (isNaN(number) || number === null || number === undefined) {
    return ''; // Return empty string if the number is invalid
  }
  var formatter = new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
  return formatter.format(number);
}

module.exports = formatNumberForDisplay;
