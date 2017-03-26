var keystone	= require('keystone'),
	Types		= keystone.Field.Types;

// Create model. Additional options allow event attendee name to be used what auto-generating URLs
var EventAttendee = new keystone.List( 'Event Attendee' );

// Create fields
EventAttendee.add({ heading: 'General Information' }, {

	type: { type: Types.Select, label: 'attendee type', options: 'admin, site visitor, family, social worker', required: true, initial: true },
	event: { type: Types.Relationship, label: 'event', required: true, initial: true }

}, { heading: 'Attendee' }, {

	isRegistered: { type: Types.Boolean, label: 'attendee is not registered with MARE', dependsOn: { type: [ 'site visitor', 'family', 'social worker' ] }, initial: true },

	adminAttendee: { type: Types.Relationship, label: 'attendee name', ref: 'Admin', filters: { isActive: true }, initial: true },
	siteVisitorAttendee: { type: Types.Relationship, label: 'attendee name', ref: 'Site Visitor', filters: { isActive: true }, initial: true },
	familyAttendee: { type: Types.Relationship, label: 'attendee name', ref: 'Family', filters: { isActive: true }, initial: true },
	socialWorkerAttendee: { type: Types.Relationship, label: 'attendee name', ref: 'Social Worker', filters: { isActive: true }, initial: true },

	unregisteredSiteVisitorAttendee: { type: Types.Text, label: 'attendee name', initial: true },
	unregisteredFamilyAttendee: { type: Types.Text, label: 'attendee name', initial: true },
	unregisteredSocialWorkerAttendee: { type: Types.Text, label: 'attendee name', initial: true }

}, { heading: 'Address', dependsOn: { isRegistered: false } }, {

	address: {
	    street1: { type: Types.Text, label: 'street 1', initial: true },
		street2: { type: Types.Text, label: 'street 2', initial: true },
		city: { type: Types.Text, label: 'city', initial: true },
		state: { type: Types.Relationship, label: 'state', ref: 'State', initial: true },
		zipCode: { type: Types.Text, label: 'zip code', initial: true }
	},

	attendeeEmail: { type: Types.Email, label: 'attendee email', initial: true }

}, { heading: 'Additional Adults', dependsOn: { type: [ 'admin', 'family', 'social worker' ] } }, {

	isBringingRegisteredFamilies: { type: Types.Boolean, label: 'bringing registered families?', dependsOn: { type: [ 'admin', 'family', 'social worker' ] }, initial: true },
	isBringingUnregisteredFamilies: { type: Types.Boolean, label: 'bringing unregistered families?', dependsOn: { type: [ 'admin', 'family', 'social worker' ] }, initial: true },

	registeredFamilies: { type: Types.Relationship, label: 'registered families', dependsOn: { isBringingRegisteredFamilies: true }, initial: true },
	unregisteredFamilies: { type: Types.Text, label: 'unregistered families', initial: true },

}, 'Additional Children', {

	isBringingRegisteredChildren: { type: Types.Boolean, label: 'bringing registered children?', dependsOn: { type: [ 'admin', 'family', 'social worker' ] }, initial: true },
	isBringingUnregisteredChildren: { type: Types.Boolean, label: 'bringing unregistered children?', dependsOn: { type: [ 'admin', 'family', 'social worker' ] }, initial: true },
	
	registeredChildren: { type: Types.Relationship, label: 'registered children', dependsOn: { isBringingRegisteredChildren: true }, initial: true },
	unregisteredChildren: { type: Types.Text, label: 'unregistered children', initial: true },

/* Container for data migration fields ( these should be kept until after phase 2 and the old system is phased out completely ) */
}, {
	// system field to store an appropriate file prefix
	oldId: { type: Types.Text, hidden: true }

});

// Define default columns in the admin interface and register the model
EventAttendee.defaultColumns = 'type, adminAttendee, siteVisitorAttendee, familyAttendee, socialWorkerAttendee, unregisteredSiteVisitorAttendee, unregisteredFamilyAttendee, unregisteredSocialWorkerAttendee';
EventAttendee.register();
