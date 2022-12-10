const {Schema, model} = require('mongoose')

const Connection = new Schema({
    name: {type: String, required: true},
    user: {type: String, required: true, ref:'User'},
})

module.exports = model('Connection', Connection)