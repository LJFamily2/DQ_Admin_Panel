/**
 * Controller for user manual pages
 */

module.exports = {
  renderPage,
};

/**
 * Renders the user manual page
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function renderPage(req, res) {
  try {
    // Define the manual sections (content will be added later)
    const manualSections = [
      { id: "introduction", title: "Giới thiệu" },
      { id: "login", title: "Đăng nhập và Bảo mật" },
      { id: "dashboard", title: "Trang Tổng quan" },
      { id: "daily-data", title: "Quản lý Dữ liệu Hàng ngày" },
      { id: "suppliers", title: "Quản lý Nhà vườn" },
      { id: "contracts", title: "Quản lý Hợp đồng" },
      { id: "reports", title: "Xuất Báo cáo" },
      { id: "user-management", title: "Quản lý Người dùng" },
      { id: "settings", title: "Cài đặt Hệ thống" },
    ];

    res.render("src/userManualPage", {
      layout: "./layouts/defaultLayout",
      title: "Hướng dẫn sử dụng hệ thống",
      user: req.user,
      manualSections,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Error rendering user manual page:", error);
    res.status(500).render("partials/500", { layout: false });
  }
}
