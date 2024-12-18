/*
Shuyang Song: 1155173859;
Tam Yiu Hei: 1155223226;
So Hiu Tung: 1155174920;
Marlen Runz: 1155232588
*/

const express = require('express');
const router = express.Router();
const Venue = require('../models/Venue');
const auth = require('../middleware/auth');

// Get all venues
router.get('/', async (req, res) => {
    try {
        const venues = await Venue.find().populate('comments.user', 'username');
        res.json(venues);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single venue
router.get('/:id', async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id).populate('comments.user', 'username');
        if (!venue) {
            return res.status(404).json({ message: 'Venue not found' });
        }
        res.json(venue);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add comment to venue (authenticated users only)
router.post('/:id/comments', auth.userAuth, async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id);
        if (!venue) {
            return res.status(404).json({ message: 'Venue not found' });
        }

        venue.comments.push({
            user: req.user.userId,
            comment: req.body.comment,
            rating: req.body.rating,
            createdAt: new Date()
        });

        await venue.save();
        
        // Return populated venue
        const updatedVenue = await Venue.findById(req.params.id).populate('comments.user', 'username');
        res.json(updatedVenue);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get venue comments
router.get('/:id/comments', async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id)
            .populate('comments.user', 'username')
            .select('comments');
        
        if (!venue) {
            return res.status(404).json({ message: 'Venue not found' });
        }
        
        res.json(venue.comments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create venue (admin only)
router.post('/', auth.adminAuth, async (req, res) => {
    const venue = new Venue({
        venueId: req.body.venueId,
        venueName: req.body.venueName,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        address: req.body.address,
        description: req.body.description,
        comments: []
    });

    try {
        const newVenue = await venue.save();
        res.status(201).json(newVenue);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update venue (admin only)
router.put('/:id', auth.adminAuth, async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id);
        if (!venue) {
            return res.status(404).json({ message: 'Venue not found' });
        }

        Object.assign(venue, req.body);
        const updatedVenue = await venue.save();
        res.json(updatedVenue);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete venue (admin only)
router.delete('/:id', auth.adminAuth, async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id);
        if (!venue) {
            return res.status(404).json({ message: 'Venue not found' });
        }
        await venue.remove();
        res.json({ message: 'Venue deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 