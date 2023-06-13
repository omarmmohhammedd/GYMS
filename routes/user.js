const { getClubs } = require("../controllers/user")
const router = require("express").Router()
router.get("/clubs", getClubs)
module.exports = router