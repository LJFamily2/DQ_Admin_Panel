function checkPermission(action) {
  return function(req, res, next) {
    // Admin bypass
    if (req.user.role === 'Admin' || req.user.role === 'superAdmin') {
      return next();
    }

    const pagePermissions = req.pagePermissions;

    // Check if action is allowed either in page permissions or defaults
    if ((pagePermissions && pagePermissions[action]) || 
        (!pagePermissions)) {
      return next();
    }

    req.flash('fail', 'Hành động không được cấp phép');
    return res.status(403).redirect(req.headers.referer);
  };
}

module.exports = checkPermission
