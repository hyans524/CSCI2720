const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const Venue = require('../models/Venue');
const User = require('../models/User');

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single user
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create user (admin only)
router.post('/', auth.adminAuth, async (req, res) => {
    const user_max_id = await Event.findOne().sort('-userId').exec()

    const user = new Event({
        userId: user_max_id.userId + 1,
        title: req.body.title,
        description: req.body.description,
        presenter: req.body.presenter,
        date: req.body.date
    });
    try {
        const updatedVenue = await Venue.findOne({ venueId: req.body.venueId }).exec();
        user.venue = updatedVenue
    }
    catch (error) { res.status(400).json({ message: "Venue not found" }); }

    try {
        const newEvent = await user.save();
        res.status(201).json(newEvent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update user (admin only)
router.put('/:id', auth.adminAuth, async (req, res) => {
    try {
        const user = await Event.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Event not found' });
        }
        try {
            const updatedVenue = await Venue.findOne({ venueId: req.body.venueId }).exec();
            user.venue = updatedVenue
        }
        catch (error) { res.status(400).json({ message: "Venue not found" }); }
        Object.assign(user, req.body);
        const updatedEvent = await user.save();
        res.json(updatedEvent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete user (admin only)
router.delete('/:userId', auth.adminAuth, async (req, res) => {
    console.log(req.params.userId)
    try {
        const user = await Event.findOne({ userId: req.params.userId }).exec();
        if (!user) {
            return res.status(404).json({ message: 'Event not found' });
        }
        await Event.deleteOne({ userId: req.params.userId }).exec();
        res.json({ message: 'Event deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 