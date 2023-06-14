const mongoose = require('mongoose');

module.exports = mongoose.model("Club", new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please Enter Club Name"]
    },
    gender: {
        type: String,
        required: [true, "Please Enter Gender"],
        enum: ["male", "female", "both"]
    },
    days: {
        type: String,
        required:[true,"please add Days"]
    },
    from: {
        type: String,
        required:[true,"Please Enter From Time"]
    },
    to: {
        type: String,
        required:[true,"Please Enter To Time"]
    },
    city: {
        type: String,
        required: [true, "Please Enter City Name"]
    },
    lat: {
        type: String,
        required:[true,"please add club lat"]
    },
    lat: {
        type: String,
        required: [true,"please add club long"]
    },
    description: {
        type: String,
        required: [true, "Please Enter Description "]
    },
    images: Array,
    location: String,
    logo: String,
    commission: {
        type: Number,
        required:[true,"Please Enter Commmission Of Club"]
    }
},{timestamps:true}))