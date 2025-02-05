const formatExcelDate = (value) => {
  if (typeof value === "string" && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
    return new Date(value.split("/").reverse().join("-"));
  }
  if (value instanceof Date) return value;
  return new Date(value);
};

module.exports = formatExcelDate;