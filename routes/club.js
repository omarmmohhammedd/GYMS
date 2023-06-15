const router = require("express").Router()

const { addSubscreptions } = require("../controllers/club")
const { addSubscreptionvalidatior } = require("../utils/validators/club")


router.post("/subscription", addSubscreptionvalidatior, addSubscreptions)

module.exports = router