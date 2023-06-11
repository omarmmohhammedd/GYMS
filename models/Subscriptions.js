const mongoose = require('mongoose');

module.exports = mongoose.model("Subscriptions", new mongoose.Schema({
    club: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    name: {
        type: String,
        required: [true, "Enter Subscription Name"]
    },
    price: {
        type: Number,
        required: [true, "Enter Subscription Name"]
    }
}, { timestamps: true }))