const keystone	= require( 'keystone' );
const Types		= keystone.Field.Types;
const async		= require( 'async' );
// Export to make it available using require.  The keystone.list import throws a ReferenceError when importing a list that comes later when sorting alphabetically
const OutsideContactGroup = require( './OutsideContactGroup' );

// Create model
var OutsideContact = new keystone.List( 'Outside Contact', {
	autokey: { path: 'key', from: 'identifyingName', unique: true },
	map: { name: 'identifyingName' },
	defaultSort: 'identifyingName'
});

// Create fields
OutsideContact.add( 'General Information', {

	name: { type: Types.Text, label: 'name', initial: true },
	organization: { type: Types.Text, label: 'organization', initial: true },
	identifyingName: { type: Types.Text, label: 'identifying name', hidden: true, noedit: true, initial: false },

	groups: { type: Types.Relationship, label: 'groups', ref: 'Outside Contact Group', many: true, required: true, initial: true }

}, 'Contact Information', {

	email: { type: Types.Email, label: 'email address', initial: true },

	phone: {
		work: { type: Types.Text, label: 'work phone number', initial: true },
		mobile: { type: Types.Text, label: 'mobile phone number', initial: true },
		preferred: { type: Types.Select, label: 'preferred phone', options: 'work, mobile', initial: true }
	}

}, 'Address', {

	address: {
		street1: { type: Types.Text, label: 'street 1', initial: true },
		street2: { type: Types.Text, label: 'street 2', initial: true },
		city: { type: Types.Text, label: 'city', initial: true },
		state: { type: Types.Relationship, label: 'state', ref: 'State', initial: true },
		zipCode: { type: Types.Text, label: 'zip code', initial: true }
	}

}, {

	isVolunteer: { type: Types.Boolean, hidden: true, noedit: true }

/* Container for data migration fields ( these should be kept until after phase 2 and the old system is phased out completely ) */
}, {
	// system field to store an appropriate file prefix
	oldId: { type: Types.Text, hidden: true }

});

// Pre Save
OutsideContact.schema.pre( 'save', function( next ) {
	'use strict';

	async.parallel([
		done => { this.setIdentifyingName( done ); },
		done => { this.setVolunteerStatus( done ); }	
	], () => {
		console.log( 'outside contact information updated' );
		next();
	});
});

OutsideContact.schema.methods.setIdentifyingName = function( done ) {
	'use strict';

	// if only the name is populated, it becomes the identifying name
	if( this.name && !this.organization ) {
		this.identifyingName = `${ this.name }`;
	// otherwise, if only the organization is populated, it becomes the identifying name
	} else if( !this.name && this.organization ) {
		this.identifyingName = `${ this.organization }`;
	// otherwise, both must be populated, and the identifying name becomes 'name - organization'
	} else {
		this.identifyingName = `${ this.name } - ${ this.organization }`
	}

	done();
};

OutsideContact.schema.methods.setVolunteerStatus = function( done ) {
	// get all the contact groups
	var contactGroups	= this.groups;
	// reset the isVolunteer flag to allow a fresh check every save
	this.isVolunteer	= false;
	// loop through each of the outside contact groups the user should be added to and mark the outside contact as a volunteer
	// if they are part of the 'volunteers' outside contact group
	async.each( contactGroups, ( listID, callback ) => {

		OutsideContactGroup.model.findById( listID )
				.exec()
				.then( result => {
					// events have outside contacts who are volunteers listed, we need to capture a reference to which outside contacts are volunteers
					if( result.name === 'volunteers' ) {
						this.isVolunteer = true;
					}

					callback();

				}, err => {
					console.error( err );
					callback();
				});

	}, err => {

			if( err ) {
				// one of the iterations produced an error.  All processing will now stop.
				console.error('an error occurred saving the outside contact\'s volunteer status');
				done();
			} else {
				console.log('outside contact volunteer status saved successfully');
				done();
			}
	});
};

// Set up relationship values to show up at the bottom of the model if any exist
OutsideContact.relationship({ ref: 'Mailing List', refPath: 'outsideContactSubscribers', path: 'mailing-lists', label: 'mailing lists' });

// Define default columns in the admin interface and register the model
OutsideContact.defaultColumns = 'identifyingName, groups';
OutsideContact.register();
