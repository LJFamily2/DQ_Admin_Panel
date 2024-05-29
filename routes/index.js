const signInPage = require('./src/signInRoute');
const profilePage = require('./src/profileRoute');

const routes = [
    {path: "/dang-nhap", route: signInPage},
    {path: "/ho-so", route: profilePage}
]

module.exports = routes;