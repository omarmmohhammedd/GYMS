const bcrypt = require('bcrypt');
const User = require("../models/User")
const asyncHandler = require("express-async-handler")
const ApiError = require("../utils/ApiError")
const {sign} = require("jsonwebtoken")

exports.Register = asyncHandler(async (req, res, next) => {
    const { username, phone, password, home_location, email,gender } = req.body
    await User.findOne({ email }).then(async user => {
        const code = Math.floor(Math.random() * 1000000)
        if (user) return next(new ApiError("Email Or Phone Already Exists", 409))
        await User.create({ email, username, phone, password: await bcrypt.hash(password, 10), home_location, code, gender }).then(user => res.status(201).json({ user }))
    })
})

exports.Login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body
    await User.findOne({ email }).then(async user => {
        if (!user) return next(new ApiError("User not found", 404))
        const match = await bcrypt.compare(password, user.password)
        if (!match) return next(new ApiError("Password Not Match", 400))
        const token = sign({ id: user.id, role: user.role }, process.env.TOKEN, { expiresIn: "30d" })
        delete user._doc.password
        res.json({user,token})
    })
})