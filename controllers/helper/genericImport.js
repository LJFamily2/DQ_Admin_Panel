const ActionHistory = require("../../models/actionHistoryModel");
const handleResponse = require("../utils/handleResponse");
const processExcelFile = require("./processExcelFile");

const messages = {
  success: (count) => `Đã nhập thành công ${count} bản ghi`,
  partialSuccess: (success, errors) =>
    `Đã nhập thành công ${success} bản ghi. Lỗi: ${errors}`,
  validation: (errors) => `Lỗi dữ liệu: ${errors}`,
  error: "Lỗi khi xử lý dữ liệu"
};

const createMockRes = () => ({
  status: function() { return this; },
  json: function() { return this; },
  redirect: function() { return this; },
  render: function() { return this; },
  send: function() { return this; }
});

const genericImport = async (req, res, processor, historyDescription) => {
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
        messages.validation(errors.join("; ")),
        req.headers.referer
      );
    }

    const results = [];
    const failedRows = [];
    const mockRes = createMockRes();

    for (const [index, row] of processedData.entries()) {
      try {
        await processor(row, req, mockRes);
        results.push(row);
      } catch (error) {
        failedRows.push(
          `Dòng ${index + 2}: ${error.message || messages.error}`
        );
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
};

module.exports = genericImport;
