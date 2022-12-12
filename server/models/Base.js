const {Schema, model} = require('mongoose')

const Base = new Schema({
    // user id not null
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // numbers - array of strings
    numbers: {
        type: [String],
        required: true
    },
    // count - number
    count: {
        type: Number,
        default: 0
    },
    filename: {
        type: String,
        required: true
    },
    // date - date
    date: {
        type: Date,
        default: Date.now
    },
    basename: {
        type: String,
        required: true
    },
})

module.exports = model('Base', Base)