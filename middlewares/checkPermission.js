function checkPermission(action) {
  return function(req, res, next) {
    // Admin bypass
    if (req.user.role === 'Admin') {
      return next();
    }

    const pagePermissions = req.pagePermissions;
    const defaultPermissions = req.user.permissions.defaultActions;

    // Check if action is allowed either in page permissions or defaults
    if ((pagePermissions && pagePermissions[action]) || 
        (!pagePermissions && defaultPermissions[action])) {
      return next();
    }

    req.flash('fail', 'Hành động không được cấp phép');
    return res.status(403).redirect(req.headers.referer);
  };
}

module.exports = checkPermission
