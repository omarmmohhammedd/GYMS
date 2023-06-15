const { getClubs, getClub, getRules, makeReport } = require("../controllers/user")
const router = require("express").Router()
const verifyToken = require("../middlewares/verifyToken")


router.get("/clubs", getClubs)
router.get("/club/:club_id", getClub)
router.get("/rules", getRules)
router.post("/user_reports",makeReport)
module.exports = router
