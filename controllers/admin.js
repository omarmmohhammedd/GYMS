const Club = require("../models/Club")
const User = require("../models/User")
const asyncHandler = require("express-async-handler")
const ApiError = require("../utils/ApiError")
const bcrypt = require("bcrypt")
const cloudinary = require("cloudinary").v2



cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});


exports.addClub = asyncHandler(async (req, res, next) => {
    const { name, email, password, lat, long, description, gender ,from,to,days} = req.body
    if (!req.files.clubImg) return next(new ApiError("Please Add Club Imgs", 409))
    if (!req.files.logo) return next(new ApiError("Please Add Club logo", 409))
    const imgs_path = await Promise.all(req.files.clubImg.map(async img => {
        const uploadImg = await cloudinary.uploader.upload(img.path);
        return uploadImg.secure_url;
    }));
    const logo = (await cloudinary.uploader.upload(req.files.logo[0].path)).secure_url
    const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
    const geocodingClient = mbxGeocoding({ accessToken: process.env.MAP_TOKEN })
    const response = await geocodingClient.reverseGeocode({
        query: [Number(long), Number(lat)],
        types: ['address'],
        limit: 1
    }).send()
    const { features } = response.body;
    const { place_name } = features[0];
    if (!place_name) return next(new ApiError("Please Add Valid Lat And Long"))
    await User.findOne({ email }).then(async user => {
        if (user) return next(new ApiError("User With This Email is Exists", 409))
        await Club.create({ name, city: `${place_name.split(" ")[place_name.split(" ").length - 2]}-${place_name.split(" ")[place_name.split(" ").length - 1]}`, location: place_name, description, gender, images: imgs_path, lat: Number(lat), long: Number(long), logo ,from,to,days}).then(async club => {
            await User.create({ email, password: await bcrypt.hash(password, 10), role: "club", club: club.id, home_location: place_name,username:name })
            res.status(201).json({ club })
        })
    })
})

exports.editClub = asyncHandler(async (req, res, next) => {
    const { club_id } = req.params
    const { name, city, location, description, gender } = req.body
    let imgs_path = []
    if (req.files) {
        imgs_path = await Promise.all(req.files.map(async img => {
            const uploadImg = await cloudinary.uploader.upload(img.path);
            return uploadImg.secure_url;
        }));
    }
    await Club.findById(club_id).then(async club => {
        if (!club) return next(new ApiError("Club Not Found", 404))
        await Club.findByIdAndUpdate(club_id,
            {
                name: name && name,
                city: city && city,
                location: location && location,
                description: description && description,
                gender: gender && gender,
                images: imgs_path.length && imgs_path
            }).then((club) => res.json({ club }))
    })
})
