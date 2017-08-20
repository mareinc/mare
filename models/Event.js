const keystone			= require( 'keystone' ),
	  Types				= keystone.Field.Types,
	  random			= require( 'mongoose-simple-random' ),
	  SourceMiddleware	= require( '../routes/middleware/models_source' );

// Create model. Additional options allow event name to be used what auto-generating URLs
var Event = new keystone.List('Event', {
	autokey: { path: 'key', from: 'name', unique: true },
	map: { name: 'name' },
	defaultSort: '-startDate'
});

// Create fields
Event.add({ heading: 'General Information' }, {

	name: { type: Types.Text, label: 'event name', required: true, initial: true },
	url: { type: Types.Url, label: 'url', noedit: true },
	isActive: { type: Types.Boolean, label: 'is event active?', default: true, initial: true },
	shouldCreateSource: { type: Types.Boolean, label: 'create source from this event', initial: true },
	// type: { type: Types.Relationship, label: 'Event Type', ref: 'Event Type', required: true, initial: true }
	type: { type: Types.Select, label: 'event type', options: 'MARE adoption parties & information events, MAPP trainings, agency information meetings, other opportunities & trainings, fundraising events', required: true, initial: true }, // TODO: this fixes an issue in pre-save which can be updated to fetch the live results and not hardcode this list.
	source: { type: Types.Relationship, label: 'source', ref: 'Source', dependsOn: { shouldCreateSource: true }, noedit: true, initial: true },
	image: { type: Types.CloudinaryImage, note: 'needed to display in the sidebar, events page, and home page', folder: 'events/', select: true, selectPrefix: 'events/', publicID: 'fileName', autoCleanup: true },
	imageFeatured: { type: Types.Url, hidden: true },
	imageSidebar: { type: Types.Url, hidden: true },

	areBuddiesAllowed: { type: Types.Boolean, label: 'buddies allowed', initial: true },
	isMatchingEvent: { type: Types.Boolean, label: 'matching event', initial: true }

}, { heading: 'Address' }, {

	address: {
	    street1: { type: Types.Text, label: 'street 1', initial: true },
		street2: { type: Types.Text, label: 'street 2', initial: true },
		city: { type: Types.Text, label: 'city', initial: true },
		state: { type: Types.Relationship, label: 'state', ref: 'State', initial: true },
		zipCode: { type: Types.Text, label: 'zip code', initial: true }
	},

	contact: { type: Types.Relationship, label: 'contact', ref: 'Admin', filters: { isActive: true }, initial: true },
	contactEmail: { type: Types.Email, label: 'contact person email', note: 'only fill out if no contact is selected', initial: true }

}, { heading: 'Details' }, {

	startDate: { type: Types.Date, label: 'start date', format: 'MM/DD/YYYY', required: true, initial: true },
	startTime: { type: Types.Text, label: 'start time', required: true, initial: true },
	endDate: { type: Types.Date, label: 'end date', format: 'MM/DD/YYYY', required: true, initial: true },
	endTime: { type: Types.Text, label: 'end time', required: true, initial: true },
	description: { type: Types.Html, label: 'description', wysiwyg: true, initial: true }

}, 'Attendees', {

	staffAttendees: { type: Types.Relationship, label: 'staff', ref: 'Admin', filters: { isActive: true }, many: true, initial: true },
	siteVisitorAttendees: { type: Types.Relationship, label: 'site visitors', ref: 'Site Visitor', filters: { isActive: true }, many: true, initial: true },
	socialWorkerAttendees: { type: Types.Relationship, label: 'social workers', ref: 'Social Worker', filters: { isActive: true }, many: true, initial: true },
	familyAttendees: { type: Types.Relationship, label: 'families', ref: 'Family', filters: { isActive: true }, many: true, initial: true },
	childAttendees: { type: Types.Relationship, label: 'children', ref: 'Child', many: true, initial: true },
	outsideContactAttendees: { type: Types.Relationship, label: 'volunteers', filters: { isVolunteer: true }, ref: 'Outside Contact', many: true, initial: true}

}, { heading: 'Notes' }, {

	notes: { type: Types.Text, label: 'notes', initial: true }

}, 'Creation Details', {
	// this is used to determine whether we should send an automatic email to the creator when their event becomes active
	createdViaWebsite: { type: Types.Boolean, label: 'created through the website', noedit: true }

/* Container for all system fields (add a heading if any are meant to be visible through the admin UI) */
}, {

	// system field to store an appropriate file prefix
	fileName: { type: Types.Text, hidden: true }

/* Container for data migration fields ( these should be kept until after phase 2 and the old system is phased out completely ) */
}, {
	// system field to store an appropriate file prefix
	oldId: { type: Types.Text, hidden: true }

});

// Pre Save
Event.schema.pre( 'save', function( next ) {
	'use strict';

	this.updateImageFields();
	this.setUrl();
	this.setFileName();

	let setSourceField = this.setSourceField();
	
	setSourceField.then( sourceId => {

		this.source = sourceId;
		next();
	})
	.catch( () => {

		next();
	});
});
// TODO: turn these fields into virtuals and update the templates that rely on it
Event.schema.methods.updateImageFields = function() {
	'use strict';

	this.imageFeatured = this._.image.thumbnail( 168, 168, { quality: 80 } );
	this.imageSidebar = this._.image.thumbnail( 216, 196, { quality: 80 } );
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
	this.url = '/events/' + eventType + '/' + this.key;
};

Event.schema.methods.setFileName = function() {
	'use strict';
	// Create an identifying name for file uploads
	this.fileName = this.key.replace( /-/g, '_' );
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
		// create a reference to the model for use after the new source promise resolves
		// let model = this;
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
		.catch( () => {
			// log the error for debugging purposes
			console.error( `error saving source from ${ this.name }` );
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

// Define default columns in the admin interface and register the model
Event.defaultColumns = 'name, url, starts, ends, isActive';
Event.register();