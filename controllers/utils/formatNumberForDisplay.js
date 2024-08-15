function formatNumberForDisplay(number) {
  if (isNaN(number) || number === null || number === undefined) {
    return ''; // Return empty string if the number is invalid
  }
  
  const formatter = new Intl.NumberFormat('en-EN', {
  });

  return formatter.format(number);
}

module.exports = formatNumberForDisplay;
