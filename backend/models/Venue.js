/*
Shuyang Song: 1155173859;
Tam Yiu Hei: 1155223226;
So Hiu Tung: 1155174920;
Marlen Runz: 1155232588
*/

const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
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
    },
    totalComments: {
        type: Number,
        default: 0
    }
});

// Calculate average rating and total comments before saving
venueSchema.pre('save', function(next) {
    if (this.comments.length > 0) {
        const totalRating = this.comments.reduce((sum, comment) => sum + comment.rating, 0);
        this.averageRating = (totalRating / this.comments.length).toFixed(1);
        this.totalComments = this.comments.length;
    } else {
        this.averageRating = 0;
        this.totalComments = 0;
    }
    next();
});

// Get recent comments
venueSchema.methods.getRecentComments = function(limit = 5) {
    return this.comments
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit);
};

// Get user's comment for this venue
venueSchema.methods.getUserComment = function(userId) {
    return this.comments.find(comment => 
        comment.user.toString() === userId.toString()
    );
};

module.exports = mongoose.model('Venue', venueSchema); 