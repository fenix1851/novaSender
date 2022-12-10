const Router = require('express')
const router = new Router()
const controller = require('../controllers/adminController')

const roleMiddleware = require('../middleware/roleMiddleware')


router.get('/users', roleMiddleware(['ADMIN']), controller.getUsers)

module.exports = router