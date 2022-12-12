const { json } = require('express')
const User = require('../models/User')
const Subscription = require('../models/Subscriptions')


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
    async getSubscriptions(req,res){
        try {
            const subscriptions = await Subscription.find()
            res.json(subscriptions)
        } catch (e) {
            console.log(e)
            
        }
    }
    // Adding new subscription
    async addSubscription(req,res) {
        try {
            const {name,length,price,acceses} = req.body
            console.log(name, length,price, acceses)
            const subscriptionNameUniqueVerify = await Subscription.findOne({name})
            console.log(subscriptionNameUniqueVerify)
            if (subscriptionNameUniqueVerify) {
                return res.status(400).json({message: `Subscription with name ${name} already exist`})
            }
            if (!name ||!length||!price||!acceses){
                return res.status(401).json({message:`Check your query: name: ${name} length: ${length} price: ${price} acceses: ${acceses}`})
            }
            if (typeof length[length.length-1] =="number"){
                return res.status(500).json({message: 'Please specify time type: 1d - one day, 1h - one hour, 1m - one minute'})
            }
            const timeType = length[length.length-1]
            const timeBody = parseInt(length.slice(0,-1))
            if(isNaN(timeBody) ){
                return res.status(500).json({message: 'Please check length format it must include only numbers + one letter at -1 index'})
            }

            let duration = 0
            switch(timeType){
                case 'd':
                    duration = timeBody*86400000
                    break
                case 'h':
                    duration = timeBody*3600000
                    break
                case 'm':
                    duration = timeBody*60000
                    break
            }

            if(!duration){
                return res.status(500).json({message: 'Please check time type: 1d - one day, 1h - one hour, 1m - one minute'})
            }

            const subscription = new Subscription({name: name, length: duration, price: price, acceses:acceses})
            await subscription.save()
            return res.json({message: `Subscription ${name} with length: ${length} (${duration}ms) and price: ${price}$ successfully created!`})
        } catch (e) {
            console.log(e)
            return res.status(500).json({message: 'Internal server error'})
        }
    }
    
    async editSubscription(req,res){
        try {
        const {name, newName,newLength,newPrice, newAcceses} = req.body
        // console.log(name, newName,newLength,newPrice, newAcceses)
        const subscription = await Subscription.findOne({name})

        if(!subscription) {
            return res.status(403).json({message:`There are no subscription: ${name}, check spleeing and try again`})
        }

        const newFields = {name: newName, length: newLength, price: newPrice, acceses: newAcceses}

        for (const keyOfNewFields in newFields) {
            console.log(newFields[keyOfNewFields])
            if(newFields[keyOfNewFields]){
                subscription[keyOfNewFields] = newFields[keyOfNewFields]
            }
        }
        // console.log(subscription)
        await subscription.save()
        return res.json(subscription)   
        } catch (e) {
            console.log(e)
            return res.status(500).json({message: 'Internal sever error'})
        }

    }
    // Adding subscription to user
    async subscribeUser(req, res) {
        try {
            const {username,subscriptionName} = req.body
            console.log(subscriptionName)
            if(!username) {
                return res.status(401).json({message: `Please check  user arguments, username: ${username}`})
            }
            if(!subscriptionName) {
                return res.status(401).json({message: 'field "subscriptionName" must be not empty'})
            }
            const user = await User.findOne({username})

            const subscription = await Subscription.findOne({name:subscriptionName})
            console.log(subscription)
            if(!subscription){
                return res.status(401).json({message: `No subscription with name: ${subscriptionName}`})
            }

            if(!user){
                return res.status(401).json({message: `No user with name: ${username}`})
            }
            // console.log(subscription._id)
            user.subscription = subscription._id
            user.subscriptionStart = Date.now()
            // console.log(user)
            await user.save()
            res.json({message: `subscribe: ${username} for subcription ${subscriptionName}`})
        } catch (e) {
            console.log(e)
        }  
    }
    async unSubscribeUser(req,res){
        try {
            console.log(1)
            const {username} = req.body

            if(!username){
                return res.status(403).json({message:'Field username must not be empty'})
            }

            const user = await User.findOne({username})

            if(!user){
                return res.status(403).json({message:`User ${username} not found`})
            }

            user.subscription = null
            user.subscriptionStart = ''
            await user.save()
            console.log(user)
            return res.status(200).json({message: `Delete subscription from user: ${username} `})
        } catch (e) {
            console.log(e)
            return res.status(500).json({message: `Internal Server Error`})
        }
        
    }
}

module.exports = new adminController()