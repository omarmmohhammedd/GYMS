const router = require("express").Router()
const { addClub, editClub, addRule, activePayment } = require("../controllers/admin")
const { addClubValidator, editClubValidator} = require("../utils/validators/admin")
const { check } = require("express-validator")
const validator = require("../middlewares/validator")
const imgUploader = require("../middlewares/imgUploader")

router.post("/club", imgUploader.fields([{ name: "clubImg" }, { name: "logo" ,maxCount:1}]), addClubValidator,addClub)
router.put("/club/:club_id", imgUploader.fields([{ name: "clubImg" }, { name: "logo", maxCount: 1 }]), editClubValidator, editClub)
// Add New Rule 
router.post("/rule", imgUploader.single("img"), [check("whatsapp").optional().isMobilePhone().withMessage("Enter Valid Phone Number"), validator], addRule)
// Activate Payment
router.put("/payment/:payment_id", activePayment)

module.exports = router