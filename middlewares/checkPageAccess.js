function checkPageAccess() {
  return function(req, res, next) {
    const path = req.originalUrl;
    
    // Admin bypass
    if (req.user.role === 'Admin' || req.user.role === 'superAdmin') {
      return next();
    }

    // Find matching page permission
    const pagePermission = req.user.permissions.pages.find(p => 
      path.startsWith(p.path)
    );

    if (!pagePermission || !pagePermission.allowed) {
      req.flash('fail', 'Không có quyền truy cập');
      return res.redirect('/dang-nhap');
    }

    // Store page permissions in request for later use
    req.pagePermissions = pagePermission.actions;
    next();
  };
}

module.exports = checkPageAccess;