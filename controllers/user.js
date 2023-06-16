const Club = require("../models/Club")
const asyncHandler = require("express-async-handler")
const Subscriptions = require("../models/Subscriptions")
const userSub = require("../models/userSub.js")
const Rules = require("../models/Rules")
const userReports = require("../models/userReports")
const ApiError = require("../utils/ApiError")
const paypal = require("paypal-rest-sdk")
exports.getRules = asyncHandler(async (req, res) => res.json({ rules: await Rules.find({}) }))

exports.makeReport = asyncHandler(async (req, res) => await userReports.create({ name: req.body.name, phone: req.body.phone, email: req.body.email, message: req.body.message }).then(() => res.sendStatus(201)))

exports.getClubs = asyncHandler(async (req, res, next) => res.json({ Clubs: await Club.find({}) }))

exports.getClub = asyncHandler(async (req, res, next) => {
    await Club.findById(req.params.club_id).then(async (club) => {
        await Subscriptions.find({ club: req.params.club_id }).then((subscriptions) => {
            res.json({ club, subscriptions })
        })
    })
})

exports.userMakeSub = asyncHandler(async (req, res, next) => {
    const {subId} = req.params
    const { id } = req.user
    await Subscriptions.findById(subId).then(async subscription => {
        if(!subscription) return next(new ApiError("Can't find subscription",404))
        await Rules.findOne({ payment_type: "paypal", active: true }).then((payment) => {
            if (!payment) return next(new ApiError("PayPal Payment Not Found", 404))
            paypal.configure({
                mode: payment.mode,
                client_id: payment.clientId,
                client_secret: payment.clientSecert
            })
            const paymentData = {
                intent: 'sale',
                payer: {
                    payment_method: 'paypal'
                },
                redirect_urls: {
                    return_url: process.env.REDIRECT_URL_SUCCESS,
                    cancel_url: process.env.REDIRECT_URL_CANCEL
                },
                transactions: [
                    {
                        amount: {
                            total: `${subscription.price}`,
                            currency: 'USD'
                        },
                        description: 'Club Subscription'
                    }
                ]
            }
            paypal.payment.create(paymentData, (err, payment) => {
                if (err) return next(new ApiError(err.message, err.statusCode))
                const approvalUrl = payment.links.find(link => link.rel === 'approval_url').href;
                res.json({ approvalUrl })
            })
        })
    })
})


exports.confirmPayment = asyncHandler(async (req, res, next) => {
    const { subId } = req.params
    const { paymentId, payerId } = req.body
    const { id } = req.user
    await Subscriptions.findById(subId).then(async subscription => {
        if (!subscription) return next(new ApiError("Can't find subscription", 404))
        await Rules.findOne({ payment_type: "paypal", active: true }).then((payment) => {
            paypal.configure({
                mode: payment.mode,
                client_id: payment.clientId,
                client_secret: payment.clientSecert
            })
            paypal.payment.execute(paymentId, { "payer_id": payerId, }, async (error, succesPayment) => {
                if (error) {
                    console.log(error);
                    res.status(500).send('Payment execution failed');
                } else {
                    const start_date = new Date(Date.now())
                    let end_date = new Date(Date.now())
                    end_date = subscription.type === "يومي" ? end_date.setDate(end_date.getDate() + 7) :
                        subscription.type === "اسبوعي" ? end_date.setDate(end_date.getDate() + 7) : 
                            subscription.type === "شهري" ? end_date.setMonth(end_date.getMonth() + 1) :
                                subscription.type === "سنوي" && end_date.setFullYear(end_date.getFullYear() + 1) 
                    await userSub.create({ user: id, club: subscription.club, subscription, start_date, end_date   }).then(() => res.status(200).send('Payment successful'))
                }

            });
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

