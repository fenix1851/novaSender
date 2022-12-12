const Router = require('express')
const router = new Router()
const controller = require('../controllers/adminController')

const roleMiddleware = require('../middleware/roleMiddleware')


router.get('/users', roleMiddleware(['ADMIN']), controller.getUsers)
router.get('/subscriptions', roleMiddleware(['ADMIN']), controller.getSubscriptions)

router.post('/addSubscription', roleMiddleware(['ADMIN']), controller.addSubscription)
router.post('/editSubscription', roleMiddleware(['ADMIN']), controller.editSubscription) 

router.post('/subscribeUser', roleMiddleware(['ADMIN']), controller.subscribeUser)
router.post('/unSubscribeUser', roleMiddleware(['ADMIN']), controller.unSubscribeUser)

module.exports = router