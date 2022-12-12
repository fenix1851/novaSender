const {Schema, model} = require('mongoose')

const User = new Schema({
    username: {type: String, unique: true, required: true},
    email: {type: String, unique: true, required: true},
    password: {type: String, required: true},
    roles: [{type: String, ref: 'Role'}],
    balance: {type: Number, default: 6100},
    subscriptionStart: {type: String},
    subscription: {type: Schema.Types.ObjectId, ref: 'Subscription'},

})

module.exports = model('User', User)