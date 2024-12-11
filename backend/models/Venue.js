const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
    venueId: { type: String, required: true, unique: true },
    venueName: { type: String, required: true },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
    address: { type: String, default: '' },
    description: String,
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }]
});

module.exports = mongoose.model('Venue', venueSchema); 