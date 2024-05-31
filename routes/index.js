const signInRoute = require('./src/signInRoute');
const profileRoute = require('./src/profileRoute');
const accountRoute = require('./src/accountRoute') 
const managerRoute = require('./src/managerRoute') 

const routes = [
    {path: "/dang-nhap", route: signInRoute},
    {path: "/ho-so", route: profileRoute},
    {path: "/quan-ly-tai-khoan", route: accountRoute},
    {path: "/quan-ly-nguoi-quan-ly", route: managerRoute},
]

module.exports = routes;