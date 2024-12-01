function checkPermission(action) {
  return function (req, res, next) {
    if (req.user.permissions[action]) {
      return next();
    } else {
        req.flash("fail", "Hành động không được cấp phép");
        return res.status(403);
    }
  };
}

module.exports = checkPermission
