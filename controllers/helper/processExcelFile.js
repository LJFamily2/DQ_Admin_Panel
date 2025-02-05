const ExcelJS = require("exceljs");
const validateRow = require("./validateRow");

const processExcelFile = async (buffer, requiredFields) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  const data = [];
  const errors = [];

  // Get headers
  const headers = worksheet.getRow(1).values.slice(1);

  // Process rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const rowData = {};
    row.values.slice(1).forEach((value, index) => {
      rowData[headers[index]] = value;
    });

    const rowErrors = validateRow(rowData, requiredFields);
    if (rowErrors.length > 0) {
      errors.push(`Row ${rowNumber}: ${rowErrors.join(", ")}`);
    } else {
      data.push(rowData);
    }
  });

  return { processedData: data, errors };
};

module.exports = processExcelFile;
