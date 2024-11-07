const signInRoute = require('./src/signInRoute');
const profileRoute = require('./src/profileRoute');
const accountRoute = require('./src/accountRoute') 
const managerRoute = require('./src/managerRoute') 
const productRoute = require('./src/productRoute') 
const areaRoute = require("./src/areaRoute")
const plantationRoute = require("./src/plantationRoute")
const queryRoute = require("./src/queryRoute")
const rawMaterialRoute = require("./src/rawMaterialRoute")
const saleRoute = require("./src/saleRoute")
const spendRoute = require("./src/spendRoute")
const dailySupplyRoute = require("./src/dailySupplyRoute")
const dashboard = require("./src/dashboardRoute")
const actionHistory = require("./src/actionHistoryRoute")
const dateAccessRange = require("./src/dateRangeAccessRoute")

const routes = [
    {path: "/tong", route: dashboard},
    {path: "/dang-nhap", route: signInRoute},
    {path: "/ho-so", route: profileRoute},
    {path: "/quan-ly-tai-khoan", route: accountRoute},
    // {path: "/quan-ly-nguoi-quan-ly", route: managerRoute},
    {path: "/quan-ly-hang-hoa", route: productRoute},
    // {path: "/quan-ly-khu-vuc", route: areaRoute},
    // {path: "/quan-ly-vuon", route: plantationRoute},
    {path: "/truy-van", route: queryRoute},
    {path: "/quan-ly-du-lieu", route: rawMaterialRoute},
    {path: "/quan-ly-hop-dong", route: saleRoute},
    {path: "/quan-ly-chi-tieu", route: spendRoute},
    {path: "/du-lieu-hang-ngay", route: dailySupplyRoute},
    {path: "/nhap-du-lieu", route: dailySupplyRoute},
    {path: "/du-lieu", route: actionHistory},
    {path: "/date-access-range", route: dateAccessRange},

]

module.exports = routes;