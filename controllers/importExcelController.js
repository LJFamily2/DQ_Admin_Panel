const { DailySupply, Supplier } = require("../models/dailySupplyModel");
const ActionHistory = require("../models/actionHistoryModel");
const handleResponse = require("./utils/handleResponse");
const { addData } = require("./dailySupplyController/supplierInputController");
const { createData } = require("./saleController");
const { createData: createSpendData } = require("./spendController");
const {
  createData: createRawMaterialData,
} = require("./rawMaterialController");
const { createProduct: createProductData } = require("./productController");
const processExcelFile = require("./helper/processExcelFile");
const genericImport = require("./helper/genericImport");
const path = require("path");

// Helper function for mocking response object
// Helper function for mocking response object
const createMockRes = () => ({
  status: () => ({
    json: () => {},
    send: () => {},
    render: () => {}, // Add this line
  }),
  json: () => {},
  send: () => {},
  redirect: () => {},
  render: () => {}, // Add this line
});

// Controller functions
module.exports = {
  importSaleData,
  importSpendData,
  importRawMaterialData,
  importProductData,
  importDailySupplyInputData,
  importDailySupplyArea,
  downloadTemplate,
};

// Translated messages
const messages = {
  supplierNotFound: (code) => `Không tìm thấy nhà vườn với mã ${code}`,
  areaNotFound: "Không tìm thấy vườn hoặc vườn chưa có nhà vườn!",
};

const templateMapping = {
  dailySupply: "Nhap_Nguyen_Lieu.xlsx",
  dailySupplyArea: "Nhap_Vuon_Va_Nha_Vuon.xlsx",
  sale: "Nhap_Hop_Dong.xlsx",
  spend: "Nhap_Chi_Tieu.xlsx",
  rawMaterial: "Nhap_Du_Lieu_Tong.xlsx",
  product: "Nhap_Chay_Lo.xlsx",
};

async function downloadTemplate(req, res) {
  try {
    const { page } = req.params;

    if (!templateMapping[page]) {
      return res.status(404).send("Template not found");
    }

    const filePath = path.join(
      "public",
      "excelTemplates",
      templateMapping[page]
    );
    res.download(filePath);
  } catch (error) {
    console.error("Template download error:", error);
    res.status(500).send("Error downloading template");
  }
}

async function importSaleData(req, res) {
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
      const key = `${row["Mã hợp đồng"]}-${row["Ngày"].toISOString()}`;
      if (!acc[key]) {
        acc[key] = {
          code: row["Mã hợp đồng"],
          date: row["Ngày"],
          notes: row["Ghi chú"] || "",
          name: [],
          quantity: [],
          price: [],
          percentage: [],
        };
      }
      acc[key].name.push(row["Tên sản phẩm"]);
      acc[key].quantity.push(row["Số lượng"]);
      acc[key].price.push(row["Giá"]);
      acc[key].percentage.push(row["Phần trăm"] || 0);
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
        failedRows.push(
          `Mã hợp đồng ${saleData.code}: ${error.message || messages.error}`
        );
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
    return handleResponse(
      req,
      res,
      500,
      "error",
      messages.error,
      req.headers.referer
    );
  }
}

async function importSpendData(req, res) {
  const processor = async (row, req, mockRes) => {
    const spendData = {
      date: row["Ngày"],
      product: row["Hàng hóa"],
      quantity: row["Số lượng"],
      price: row["Đơn giá"],
      notes: row["Ghi chú"] || "",
    };
    await createSpendData({ ...req, body: spendData }, mockRes);
  };
  await genericImport(req, res, processor, "Nhập dữ liệu chi tiêu từ Excel");
}

async function importRawMaterialData(req, res) {
  const processor = async (row, req, mockRes) => {
    const rawMaterialData = {
      date: row["Ngày"],
      notes: row["Ghi chú"] || "",
      dryQuantity: row["Số lượng mủ nước"] || 0,
      dryPercentage: row["Hàm lượng mủ nước"] || 0,
      keQuantity: row["Số lượng mủ ké"] || 0,
      kePercentage: row["Hàm lượng mủ ké"] || 0,
      mixedQuantity: row["Số lượng mủ tạp"] || 0,
    };
    await createRawMaterialData({ ...req, body: rawMaterialData }, mockRes);
  };
  await genericImport(
    req,
    res,
    processor,
    "Nhập dữ liệu nguyên liệu thô từ Excel"
  );
}

async function importProductData(req, res) {
  const processor = async (row, req, mockRes) => {
    const productData = {
      date: row["Ngày"],
      dryRubberUsed: row["Số lượng mủ nước"] || 0,
      dryPercentage: row["Hàm lượng mủ nước"] || 0,
      quantity: row["Thành phẩm"] || 0,
      notes: row["Ghi chú"] || "",
    };
    await createProductData({ ...req, body: productData }, mockRes);
  };
  await genericImport(req, res, processor, "Nhập dữ liệu sản phẩm từ Excel");
}

async function importDailySupplyInputData(req, res) {
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
      const supplier = area.suppliers.find(
        (s) => s.code === row["Nhà vườn"]?.toString()
      );
      if (!supplier) {
        throw new Error(messages.supplierNotFound(row["Nhà vườn"]));
      }

      await addData(
        {
          body: {
            date: row["Ngày"],
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
        },
        mockRes
      );
    };

    await genericImport(
      req,
      res,
      processor,
      "Nhập dữ liệu thu mua hàng ngày từ Excel"
    );
  } catch (error) {
    return handleResponse(
      req,
      res,
      500,
      "error",
      messages.error,
      req.headers.referer
    );
  }
}

async function importDailySupplyArea(req, res) {
  try {
    const { processedData, errors: fileErrors } = await processExcelFile(
      req.file.buffer,
      JSON.parse(req.body.requiredFields)
    );

    if (fileErrors.length) {
      return handleResponse(
        req,
        res,
        400,
        "fail",
        `Lỗi kiểm tra dữ liệu: ${fileErrors.join("; ")}`,
        req.headers.referer
      );
    }

    // Group data by area name
    const groupedData = processedData.reduce((acc, row) => {
      const areaName = row["Tên vườn"];

      if (!acc[areaName]) {
        acc[areaName] = {
          areaName,
          areaGroup: row["Khu vực"] || "Chưa phân loại",
          areaDimension: row["Diện tích vườn"] || 0,
          areaPrice: row["Giá vườn"] || 0,
          address: row["Địa chỉ vườn"] || "Không có địa chỉ",
          contractDuration: {
            start: row["Ngày bắt đầu hợp đồng"] || null,
            end: row["Ngày kết thúc hợp đồng"] || null,
          },

          // Supplier arrays
          supplierName: [],
          code: [],
          phone: [],
          identification: [],
          issueDate: [],
          supplierAddress: [],
          ratioSumSplit: [],
          ratioRubberSplit: [],
          areaDeposit: [],
          purchasedAreaPrice: [],
          purchasedAreaDimension: [],
          moneyRetainedPercentage: [],
          advancePayment: [],
          areaDuration: {
            start: [],
            end: [],
          },
        };
      }

      // Add supplier details to arrays
      if (row["Tên nhà vườn"]) {
        acc[areaName].supplierName.push(row["Tên nhà vườn"]);
        acc[areaName].code.push(row["Mã nhà vườn"]);
        acc[areaName].phone.push(row["Số điện thoại"] || "");
        acc[areaName].identification.push(row["CMND/CCCD"] || "");
        const issueDate = row["Ngày cấp"] 
        ? (typeof row["Ngày cấp"] === 'string' 
           ? row["Ngày cấp"] 
           : `${row["Ngày cấp"].getDate().toString().padStart(2, '0')}/${(row["Ngày cấp"].getMonth() + 1).toString().padStart(2, '0')}/${row["Ngày cấp"].getFullYear()}`)
        : "";
      acc[areaName].issueDate.push(issueDate);
        acc[areaName].supplierAddress.push(row["Địa chỉ"] || "");
        acc[areaName].purchasedAreaDimension.push(row["Diện tích mua"] || 0);
        acc[areaName].purchasedAreaPrice.push(row["Giá mua"] || 0);
        acc[areaName].areaDeposit.push(row["Tiền cọc"] || 0);
        acc[areaName].areaDuration.start.push(
          row["Ngày bắt đầu hợp đồng nhà vườn"] || row["Ngày bắt đầu hợp đồng"] || null
        );
        acc[areaName].areaDuration.end.push(
          row["Ngày kết thúc hợp đồng nhà vườn"] || row["Ngày kết thúc hợp đồng"] || null
        );
        acc[areaName].ratioSumSplit.push(row["% nhận tổng mặc định"] || 100);
        acc[areaName].ratioRubberSplit.push(row["% nhận mủ mặc định"] || 100);
        acc[areaName].moneyRetainedPercentage.push(row["% giữ lại"] || 0);
        acc[areaName].advancePayment.push(row["Tạm ứng"] || 0);
      }

      return acc;
    }, {});

    // First, validate all areas without saving any
    const validationErrors = [];
    const mockRes = createMockRes();
    const areaDataList = Object.values(groupedData);
    
    // Perform all validations first
    for (const areaData of areaDataList) {
      try {
        // Check for duplicate supplier codes
        const supplierCodes = areaData.code.filter(Boolean);
        const uniqueCodes = new Set(supplierCodes);

        if (supplierCodes.length !== uniqueCodes.size) {
          validationErrors.push(`"${areaData.areaName}": Mã nhà vườn không được trùng lặp!`);
          continue;
        }

        // Check if any area name already exists
        const existingArea = await DailySupply.findOne({
          name: areaData.areaName,
        });
        if (existingArea) {
          validationErrors.push(`"${areaData.areaName}": Vườn "${areaData.areaName}" đã tồn tại!`);
          continue;
        }

        // Check if any codes already exist in the database
        const existingSuppliers = await Supplier.find({
          code: { $in: supplierCodes },
        });
        if (existingSuppliers.length > 0) {
          validationErrors.push(`"${areaData.areaName}": Mã nhà vườn đã tồn tại: ${existingSuppliers
            .map((s) => s.code)
            .join(", ")}`);
          continue;
        }

        // Calculate total purchased area dimension
        const totalPurchasedAreaDimension =
          areaData.purchasedAreaDimension.reduce(
            (sum, dim) => sum + (parseFloat(dim) || 0),
            0
          );

        // Check if remainingAreaDimension is sufficient
        if (totalPurchasedAreaDimension > parseFloat(areaData.areaDimension)) {
          validationErrors.push(`"${areaData.areaName}": Tổng diện tích mua vượt quá diện tích vườn!`);
          continue;
        }
      } catch (error) {
        validationErrors.push(`"${areaData.areaName}": ${error.message || "Lỗi không xác định"}`);
      }
    }

    // If any errors were found during validation, return immediately
    if (validationErrors.length > 0) {
      return handleResponse(
        req,
        res,
        400,
        "fail",
        `Lỗi kiểm tra dữ liệu: ${validationErrors.join("; ")}`,
        req.headers.referer
      );
    }

    // If no errors, proceed with saving all areas
    const results = [];
    for (const areaData of areaDataList) {  
      try {
        // Call addArea function with mocked request/response
        await require("./dailySupplyController/supplierAreaController").addArea(
          { body: areaData, user: req.user, headers: req.headers },
          mockRes
        );
        results.push(areaData);
      } catch (error) {
        // This should not happen as we've already validated everything,
        // but just in case there's an unexpected error
        return handleResponse(
          req,
          res,
          500,
          "error",
          `Lỗi hệ thống khi tạo vườn: ${error.message}`,
          req.headers.referer
        );
      }
    }

    // If we got here, all areas were created successfully
    if (results.length) {
      await ActionHistory.create({
        actionType: "create",
        userId: req.user._id,
        details: "Nhập dữ liệu vườn và nhà vườn từ Excel",
        newValues: results,
      });
    }

    return handleResponse(
      req,
      res,
      200,
      "success",
      `Đã tạo ${results.length} vườn thành công`,
      req.headers.referer
    );
  } catch (error) {
    console.error("Import error:", error);
    return handleResponse(
      req,
      res,
      500,
      "error",
      "Lỗi hệ thống khi xử lý file Excel",
      req.headers.referer
    );
  }
}