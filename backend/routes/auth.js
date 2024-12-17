const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Venue = require('../models/Venue');
const auth = require('../middleware/auth');

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Create new user
        const user = new User({
            username,
            password,
            isAdmin: false
        });

        await user.save();

        // Generate token
        const token = jwt.sign(
            { userId: user._id, isAdmin: user.isAdmin },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({ token, userId: user._id, isAdmin: user.isAdmin });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id, isAdmin: user.isAdmin },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, userId: user._id, isAdmin: user.isAdmin });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get user favorites
router.get('/favorites', auth.userAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).populate('favorites');
        res.json(user.favorites);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add to favorites
router.post('/favorites/:venueId', auth.userAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user.favorites.includes(req.params.venueId)) {
            user.favorites.push(req.params.venueId);
            await user.save();
        }
        res.json(user.favorites);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Remove from favorites
router.delete('/favorites/:venueId', auth.userAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        user.favorites = user.favorites.filter(id => id.toString() !== req.params.venueId);
        await user.save();
        res.json(user.favorites);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get user's comments
router.get('/comments', auth.userAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .populate({
                path: 'comments.venue',
                select: 'venueName address'
            });
        res.json(user.comments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get user's comments for a specific venue
router.get('/comments/venue/:venueId', auth.userAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        const comments = user.getVenueComments(req.params.venueId);
        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add a comment
router.post('/comments', auth.userAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        const venue = await Venue.findById(req.body.venueId);
        
        if (!venue) {
            return res.status(404).json({ message: 'Venue not found' });
        }

        // Create comment object
        const newComment = {
            user: req.user.userId,
            username: user.username,
            venue: req.body.venueId,
            comment: req.body.comment,
            rating: req.body.rating,
            createdAt: new Date()
        };

        // Add comment to user's comments
        user.comments.push(newComment);
        await user.save();

        // Add comment to venue's comments
        venue.comments.push({
            user: req.user.userId,
            username: user.username,
            comment: req.body.comment,
            rating: req.body.rating,
            createdAt: new Date()
        });
        await venue.save();
        
        const updatedUser = await User.findById(req.user.userId)
            .populate({
                path: 'comments.venue',
                select: 'venueName address'
            });
            
        res.json(updatedUser.comments);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update a comment
router.put('/comments/:commentId', auth.userAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        const comment = user.comments.id(req.params.commentId);
        
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Update user's comment
        if (req.body.comment) comment.comment = req.body.comment;
        if (req.body.rating) comment.rating = req.body.rating;
        await user.save();

        // Update venue's comment
        const venue = await Venue.findById(comment.venue);
        const venueComment = venue.comments.find(
            c => c.user.toString() === req.user.userId && 
                c.createdAt.getTime() === comment.createdAt.getTime()
        );
        
        if (venueComment) {
            if (req.body.comment) venueComment.comment = req.body.comment;
            if (req.body.rating) venueComment.rating = req.body.rating;
            await venue.save();
        }
        
        const updatedUser = await User.findById(req.user.userId)
            .populate({
                path: 'comments.venue',
                select: 'venueName address'
            });
            
        res.json(updatedUser.comments);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a comment
router.delete('/comments/:commentId', auth.userAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        const comment = user.comments.id(req.params.commentId);
        
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Remove comment from venue
        const venue = await Venue.findById(comment.venue);
        if (venue) {
            venue.comments = venue.comments.filter(
                c => c.user.toString() !== req.user.userId || 
                     c.createdAt.getTime() !== comment.createdAt.getTime()
            );
            await venue.save();
        }

        // Remove comment from user
        user.comments.pull(req.params.commentId);
        await user.save();
        
        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 