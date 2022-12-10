const {Schema, model} = require('mongoose')

const Distribution = new Schema({
    // user id not null
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // base id not null
    base: {
        type: Schema.Types.ObjectId,
        ref: 'Base',
        required: true
    },
    // cursor - number
    cursor: {
        type: Number,
        default: 0
    },
    // text - string
    text: {
        type: String,
        required: true
    },
    // links - array of strings
    links: {
        type: [String],
        required: true
    },
    // date - date
    date: {
        type: Date,
        default: Date.now
    },
    // status - boolean
    status: {
        type: Boolean,
        default: false
    },
    name: {
        type: String,
        required: true
    }
})

module.exports = model('Distribution', Distribution)