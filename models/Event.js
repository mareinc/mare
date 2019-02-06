const keystone			= require( 'keystone' ),
	  Types				= keystone.Field.Types,
	  random			= require( 'mongoose-simple-random' ),
	  SourceMiddleware	= require( '../routes/middleware/models_source' ),
	  Validators		= require( '../routes/middleware/validators' );

// create model. Additional options allow event name to be used what auto-generating URLs
var Event = new keystone.List('Event', {
	autokey: { path: 'key', from: 'name', unique: true },
	map: { name: 'name' },
	defaultSort: '-startDate'
});

// create fields
Event.add( 'General Information', {

	name: { type: Types.Text, label: 'event name', required: true, initial: true },
	url: { type: Types.Url, label: 'url', noedit: true },
	isActive: { type: Types.Boolean, label: 'is event active?', initial: true },
	shouldCreateSource: { type: Types.Boolean, label: 'create source from this event', initial: true },
	// type: { type: Types.Relationship, label: 'Event Type', ref: 'Event Type', required: true, initial: true }
	type: { type: Types.Select, label: 'event type', options: 'MAPP trainings, Mare hosted events, partner hosted events', required: true, initial: true }, // TODO: this fixes an issue in pre-save which can be updated to fetch the live results and not hardcode this list.
	source: { type: Types.Relationship, label: 'source', ref: 'Source', dependsOn: { shouldCreateSource: true }, noedit: true, initial: true },
	image: {
		type: Types.CloudinaryImage,
		note: 'needed to display in the sidebar, events page, and home page',
		folder: `${ process.env.CLOUDINARY_DIRECTORY }/events/`,
		select: true,
		selectPrefix: `${ process.env.CLOUDINARY_DIRECTORY }/events/`,
		autoCleanup: true,
		whenExists: 'overwrite',
		filenameAsPublicID: true
	},

	areBuddiesAllowed: { type: Types.Boolean, label: 'buddies allowed', initial: true },
	isMatchingEvent: { type: Types.Boolean, label: 'matching event', initial: true }

}, 'Address', {

	address: {
	    street1: { type: Types.Text, label: 'street 1', initial: true },
		street2: { type: Types.Text, label: 'street 2', initial: true },
		city: { type: Types.Text, label: 'city', initial: true },
		state: { type: Types.Relationship, label: 'state', ref: 'State', initial: true },
		zipCode: { type: Types.Text, label: 'zip code', initial: true, validate: Validators.zipValidator }
	},

	contact: { type: Types.Relationship, label: 'contact', ref: 'Admin', initial: true },
	contactEmail: { type: Types.Email, label: 'contact person email', note: 'only fill out if no contact is selected', initial: true }

}, 'Details', {

	recurringEvent: { type: Types.Boolean, label: 'recurring event', initial: true },
	startDate: { type: Types.Date, label: 'start date', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, dependsOn: { recurringEvent: true }, initial: true },
	startTime: { type: Types.Text, label: 'start time', utc: true, dependsOn: { recurringEvent: true }, initial: true, validate: Validators.timeValidator },
	endDate: { type: Types.Date, label: 'end date', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, utc: true, dependsOn: { recurringEvent: true }, initial: true },
	endTime: { type: Types.Text, label: 'end time', initial: true, utc: true, dependsOn: { recurringEvent: true }, validate: Validators.timeValidator },
	scheduleDescription: { type: Types.TextArea, label: 'schedule description', note: 'only use this field if this is a recurring event', utc: true, dependsOn: { recurringEvent: false }, initial: true },
	description: { type: Types.Html, label: 'description', wysiwyg: true, initial: true }

}, 'Access Restrictions', {

	preventSiteVisitorRegistration: { type: Types.Boolean, label: 'prevent site visitor registration', note: 'this will prevent registration for active fundraising events and adoption parties & information events', initial: true },
	preventFamilyRegistration: { type: Types.Boolean, label: 'prevent family registration', note: 'this will prevent registration for active fundraising events and adoption parties & information events', initial: true },
	preventSocialWorkerRegistration: { type: Types.Boolean, label: 'prevent social worker registration', note: 'this will prevent registration for active fundraising events and adoption parties & information events', initial: true }

}, 'Attendees', {

	staffAttendees: { type: Types.Relationship, label: 'staff', ref: 'Admin', many: true, initial: true },
	siteVisitorAttendees: { type: Types.Relationship, label: 'site visitors', ref: 'Site Visitor', many: true, initial: true },
	socialWorkerAttendees: { type: Types.Relationship, label: 'social workers', ref: 'Social Worker', many: true, initial: true },
	familyAttendees: { type: Types.Relationship, label: 'families', ref: 'Family', many: true, initial: true },
	childAttendees: { type: Types.Relationship, label: 'children', ref: 'Child', many: true, initial: true },
	outsideContactAttendees: { type: Types.Relationship, label: 'volunteers', filters: { isVolunteer: true }, ref: 'Outside Contact', many: true, initial: true }

}, 'Notes', {

	notes: { type: Types.Text, label: 'notes', initial: true }

}, 'Creation Details', {
	// this is used to determine whether we should send an automatic email to the creator when their event becomes active
	createdViaWebsite: { type: Types.Boolean, label: 'created through the website', noedit: true }

/* container for data migration fields ( these should be kept until after phase 2 and the old system is phased out completely ) */
}, {
	// system field to store an appropriate file prefix
	oldId: { type: Types.Text, hidden: true }

});

// add an array of sub-documents to keep track of unregistered children attendees
Event.schema.add({
	unregisteredChildAttendees: [{
		name: {
			first: String,
			last: String
		},
		age: Number,
		registrantID: String
	}]
});

// add an array of sub-documents to keep track of unregistered adult attendees
Event.schema.add({
	unregisteredAdultAttendees: [{
		name: {
			first: String,
			last: String
		},
		registrantID: String
	}]
});

Event.schema.virtual( 'hasImage' ).get( function() {
	'use strict';

	return this.image.exists;
});

// pre save hook
Event.schema.pre( 'save', function( next ) {
	'use strict';
	// trim whitespace characters from any type.Text fields
	this.trimTextFields();

	this.setUrl();

	let setSourceField = this.setSourceField();

	setSourceField.then( sourceId => {

		this.source = sourceId;
		next();
	})
	.catch( () => {

		next();
	});
});

// TODO IMPORTANT: this is a temporary solution to fix a problem where the autokey generation from Keystone
// 				   occurs after the pre-save hook for this model, preventing the url from being set.  Remove
//				   this hook once that issue is resolved.
Event.schema.post( 'save', function() {
	if( !this.get( 'url' ) ) {
		this.save();
	}
});

/* text fields don't automatically trim(), this is to ensure no leading or trailing whitespace gets saved into url, text, or text area fields */
Event.schema.methods.trimTextFields = function() {

	if( this.get( 'name' ) ) {
		this.set( 'name', this.get( 'name' ).trim() );
	}

	if( this.get( 'url' ) ) {
		this.set( 'url', this.get( 'url' ).trim() );
	}

	if( this.get( 'address.street1' ) ) {
		this.set( 'address.street1', this.get( 'address.street1' ).trim() );
	}

	if( this.get( 'address.street2' ) ) {
		this.set( 'address.street2', this.get( 'address.street2' ).trim() );
	}

	if( this.get( 'address.city' ) ) {
		this.set( 'address.city', this.get( 'address.city' ).trim() );
	}

	if( this.get( 'address.zipCode' ) ) {
		this.set( 'address.zipCode', this.get( 'address.zipCode' ).trim() );
	}

	if( this.get( 'contactEmail' ) ) {
		this.set( 'contactEmail', this.get( 'contactEmail' ).trim() );
	}

	if( this.get( 'startTime' ) ) {
		this.set( 'startTime', this.get( 'startTime' ).trim() );
	}

	if( this.get( 'endTime' ) ) {
		this.set( 'endTime', this.get( 'endTime' ).trim() );
	}

	if( this.get( 'description' ) ) {
		this.set( 'description', this.get( 'description' ).trim() );
	}

	if( this.get( 'notes' ) ) {
		this.set( 'notes', this.get( 'notes' ).trim() );
	}
};

Event.schema.methods.setUrl = function() {
	'use strict';

	let eventType;

	switch( this.type ) {
		case 'MARE adoption parties & information events': eventType = 'adoption-parties'; break
		case 'MAPP trainings': eventType = 'mapp-trainings'; break;
    	case 'fundraising events': eventType = 'fundraising-events'; break;
    	case 'agency information meetings': eventType = 'agency-info-meetings'; break;
    	case 'other opportunities & trainings': eventType = 'other-trainings'; break;
    	default: eventType = '';
	}

	// TODO: if !eventType.length, I should prevent the save
	this.url = this.get( 'key' ) ? '/events/' + eventType + '/' + this.get( 'key' ) : undefined;
};

Event.schema.methods.setSourceField = function() {
	'use strict';

	return new Promise( ( resolve, reject ) => {
		// if no source is meant to be created from this event
		if( !this.shouldCreateSource ) {
			// log the info for debugging purposes
			console.info( `no source creation needed` );
			// resolve the promise
			return resolve();
		}

		// if the source is already set, update it, otherwise create it
		let newSource = this.source
						? SourceMiddleware.updateSource( this.source, this.name )
						: SourceMiddleware.createSource( this.name );
		// respond to the promise returned from the source middleware
		newSource.then( id => {
			// record the successful creation of the source from this event
			console.info( `source successfully saved from ${ this.name }` );
			// update the source relationship field with the id of the newly created source
			resolve( id );
		})
		.catch( err => {
			// log the error for debugging purposes
			console.error( `error saving source from ${ this.name } - ${ err }` );
			// reject the promise
			reject();
		});
	})
	.catch( () => {
		// reject the promise
		reject();
	});
};

Event.schema.plugin( random );

// define default columns in the admin interface and register the model
Event.defaultColumns = 'name, url, startDate, endDate, isActive';
Event.register();
