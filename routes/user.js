const { getClubs, getClub, getRules, makeReport, userMakeSub, confirmPayment } = require("../controllers/user")
const router = require("express").Router()
const verifyToken = require("../middlewares/verifyToken")


router.get("/clubs", getClubs)
router.get("/club/:club_id", getClub)
router.get("/rules", getRules)
router.post("/user_reports", makeReport)
router.post("/make_sub/:subId", verifyToken, userMakeSub)
router.post("/confirm_payment/:subId", verifyToken, confirmPayment)
module.exports = router
