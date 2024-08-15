function convertToDecimal(input) {
  if (input) {
    // Assign input to result
    let result = input;
    // Remove all commas
    result = result.replace(/\./g, '').replace(/,/g, '.');
    // Convert the string to a floating-point number
    return parseFloat(result);
  }
}


module.exports = convertToDecimal;