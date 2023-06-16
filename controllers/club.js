const Club = require("../models/Club")
const asyncHandler = require("express-async-handler") 
const Subscriptions = require("../models/Subscriptions")
const ApiError = require("../utils/ApiError")
const User = require("../models/User")

exports.addSubscreptions = asyncHandler(async(req, res, next) => {
    const clubId = req.user.id
    const { name, price, type } = req.body
    await User.findById(clubId).then(async(club) => {
        await Subscriptions.findOne({ id: club.club, name: name }).then(async exists => {
            if (exists) return next(new ApiError("Subscription Found With This Name", 403))
            await Subscriptions.create({ club: club.club, name, price, type }).then((sub) => res.status(201).json({ sub }))
        }) 
    })
})