async function renderPage(req,res){
    res.render("src/profilePage" , {layout:"./layouts/defaultLayout", title: 'Hồ sơ cá nhân', user: req.user, messages: req.flash()})
}

module.exports = {
    renderPage,
}