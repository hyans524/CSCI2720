const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    comment: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const venueSchema = new mongoose.Schema({
    venueId: {
        type: String,
        required: true,
        unique: true
    },
    venueName: {
        type: String,
        required: true
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    comments: [commentSchema],
    averageRating: {
        type: Number,
        default: 0
    }
});

// Calculate average rating before saving
venueSchema.pre('save', function(next) {
    if (this.comments.length > 0) {
        const totalRating = this.comments.reduce((sum, comment) => sum + comment.rating, 0);
        this.averageRating = totalRating / this.comments.length;
    } else {
        this.averageRating = 0;
    }
    next();
});

module.exports = mongoose.model('Venue', venueSchema); 