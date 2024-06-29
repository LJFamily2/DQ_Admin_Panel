const AccountModel = require('../models/userAccountModel')
const handleResponse = require('./utils/handleResponse');

async function renderPage(req,res){
    res.render("src/profilePage" , {layout:"./layouts/defaultLayout", title: 'Hồ sơ cá nhân', user: req.user})
}

async function updateData(req,res){
    try{
        console.log(req.body)
        const {id} = req.params

        if(!id){
            return handleResponse(
                req,
                res,
                404,
                "fail",
                "Không tìm thấy tài khoản",
                req.headers.referer
            )
        }

        let updateFields ={
            ...req.body
        }

        let newData = await AccountModel.findByIdAndUpdate(id, updateFields, {new: true})
        
        if(!newData){
            return handleResponse(
                req,
                res,
                404,
                "fail",
                "Cập nhật thất bại",
                req.headers.referer
            )
        }

        handleResponse(
            req,
            res,
            201,
            "success",
            "Cập nhật thành công",
            req.headers.referer
        )
    }catch(err){
        console.log(err)
        res.status(500)
    }
}

module.exports = {
    renderPage,
    updateData
}