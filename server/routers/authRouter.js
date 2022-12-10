const Router = require('express')
const router = new Router()
const controller = require('../controllers/authControler')

const {check} = require("express-validator")

const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')


router.post('/reg', [
    check('username',"Username must be not empty").notEmpty(),
    check('email',"Email must be not empty").notEmpty(),
    check('password', "Password length must be greater then 8").isLength({min:8, max: 128}),
], controller.reg) 
router.post('/login',controller.login)
router.post('/logout',controller.logout)
router.post('/refresh',controller.refresh)
router.get('/verify/:uid', controller.verify)

module.exports = router