const User = require("../models/User")
const userSub = require("../models/userSub")
const ApiError = require("./ApiError")

module.exports =async (id) => {
    try {
        await User.findById(id).then(async user => {
            if (!user) throw new ApiError("User not found", 404)
            await userSub.find({ user: id, expired: false }).then(async subs => {
                if (subs.length) {
                    subs.forEach(async (sub) => { 
                        const end_date = sub.end_date
                        if (end_date.getTime() > Date.now()) {
                            await userSub.findOneAndUpdate({ user: id, expired: false },{expired:true})
                        }
                    })
                }
            })
            })
    } catch (e) {
        console.error(e)
        throw new ApiError(e.message,e.statusCode)
    }   
}