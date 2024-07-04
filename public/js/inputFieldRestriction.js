function handleQuantityInput(input) {
  // Flag to check if input ends with a comma
  const endsWithComma = input.value.endsWith(',');

  // Step 1: Allow only numbers and a single comma, preserve trailing comma for typing
  input.value = input.value.replace(/[^0-9,]/g, '').replace(/,(?=.*[,])/g, '');

  // Split into whole and decimal parts
  let [whole, decimal] = input.value.split(',');

  // Step 3: Format the whole part with periods as thousand separators
  whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // Step 4: Limit the decimal part to two digits (if present)
  if (decimal && decimal.length > 2) {
    decimal = decimal.substring(0, 2);
  }

  // Step 5: Combine whole and decimal parts, reapply trailing comma if it was present
  input.value = decimal ? `${whole},${decimal}` : whole;
  if (endsWithComma && !decimal) {
    input.value += ',';
  }
}

function handlePercentageInput(input) {
  input.value = input.value.replace(/[^0-9,]/g, ''); // Allow only numbers and a single comma
  if ((input.value.match(/,/g) || []).length > 1) {
    input.value = input.value.replace(/,(?=.*[,])/g, ''); // Remove additional commas if more than one is present
  }
  const numericValue = parseFloat(input.value.replace(',', '.'));
  if (numericValue > 100) {
    input.value = '100'; // Limit to a maximum of 100
  } else if (numericValue < 0) {
    input.value = '0'; // Limit to a minimum of 0
  }
  const parts = input.value.split(',');
  if (parts[1] && parts[1].length > 2) {
    input.value = parts[0] + ',' + parts[1].substring(0, 2); // Limit to two decimal places
  }
}
