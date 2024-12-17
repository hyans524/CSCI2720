require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const xmlParser = require('./utils/xmlParser');
const Venue = require('./models/Venue');
const Event = require('./models/Event');
const User = require('./models/User');
const bson = require('bson');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/venue-events', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const db = mongoose.connection;
// Import routes
const venueRoutes = require('./routes/venues');
const eventRoutes = require('./routes/events');
const authRoutes = require('./routes/auth');

// Use routes
app.use('/api/venues', venueRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/auth', authRoutes);

// Data initialization endpoint
app.post('/api/init-data', async (req, res) => {
    try {
        // Clear existing data
        await Promise.all([
            Venue.deleteMany({}),
            Event.deleteMany({}),
            User.deleteMany({})
        ]);

        // Get data from XML files
        const venues = await xmlParser.getVenues();
        const events = await xmlParser.getEvents();

        console.log('Venues loaded:', venues.length);

        // Process and save venues
        const savedVenues = await Promise.all(
            venues.map(venue => new Venue({
                venueId: venue.venueId,
                venueName: venue.venueName,
                latitude: venue.latitude,
                longitude: venue.longitude,
                address: venue.address,
                description: venue.venueName // 使用場地名稱作為描述
            }).save())
        );

        console.log('Venues saved:', savedVenues.length);

        // Create venue ID to _id mapping
        const venueMap = savedVenues.reduce((map, venue) => {
            map[venue.venueId] = venue._id;
            return map;
        }, {});

        // Process and save events
        let savedEvents = [];
        if (events.length > 0) {
            for (const event of events) {

                if (event.venueId && venueMap[event.venueId]) {
                    try {
                        const newEvent = new Event({
                            eventId: event.eventId,
                            title: event.title,
                            description: event.description,
                            presenter: event.presenter,
                            venue: venueMap[event.venueId],
                            date: event.date
                        });
                        const savedEvent = await newEvent.save();
                        savedEvents.push(savedEvent);
                    } catch (error) {
                        console.error('Error saving event:', event.eventId, error);
                    }
                } else {

                }
            }
        }

        console.log('Events saved:', savedEvents.length);

        res.json({
            message: 'Data initialized successfully',
            venuesCount: savedVenues.length,
            eventsCount: savedEvents.length
        });

        var json1 = require("./data/venue-events.users.json")
        json1 = bson.EJSON.parse(JSON.stringify(json1))
        db.collection("users").insertMany(json1)


    } catch (error) {
        console.error('Error initializing data:', error);
        res.status(500).json({ error: 'Error initializing data', details: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


// __init
fetch('http://localhost:5000/api/init-data', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
});