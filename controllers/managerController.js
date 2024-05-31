const ManagerModel = require("../models/managerModel");
const handleResponse = require("./utils/handleResponse");

async function createManager(req, res) {
  try {
    console.log(req.body)
    // Extract uploaded files
    const frontIdentification =
       req.files["frontIdentification"]
        ? req.files["frontIdentification"][0].filename
        : null;
    const backIdentification =
       req.files["backIdentification"]
        ? req.files["backIdentification"][0].filename
        : null;
    console.log(frontIdentification)
    console.log(backIdentification)
    // Create a new manager instance
    const newManager = await ManagerModel.create({
      ...req.body,
      frontIdentification,
      backIdentification,
    });

    if (!newManager) {
      handleResponse(
        req,
        res,
        404,
        "fail",
        "Tạo người quản lý thất bại",
        "/quan-ly-nguoi-quan-ly"
      );
    }

    // Respond with success message
    handleResponse(
      req,
      res,
      201,
      "success",
      "Tạo người quản lý thành công",
      "/quan-ly-nguoi-quan-ly"
    );
  } catch (error) {
    // Log and respond with error message
    console.error(error);
    res.status(500);
  }
}

module.exports = {
  createManager,
};
