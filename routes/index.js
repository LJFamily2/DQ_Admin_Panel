const signInRoute = require('./src/signInRoute');
const profileRoute = require('./src/profileRoute');
const accountRoute = require('./src/accountRoute') 
const managerRoute = require('./src/managerRoute') 
const productRoute = require('./src/productRoute') 
const areaRoute = require("./src/areaRoute")
const plantationRoute = require("./src/plantationRoute")


const routes = [
    {path: "/dang-nhap", route: signInRoute},
    {path: "/ho-so", route: profileRoute},
    {path: "/quan-ly-tai-khoan", route: accountRoute},
    {path: "/quan-ly-nguoi-quan-ly", route: managerRoute},
    {path: "/quan-ly-hang-hoa", route: productRoute},
    {path: "/quan-ly-khu-vuc", route: areaRoute},
    {path: "/quan-ly-vuon", route: plantationRoute},
]

module.exports = routes;