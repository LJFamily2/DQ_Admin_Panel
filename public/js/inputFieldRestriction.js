function handleQuantityInput(input) {
  // Flag to check if input ends with a comma
  const endsWithComma = input.value.endsWith(',');

  // Step 1: Allow only numbers and a single comma, preserve trailing comma for typing
  input.value = input.value.replace(/[^0-9,]/g, '').replace(/,(?=.*[,])/g, '');

  // Split into whole and decimal parts
  let [whole, decimal] = input.value.split(',');

  // Step 3: Format the whole part with periods as thousand separators
  whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // Step 4: Combine whole and decimal parts, reapply trailing comma if it was present
  input.value = decimal ? `${whole},${decimal}` : whole;
  if (endsWithComma && !decimal) {
    input.value += ',';
  }
}

function handlePercentageInput(input) {
  input.value = input.value.replace(/[^0-9,]/g, ''); 
  if ((input.value.match(/,/g) || []).length > 1) {
    input.value = input.value.replace(/,(?=.*[,])/g, ''); 
  }
  const numericValue = parseFloat(input.value.replace(',', '.'));
  if (numericValue > 100) {
    input.value = '100'; 
  } else if (numericValue < 0) {
    input.value = '0';
  }
}