const fs = require('fs').promises;
const xml2js = require('xml2js');
const path = require('path');

const parser = new xml2js.Parser({
    explicitArray: false,
    trim: true,
    explicitRoot: true,
    tagNameProcessors: [xml2js.processors.stripPrefix],
    attrNameProcessors: [xml2js.processors.stripPrefix],
    valueProcessors: [xml2js.processors.stripPrefix],
    attrValueProcessors: [xml2js.processors.stripPrefix]
});

// Default location for Hong Kong Cultural Centre
const DEFAULT_LOCATION = {
    lat: 22.2938,
    lng: 114.1722
};

// Read and parse XML file
async function parseXMLFile(filename) {
    try {
        const filePath = path.join(__dirname, '../data', filename);
        const xmlData = await fs.readFile(filePath, 'utf8');
        const result = await parser.parseStringPromise(xmlData);
        return result;
    } catch (error) {
        console.error(`Error parsing XML file ${filename}:`, error);
        throw error;
    }
}

// Parse venues data
async function getVenues() {
    const data = await parseXMLFile('venues.xml');
    const venues = Array.isArray(data.venues.venue) ? data.venues.venue : [data.venues.venue];
    
    return venues.map(venue => {
        const venueName = venue.venuee || venue.venuec;
        return {
            venueId: venue.$.id,
            venueName: venueName,
            latitude: venue.latitude ? parseFloat(venue.latitude) : DEFAULT_LOCATION.lat,
            longitude: venue.longitude ? parseFloat(venue.longitude) : DEFAULT_LOCATION.lng,
            address: venue.address || venueName,
            description: venue.description || `${venue.venuec} (${venue.venuee})`
        };
    });
}

// Parse events data
async function getEvents() {
    try {
        const data = await parseXMLFile('events.xml');
        if (!data || !data.events || !data.events.event) {
            console.log('No events found in events.xml');
            return [];
        }
        const events = Array.isArray(data.events.event) ? data.events.event : [data.events.event];
        return events.map(event => ({
            eventId: event.$.id,
            title: event.titlee || event.titlec || '',
            description: event.descriptione || event.descriptionc || event.description || '',
            presenter: event.presenterorge || event.presenterorgc || event.presenter || '',
            price: event.price || 'Free',
            venueId: event.venueid || event.venueId || ''
        }));
    } catch (error) {
        console.error('Error parsing events:', error);
        return [];
    }
}

// Parse event dates data
async function getEventDates() {
    try {
        const data = await parseXMLFile('eventDates.xml');
        if (!data || !data.eventDates || !data.eventDates.event) {
            console.log('No event dates found in eventDates.xml');
            return [];
        }
        const events = Array.isArray(data.eventDates.event) ? data.eventDates.event : [data.eventDates.event];
        return events.map(event => {
            const dates = Array.isArray(event.date) ? event.date : [event.date];
            return {
                eventId: event.$.id,
                dates: dates.map(date => {
                    // Process date and time
                    let dateObj = {};
                    if (typeof date === 'string') {
                        dateObj = {
                            date: new Date(date),
                            time: ''
                        };
                    } else {
                        dateObj = {
                            date: new Date(date._),
                            time: date.$.time || ''
                        };
                    }
                    return dateObj;
                })
            };
        });
    } catch (error) {
        console.error('Error parsing event dates:', error);
        return [];
    }
}

// Parse holiday data
async function getHolidays() {
    try {
        const data = await parseXMLFile('holiday.xml');
        if (!data || !data.holidays || !data.holidays.holiday) {
            console.log('No holidays found in holiday.xml');
            return [];
        }
        return Array.isArray(data.holidays.holiday) ? data.holidays.holiday : [data.holidays.holiday];
    } catch (error) {
        console.error('Error parsing holidays:', error);
        return [];
    }
}

module.exports = {
    parseXMLFile,
    getVenues,
    getEvents,
    getEventDates,
    getHolidays
}; 