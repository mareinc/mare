const keystone						= require( 'keystone' ),
	  Types							= keystone.Field.Types,
	  random						= require( 'mongoose-simple-random' ),
	  SourceMiddleware				= require( './event.source.controllers' ),
	  Validators					= require( '../../routes/middleware/validators' ),
	  emailTargetMiddleware			= require( '../../routes/middleware/service_email-target' ),
	  eventEmailMiddleware			= require( './event.email.controllers' ),
	  staffEmailContactMiddleware	= require( '../../routes/middleware/service_staff-email-contact' ),
	  modelService					= require( '../../routes/middleware/service_model' );

// configure the s3 storage adapters
const imageStorage = new keystone.Storage({
	adapter: require( 'keystone-storage-adapter-s3' ),
	s3: {
		key: process.env.S3_KEY, // required; defaults to process.env.S3_KEY
		secret: process.env.S3_SECRET, // required; defaults to process.env.S3_SECRET
		bucket: process.env.S3_BUCKET_NAME, // required; defaults to process.env.S3_BUCKET
		region: process.env.S3_REGION, // optional; defaults to process.env.S3_REGION, or if that's not specified, us-east-1
		path: '/events/images',
		// use the file name with spaces replaced by dashes instead of randomly generating a value
		// NOTE: this is needed to prevent access errors when trying to view the files
		generateFilename: file => file.originalname.replace( /\s/g, '_' ),
		publicUrl: file => `${ process.env.CLOUDFRONT_URL }/events/images/${ file.originalname.replace( /\s/g, '_' ) }`
	},
	schema: {
		bucket: true, // optional; store the bucket the file was uploaded to in your db
		etag: true, // optional; store the etag for the resource
		path: true, // optional; store the path of the file in your db
		url: true // optional; generate & store a public URL
	}
});

// create model. Additional options allow event name to be used what auto-generating URLs
const Event = new keystone.List( 'Event', {
	autokey: { path: 'key', from: 'name', unique: true },
	map: { name: 'name' },
	defaultSort: '-startDate',
	searchFields: 'name, displayName',
});

// create fields
Event.add( 'General Information', {

	name: { type: Types.Text, label: 'event name', note: 'this is a unique name for internal use', required: true, initial: true },
	displayName: { type: Types.Text, label: 'display name', note: 'this is the name that will appear on the website', required: true, initial: true },
	url: { type: Types.Url, label: 'url', noedit: true },
	isActive: { type: Types.Boolean, label: 'is event active?', initial: true },
	shouldCreateSource: { type: Types.Boolean, label: 'create source from this event', initial: true },
	// type: { type: Types.Relationship, label: 'Event Type', ref: 'Event Type', required: true, initial: true }
	type: { type: Types.Select, label: 'event type', options: 'Mare hosted events, partner hosted events, MAPP trainings', required: true, initial: true }, // TODO: this fixes an issue in pre-save which can be updated to fetch the live results and not hardcode this list.
	source: { type: Types.Relationship, label: 'source', ref: 'Source', dependsOn: { shouldCreateSource: true }, noedit: true, initial: true },
	image: { type: Types.File, storage: imageStorage, label: 'image', note: 'needed to display in the sidebar, events page, and home page' },

	areBuddiesAllowed: { type: Types.Boolean, label: 'buddies allowed', initial: true },
	isMatchingEvent: { type: Types.Boolean, label: 'matching event', initial: true }

}, 'Address', {

	address: {
	    street1: { type: Types.Text, label: 'street 1', initial: true },
		street2: { type: Types.Text, label: 'street 2', initial: true },
		city: { type: Types.Text, label: 'city', initial: true },
		state: { type: Types.Relationship, label: 'state', ref: 'State', initial: true },
		zipCode: { type: Types.Text, label: 'zip code', initial: true, validate: Validators.zipValidator },
		region: { type: Types.Relationship, label: 'region', ref: 'Region' }
	},
	// TODO: contact and contactEmail should be renamed as socialWorkerContact and socialWorkerContactEmail
	contact: { type: Types.Relationship, label: 'gen./SW contact', ref: 'Admin', initial: true },
	contactEmail: { type: Types.Email, label: 'gen./SW contact email', note: 'only fill out if no gen./SW contact is selected', initial: true },
	familyContact: { type: Types.Relationship, label: 'family reg. contact', ref: 'Admin', initial: true },
	familyContactEmail: { type: Types.Email, label: 'family reg. contact email', note: 'only fill out if no family reg. contact is selected', initial: true },

}, 'Details', {

	isRecurringEvent: { type: Types.Boolean, label: 'recurring event', initial: true },
	startDate: { type: Types.Date, label: 'start date', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, dependsOn: { isRecurringEvent: false }, initial: true },
	startTime: { type: Types.Text, label: 'start time', utc: true, dependsOn: { isRecurringEvent: false }, initial: true, validate: Validators.timeValidator },
	endDate: { type: Types.Date, label: 'end date', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, utc: true, dependsOn: { isRecurringEvent: false }, initial: true },
	endTime: { type: Types.Text, label: 'end time', initial: true, utc: true, dependsOn: { isRecurringEvent: false }, validate: Validators.timeValidator },
	scheduleDescription: { type: Types.Textarea, label: 'schedule description', note: 'only use this field if this is a recurring event', utc: true, dependsOn: { isRecurringEvent: true }, initial: true },
	description: { type: Types.Html, label: 'description', wysiwyg: true, initial: true }

}, 'Access Restrictions', {

	preventSiteVisitorRegistration: { type: Types.Boolean, label: 'prevent site visitor registration', initial: true },
	preventFamilyRegistration: { type: Types.Boolean, label: 'prevent family registration', initial: true },
	preventSocialWorkerRegistration: { type: Types.Boolean, label: 'prevent social worker registration', initial: true },
	preventAdminRegistration: { type: Types.Boolean, label: 'prevent MARE staff child/adult registration', initial: true }

}, 'Attendees', {

	staffAttendees: { type: Types.Relationship, label: 'staff', ref: 'Admin', many: true, initial: true },
	siteVisitorAttendees: { type: Types.Relationship, label: 'site visitors', ref: 'Site Visitor', many: true, initial: true },
	socialWorkerAttendees: { type: Types.Relationship, label: 'social workers', ref: 'Social Worker', many: true, initial: true },
	familyAttendees: { type: Types.Relationship, label: 'families', ref: 'Family', many: true, initial: true },
	childAttendees: { type: Types.Relationship, label: 'children', ref: 'Child', many: true, initial: true },
	outsideContactAttendees: { type: Types.Relationship, label: 'volunteers', filters: { isVolunteer: true }, ref: 'Outside Contact', many: true, initial: true }

}, 'Notes', {

	notes: { type: Types.Textarea, label: 'notes', initial: true }

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
		registrantID: String,
		registrantType: String
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

	return !!this.image.url;
});

Event.schema.post( 'init', function() {
	'use strict';

	this._savedVersion = this.toObject();
});

// pre save hook
Event.schema.pre( 'save', function( next ) {
	'use strict';

	// trim whitespace characters from any type.Text fields
	this.trimTextFields();

	this.setUrl();

	// attempt to update the no-edit source field
	this.setSourceField()
		.then( sourceId => {

			this.source = sourceId;
			next();
		})
		.catch( () => {

			next();
		});
});

Event.schema.post( 'save', async function() {

	// prevent further execution if the event is being saved for the first time
	if( !this._savedVersion ) {
		return;
	}

	// check for a large number of dropped attendees ( >= 5 ) in any group, and send an email if it occurred
	// NOTE: attendees have gone missing from events and this is a way to track changes and send alerts if any are found
	try {
		// fetch an array with the ids of the removed staff attendees
		const removedStaffIds = this.getRemovedAttendeeIds({
			original: this._savedVersion.staffAttendees,
			updated: this.staffAttendees
		});
		// fetch an array with the ids of the removed site visitor attendees
		const removedSiteVisitorIds = this.getRemovedAttendeeIds({
			original: this._savedVersion.siteVisitorAttendees,
			updated: this.siteVisitorAttendees
		});
		// fetch an array with the ids of the removed social worker attendees
		const removedSocialWorkerIds = this.getRemovedAttendeeIds({
			original: this._savedVersion.socialWorkerAttendees,
			updated: this.socialWorkerAttendees
		});
		// fetch an array with the ids of the removed family attendees
		const removedFamilyIds = this.getRemovedAttendeeIds({
			original: this._savedVersion.familyAttendees,
			updated: this.familyAttendees
		});
		// fetch an array with the ids of the removed child attendees
		const removedChildIds = this.getRemovedAttendeeIds({
			original: this._savedVersion.childAttendees,
			updated: this.childAttendees
		});
		// fetch an array with the ids of the removed outside contact attendees
		const removedOutsideContactIds = this.getRemovedAttendeeIds({
			original: this._savedVersion.outsideContactAttendees,
			updated: this.outsideContactAttendees
		});
		// fetch the models of the removed staff attendees, populating only the full name field
		const removedStaff = await modelService.getModels({
			ids: removedStaffIds,
			targetModel: 'Admin',
			fieldsToSelect: [ 'name.full' ]
		});
		// fetch the models of the removed site visitor attendees, populating only the full name field
		const removedSiteVisitors = await modelService.getModels({
			ids: removedSiteVisitorIds,
			targetModel: 'Site Visitor',
			fieldsToSelect: [ 'name.full' ]
		});
		// fetch the models of the removed social worker attendees, populating only the full name field
		const removedSocialWorkers = await modelService.getModels({
			ids: removedSocialWorkerIds,
			targetModel: 'Social Worker',
			fieldsToSelect: [ 'name.full' ]
		});
		// fetch the models of the removed family attendees, populating only the display name/registration number field
		const removedFamilies = await modelService.getModels({
			ids: removedFamilyIds,
			targetModel: 'Family',
			fieldsToSelect: [ 'displayNameAndRegistration' ]
		});
		// fetch the models of the removed child attendees, populating only the display name/registration number field
		const removedChildren = await modelService.getModels({
			ids: removedChildIds,
			targetModel: 'Child',
			fieldsToSelect: [ 'displayNameAndRegistration' ]
		});
		// fetch the models of the removed outside contact attendees, populating only the identifying name field
		const removedOutsideContacts = await modelService.getModels({
			ids: removedOutsideContactIds,
			targetModel: 'Outside Contact',
			fieldsToSelect: [ 'identifyingName' ]
		});
		// fetch an array of unregistered child objects that have been removed from the event
		const removedUnregisteredChildren = this.getRemovedUnregisteredAttendees({
			original: this._savedVersion.unregisteredChildAttendees,
			updated: this.unregisteredChildAttendees
		});
		// fetch an array of unregistered adult objects that have been removed from the event
		const removedUnregisteredAdults = this.getRemovedUnregisteredAttendees({
			original: this._savedVersion.unregisteredAdultAttendees,
			updated: this.unregisteredAdultAttendees
		});
		// loop through each of the children and fetch the name of the social worker who registered them for the event
		for( let child of removedUnregisteredChildren ) {

			try {
				const registrant = await modelService.getModel({
					id: child.registrantID,
					targetModel: 'Social Worker',
					fieldsToSelect: [ 'name.full' ]
				});
				// if a social worker was found, add details to make it easier to restore the child accurately
				if( registrant ) {
					child.registrant = registrant.name.full;
				}
			}
			catch( err ) {
				console.error( `error populating registrant for unregistered child ${ child.name.first } ${ child.name.last }`, err );
			}
		}
		// a notification email will only be sent if at least 5 of a single group of attendees have been removed
		if( removedStaff.length >= 5
			|| removedSiteVisitors.length >= 5
			|| removedSocialWorkers.length >= 5
			|| removedFamilies.length >= 5
			|| removedChildren.length >= 5
			|| removedOutsideContacts.length >= 5
			|| removedUnregisteredChildren.length >= 5
			|| removedUnregisteredAdults.length >= 5
		) {
			// fetch the email target model matching 'dropped event attendees'
			const emailTarget = await emailTargetMiddleware.getEmailTargetByName( 'dropped event attendees' );
			
			// fetch contact info for the staff contacts for 'dropped event attendees'
			const staffEmailContacts = await staffEmailContactMiddleware.getStaffEmailContactsByEmailTarget({
				emailTargetId: emailTarget.get( '_id' ),
				fieldsToPopulate: [ 'staffEmailContact' ]
			});

			// set the contact details from the returned objects if any were retrieved
			const staffEmailContactsInfo = staffEmailContacts.length > 0
				? staffEmailContacts.map( contact => contact.staffEmailContact.email )
				: null;

			eventEmailMiddleware.sendDroppedEventAttendeesEmailToMARE({
				staffContactEmails: staffEmailContactsInfo,
				eventName: this.name,
				changedBy: this._req_user,
				droppedStaff: removedStaff.length >= 5 ? removedStaff : [],
				droppedSiteVisitors: removedSiteVisitors.length >= 5 ? removedSiteVisitors : [],
				droppedSocialWorkers: removedSocialWorkers.length >= 5 ? removedSocialWorkers : [],
				droppedFamilies: removedFamilies.length >= 5 ? removedFamilies : [],
				droppedChildren: removedChildren.length >= 5 ? removedChildren : [],
				droppedOutsideContacts: removedOutsideContacts.length >= 5 ? removedOutsideContacts : [],
				droppedUnregisteredAdults: removedUnregisteredAdults.length >= 5 ? removedUnregisteredAdults : [],
				droppedUnregisteredChildren: removedUnregisteredChildren.length >= 5 ? removedUnregisteredChildren : []
			});
		}
	}
	catch( err ) {
		console.error( `error sending email notification about dropped event attendees for ${ this.name }`, err );
	}

	// TODO IMPORTANT: this is a temporary solution to fix a problem where the autokey generation from Keystone
	// 				   occurs after the pre-save hook for this model, preventing the url from being set.  Remove
	//				   this hook once that issue is resolved.
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

	let eventType =
		this.type === 'Mare hosted events' ? 'mare-hosted-events'
		: this.type === 'partner hosted events' ? 'partner-hosted-events'
		: this.type === 'MAPP trainings' ? 'mapp-trainings'
		: 'mare-hosted-events';

	let eventKey = this.get( 'key' );
	// Prevent a malformed url as the key will not be set on the first save
	this.url = eventKey
		? `/events/${ eventType }/${ eventKey }`
		: undefined;
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
			console.error( `error saving source from ${ this.name }`, err );
			// reject the promise
			reject();
		});
	})
	.catch( () => {
		// reject the promise
		reject();
	});
};

Event.schema.methods.getRemovedAttendeeIds = function getRemovedAttendeeIds({ original = {}, updated = {} }) {

	const originalAttendees = original.map( id => id.toString() );
	const updatedAttendees = updated.map( id => id.toString() );

	const originalAttendeeSet = new Set( originalAttendees );
	const updatedAttendeeSet = new Set( updatedAttendees );

	const removedAttendeeSet = originalAttendeeSet.leftOuterJoin( updatedAttendeeSet );

	return [ ...removedAttendeeSet ];
};

Event.schema.methods.getRemovedUnregisteredAttendees = function getRemovedUnregisteredAttendees({ original = {}, updated = {} }) {

	const originalIds = original
		? original.map( attendee => attendee._id.toString() )
		: [];

	const updatedIds = updated
		? updated.map( updated => updated._id.toString() )
		: [];

	const originalIdsSet = new Set( originalIds );
	const updatedIdsSet = new Set( updatedIds );

	const droppedIdsSet = originalIdsSet.leftOuterJoin( updatedIdsSet );

	let droppedAttendees = original.filter( attendee => droppedIdsSet.has( attendee._id.toString() ) );

	return droppedAttendees;
};

Event.schema.methods.getDroppedUnregisteredAttendeeDetailsString = async function getDroppedUnregisteredAttendeeDetailsString( { attendee = {}, type } ) {

	try {
		const registrant = await modelService.getModel({
			id: registrantID,
			targetModel: 'Social Worker',
			fieldsToSelect: [ 'name.full' ]
		});

		return type === 'child'
			? `${ attendee.name.first } ${ attendee.name.last } ${ attendee.age ? `(age ${ attendee.age }) ` : '' }- registered by ${ registrant.name.full }`
			: `${ attendee.name.first } ${ attendee.name.last } - registered by ${ registrant.name.full }`
	}
	catch( err ) {
		console.error( `error setting an unregistered ${ type } string`, err );

		return `${ attendee.name.first } ${ attendee.name.last }`;
	}
};

Event.schema.plugin( random );

// define default columns in the admin interface and register the model
Event.defaultColumns = 'name, url, startDate, endDate, isActive';
Event.register();
