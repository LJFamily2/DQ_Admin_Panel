function handleResponse(req, res, status, type, message, redirectUrl) {
    req.flash(type, message);
    res.status(status).redirect(redirectUrl);
  }
  
module.exports = handleResponse;