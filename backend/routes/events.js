/*
Shuyang Song: 1155173859;
Tam Yiu Hei: 1155223226;
So Hiu Tung: 1155174920;
Marlen Runz: 1155232588
*/


const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const Venue = require('../models/Venue');

// Get all events
router.get('/', async (req, res) => {
    try {
        const events = await Event.find().populate('venue');
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get events by venue
router.get('/venue/:venueId', async (req, res) => {
    try {
        const events = await Event.find({ venue: req.params.venueId }).populate('venue');
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single event
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('venue');
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create event (admin only)
router.post('/', auth.adminAuth, async (req, res) => {
    const event_max_id = await Event.findOne().sort('-eventId').exec()

    const event = new Event({
        eventId: event_max_id.eventId + 1,
        title: req.body.title,
        description: req.body.description,
        presenter: req.body.presenter,
        date: req.body.date
    });
    try {
        const updatedVenue = await Venue.findOne({ venueId: req.body.venueId }).exec();
        event.venue = updatedVenue
    }
    catch (error) { res.status(400).json({ message: "Venue not found" }); }

    try {
        const newEvent = await event.save();
        res.status(201).json(newEvent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update event (admin only)
router.put('/:id', auth.adminAuth, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        try {
            const updatedVenue = await Venue.findOne({ venueId: req.body.venueId }).exec();
            event.venue = updatedVenue
        }
        catch (error) { res.status(400).json({ message: "Venue not found" }); }
        Object.assign(event, req.body);
        const updatedEvent = await event.save();
        res.json(updatedEvent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete event (admin only)
router.delete('/:eventId', auth.adminAuth, async (req, res) => {
    console.log(req.params.eventId)
    try {
        const event = await Event.findOne({ eventId: req.params.eventId }).exec();
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        await Event.deleteOne({ eventId: req.params.eventId }).exec();
        res.json({ message: 'Event deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 