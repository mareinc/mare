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
	type: { type: Types.Select, label: 'event type', options: 'MARE adoption parties & information events, MAPP trainings, agency information meetings, other opportunities & trainings, fundraising events', required: true, initial: true },
	image: { type: Types.CloudinaryImage, note: 'needed to display in the sidebar, events page, and home page', folder: 'events/', publicID: 'fileName', autoCleanup: true },
	imageFeatured: { type: Types.Url, hidden: true },
	imageSidebar: { type: Types.Url, hidden: true }

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

	staffAttendees: { type: Types.Relationship, label: 'staff', ref: 'Admin', many: true, initial: true },
	siteVisitorAttendees: { type: Types.Relationship, label: 'site visitors', ref: 'Site Visitor', many: true, initial: true },
	socialWorkerAttendees: { type: Types.Relationship, label: 'social workers', ref: 'Social Worker', many: true, initial: true },
	familyAttendees: { type: Types.Relationship, label: 'families', ref: 'Family', many: true, initial: true },
	childAttendees: { type: Types.Relationship, label: 'children', ref: 'Child', many: true, initial: true },
	outsideContactAttendees: { type: Types.Relationship, label: 'volunteers', filters: { isVolunteer: true }, ref: 'Outside Contact', many: true, initial: true}

}, { heading: 'Notes' }, {

	notes: { type: Types.Text, label: 'notes', initial: true }

/* Container for all system fields (add a heading if any are meant to be visible through the admin UI) */
}, {

	// system field to store an appropriate file prefix
	fileName: { type: Types.Text, hidden: true }

});

Event.schema.statics.findRandom = function(callback) {

  this.count(function(err, count) {
    if (err) {
      return callback(err);
    }
    var rand = Math.floor(Math.random() * count);
    this.findOne().skip(rand).exec(callback);
  }.bind(this));
 };

// Pre Save
Event.schema.pre('save', function(next) {
	'use strict';

	this.imageFeatured = this._.image.thumbnail( 168, 168, { quality: 80 } );
	this.imageSidebar = this._.image.thumbnail( 216, 196, { quality: 80 } );

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

	// Create an identifying name for file uploads
	this.fileName = this.key.replace(/-/g, '_');

	next();
});

// Define default columns in the admin interface and register the model
Event.defaultColumns = 'name, url, starts, ends, isActive';
Event.register();
