const { json } = require('express')
const User = require('../models/User')


class adminController {
    // Get users list
    async getUsers(req,res){
        try {
            const users = await User.find()
            res.json(users)
        } catch (e) {
            console.log(e)
            
        }
    }   
}

module.exports = new adminController()