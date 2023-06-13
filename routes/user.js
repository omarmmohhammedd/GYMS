const { getClubs, getClub } = require("../controllers/user")
const router = require("express").Router()
const verifyToken = require("../middlewares/verifyToken")


router.get("/clubs", getClubs)
router.get("/club/:club_id",getClub)
module.exports = router
