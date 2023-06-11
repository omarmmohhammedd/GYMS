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
    city: {
        type: String,
        required: [true, "Please Enter City Name"]
    },
    location: {
        type: String,
        required: [true, "Please Enter Location Name "]
    },
    description: {
        type: String,
        required: [true, "Please Enter Description "]
    },
    images: Array
}))