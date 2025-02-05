const parseVietnameseNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0;

  // Convert to string and trim
  const strValue = String(value).trim();

  // Check if it's already a valid number
  if (!isNaN(strValue) && !strValue.includes(",") && !strValue.includes(".")) {
    return Number(strValue);
  }

  // Check for invalid format (reject period as decimal separator)
  if (strValue.includes(".")) {
    throw new Error(
      `Số "${value}" không đúng định dạng. Vui lòng sử dụng dấu phẩy (,) để phân cách thập phân`
    );
  }

  // Replace comma with period and convert to number
  const normalizedValue = strValue.replace(/,/g, ".");
  const number = Number(normalizedValue);

  if (isNaN(number)) {
    throw new Error(`Giá trị "${value}" không phải là số hợp lệ`);
  }

  return number;
};

module.exports = parseVietnameseNumber;
