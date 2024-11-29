const rateLimit = require("express-rate-limit");
const handleResponse = require("../controllers/utils/handleResponse");

// Custom handler to display a 505 error page
const customRateLimitHandler = (req, res) => {
  return handleResponse(
    req,
    res,
    404,
    "fail",
    "Vượt quá nhiều yêu cầu xóa. Vui lòng thử lại sau 15 phút.",
    req.body.currentUrl
  );
};

// Create a rate limiter instance with the custom handler
const deleteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  handler: customRateLimitHandler,
});

// Custom middleware to conditionally apply rate limiting
const conditionalRateLimiter = (req, res, next) => {
  const userRole = req.user.role;
  if (userRole === "Admin" || userRole === "Quản lý") {
    return next();
  }
  return deleteLimiter(req, res, next);
};

module.exports = conditionalRateLimiter;
