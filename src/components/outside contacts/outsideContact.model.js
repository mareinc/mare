const keystone	= require( 'keystone' );
const Types		= keystone.Field.Types;
const async		= require( 'async' );
// Export to make it available using require.  The keystone.list import throws a ReferenceError when importing a list that comes later when sorting alphabetically
const ContactGroup = require( '../contact groups/contactGroup.model' );
const Validators = require( '../../routes/middleware/validators' );

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

	contactGroups: { type: Types.Relationship, label: 'contact groups', ref: 'Contact Group', many: true, required: true, initial: true }

}, 'Contact Information', {

	email: { type: Types.Email, label: 'email address', initial: true },

	phone: {
		work: { type: Types.Text, label: 'work phone number', initial: true, validate: Validators.phoneValidator },
		mobile: { type: Types.Text, label: 'mobile phone number', initial: true, validate: Validators.phoneValidator },
		preferred: { type: Types.Select, label: 'preferred phone', options: 'work, mobile', initial: true }
	}

}, 'Address', {

	address: {
		street1: { type: Types.Text, label: 'street 1', initial: true },
		street2: { type: Types.Text, label: 'street 2', initial: true },
		city: { type: Types.Text, label: 'city', initial: true },
		state: { type: Types.Relationship, label: 'state', ref: 'State', initial: true },
		zipCode: { type: Types.Text, label: 'zip code', initial: true, validate: Validators.zipValidator }
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
	// trim whitespace characters from any type.Text fields
	this.trimTextFields();
	// set an identifying name based on the name and organization provided to make using it in Relationship dropdowns possible
	this.setIdentifyingName();
	// determine whether or not the outside contact is a volunteer
	this.setVolunteerStatus()
		.catch( err => {
			console.error( `error setting the volunteer status for outside contact with identifyingName ${this.get('identifyingName')} - ${err}` );
		})
		.then(() => {
			next();
		});
});

/* text fields don't automatically trim(), this is to ensure no leading or trailing whitespace gets saved into url, text, or text area fields */
OutsideContact.schema.methods.trimTextFields = function() {

	if( this.get( 'name' ) ) {
		this.set( 'name', this.get( 'name' ).trim() );
	}

	if( this.get( 'organization' ) ) {
		this.set( 'organization', this.get( 'organization' ).trim() );
	}

	if( this.get( 'email' ) ) {
		this.set( 'email', this.get( 'email' ).trim() );
	}

	if( this.get( 'phone.work' ) ) {
		this.set( 'phone.work', this.get( 'phone.work' ).trim() );
	}

	if( this.get( 'phone.mobile' ) ) {
		this.set( 'phone.mobile', this.get( 'phone.mobile' ).trim() );
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
};

OutsideContact.schema.methods.setIdentifyingName = function() {
	'use strict';

	// if only the name is populated, it becomes the identifying name
	if( this.name.trim() && !this.organization.trim() ) {
		this.identifyingName = `${ this.name.trim() }`;
	// otherwise, if only the organization is populated, it becomes the identifying name
	} else if( !this.name.trim() && this.organization.trim() ) {
		this.identifyingName = `${ this.organization.trim() }`;
	// otherwise, both must be populated, and the identifying name becomes 'name - organization'
	} else {
		this.identifyingName = `${ this.name.trim() } - ${ this.organization.trim() }`
	}
};

OutsideContact.schema.methods.setVolunteerStatus = function() {

	return new Promise( (resolve, reject) => {
		// get all the contact groups
		const contactGroups	= this.contactGroups;
		// reset the isVolunteer flag to allow a fresh check every save
		this.isVolunteer = false;
		// loop through each of the contact groups the user should be added to and mark the outside contact as a volunteer
		// if they are part of the 'volunteers' contact group
		// TODO: this can probably be done much more cleanly with a .populate on the current model.  See populateAgency in the Placement model
		ContactGroup.model
			.find()
			.where( { _id: { $in: contactGroups } } )
			.exec()
			.then( contactGroups => {
				// create an array from just the names of each contact group
				const contactGroupNames = contactGroups.map( contactGroup => contactGroup.get( 'name' ) );
				// events have outside contacts who are volunteers listed, we need to capture a reference to which outside contacts are volunteers
				if( contactGroupNames.includes( 'volunteers' ) ) {
					this.isVolunteer = true;
				}

				resolve();

			}, err => {
				reject( err );
			})
		});
};

// Set up relationship values to show up at the bottom of the model if any exist
OutsideContact.relationship({ ref: 'Mailing List', refPath: 'outsideContactSubscribers', path: 'mailing-lists', label: 'mailing lists' });

// Define default columns in the admin interface and register the model
OutsideContact.defaultColumns = 'identifyingName, address.city, address.state, contactGroups';
OutsideContact.register();
