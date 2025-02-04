const ExcelJS = require("exceljs");
const SaleModel = require("../models/saleModel");
const SpendModel = require("../models/spendModel");
const RawMaterialModel = require("../models/rawMaterialModel");
const ProductModel = require("../models/productModel");
const { DailySupply } = require("../models/dailySupplyModel");
const ActionHistory = require("../models/actionHistoryModel");
const handleResponse = require("./utils/handleResponse");
const convertToDecimal = require("./utils/convertToDecimal");
const { addData } = require("./dailySupplyController/supplierInputController");
const { createData } = require("./saleController");
const { createData: createSpendData } = require('./spendController');
const { createData: createRawMaterialData } = require('./rawMaterialController');
const { createProduct: createProductData } = require('./productController');

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
const groupSalesByCode = (data) =>
  data.reduce((grouped, row) => {
    const product = {
      name: row["Tên sản phẩm"],
      quantity: convertToDecimal(row["Số lượng"]),
      percentage: row["Phần trăm"] ? convertToDecimal(row["Phần trăm"]) : 0,
      price: convertToDecimal(row["Giá"]),
      date: row["Ngày bán"],
    };

    const code = row["Mã hợp đồng"];
    if (!grouped.has(code)) {
      grouped.set(code, {
        code,
        date: row["Ngày"],
        status: "active",
        notes: row["Ghi chú"] || "",
        products: [product],
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
        return handleResponse(
          req,
          res,
          400,
          "fail",
          `Lỗi kiểm tra dữ liệu: ${errors.join("; ")}`,
          req.headers.referer
        );
      }

      // Create mock response object for use with createData
      const mockRes = {
        status: () => mockRes,
        json: () => mockRes,
        redirect: () => mockRes,
        render: () => mockRes,
        send: () => mockRes,
      };

      const results = [];
      const failedRows = [];

      // Process each row through createData
      for (const [index, row] of processedData.entries()) {
        try {
          // Transform Excel data into the format expected by createData
          const saleData = {
            code: row["Mã hợp đồng"],
            date: row["Ngày"],
            notes: row["Ghi chú"] || "",
            name: row["Tên sản phẩm"],
            quantity: row["Số lượng"],
            price: row["Giá"],
            percentage: row["Phần trăm"] || 0,
          };

          // Create mock request object
          const mockReq = {
            body: saleData,
            user: req.user,
            headers: { referer: req.headers.referer },
            flash: () => {},
          };

          await createData(mockReq, mockRes);
          results.push(row);
        } catch (error) {
          failedRows.push(
            `Dòng ${index + 2}: ${error.message || "Lỗi khi nhập dữ liệu"}`
          );
        }
      }

      // Create history if any successful imports
      if (results.length) {
        await ActionHistory.create({
          actionType: "create",
          userId: req.user._id,
          details: "Imported sales data from Excel",
          newValues: results,
        });
      }

      // Return response
      const success = results.length > 0;
      const message = failedRows.length
        ? `Đã nhập thành công ${
            results.length
          } bản ghi. Các lỗi: ${failedRows.join("; ")}`
        : `Đã nhập thành công ${results.length} bản ghi`;

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
      return handleResponse(
        req,
        res,
        500,
        "error",
        `Lỗi khi nhập dữ liệu: ${error.message}`,
        req.headers.referer
      );
    }
  },

  async importSpendData(req, res) {
    try {
      const { processedData, errors } = await processExcelFile(
        req.file.buffer,
        JSON.parse(req.body.requiredFields)
      );

      if (errors.length) {
        return handleResponse(
          req, res, 400, "fail", 
          `Lỗi kiểm tra dữ liệu: ${errors.join("; ")}`, 
          req.headers.referer
        );
      }

      const mockRes = {
        status: () => mockRes,
        json: () => mockRes,
        redirect: () => mockRes,
        render: () => mockRes,
        send: () => mockRes
      };

      const results = [];
      const failedRows = [];

      // Process each row through createData
      for (const [index, row] of processedData.entries()) {
        try {
          // Transform Excel data into the format expected by createData
          const spendData = {
            date: row["Ngày"],
            product: row["Hàng hóa"],
            quantity: row["Số lượng"],
            price: row["Đơn giá"],
            notes: row["Ghi chú"] || ""
          };

          // Create mock request object
          const mockReq = {
            body: spendData,
            user: req.user,
            headers: { referer: req.headers.referer },
            flash: () => {}
          };

          await createSpendData(mockReq, mockRes);
          results.push(row);
        } catch (error) {
          failedRows.push(`Dòng ${index + 2}: ${error.message || 'Lỗi khi nhập dữ liệu'}`);
        }
      }

      // Create history if any successful imports
      if (results.length) {
        await ActionHistory.create({
          actionType: "create",
          userId: req.user._id,
          details: "Imported spend data from Excel",
          newValues: results,
        });
      }

      // Return response
      const success = results.length > 0;
      const message = failedRows.length 
        ? `Đã nhập thành công ${results.length} bản ghi. Các lỗi: ${failedRows.join("; ")}`
        : `Đã nhập thành công ${results.length} bản ghi`;

      return handleResponse(
        req, res,
        success ? 200 : 400,
        success ? "success" : "fail",
        message,
        req.headers.referer
      );

    } catch (error) {
      console.error("Import error:", error);
      return handleResponse(
        req, res, 500, "error",
        `Lỗi khi nhập dữ liệu: ${error.message}`, 
        req.headers.referer
      );
    }
  },

  async importRawMaterialData(req, res) {
    try {
      const { processedData, errors } = await processExcelFile(
        req.file.buffer,
        JSON.parse(req.body.requiredFields)
      );

      if (errors.length) {
        return handleResponse(
          req, res, 400, "fail", 
          `Lỗi kiểm tra dữ liệu: ${errors.join("; ")}`, 
          req.headers.referer
        );
      }

      const mockRes = {
        status: () => mockRes,
        json: () => mockRes,
        redirect: () => mockRes,
        render: () => mockRes,
        send: () => mockRes
      };

      const results = [];
      const failedRows = [];

      // Process each row through createData
      for (const [index, row] of processedData.entries()) {
        try {
          // Transform Excel data into the format expected by createData
          const rawMaterialData = {
            date: row["Ngày"],
            notes: row["Ghi chú"] || "",
            dryQuantity: row["Số lượng mủ nước"] || 0,
            dryPercentage: row["Hàm lượng mủ nước"] || 0,
            keQuantity: row["Số lượng mủ ké"] || 0,
            kePercentage: row["Hàm lượng mủ ké"] || 0,
            mixedQuantity: row["Số lượng mủ tạp"] || 0
          };

          // Create mock request object
          const mockReq = {
            body: rawMaterialData,
            user: req.user,
            headers: { referer: req.headers.referer },
            flash: () => {}
          };

          await createRawMaterialData(mockReq, mockRes);
          results.push(row);
        } catch (error) {
          failedRows.push(`Dòng ${index + 2}: ${error.message || 'Lỗi khi nhập dữ liệu'}`);
        }
      }

      // Create history if any successful imports
      if (results.length) {
        await ActionHistory.create({
          actionType: "create",
          userId: req.user._id,
          details: "Imported raw materials data from Excel",
          newValues: results,
        });
      }

      // Return response
      const success = results.length > 0;
      const message = failedRows.length 
        ? `Đã nhập thành công ${results.length} bản ghi. Các lỗi: ${failedRows.join("; ")}`
        : `Đã nhập thành công ${results.length} bản ghi`;

      return handleResponse(
        req, res,
        success ? 200 : 400,
        success ? "success" : "fail",
        message,
        req.headers.referer
      );

    } catch (error) {
      console.error("Import error:", error);
      return handleResponse(
        req, res, 500, "error",
        `Lỗi khi nhập dữ liệu: ${error.message}`, 
        req.headers.referer
      );
    }
  },

  async importProductData(req, res) {
    try {
      const { processedData, errors } = await processExcelFile(
        req.file.buffer,
        JSON.parse(req.body.requiredFields)
      );

      if (errors.length) {
        return handleResponse(
          req, res, 400, "fail", 
          `Lỗi kiểm tra dữ liệu: ${errors.join("; ")}`, 
          req.headers.referer
        );
      }

      const mockRes = {
        status: () => mockRes,
        json: () => mockRes,
        redirect: () => mockRes,
        render: () => mockRes,
        send: () => mockRes
      };

      const results = [];
      const failedRows = [];

      // Process each row through createData
      for (const [index, row] of processedData.entries()) {
        try {
          // Transform Excel data into the format expected by createData
          const productData = {
            date: row["Ngày"],
            dryRubberUsed: row["Số lượng mủ nước"] || 0,
            dryPercentage: row["Hàm lượng mủ nước"] || 0,
            quantity: row["Thành phẩm"] || 0,
            notes: row["Ghi chú"] || ""
          };

          // Create mock request object
          const mockReq = {
            body: productData,
            user: req.user,
            headers: { referer: req.headers.referer },
            flash: () => {}
          };

          await createProductData(mockReq, mockRes);
          results.push(row);
        } catch (error) {
          failedRows.push(`Dòng ${index + 2}: ${error.message || 'Lỗi khi nhập dữ liệu'}`);
        }
      }

      // Create history if any successful imports
      if (results.length) {
        await ActionHistory.create({
          actionType: "create",
          userId: req.user._id,
          details: "Imported products data from Excel",
          newValues: results,
        });
      }

      // Return response
      const success = results.length > 0;
      const message = failedRows.length 
        ? `Đã nhập thành công ${results.length} bản ghi. Các lỗi: ${failedRows.join("; ")}`
        : `Đã nhập thành công ${results.length} bản ghi`;

      return handleResponse(
        req, res,
        success ? 200 : 400,
        success ? "success" : "fail",
        message,
        req.headers.referer
      );

    } catch (error) {
      console.error("Import error:", error);
      return handleResponse(
        req, res, 500, "error",
        `Lỗi khi nhập dữ liệu: ${error.message}`, 
        req.headers.referer
      );
    }
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

      // Process rows
      const results = [];
      const failedRows = [];
      const mockRes = {
        status: () => mockRes,
        json: () => mockRes,
        redirect: () => mockRes,
        render: () => mockRes,
        send: () => mockRes,
      };

      for (const [index, row] of processedData.entries()) {
        try {
          const supplier = area.suppliers.find(
            (s) => s.code === row["Nhà vườn"]?.toString()
          );
          if (!supplier) {
            failedRows.push(
              `Dòng ${index + 2}: Không tìm thấy nhà vườn với mã ${
                row["Nhà vườn"]
              }`
            );
            continue;
          }

          await addData(
            {
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
              headers: { referer: req.headers.referer },
              flash: () => {},
            },
            mockRes
          );

          results.push(row);
        } catch (error) {
          failedRows.push(`Dòng ${index + 2}: Lỗi khi nhập dữ liệu`);
        }
      }

      // Create history if any successful imports
      if (results.length) {
        await ActionHistory.create({
          actionType: "create",
          userId: req.user._id,
          details: "Imported daily supply data from Excel",
          newValues: results,
        });
      }

      // Return response
      const success = results.length > 0;
      const message = failedRows.length
        ? `Đã nhập thành công ${
            results.length
          } bản ghi. Các lỗi: ${failedRows.join("; ")}`
        : `Đã nhập thành công ${results.length} bản ghi`;

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
      return handleResponse(
        req,
        res,
        500,
        "error",
        "Lỗi khi nhập dữ liệu",
        req.headers.referer
      );
    }
  },
};
