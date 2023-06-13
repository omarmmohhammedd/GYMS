const Club = require("../models/Club")
const asyncHandler = require("express-async-handler")
const Subscriptions = require("../models/Subscriptions")
const userSub = require("../models/userSub.js")

exports.getClubs = asyncHandler(async (req, res, next) => res.json({ Clubs: await Club.find({}) }))

exports.getClub = asyncHandler(async (req, res, next) => {
    const { club_id } = req.params
    await Club.findById(club_id).then(async club => {
        await userSub.findOne({ club: club_id }).then((user) => {
            if (user) return res.json({ subscripe: true, subscription: userSub, clud })
            else res.json({ subscripe: false, club })
        })
    })
})

exports.searchClub = asyncHandler(async (req, res, next) => {
    const { search } = req.query // User input for searching
    await Club.find()
        .or([
            { name: { $regex: search, $options: 'i' } }, // Search by eviction_name
            { city: { $regex: search, $options: 'i' } }, // Search source City
            { location: { $regex: search, $options: 'i' } }, // Search by dis location
        ]).then((clubs) => res.json({ clubs }))
})

exports.getClubSubscriptions = asyncHandler(async (req, res, next) => await Subscriptions.find({ club: req.params.club_id }).then((subs) => res.json({ Subscriptions: subs })))

exports.userSub = asyncHandler(async (req, res, next) => await userSub.find({ club: req.params.club, user: req.user.id }).then((userSub) => res.json({ userSub })))

exports.makeSub = asyncHandler(async (req, res, next) => {
    const id = req.user.id
    const { Subscription } = req.params
    await Subscriptions.findById(Subscription).then((sub) => {
        if (!sub) return next(new ApiError("Couldn't find subscription", 404))

    })
})
