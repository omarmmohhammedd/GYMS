const Club = require("../models/Club")
const asyncHandler = require("express-async-handler")
const Subscriptions = require("../models/Subscriptions")
const userSub = require("../models/userSub.js")
const User = require("../models/User.js")
const Rules = require("../models/Rules")
const userReports = require("../models/userReports")
const ApiError = require("../utils/ApiError")
const paypal = require("paypal-rest-sdk")
const axios = require("axios");
const { calcDistance } = require("../utils/Map")

exports.getRules = asyncHandler(async (req, res) => {
    if (req.query.type && req.query.type === "banner") {
        const banner = (await Rules.findOne({ type: "banner" }))
        if (!banner) res.json({ banner:""})
        else res.json({ banner: banner.banner_img })

    } else {
        res.json({ rules: await Rules.find({}) })
    }
})

exports.makeReport = asyncHandler(async (req, res) => await userReports.create({ name: req.body.name, phone: req.body.phone, email: req.body.email, message: req.body.message }).then(() => res.sendStatus(201)))

exports.getClubs = asyncHandler(async (req, res, next) => {
    const { lat, long } = req.body;
    const clubs = await Club.find({});
    const countries = {};
    for (const club of clubs) {
        if (countries[club.country]) {
            countries[club.country].push(club.city);
        } else {
            countries[club.country] = [club.city];
        }
    }
    if (lat && long) {
        const clubsWithDistance = [];
        for (const club of clubs) {
            let distance;

            distance = await calcDistance(`${club.lat},${club.long}`, `${lat},${long}`)
            if (!distance) return next(new ApiError("Invalid distance", 400))
            clubsWithDistance.push({ ...club.toObject(), distance: distance && distance });
        }

        res.json({ Clubs: clubsWithDistance, countries });
    } else res.json({ Clubs: clubs, countries });

});

exports.getClub = asyncHandler(async (req, res, next) => {
    const { lat, long } = req.body;
    await Club.findById(req.params.club_id).then(async (club) => {
        await Subscriptions.find({ club: req.params.club_id }).then(async subscriptions => {
            if (lat && long) {
                let distance = await calcDistance(`${club.lat},${club.long}`, `${lat},${long}`)
                if (!distance) return next(new ApiError("Invalid distance", 400))
                res.json({ club, distance, subscriptions })
            } else res.json({ club, subscriptions })
        })
    })
})

exports.getClubAuth = asyncHandler(async (req, res, next) => {
    const { id } = req.user
    const { lat, long } = req.body;
    const { club_id } = req.params
    await Club.findById(club_id).then(async (club) => {
        await Subscriptions.find({ club: req.params.club_id })
            .then(async subscriptions => await userSub.findOne({ club: club_id, user: id }).populate({ path: "subscription", select: "name price" })
                .then(async sub => {


                    if (lat && long) {
                        let distance = await calcDistance(`${club.lat},${club.long}`, `${lat},${long}`)
                        if (!distance) return next(new ApiError("Invalid distance", 400))
                        res.json(
                            {
                                club,
                                distance,
                                subscriptions,
                                sub: sub ? true : false,
                                data: sub ? {
                                    id: sub.id,
                                    username: (await User.findById(sub.user)).username,
                                    club_name: club.name,
                                    club_location: club.location,
                                    start_date: sub.start_date,
                                    end_date: sub.end_date,
                                    subscription_name: sub.subscription.name,
                                    subscription_price: sub.subscription.price,
                                    code: sub.code,
                                    expired: sub.expired
                                } :{}
                            })
                    } else {
                        const user = await User.findById(sub.user)
                        res.json(
                            {
                                club,
                                subscriptions,
                                sub: sub ? {
                                    id: sub.id,
                                    username: (await User.findById(sub.user)).username,
                                    club_name: club.name,
                                    club_location: club.location,
                                    start_date: sub.start_date,
                                    end_date: sub.end_date,
                                    subscription_name: sub.subscription.name,
                                    subscription_price: sub.subscription.price,
                                    code: sub.code,
                                    expired: sub.expired
                                } : false
                            })
                    }
                }))
    })
})

exports.userMakeSub = asyncHandler(async (req, res, next) => {
    const { subId } = req.params
    const { id } = req.user
    const { type } = req.query
    await Subscriptions.findById(subId).then(async (sub) => {
        const club = sub.club
        await userSub.findOne({ user: id, club, expired: false }).then(async check => {
            if (check) return next(new ApiError("User Already Make Subscreption in This Club "))
            await Subscriptions.findById(subId).then(async subscription => {
                if (!subscription) return next(new ApiError("Can't find subscription", 404))
                if (type === "paypal") {
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
                } else if (type === "wallet") {
                    await User.findById(id).then(async (user) => {
                        if (user.wallet < subscription.price) return next(new ApiError("Your Balance in Wallet Not Enough"))
                        else {
                            const start_date = new Date(Date.now())
                            let end_date = new Date(Date.now())
                            end_date = subscription.type === "يومي" ? end_date.setDate(end_date.getDate() + 1) :
                                subscription.type === "اسبوعي" ? end_date.setDate(end_date.getDate() + 7) :
                                    subscription.type === "شهري" ? end_date.setMonth(end_date.getMonth() + 1) :
                                        subscription.type === "سنوي" && end_date.setFullYear(end_date.getFullYear() + 1)
                            await userSub.create({ user: id, club: subscription.club, subscription, start_date, end_date, code: user.code }).then(async () => {
                                user.wallet -= Number(subscription.price)
                                await user.save()
                                res.sendStatus(200)
                            })
                        }
                    })
                }
            })
        })
    })
})

exports.confirmPayment = asyncHandler(async (req, res, next) => {
    const { subId } = req.params
    const { paymentId, payerId } = req.body
    const { id } = req.user
    const userData = await User.findById(id)
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
                    end_date = subscription.type === "يومي" ? end_date.setDate(end_date.getDate() + 1) :
                        subscription.type === "اسبوعي" ? end_date.setDate(end_date.getDate() + 7) :
                            subscription.type === "شهري" ? end_date.setMonth(end_date.getMonth() + 1) :
                                subscription.type === "سنوي" && end_date.setFullYear(end_date.getFullYear() + 1)
                    await userSub.create({ user: id, club: subscription.club, subscription, start_date, end_date, code: userData.code }).then(() => res.status(200).send('Payment successful'))
                }

            });
        })
    })
})

exports.depositWallet = asyncHandler(async (req, res, next) => {
    const { amount } = req.body
    const { type } = req.query
    if (type === "paypal") {
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
                            total: `${amount}`,
                            currency: 'USD'
                        },
                        description: 'Wallet Deposit'
                    }
                ]
            }
            paypal.payment.create(paymentData, (err, payment) => {
                if (err) return next(new ApiError(err.message, err.statusCode))
                const approvalUrl = payment.links.find(link => link.rel === 'approval_url').href;
                res.json({ approvalUrl })
            })
        })
    }
})

exports.confirmDeposit = asyncHandler(async (req, res, next) => {
    const { id } = req.user
    const { paymentId, payerId, amount } = req.body
    const user = await User.findById(id)
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
                user.wallet += Number(amount)
                await user.save()
                res.sendStatus(200)
            }
        });
    })
})

exports.searchClubByName = asyncHandler(async (req, res, next) => {
    const { country, city,gender } = req.body;
    await Club.find({ $or: [{ country, gender,city: { $regex: new RegExp(`.*${city}.*`, 'i') } }] })
        .then((clubs) => res.json({ clubs }));
});

exports.searchClub = asyncHandler(async (req, res, next) => {
    const { search } = req.query // User input for searching
    await Club.find()
        .or([
            { name: { $regex: search, $options: 'i' } },
            { city: { $regex: search, $options: 'i' } },
            { location: { $regex: search, $options: 'i' } },
        ]).then((clubs) => res.json({ clubs }))
})

exports.filterClubs = asyncHandler(async (req, res, next) => {
    const { filter } = req.query
    const { lat, long } = req.body
    await Club.find({}).then(async (clubs) => {
        if (filter === "nearby") {
            const clubsWithDistance = [];
            for (const club of clubs) {
                let distance;
                distance = await calcDistance(`${club.lat},${club.long}`, `${lat},${long}`)
                if (!distance) return next(new ApiError("Invalid distance", 400))
                clubsWithDistance.push({ ...club.toObject(), distance: distance && distance });
            }
            res.json({ Clubs: clubsWithDistance.sort((a, b) => Number(a.distance.split(" ")[0].replace(",", "")) - Number(b.distance.split(" ")[0].replace(",", ""))) })
        }
        else if (filter === "lowest") {
            const clubs = await Club.find({}).lean()
            const clubIds = clubs.map((club) => club._id);
            const lowestSubscriptions = await Subscriptions.aggregate([
                {
                    $match: {
                        club: { $in: clubIds },
                    },
                },
                {
                    $group: {
                        _id: "$club",
                        lowestPrice: { $min: "$price" },
                    },
                },
            ]);
            const sortedClubs = clubs.map((club) => {
                const lowestSubscription = lowestSubscriptions.find(
                    (subscription) => subscription._id.toString() === club._id.toString()
                );
                if (lowestSubscription) {
                    club.lowestSubscriptionPrice = lowestSubscription.lowestPrice;
                } else {
                    club.lowestSubscriptionPrice = null; // or any default value if there is no subscription
                }

                return club;
            });

            sortedClubs.sort((a, b) => a.lowestSubscriptionPrice - b.lowestSubscriptionPrice);
            res.json({ Clubs: sortedClubs })
        }
        else if (filter === "best") {
            await Club.aggregate([
                {
                    $lookup: {
                        from: 'usersubs',
                        localField: '_id',
                        foreignField: 'club',
                        as: 'subscriptions',
                    },
                },
                {
                    $sort: { subscriptionCount: -1 },
                },
            ]).then((Clubs) => res.json({ Clubs }))
        }
    })
})

exports.getUserWallet = asyncHandler(async (req, res, next) => {
    const { id } = req.user
    await User.findById(id).then(async user => {
        await userSub.find({ user: id, expired: false }).then(async subs => {
            if (subs.length > 0) {
                const filterSubs = await Promise.all(subs.map(async sub => {
                    const club = await Club.findById(sub.club) || { name: '', logo: '' }
                    return {
                        _id: sub._id,
                        club_name: club.name,
                        club_logo: club.logo,
                        start_date: sub.start_date,
                        end_date: sub.end_date,
                        expired: sub.expired
                    }
                }))

                res.json({ subs: filterSubs, wallet: user.wallet })
            } else {
                res.json({ subs: [], wallet: user.wallet })
            }
        })
    })
})

exports.userBooking = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id)
    await userSub.find({ user: req.user.id }).then(async subs => {
        if (!subs.length > 0) return res.status(200).json({ subs: [] })
            const filterSubs = await Promise.all(subs.map(async sub => {
                const club = await Club.findById(sub.club) || { name: '', logo: '' }
                const subscription = await Subscriptions.findById(sub.subscription)
                const expire_in = !sub.expired && Math.ceil(Math.abs(sub.end_date - new Date(Date.now())) / (1000 * 60 * 60 * 24));
                return {
                    _id: sub._id,
                    club_name: club.name,
                    club_days:club.days,
                    club_logo: club.logo,
                    start_date: sub.start_date,
                    end_date: sub.end_date,
                    expired: sub.expired,
                    price: subscription.price,
                    type: subscription.type,
                    expire_in: expire_in ? expire_in : "finished"
                }
            }))
            res.json({ subs: filterSubs })
       
    })
})