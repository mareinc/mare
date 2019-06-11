const keystone 		= require( 'keystone' ),
	  Types 		= keystone.Field.Types,
	  // the keystone.list import throws a ReferenceError when importing a list that comes later when sorting alphabetically
	  SiteVisitor	= require( '../site visitors/site-visitor.model' ),
	  SocialWorker	= require( '../social workers/social-worker.model' ),
	  Family		= require( '../families/family.model' ),
	  Admin			= require( '../administrators/admin.model' ),
	  Validators	= require( '../../routes/middleware/validators' );

// create model
var Donation = new keystone.List( 'Donation' );

// create fields
Donation.add({

	date: { type: Types.Date, label: 'date', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, required: true, initial: true },
	amount: { type: Types.Money, format: '$0,0.00', label: 'amount', required: true, initial: true },
	stripeTransactionID: { type: Types.Text, label: 'stripe transaction ID', required: true, initial: true, noedit: true },
	isSubscription: { type: Types.Boolean, label: ' is donation repeating', initial: true, noedit: true },

	isRegistered: { type: Types.Boolean, label: 'is a registered user', initial: true },
	userType: { type: Types.Select, label: 'user type', options: 'site visitor, social worker, family, admin', dependsOn: { isRegistered: true }, initial: true },
	siteVisitor: { type: Types.Relationship, label: 'donation from', ref: 'Site Visitor', dependsOn: { isRegistered: true, userType: 'site visitor' }, initial: true },
	socialWorker: { type: Types.Relationship, label: 'donation from', ref: 'Social Worker', dependsOn: { isRegistered: true, userType: 'social worker' }, initial: true },
	family: { type: Types.Relationship, label: 'donation from', ref: 'Family', dependsOn: { isRegistered: true, userType: 'family' }, initial: true },
	admin: { type: Types.Relationship, label: 'donation from', ref: 'Admin', dependsOn: { isRegistered: true, userType: 'admin' }, initial: true },
	unregisteredUser: { type: Types.Text, label: 'donation from', dependsOn: { isRegistered: false }, initial: true },
	name: { type: Types.Text, label: 'name', hidden: true, noedit: true, initial: false },
	onBehalfOf: { type: Types.Text, label: 'on behalf of', initial: true },
	note: { type: Types.Text, label: 'note', initial: true }

	}, 'Mailing Address', {
		
	address: {
		street: 	{ type: Types.Text, label: 'street address', required: true, initial: true },
		city:		{ type: Types.Text, required: true, initial: true },
		state:		{ type: Types.Text, required: true, initial: true },
		zip:		{ type: Types.Text, label: 'zip code', required: true, initial: true, validate: Validators.zipValidator }
	}

});

// presave hook
// TODO: split out the contents into schema methods
Donation.schema.pre( 'save', function( next ) {
	'use strict';
	// trim whitespace characters from any type.Text fields
	this.trimTextFields();

	let targetUserType,
		targetId;

	// if the user is registered in the system
	if( this.isRegistered ) {
		// set variables to allow us to fetch the user
		switch( this.userType ) {
			case 'site visitor'	: targetUserType = SiteVisitor; 	targetId = this.siteVisitor; break;
			case 'social worker': targetUserType = SocialWorker; 	targetId = this.socialWorker; break;
			case 'family'		: targetUserType = Family; 			targetId = this.family; break;
			case 'admin'		: targetUserType = Admin; 			targetId = this.admin;
		}
		// attempt to fetch the user who made the donation by their _id
		targetUserType.model
			.findById( targetId )
			.exec()
			.then( user => {
				// if the user has a name, they're not a family
				if( user.name ) {
					// store the name of the user's name
					this.name = user.name.full;
				// otherwise, if they're a family
				} else {
					// TODO: this functionality is identical to that in event, pull both out and put them in the model as a virtual
					// check to see if a second contact has been filled out
					const contact2Exists = user.contact2.name.full.length > 0;
					// check to see if both contacts share a last name
					const sameLastName = user.contact1.name.last === user.contact2.name.last;

					// if there's a second contact and they both contacts share a last name
					if( contact2Exists && sameLastName ) {
						// set the name to both first names, then the last name: John Smith + Jane Smith = John and Jane Smith
						model.name = user.contact1.name.first + ' and ' + user.contact2.name.full;
					// if there's a second contact, but the contacts have different last names
					} else if( contact2Exists && !sameLastName ) {
						// set the name to the two names appended: John Smith + Jane Doe = John Smith and Jane Doe
						model.name = user.contact1.name.full + ' and ' + user.contact2.name.full;
					// if there's no second contact
					} else {
						// set the name to contact 1's full name
						model.name = user.contact1.name.full;
					}
				}
				// allow further processing beyond this middleware
				next();

			}, err => {
				// log the error for debugging purposes
				console.error( `an error occurred fetching the user model to set the donator name for donation with id ${this.get( 'id' )}`, err );
				// allow further processing beyond this middleware
				next();
			});
	// if the user is not registered in the system
	} else {
		// set the name to whatever was filled out in the free text field
		this.name = this.unregisteredUser;
		next();
	}
});

/* text fields don't automatically trim(), this is to ensure no leading or trailing whitespace gets saved into url, text, or text area fields */
Donation.schema.methods.trimTextFields = function() {

	if( this.get( 'stripeTransactionID' ) ) {
		this.set( 'stripeTransactionID', this.get( 'stripeTransactionID' ).trim() );
	}

	if( this.get( 'unregisteredUser' ) ) {
		this.set( 'unregisteredUser', this.get( 'unregisteredUser' ).trim() );
	}

	if( this.get( 'name' ) ) {
		this.set( 'name', this.get( 'name' ).trim() );
	}

	if( this.get( 'onBehalfOf' ) ) {
		this.set( 'onBehalfOf', this.get( 'onBehalfOf' ).trim() );
	}

	if( this.get( 'note' ) ) {
		this.set( 'note', this.get( 'note' ).trim() );
	}

	if( this.get( 'address.street' ) ) {
		this.set( 'address.street', this.get( 'address.street' ).trim() );
	}

	if( this.get( 'address.city' ) ) {
		this.set( 'address.city', this.get( 'address.city' ).trim() );
	}

	if( this.get( 'address.state' ) ) {
		this.set( 'address.state', this.get( 'address.state' ).trim() );
	}

	if( this.get( 'address.zip' ) ) {
		this.set( 'address.zip', this.get( 'address.zip' ).trim() );
	}
};

// define default columns in the admin interface and register the model
Donation.defaultColumns = 'name, amount, date';
Donation.register();
