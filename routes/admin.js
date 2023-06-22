const router = require("express").Router()
const { addClub, editClub, addRule, activePayment, deleteClub, getUserReports, clubReports, deleteQuestion } = require("../controllers/admin")
const { addClubValidator, editClubValidator} = require("../utils/validators/admin")
const { check } = require("express-validator")
const validator = require("../middlewares/validator")
const imgUploader = require("../middlewares/imgUploader")

// Clubs 
router.post("/club", imgUploader.fields([{ name: "clubImg" }, { name: "logo" ,maxCount:1}]), addClubValidator,addClub)
router.put("/club/:club_id", imgUploader.fields([{ name: "clubImg" }, { name: "logo", maxCount: 1 }]), editClubValidator, editClub)
router.delete("/club/:club_id",[check("club_id").isMongoId().withMessage("Please Add Valid Mongo Id ")] ,deleteClub)
// Add New Rule 
router.post("/rule", imgUploader.single("img"), [check("whatsapp").optional().isMobilePhone().withMessage("Enter Valid Phone Number"), validator], addRule)
// Activate Payment
router.put("/payment/:payment_id", activePayment)

// Reports
router.get("/user_reports", getUserReports)

router.get("/clubs/report", clubReports)

router.delete("/rule/question", deleteQuestion)
module.exports = router