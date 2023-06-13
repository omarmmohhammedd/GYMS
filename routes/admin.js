const router = require("express").Router()

const { addClub, getClubs, editClub } = require("../controllers/admin")

const { addClubValidator, editClubValidator } = require("../utils/validators/admin")
const imgUploader = require("../middlewares/imgUploader")

router.post("/club", imgUploader.fields([{ name: "clubImg" }, { name: "logo" ,maxCount:1}]), addClubValidator,addClub)
router.put("/club/:club_id", imgUploader.array("clubImg"), editClubValidator, editClub)

module.exports = router