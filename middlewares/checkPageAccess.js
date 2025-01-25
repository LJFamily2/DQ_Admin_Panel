function checkPageAccess() {
  return function(req, res, next) {
    const path = req.originalUrl;
    
    // Admin bypass
    if (req.user.role === 'Admin') {
      return next();
    }

    // Find matching page permission
    const pagePermission = req.user.permissions.pages.find(p => 
      path.startsWith(p.path)
    );

    if (!pagePermission || !pagePermission.allowed) {
      req.flash('fail', 'Không có quyền truy cập trang này');
      return res.redirect(req.headers.referer).status(403);
    }

    // Store page permissions in request for later use
    req.pagePermissions = pagePermission.actions;
    next();
  };
}

module.exports = checkPageAccess;