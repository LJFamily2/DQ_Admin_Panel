const signInRoute = require("./src/signInRoute");
const profileRoute = require("./src/profileRoute");
const accountRoute = require("./src/accountRoute");
const productRoute = require("./src/productRoute");
const rawMaterialRoute = require("./src/rawMaterialRoute");
const saleRoute = require("./src/saleRoute");
const spendRoute = require("./src/spendRoute");
const dailySupplyRoute = require("./src/dailySupplyRoute");
const dashboard = require("./src/dashboardRoute");
const actionHistory = require("./src/actionHistoryRoute");
const dateAccessRange = require("./src/dateRangeAccessRoute");
const importExcelRoute = require("./src/importExcelRoute");
const userManualRoute = require("./src/userManualRoute");

// Add to routes array:
const routes = [
  { path: "/tong", route: dashboard },
  { path: "/dang-nhap", route: signInRoute },
  { path: "/ho-so", route: profileRoute },
  { path: "/quan-ly-tai-khoan", route: accountRoute },
  { path: "/quan-ly-hang-hoa", route: productRoute },
  { path: "/quan-ly-du-lieu", route: rawMaterialRoute },
  { path: "/quan-ly-hop-dong", route: saleRoute },
  { path: "/quan-ly-chi-tieu", route: spendRoute },
  { path: "/du-lieu-hang-ngay", route: dailySupplyRoute.areaDataRoute },
  { path: "/nhap-du-lieu", route: dailySupplyRoute.inputDataRoute },
  { path: "/du-lieu", route: actionHistory },
  { path: "/date-access-range", route: dateAccessRange },
  { path: "/import", route: importExcelRoute },
  { path: "/huong-dan-su-dung", route: userManualRoute },
];

module.exports = routes;
