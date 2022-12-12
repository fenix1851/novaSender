const {Schema, model} = require('mongoose')

const Subscription = new Schema({
    name: {type: String, unique: true, required: true},
    length: {type: Number, required: true},
    price: {type: Number, required: true},
    acceses: [{type: Number, required: true}]
})

module.exports = model('Subscription', Subscription)