const parseVietnameseNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0;

  // Convert to string and trim
  const strValue = String(value).trim();

  // Check if it's already a valid number
  if (!isNaN(strValue) && !strValue.includes(",") && !strValue.includes(".")) {
    return Number(strValue);
  }

  // Accept both period and comma as decimal separators
  let normalizedValue;
  if (strValue.includes(".")) {
    // Already in American format, keep as is
    normalizedValue = strValue;
  } else {
    // Convert from Vietnamese format (comma) to American format (period)
    normalizedValue = strValue.replace(/,/g, ".");
  }

  const number = Number(normalizedValue);

  if (isNaN(number)) {
    throw new Error(`Giá trị "${value}" không phải là số hợp lệ`);
  }

  return number;
};

module.exports = parseVietnameseNumber;
