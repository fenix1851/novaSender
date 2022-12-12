const jwt = require('jsonwebtoken')
const {secret} = require('../config')
const Subscriptions = require('../models/Subscriptions')

const User = require('../models/User')

module.exports = function(innerAcces) {
    return async function(req,res,next){
        if (req.method === "OPTIONS") {
            next()
        }
        try {
            // checking authorization
            const token = req.headers.authorization.split(' ')[1]
            if(!token) {
                return res.status(401).json({message:"User unauthorized"})
            }
            const {id: id} = jwt.verify(token, secret)
            let hasAcces = false
            const user = await User.findById(id)

            if (!user){
                return res.status(401).json({message:"User anauthorized"})
            }

            // find subscription
            
            const subscription =  await Subscriptions.findById(user.subscription) 
            
            if(!subscription){
                return res.status(401).json({message: 'There are no subscription'})
            }

            // checking accesses in subscription
            subscription.acceses.forEach(acces => {
                if(acces == innerAcces){
                    hasAcces = true
                }
            });
            
            if(!hasAcces){
                return res.status(403).json({message: 'Acces Denied'})
            }

            // checking if subscription are outdated
            const duration  = subscription.length 
            const subscriptionStart = user.subscriptionStart
            
            if(!subscriptionStart){
                res.status(500).json({message: "There are no subscription start time"})
            }
            
            const checkTimeout = duration + subscriptionStart

            const currentTime = Date.now()
            
            // if outdated update user subscription to None
            if(currentTime >= checkTimeout){
                user.subscription = ''
                user.subscriptionStart = ''
                await user.save()
                return res.status(403).json({message: 'Подписка окончена, продлите подписку'})
            }
            next()
        } catch(e) {
            console.log(e)
            return res.status(401).json({message:"User unauthorized"})
        }
    }
}