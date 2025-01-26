const passport = require("passport");
const handleResponse = require("./utils/handleResponse");
const trimStringFields = require("./utils/trimStringFields");

function renderLogin(req, res) {
  res.render("src/signInPage", { layout: false, messages: req.flash() });
}

function handleLogin(req, res, next) {
  req.body = trimStringFields(req.body);
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return handleResponse(
        req,
        res,
        401,
        "fail",
        "Tài khoản hoặc mật khẩu không đúng",
        "/dang-nhap"
      );
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      if (req.body.rememberMe === "true") {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
      } else {
        req.session.cookie.expires = false;
      }
      // Redirect based on user role
      switch (user.role) {
        case "Admin":
        case "superAdmin":
          return res.redirect("/tong");
        case "Văn phòng":
          return res.redirect("/du-lieu-hang-ngay");
        case "Hàm lượng":
          return res.redirect("/nhap-du-lieu/nguyen-lieu");
        default:
          return res.status(500).render("partials/500", { layout: false });
      }
    });
  })(req, res, next);
}

module.exports = {
  handleLogin,
  renderLogin,
};
