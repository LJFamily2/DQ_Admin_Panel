function convertToDecimal(value) {
  if (value == null) return 0;
  if (typeof value === "number") return value;

  if (value?.hasOwnProperty("result")) {
    value = value.result;
  }

  if (typeof value === "string") {
    value = value.replace(/\./g, "").replace(/,/g, ".");
  }

  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

module.exports = convertToDecimal;