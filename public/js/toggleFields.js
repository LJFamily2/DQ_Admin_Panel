// views/src/toggleFields.js
function debounce(func, timeout = 700) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        func.apply(this, args);
      }, timeout);
    };
  }
  
  function toggleFields(areaDimension, areaPrice) {
    const conditionalFields = document.querySelectorAll('.conditional-field');
    const inputFields = document.querySelectorAll('.conditional-field input');
  
    if (areaDimension > 0 && areaPrice > 0) {
      conditionalFields.forEach(field => (field.style.display = 'block'));
      inputFields.forEach(input => (input.disabled = true));
    } else {
      conditionalFields.forEach(field => (field.style.display = 'none'));
      inputFields.forEach(input => (input.disabled = false));
    }
  }
  
  function initializeToggleFields(areaDimensionId, areaPriceId) {
    const debouncedToggleFields = debounce(() => {
      const areaDimension = parseFloat(document.getElementById(areaDimensionId).value) || 0;
      const areaPrice = parseFloat(document.getElementById(areaPriceId).value.replace(/,/g, '')) || 0;
      toggleFields(areaDimension, areaPrice);
    });
  
    document.getElementById(areaDimensionId).addEventListener('input', debouncedToggleFields);
    document.getElementById(areaPriceId).addEventListener('input', debouncedToggleFields);
  
    document.addEventListener('DOMContentLoaded', () => {
      debouncedToggleFields(); // Initial check
    });
  }