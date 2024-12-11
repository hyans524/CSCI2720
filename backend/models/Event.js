const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    eventId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: String,
    presenter: String,
    price: String,
    venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
    dates: [{
        date: { type: Date, required: true },
        time: String
    }]
});

module.exports = mongoose.model('Event', eventSchema); 