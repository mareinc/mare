2/* Fields in old system, missing from the new one

rcs_id ( Recruitment Source ID )  This will be the list of 300+ sources, we don't need it because we're typing a new name
location ( We break it out into multiple fields which means importing might be a manual process if we care about those.
		   We can possibly have a checkbox for a moved event and a connnect field for the old location )
directions
schedule_datetime ( Right now they just track the start date/time )

   Fields in new system, missing from the old one

url ( location of the event on the site )
address.street1
address.street2
address.city
address.state
address.zipCode
starts ( used to track the event tie more accurately )
ends ( used to track the event time more accurately )
contact ( this is a relationship now, but should probably be a text field and maybe include their details, phone, email, etc. )
recurring
recurringDuration ( This needs to be more details, every day, every week, every month on the first saturday/sunday/monday, etc. )

   End missing fields */

var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow event name to be used what auto-generating URLs
var Event = new keystone.List('Event', {
	track: true,
	autokey: { path: 'key', from: 'name', unique: true },
	map: { name: 'name' }
});

// Create fields
Event.add({ heading: 'General Information' }, {

	name: { type: Types.Text, label: 'event name', required: true, initial: true },
	url: { type: Types.Url, label: 'url', noedit: true },
	isActive: { type: Types.Boolean, label: 'is event active?', default: true, initial: true },
	// type: { type: Types.Relationship, label: 'Event Type', ref: 'Event Type', required: true, initial: true }
	type: { type: Types.Select, label: 'event type', options: 'MARE adoption parties & information events, MAPP trainings, agency information meetings, other opportunities & trainings, fundraising events', required: true, initial: true }

}, { heading: 'Address' }, {

	address: {
	    street1: { type: Types.Text, label: 'street 1', required: true, initial: true },
		street2: { type: Types.Text, label: 'street 2', initial: true },
		city: { type: Types.Text, label: 'city', required: true, initial: true },
		state: { type: Types.Relationship, label: 'state', ref: 'State', required: true, initial: true },
		zipCode: { type: Types.Text, label: 'zip code', initial: true }
	},

	contact: { type: Types.Relationship, label: 'contact', ref: 'Admin', initial: true },
	contactEmail: { type: Types.Text, label: 'contact person email', note: 'only fill out if no contact is selected', initial: true }

}, { heading: 'Details' }, {

	date: { type: Types.Date, label: 'date', format: 'MM/DD/YYYY', initial: true },
	startTime: { type: Types.Text, label: 'start time', required: true, initial: true },
	endTime: { type: Types.Text, label: 'end time', required: true, initial: true },
	description: { type: Types.Html, label: 'description', wysiwyg: true, initial: true }

}, 'Attendees', {

	cscAttendees: { type: Types.Relationship, label: 'CSC staff', ref: 'Admin', many: true, initial: true },
	siteVisitorAttendees: { type: Types.Relationship, label: 'site visitors', ref: 'Site Visitor', many: true, initial: true },
	socialWorkerAttendees: { type: Types.Relationship, label: 'social workers', ref: 'Social Worker', many: true, initial: true },
	familyAttendees: { type: Types.Relationship, label: 'families', ref: 'Family', many: true, initial: true },
	childAttendees: { type: Types.Relationship, label: 'children', ref: 'Child', many: true, initial: true },
	outsideContactAttendees: { type: Types.Relationship, label: 'volunteers', filters: { isVolunteer: true }, ref: 'Outside Contact', many: true, initial: true}

}, { heading: 'Notes' }, {

	notes: { type: Types.Text, label: 'notes', initial: true }

});

// Pre Save
Event.schema.pre('save', function(next) {
	'use strict';

	var eventType = '';

	switch(this.type) {
		case 'MARE adoption parties & information events': eventType = 'adoption-parties'; break
		case 'MAPP trainings': eventType = 'mapp-trainings'; break;
    	case 'fundraising events': eventType = 'fundraising-events'; break;
    	case 'agency information meetings': eventType = 'agency-info-meetings'; break;
    	case 'other opportunities & trainings': eventType = 'other-trainings'; break;
    	default: eventType = '';
	}

	//TODO: if eventType.length === 0, I should prevent the save

	this.url = '/events/' + eventType + '/' + this.key;

	next();
});

// Define default columns in the admin interface and register the model
Event.defaultColumns = 'name, url, starts, ends, isActive';
Event.register();
