const ExcelJS = require("exceljs");
const { DailySupply } = require("../models/dailySupplyModel");
const ActionHistory = require("../models/actionHistoryModel");
const handleResponse = require("./utils/handleResponse");
const convertToDecimal = require("./utils/convertToDecimal");
const { addData } = require("./dailySupplyController/supplierInputController");
const { createData } = require("./saleController");
const { createData: createSpendData } = require('./spendController');
const { createData: createRawMaterialData } = require('./rawMaterialController');
const { createProduct: createProductData } = require('./productController');

// Translated messages
const messages = {
  success: (count) => `Đã nhập thành công ${count} bản ghi`,
  partialSuccess: (success, errors) => 
    `Đã nhập thành công ${success} bản ghi. Lỗi: ${errors}`,
  validation: (errors) => `Lỗi dữ liệu: ${errors}`,
  notFound: "Không tìm thấy dữ liệu",
  error: "Lỗi khi xử lý dữ liệu",
  supplierNotFound: (code) => `Không tìm thấy nhà vườn với mã ${code}`,
  areaNotFound: "Không tìm thấy vườn hoặc vườn chưa có nhà vườn!"
};

// Utility function for mock response
const createMockRes = () => {
  const mockRes = {
    status: () => mockRes,
    json: () => mockRes,
    redirect: () => mockRes,
    render: () => mockRes,
    send: () => mockRes
  };
  return mockRes;
};

// Helper functions
const formatExcelDate = (value) => {
  if (typeof value === "string" && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
    return new Date(value.split("/").reverse().join("-"));
  }
  if (value instanceof Date) return value;
  return new Date(value);
};

const parseVietnameseNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  
  // Convert to string and trim
  const strValue = String(value).trim();
  
  // Check if it's already a valid number
  if (!isNaN(strValue) && !strValue.includes(',') && !strValue.includes('.')) {
    return Number(strValue);
  }

  // Check for invalid format (reject period as decimal separator)
  if (strValue.includes('.')) {
    throw new Error(`Số "${value}" không đúng định dạng. Vui lòng sử dụng dấu phẩy (,) để phân cách thập phân`);
  }

  // Replace comma with period and convert to number
  const normalizedValue = strValue.replace(/,/g, '.');
  const number = Number(normalizedValue);

  if (isNaN(number)) {
    throw new Error(`Giá trị "${value}" không phải là số hợp lệ`);
  }

  return number;
};

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
          errors.push(`Giá trị "${value}" của trường ${field.name} không được âm`);
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

// Generic import handler
const genericImport = async (req, res, processor, historyDescription) => {
  try {
    const { processedData, errors } = await processExcelFile(
      req.file.buffer,
      JSON.parse(req.body.requiredFields)
    );

    if (errors.length) {
      return handleResponse(req, res, 400, "fail", messages.validation(errors.join("; ")), req.headers.referer);
    }

    const results = [];
    const failedRows = [];
    const mockRes = createMockRes();

    for (const [index, row] of processedData.entries()) {
      try {
        await processor(row, req, mockRes);
        results.push(row);
      } catch (error) {
        failedRows.push(`Dòng ${index + 2}: ${error.message || messages.error}`);
      }
    }

    if (results.length) {
      await ActionHistory.create({
        actionType: "create",
        userId: req.user._id,
        details: historyDescription,
        newValues: results,
      });
    }

    const success = results.length > 0;
    const message = failedRows.length 
      ? messages.partialSuccess(results.length, failedRows.join("; "))
      : messages.success(results.length);

    return handleResponse(
      req, res,
      success ? 200 : 400,
      success ? "success" : "fail",
      message,
      req.headers.referer
    );

  } catch (error) {
    console.error("Import error:", error);
    return handleResponse(req, res, 500, "error", messages.error, req.headers.referer);
  }
};

// Controller functions
module.exports = {
  async importSaleData(req, res) {
    try {
      const { processedData, errors } = await processExcelFile(
        req.file.buffer,
        JSON.parse(req.body.requiredFields)
      );

      if (errors.length) {
        return handleResponse(
          req,
          res,
          400,
          "fail",
          `Lỗi kiểm tra dữ liệu: ${errors.join("; ")}`,
          req.headers.referer
        );
      }

      // Group data by contract code
      const groupedData = processedData.reduce((acc, row) => {
        const key = `${row['Mã hợp đồng']}-${row['Ngày'].toISOString()}`;
        if (!acc[key]) {
          acc[key] = {
            code: row['Mã hợp đồng'],
            date: row['Ngày'],
            notes: row['Ghi chú'] || '',
            name: [],
            quantity: [],
            price: [],
            percentage: []
          };
        }
        acc[key].name.push(row['Tên sản phẩm']);
        acc[key].quantity.push(row['Số lượng']);
        acc[key].price.push(row['Giá']);
        acc[key].percentage.push(row['Phần trăm'] || 0);
        return acc;
      }, {});

      const results = [];
      const failedRows = [];
      const mockRes = createMockRes();

      // Process each grouped contract
      for (const saleData of Object.values(groupedData)) {
        try {
          await createData({ ...req, body: saleData }, mockRes);
          results.push(saleData);
        } catch (error) {
          failedRows.push(`Mã hợp đồng ${saleData.code}: ${error.message || messages.error}`);
        }
      }

      if (results.length) {
        await ActionHistory.create({
          actionType: "create",
          userId: req.user._id,
          details: "Nhập dữ liệu bán hàng từ Excel",
          newValues: results,
        });
      }

      const success = results.length > 0;
      const message = failedRows.length 
        ? messages.partialSuccess(results.length, failedRows.join("; "))
        : messages.success(results.length);

      return handleResponse(
        req,
        res,
        success ? 200 : 400,
        success ? "success" : "fail",
        message,
        req.headers.referer
      );

    } catch (error) {
      console.error("Import error:", error);
      return handleResponse(req, res, 500, "error", messages.error, req.headers.referer);
    }
  },

  async importSpendData(req, res) {
    const processor = async (row, req, mockRes) => {
      const spendData = {
        date: row["Ngày"],
        product: row["Hàng hóa"],
        quantity: row["Số lượng"],
        price: row["Đơn giá"],
        notes: row["Ghi chú"] || ""
      };
      await createSpendData({ ...req, body: spendData }, mockRes);
    };
    await genericImport(req, res, processor, "Nhập dữ liệu chi tiêu từ Excel");
  },

  async importRawMaterialData(req, res) {
    const processor = async (row, req, mockRes) => {
      const rawMaterialData = {
        date: row["Ngày"],
        notes: row["Ghi chú"] || "",
        dryQuantity: row["Số lượng mủ nước"] || 0,
        dryPercentage: row["Hàm lượng mủ nước"] || 0,
        keQuantity: row["Số lượng mủ ké"] || 0,
        kePercentage: row["Hàm lượng mủ ké"] || 0,
        mixedQuantity: row["Số lượng mủ tạp"] || 0
      };
      await createRawMaterialData({ ...req, body: rawMaterialData }, mockRes);
    };
    await genericImport(req, res, processor, "Nhập dữ liệu nguyên liệu thô từ Excel");
  },

  async importProductData(req, res) {
    const processor = async (row, req, mockRes) => {
      const productData = {
        date: row["Ngày"],
        dryRubberUsed: row["Số lượng mủ nước"] || 0,
        dryPercentage: row["Hàm lượng mủ nước"] || 0,
        quantity: row["Thành phẩm"] || 0,
        notes: row["Ghi chú"] || ""
      };
      await createProductData({ ...req, body: productData }, mockRes);
    };
    await genericImport(req, res, processor, "Nhập dữ liệu sản phẩm từ Excel");
  },

  async importDailySupplyInputData(req, res) {
    try {
      // Validate Excel data
      const { processedData, errors } = await processExcelFile(
        req.file.buffer,
        JSON.parse(req.body.requiredFields)
      );

      if (errors.length) {
        return handleResponse(
          req,
          res,
          400,
          "fail",
          `Lỗi kiểm tra dữ liệu: ${errors.join("; ")}`,
          req.headers.referer
        );
      }

      // Get area data
      const area = await DailySupply.findById(req.body.areaId).populate(
        "suppliers"
      );
      if (!area?.suppliers?.length) {
        return handleResponse(
          req,
          res,
          404,
          "fail",
          "Không tìm thấy vườn hoặc vườn chưa có nhà vườn!",
          req.headers.referer
        );
      }

      const processor = async (row, req, mockRes) => {
        const supplier = area.suppliers.find(s => s.code === row["Nhà vườn"]?.toString());
        if (!supplier) {
          throw new Error(messages.supplierNotFound(row["Nhà vườn"]));
        }

        await addData({
          body: {
            name: ["Mủ nước", "Mủ tạp", "Mủ ké", "Mủ đông"],
            quantity: [
              row["Số lượng mủ nước"] || 0,
              row["Số lượng mủ tạp"] || 0,
              row["Số lượng mủ ké"] || 0,
              row["Số lượng mủ đông"] || 0,
            ],
            percentage: [row["Hàm lượng mủ nước"] || 0],
            supplier: supplier.supplierSlug,
            note: row["Ghi chú"] || "",
            areaID: area._id,
          },
          params: { id: area._id },
          user: req.user,
          headers: req.headers,
          flash: () => {},
        }, mockRes);
      };

      await genericImport(req, res, processor, "Nhập dữ liệu thu mua hàng ngày từ Excel");
    } catch (error) {
      return handleResponse(req, res, 500, "error", messages.error, req.headers.referer);
    }
  }
};
