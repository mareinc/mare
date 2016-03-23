2/* Fields in old system, missing from the new one

rcs_id ( Recruitment Source ID )  This will be the list of 300+ sources, we don't need it because we're typing a new name
location ( We break it out into multiple fields which means importing might be a manual process )
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

	name: { type: Types.Text, label: 'event name', required: true, index: true, initial: true },
	url: { type: Types.Url, label: 'url', noedit: true },
	isActive: { type: Types.Boolean, label: 'is event active?', index: true, initial: true },
	// type: { type: Types.Relationship, label: 'Event Type', ref: 'Event Type', required: true, index: true, initial: true }
	type: { type: Types.Select, label: 'event type', options: 'MARE adoption parties & information events, MAPP training, agency information meetings, other opportunities & trainings, fundraising events', required: true, initial: true }

}, { heading: 'Address' }, {

	address: {
	    street1: { type: Types.Text, label: 'street 1', initial: true },
		street2: { type: Types.Text, label: 'street 2', initial: true },
		city: { type: Types.Text, label: 'city', initial: true },
		state: { type: Types.Relationship, label: 'state', ref: 'State', index: true, initial: true },
		zipCode: { type: Types.Text, label: 'zip code', index: true, initial: true }
	},

	contactEmail: { type: Types.Text, label: 'contact person email', required: true, initial: true },

}, { heading: 'Details' }, {

	date: { type: Types.Text, label: 'date', note: 'mm/dd/yyyy', required: true, initial: true },
	startTime: { type: Types.Text, label: 'start time', required: true, initial: true },
	endTime: { type: Types.Text, label: 'end time', required: true, initial: true },
	description: { type: Types.Html, label: 'description', wysiwyg: true, initial: true },
	isRecurring: { type: Types.Boolean, label: 'recurring event?', index: true, initial: true },
	recurringDuration: { type: Types.Select, label: 'recurs every', options: 'day, week, month', dependsOn: { isRecurring: true }, initial: true }

}, { heading: 'Notes' }, {

	notes: { type: Types.Text, label: 'notes', initial: true }

});

// Pre Save
Event.schema.pre('save', function(next) {
	'use strict';

	this.url = '/events/' + this.key;
	next();
});

// Define default columns in the admin interface and register the model
Event.defaultColumns = 'name, url, starts, ends, recurring';
Event.register();