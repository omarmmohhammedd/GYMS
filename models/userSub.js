const mongoose = require("mongoose")

module.exports = mongoose.model("UserSub", new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    club: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Club"
    },
    subscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subscriptions"
    },
    date: {
        type: Date,
        defult: Date.now()
    },
    expired: Boolean
}))