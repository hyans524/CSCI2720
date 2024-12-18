/*
Shuyang Song: 1155173859;
Tam Yiu Hei: 1155223226;
So Hiu Tung: 1155174920;
Marlen Runz: 1155232588
*/


const fs = require('fs').promises;
const xml2js = require('xml2js');
const path = require('path');

const parser = new xml2js.Parser({
    explicitArray: false,
    trim: false,
    explicitRoot: true,
    // tagNameProcessors: [xml2js.processors.stripPrefix],
    // attrNameProcessors: [xml2js.processors.stripPrefix],
    // valueProcessors: [xml2js.processors.stripPrefix],
    // attrValueProcessors: [xml2js.processors.stripPrefix]
});

// Default location
const DEFAULT_LOCATION = {
    lat: 0,
    lng: 0
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
            description: venue.description || `${venue.venuec} (${venue.venuee})`,
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
            title: event.titlee,
            description: event.desce || '',
            presenter: event.presenterorge || '',
            venueId: event.venueid,
            date: event.predateE
        }));
    } catch (error) {
        console.error('Error parsing events:', error);
        return [];
    }
}

module.exports = {
    parseXMLFile,
    getVenues,
    getEvents,
}; 