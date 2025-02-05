const formatExcelDate = require("./formatExcelDate");
const parseVietnameseNumber = require("./parseVietnameseNumber");

const validateRow = (row, requiredFields) => {
  const errors = [];
  requiredFields.forEach((field) => {
    let value = row[field.name];

    // Handle Excel cell object
    if (value && typeof value === "object" && value.hasOwnProperty("result")) {
      value = value.result;
    }

    // Skip percentage validation if empty
    if (
      field.name === "Phần trăm" &&
      (value === "" || value === null || value === undefined)
    ) {
      return;
    }

    try {
      if (field.type === "date") {
        const dateValue = formatExcelDate(value);
        if (!dateValue || isNaN(dateValue.getTime())) {
          errors.push(`Giá trị ngày không hợp lệ cho trường ${field.name}`);
        }
      } else if (field.type === "number") {
        const num = parseVietnameseNumber(value);
        if (num < 0) {
          errors.push(
            `Giá trị "${value}" của trường ${field.name} không được âm`
          );
        }
        row[field.name] = num; // Update the value in the row
      } else if (!value && value !== 0) {
        errors.push(`Thiếu trường bắt buộc ${field.name}`);
      }
    } catch (error) {
      errors.push(error.message);
    }
  });
  return errors;
};

module.exports = validateRow;
