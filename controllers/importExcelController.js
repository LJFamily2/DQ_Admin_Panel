const ExcelJS = require("exceljs");
const SaleModel = require("../models/saleModel");
const SpendModel = require("../models/spendModel");
const RawMaterialModel = require("../models/rawMaterialModel");
const ProductModel = require("../models/productModel");
const DailySupplyModel = require("../models/dailySupplyModel");
const ActionHistory = require("../models/actionHistoryModel");
const handleResponse = require("./utils/handleResponse");
const convertToDecimal = require("./utils/convertToDecimal");

// Helper functions
const formatExcelDate = (value) => {
  if (typeof value === "string" && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
    return new Date(value.split("/").reverse().join("-"));
  }
  if (value instanceof Date) return value;
  return new Date(value);
};

const validateRow = (row, requiredFields) => {
  const errors = [];
  requiredFields.forEach((field) => {
    let value = row[field.name];
    
    // Handle Excel cell object
    if (value && typeof value === 'object' && value.hasOwnProperty('result')) {
      value = value.result;
    }

    // Skip percentage validation if empty
    if (field.name === 'Phần trăm' && (value === '' || value === null || value === undefined)) {
      return;
    }

    if (field.type === "date") {
      const dateValue = formatExcelDate(value);
      if (!dateValue || isNaN(dateValue.getTime())) {
        errors.push(`Invalid date value for ${field.name}`);
      }
    } else if (field.type === "number") {
      const num = convertToDecimal(value);
      if (isNaN(num) || num < 0) {
        errors.push(`Invalid number value for ${field.name}`);
      }
    } else if (!value && value !== 0) {
      errors.push(`Missing required field ${field.name}`);
    }
  });
  return errors;
};

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

    if (rowData.Ngày) {
      rowData.Ngày = formatExcelDate(rowData.Ngày);
    }

    const rowErrors = validateRow(rowData, requiredFields);
    if (rowErrors.length > 0) {
      errors.push(`Row ${rowNumber}: ${rowErrors.join(", ")}`);
    } else {
      data.push(rowData);
    }
  });

  return { processedData: data, errors };
};

// Generic import function
const handleImport = async (
  req,
  res,
  transformData,
  model,
  actionDescription
) => {
  try {
    const requiredFields = JSON.parse(req.body.requiredFields);
    const { processedData, errors } = await processExcelFile(
      req.file.buffer,
      requiredFields
    );

    if (errors.length > 0) {
      return handleResponse(
        req,
        res,
        400,
        "fail",
        `Lỗi kiểm tra dữ liệu: ${errors.join("; ")}`,
        req.headers.referer
      );
    }

    const transformedData = processedData.map(transformData);
    const result = await model.insertMany(transformedData);

    await ActionHistory.create({
      actionType: "create",
      userId: req.user._id,
      details: actionDescription,
      newValues: result,
    });

    return handleResponse(
      req,
      res,
      200,
      "success",
      `Đã nhập thành công ${result.length} bản ghi`,
      req.headers.referer
    );
  } catch (error) {
    console.error("Import error:", error);
    return handleResponse(
      req,
      res,
      500,
      "error",
      "Lỗi khi nhập dữ liệu",
      req.headers.referer
    );
  }
};

// Add this helper function before the controller functions
const groupSalesByCode = data => data.reduce((grouped, row) => {
  const product = {
    name: row['Tên sản phẩm'],
    quantity: convertToDecimal(row['Số lượng']),
    percentage: row['Phần trăm'] ? convertToDecimal(row['Phần trăm']) : 0,
    price: convertToDecimal(row['Giá']),
    date: row['Ngày bán']
  };

  const code = row['Mã hợp đồng'];
  if (!grouped.has(code)) {
    grouped.set(code, {
      code,
      date: row['Ngày'],
      status: 'active',
      notes: row['Ghi chú'] || '',
      products: [product]
    });
  } else {
    grouped.get(code).products.push(product);
  }
  return grouped;
}, new Map());

// Controller functions
module.exports = {
  async importSaleData(req, res) {
    try {
      const { processedData, errors } = await processExcelFile(
        req.file.buffer,
        JSON.parse(req.body.requiredFields)
      );

      if (errors.length) {
        return handleResponse(req, res, 400, "fail", 
          `Lỗi kiểm tra dữ liệu: ${errors.join("; ")}`, req.headers.referer);
      }

      const groupedSales = Array.from(groupSalesByCode(processedData).values());
      if (!groupedSales.length || !groupedSales.every(sale => 
        sale.code && sale.date && Array.isArray(sale.products) && sale.products.length)) {
        throw new Error('Invalid sale data structure');
      }

      const result = await SaleModel.createWithSlug(groupedSales);
      await ActionHistory.create({
        actionType: "create",
        userId: req.user._id,
        details: "Imported sales data from Excel",
        newValues: result
      });

      return handleResponse(req, res, 200, "success",
        `Đã nhập thành công ${Array.isArray(result) ? result.length : 1} bản ghi`,
        req.headers.referer);
    } catch (error) {
      return handleResponse(req, res, 500, "error",
        `Lỗi khi nhập dữ liệu: ${error.message}`, req.headers.referer);
    }
  },

  async importSpendData(req, res) {
    await handleImport(
      req,
      res,
      (row) => ({
        date: row["Ngày"],
        product: row["Hàng hóa"],
        quantity: convertToDecimal(row["Số lượng"]),
        price: convertToDecimal(row["Đơn giá"]),
        notes: row["Ghi chú"]
      }),
      SpendModel,
      "Imported spend data from Excel"
    );
  },

  async importRawMaterialData(req, res) {
    await handleImport(
      req,
      res,
      (row) => ({
        date: row["Ngày"],
        notes: row["Ghi chú"],
        products: {
          dryQuantity: convertToDecimal(row["Số lượng mủ nước"]),
          dryPercentage: convertToDecimal(row["Hàm lượng mủ nước"]),
          keQuantity: convertToDecimal(row["Số lượng mủ ké"]),
          kePercentage: convertToDecimal(row["Hàm lượng mủ ké"]),
          mixedQuantity: convertToDecimal(row["Số lượng mủ tạp"])
        }
      }),
      RawMaterialModel,
      "Imported raw materials from Excel"
    );
  },

  async importProductData(req, res) {
    await handleImport(
      req,
      res,
      (row) => ({
        date: row["Ngày"],
        dryRubberUsed: convertToDecimal(row["Số lượng mủ nước"]),
        dryPercentage: convertToDecimal(row["Hàm lượng mủ nước"]),
        quantity: convertToDecimal(row["Thành phẩm"]),
        notes: row["Ghi chú"]
      }),
      ProductModel,
      "Imported products from Excel"
    );
  },

  async importDailySupplyInputData(req, res) {
    await handleImport(
      req,
      res,
      (row) => ({
        date: row.Ngày,
        materialName: row["Tên nguyên liệu"],
        quantity: convertToDecimal(row["Số lượng"]),
        price: convertToDecimal(row["Giá"]),
        supplier: row["Nhà cung cấp"],
        status: "active",
      }),
      DailySupplyModel,
      "Imported daily supply inputs from Excel"
    );
  },
};
