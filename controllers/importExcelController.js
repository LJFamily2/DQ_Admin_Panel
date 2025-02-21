const { DailySupply } = require("../models/dailySupplyModel");
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
const createMockRes = () => ({
  status: () => ({ json: () => {}, send: () => {} }),
  json: () => {},
  send: () => {},
  redirect: () => {},
});

// Controller functions
module.exports = {
  importSaleData,
  importSpendData,
  importRawMaterialData,
  importProductData,
  importDailySupplyInputData,
  downloadTemplate,
};

// Translated messages
const messages = {
  supplierNotFound: (code) => `Không tìm thấy nhà vườn với mã ${code}`,
  areaNotFound: "Không tìm thấy vườn hoặc vườn chưa có nhà vườn!",
};

const templateMapping = {
  dailySupply: "Nhap_Nguyen_Lieu.xlsx",
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
