const Router = require('express')
const router = new Router()
const controller = require('../controllers/userController')

const authMiddleware = require('../middleware/authMiddleware')

router.get('/', authMiddleware, controller.getUser)
// post for add money to balance
router.post('/add', authMiddleware, controller.addMoney)
router.post('/uploadTable', authMiddleware, controller.uploadTable) // upload table to database)
router.post('/analyzeTable', authMiddleware, controller.analyzeTable) // analyze table 
router.get('/improveTable', authMiddleware, controller.improveTable) // improve table
router.post('/addBase', authMiddleware, controller.addBase) // gets array of mobiles and name of file
router.get('/getBases', authMiddleware, controller.getBases) // gets array of mobiles and name of file
router.post('/createDistribution', authMiddleware, controller.createDistribution) // gets name of base and text of message
router.get('/getDistributions', authMiddleware, controller.getDistributions) // gets array of distributions
module.exports = router