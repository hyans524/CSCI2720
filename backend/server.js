require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const xmlParser = require('./utils/xmlParser');
const Venue = require('./models/Venue');
const Event = require('./models/Event');
const User = require('./models/User');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/venue-events', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

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
            Event.deleteMany({})
        ]);

        // Get data from XML files
        const venues = await xmlParser.getVenues();
        const events = await xmlParser.getEvents();
        const eventDates = await xmlParser.getEventDates();

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
                const eventDatesData = eventDates.find(ed => ed.eventId === event.eventId);
                const dates = eventDatesData ? eventDatesData.dates.map(d => ({
                    date: new Date(d),
                    time: ''
                })) : [];

                if (event.venueId && venueMap[event.venueId]) {
                    try {
                        const newEvent = new Event({
                            eventId: event.eventId,
                            title: event.title,
                            description: event.description,
                            presenter: event.presenter,
                            price: event.price,
                            venue: venueMap[event.venueId],
                            dates: dates
                        });
                        const savedEvent = await newEvent.save();
                        savedEvents.push(savedEvent);
                    } catch (error) {
                        console.error('Error saving event:', event.eventId, error);
                    }
                } else {
                    console.warn('Skipping event due to missing venue:', event.eventId);
                }
            }
        }

        console.log('Events saved:', savedEvents.length);

        res.json({ 
            message: 'Data initialized successfully',
            venuesCount: savedVenues.length,
            eventsCount: savedEvents.length
        });
    } catch (error) {
        console.error('Error initializing data:', error);
        res.status(500).json({ error: 'Error initializing data', details: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 