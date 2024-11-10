const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
const ensureLoggedOut = require('connect-ensure-login').ensureLoggedOut;

function ensureRole(role) {
  return function (req, res, next) {
    if (req.isAuthenticated() && req.user.role === role) {
      return next();
    } else {
      req.flash('fail', 'Không có quyền thao tác!');
      return res.status(403).redirect(req.headers.referer);
    }
  };
}

function ensureRoles(roles) {
  return function (req, res, next) {
    if (req.isAuthenticated() && roles.includes(req.user.role)) {
      return next();
    } else {
      req.flash('fail', 'Không có quyền thao tác!');
      return res.status(403).redirect(req.headers.referer);
    }
  };
}

function ensureWorkingHours(req, res, next) {
  const currentHour = new Date().getHours();
  const workingHoursStart = 7; // 7 AM
  const workingHoursEnd = 23; // 11 PM

  if (req.isAuthenticated && req.isAuthenticated() && req.user && (req.user.role === 'Admin' || req.user.role === 'Giám đốc')) {
    return next();
  }

  if (currentHour >= workingHoursStart && currentHour < workingHoursEnd) {
    return next();
  } else {
    req.logout(err => {
      if (err) {
        req.flash('fail', 'Đăng xuất không thành công!');
        return next(err);
      }
      req.flash('fail', 'Ngoài giờ làm việc!');
      return res.status(403).redirect('/dang-nhap');
    });
  }
}

module.exports = {
  ensureLoggedOut: ensureLoggedOut('/ho-so'),
  ensureLoggedIn: ensureLoggedIn('/dang-nhap'),
  ensureAdmin: ensureRole('Admin'),
  ensureManager: ensureRole('Giám đốc'),
  ensureVanPhong: ensureRole('Văn phòng'),
  ensureRoles: ensureRoles, 
  ensureWorkingHours,
};