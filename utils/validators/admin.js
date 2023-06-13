const { check } = require("express-validator")
const validator = require("../../middlewares/validator")

exports.addClubValidator = [
    check("name").notEmpty().withMessage("Please Enter Name Of Club"),
    check("email").isEmail().withMessage("Please Enter Valid Email Of Club"),
    check("password").notEmpty().isLength({ min: 6 }).withMessage("Please Enter Password Of Club"),
    check("lat").notEmpty().withMessage("Please Enter Valid lat Of location"),
    check("long").notEmpty().withMessage("Please Enter Valid long Of location"),
    check("description").notEmpty().withMessage("Please Enter Valid Description Of Club"),
    check("gender").notEmpty().withMessage("Please Enter Valid Gender Of Users"),
    validator
]

exports.editClubValidator = [
    check("name").optional().notEmpty().withMessage("Please Enter Name Of Club"),
    check("city").optional().notEmpty().withMessage("Please Enter Valid City Of Club"),
    check("location").optional().notEmpty().withMessage("Please Enter Valid Location Of Club"),
    check("description").optional().notEmpty().withMessage("Please Enter Valid Description Of Club"),
    check("gender").optional().notEmpty().withMessage("Please Enter Valid Gender Of Users"),
    validator
]