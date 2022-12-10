// libraries
const express = require("express"),
    app = express()
const cookieParser = require('cookie-parser')
const path = require('path')
const mongoose = require("mongoose")
const events = require('events')

// routers
const authRouter = require('./routers/authRouter')
const adminRouter = require('./routers/adminRouter')
const userRouter = require('./routers/userRouter')

// config
const PORT = 5000

// добавить три функции подписки на три события с проверкой подписки через мидлвейр 
app.use(express.json())
app.use(cookieParser())
app.use('/auth', authRouter)
app.use('/admin', adminRouter)
app.use('/user', userRouter)
app.get('/', (req,res) => {
    res.sendFile(path.join(__dirname+"/documentation.html"))
})
// static images
app.use('/images', express.static(path.join(__dirname,'static','images')))
// static files xlsx and pdf
app.use('/files', express.static(path.join(__dirname,'static','files')))

const start = async () => {
        mongoose.connect(`mongodb://0.0.0.0:27017/nova_sender`, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            
        }).catch((err) => {
            console.log(err)
        }).then(() => {
        app.listen(PORT)})
}

start().then(console.log('server started'))