const mongoose = require('mongoose');

module.exports = mongoose.model("Rules", new mongoose.Schema({
    type: {
        type: String,
        enum: ['uses', 'contact_number', "main_img", "main_logo", "payment", "commission", "Bank", "whatsapp", "instagram", "facebook", "questions","app_bg"]
    },
    textBody: String,
    main_img: String,
    main_logo: String,
    commission: Number,
    payment_type: {
        type: String,
        enum: ['visa', 'master_card', 'paypal'],
    },
    clientId: String,
    clientSecert: String,
    mode: String,
    active: Boolean,
    IBAN: String,
    whatsapp: String,
    instagram: String,
    facebook: String,
    questions: Array,
    phone1:String,
    phone2: String,
    location1: String,
    location2: String,
    app_bg:String
}))