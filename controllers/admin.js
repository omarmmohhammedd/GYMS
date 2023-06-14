const Club = require("../models/Club")
const User = require("../models/User")
const asyncHandler = require("express-async-handler")
const ApiError = require("../utils/ApiError")
const bcrypt = require("bcrypt")
const cloudinary = require("cloudinary").v2
const { getPlace } = require("../utils/Map")
const Rules = require("../models/Rules")
const axios = require("axios")
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});


exports.addClub = asyncHandler(async (req, res, next) => {
    const { name, email, password, lat, long, description, gender, from, to, days, commission } = req.body
    if (!req.files.clubImg) return next(new ApiError("Please Add Club Imgs", 409))
    if (!req.files.logo) return next(new ApiError("Please Add Club logo", 409))
    const imgs_path = await Promise.all(req.files.clubImg.map(async img => {
        const uploadImg = await cloudinary.uploader.upload(img.path);
        return uploadImg.secure_url;
    }));
    const logo = (await cloudinary.uploader.upload(req.files.logo[0].path)).secure_url
    const place_name = await getPlace(Number(lat) ,Number(long) )
    await User.findOne({ email }).then(async user => {
        if (user) return next(new ApiError("User With This Email is Exists", 409))
        await Club.create({ name, city: `${place_name.split(" ")[place_name.split(" ").length - 2]}-${place_name.split(" ")[place_name.split(" ").length - 1]}`, location: place_name, description, gender, images: imgs_path, lat: Number(lat), long: Number(long), logo, from, to, days,commission }).then(async club => {
            await User.create({ email, password: await bcrypt.hash(password, 10), role: "club", club: club.id, home_location: place_name,username:name })
            res.status(201).json({ club })
        })
    })
})

exports.editClub = asyncHandler(async (req, res, next) => {
    const { club_id } = req.params
    const { name, lat, long, description, gender, from, to, days,commission } = req.body
    let imgs_path = []
    if (req.files.clubImg) {
        imgs_path = await Promise.all(req.files.clubImg.map(async img => {
            const uploadImg = await cloudinary.uploader.upload(img.path);
            return uploadImg.secure_url;
        }));
    }
    let logo = req.files.logo && (await cloudinary.uploader.upload(req.files.logo[0].path)).secure_url
    let place_name;
    if (lat && long) place_name = await getPlace(Number(lat),Number(long))
        await Club.findById(club_id).then(async club => {
            if (!club) return next(new ApiError("Club Not Found", 404))
            await Club.findByIdAndUpdate(club_id,
                {
                    name: name && name,
                    city: place_name && `${place_name.split(" ")[place_name.split(" ").length - 2]}-${place_name.split(" ")[place_name.split(" ").length - 1]}`,
                    location: place_name && place_name, description: description && description, gender: gender && gender, images: imgs_path.length && imgs_path, logo: logo && logo, lat: place_name && Number(lat), long: place_name && Number(long), from: from && from, to: to && to, days: days && days, commission: commission && commission
                },{new:true}).then((club) => res.json({ club }))
        })

 
})

// Add Rule
exports.addRule = asyncHandler(async (req, res, next) => {
    const { type } = req.query
    if (type === "uses" || type === "privacy") {
        const { textBody } = req.body
        if (!textBody.length) return next(new ApiError("Please Add a textBody", 400))
        await Rules.findOne({ type }).then(async (rule) => {
            if (rule) await Rules.findOneAndUpdate({ type }, { textBody }).then((uses) => res.json(uses))
            else await Rules.create({ textBody, type }).then((uses) => res.json(uses))
        })
    } else if (type === 'main_img') {
        const main_img = req.file && (await cloudinary.uploader.upload(req.file.path)).secure_url
        if (!main_img) return next(new ApiError("Please Add a main_img", 400))
        await Rules.findOne({ type }).then(async (rule) => {
            if (rule) await Rules.findOneAndUpdate({ type }, { main_img }).then((main_img) => res.json(main_img))
            else await Rules.create({ main_img, type }).then((main_img) => res.json(main_img))
        })
    } else if (type === 'main_logo') {
        const main_logo = req.file && (await cloudinary.uploader.upload(req.file.path)).secure_url
        if (!main_logo) return next(new ApiError("Please Add a main_logo", 400))
        await Rules.findOne({ type }).then(async (rule) => {
            if (rule) await Rules.findOneAndUpdate({ type }, { main_logo }).then((main_img) => res.json(main_img))
            else await Rules.create({ main_logo, type }).then((main_img) => res.json(main_img))
        })
    } else if (type === "payment") {
        const { payment_type } = req.body
        if (payment_type === "paypal") {
            const { clientId, clientSecert, mode } = req.body
            await axios.post(`${mode === "sandbox" ? "https://api.sandbox.paypal.com/v1/oauth2/token" : "https://api.paypal.com/v1/oauth2/token"}`, null, {
                params: {
                    grant_type: 'client_credentials',
                },
                auth: {
                    username: clientId,
                    password: clientSecert,
                },
            }).then(async response => {
                if (response.status === 200) {
                    await Rules.findOne({ type, payment_type, mode }).then(async exists => {
                        if (exists) await Rules.findOneAndUpdate({ type, payment_type, mode }, { clientId, clientSecert, mode })
                            .then(async payment => res.status(201).json({ payment }))
                        else await Rules.create({ type, payment_type, clientId, clientSecert, mode, active: false })
                            .then(async payment => res.status(201).json({ payment }))
                    })
                }
            }).catch(err => {
                console.log(err.message)
                return next(new ApiError(err.message, 401))
            })
        }
    }else if (type === "whatsapp") {
        const { whatsapp } = req.body
        if (!whatsapp) return next(new ApiError("Whatsapp Required", 400))
        await Rules.findOne({ type }).then(async (rule) => {
            if (rule) await Rules.findOneAndUpdate({ type }, { whatsapp }).then(whatsapp => res.json({ whatsapp }))
            else await Rules.create({ whatsapp, type }).then(whatsapp => res.json({ whatsapp }))
        })
    } else if (type === "instagram") {
        const { instagram } = req.body
        if (!instagram) return next(new ApiError("Instagram Required", 400))
        await Rules.findOne({ type }).then(async (rule) => {
            if (rule) await Rules.findOneAndUpdate({ type }, { instagram }).then(instagram => res.json({ instagram }))
            else await Rules.create({ instagram, type }).then(instagram => res.json({ instagram }))
        })
    } else if (type === "facebook") {
        const { facebook } = req.body
        if (!facebook) return next(new ApiError("Facebook Required", 400))
        await Rules.findOne({ type }).then(async (rule) => {
            if (rule) await Rules.findOneAndUpdate({ type }, { facebook }).then(facebook => res.json({ facebook }))
            else await Rules.create({ facebook, type }).then(facebook => res.json({ facebook }))
        })
    } else if (type === "questions") {
        const { question, answer } = req.body
        if (!question || !answer) return next(new ApiError("Please Add Question And Answer", 400))
        await Rules.findOne({ type }).then(async (rule) => {
            if (rule) await Rules.findOneAndUpdate(
                { type },
                { $push: { questions: { question, answer } } }
            ).then(questions => res.json({ questions }))
            else await Rules.create({ questions: [{ question, answer }], type }).then(questions => res.json({ questions }))
        })
        
    }
    else return next(new ApiError("Invalid Type To Be Modify", 403))
}
)
// Payment Activate With Paypal
exports.activePayment = asyncHandler(async (req, res, next) => {
    const { payment_id } = req.params
    await Rules.findById(payment_id).then(async payment => {
        if (!payment_id) return next(new ApiError("Payment Not Found", 404))
        if (payment.mode === "sandbox") {
            await Rules.updateMany({ mode: "live" }, { active: "false" })
            await Rules.findByIdAndUpdate(payment_id, { active: true }).then(() => res.sendStatus(200))
        } else {
            await Rules.updateMany({ mode: "sandbox" }, { active: "false" })
            await Rules.findByIdAndUpdate(payment_id, { active: true }).then(() => res.sendStatus(200))
        }
    })
})