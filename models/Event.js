/* Fields in old system, missing from the new one

rcs_id ( Recruitment Source ID )
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

	name: { type: Types.Text, label: 'Event Name', required: true, index: true, initial: true },
	url: { type: Types.Url, noedit: true },
	isActive: { type: Types.Boolean, label: 'Is Event Active?', index: true, initial: true },
	type: { type: Types.Relationship, label: 'Event Type', ref: 'Event Type', required: true, index: true, initial: true }

}, { heading: 'Address' }, {	

	address: {
	    street1: { type: Types.Text, label: 'Address Line 1', initial: true },
		street2: { type: Types.Text, label: 'Address Line 2', initial: true },
		city: { type: Types.Text, label: 'City', initial: true },
		state: { type: Types.Relationship, label: 'State', ref: 'State', index: true, initial: true },
		zipCode: { type: Types.Text, label: 'Zip code', index: true, initial: true }
	}

}, { heading: 'Details' }, {	

	starts: { type: Types.Datetime, initial: true },
	ends: { type: Types.Datetime, initial: true },
	contact: { type: Types.Relationship, label: 'Contact Person', ref: 'User', initial: true },
	description: { type: Types.Html, wysiwyg: true, initial: true },
	isRecurring: { type: Types.Boolean, label: 'Recurring Event?', index: true, initial: true },
	recurringDuration: { type: Types.Select, label: 'Recurs Every', options: 'Day, Week, Month', dependsOn: { isRecurring: true }, initial: true }

}, { heading: 'Notes' }, {

	notes: { type: Types.Text, label: 'Notes', initial: true }

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