const passport = require('passport');

function renderLogin(req,res){
    res.render("src/signInPage" , {layout:false})
}

function handleLogin(req, res, next) {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.redirect('/signIn');
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            if (req.body.rememberMe) {
                req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; 
            } else {
                req.session.cookie.expires = false;
            }
            return res.redirect('/account');
        });
    })(req, res, next);
}

module.exports = {
    handleLogin,
    renderLogin,
}