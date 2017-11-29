const keystone 		= require( 'keystone' ),
	  Types 		= keystone.Field.Types,
	  // the keystone.list import throws a ReferenceError when importing a list that comes later when sorting alphabetically
	  SiteVisitor	= require( './User_SiteVisitor' ),
	  SocialWorker	= require( './User_SocialWorker' ),
	  Family		= require( './User_Family' ),
	  Admin			= require( './User_Admin' );

// create model
var Donation = new keystone.List( 'Donation' );

// create fields
Donation.add({

	date: { type: Types.Date, label: 'date', format: 'MM/DD/YYYY', required: true, initial: true },
	amount: { type: Types.Money, format: '$0,0.00', label: 'amount', required: true, initial: true },
	stripeTransactionID: { type: Types.Text, label: 'stripe transaction ID', required: true, initial: true, noedit: true },
	isSubscription: { type: Types.Boolean, label: ' is donation repeating', required: true, initial: true, noedit: true },

	isRegistered: { type: Types.Boolean, label: 'is a registered user', default: true, required: true, initial: true },
	userType: { type: Types.Select, label: 'user type', options: 'site visitor, social worker, family, admin', dependsOn: { isRegistered: true }, filters: { isActive: true }, initial: true },
	siteVisitor: { type: Types.Relationship, label: 'donation from', ref: 'Site Visitor', dependsOn: { isRegistered: true, userType: 'site visitor' }, filters: { isActive: true }, initial: true },
	socialWorker: { type: Types.Relationship, label: 'donation from', ref: 'Social Worker', dependsOn: { isRegistered: true, userType: 'social worker' }, filters: { isActive: true }, initial: true },
	family: { type: Types.Relationship, label: 'donation from', ref: 'Family', dependsOn: { isRegistered: true, userType: 'family' }, filters: { isActive: true }, initial: true },
	admin: { type: Types.Relationship, label: 'donation from', ref: 'Admin', dependsOn: { isRegistered: true, userType: 'admin' }, filters: { isActive: true }, initial: true },
	unregisteredUser: { type: Types.Text, label: 'donation from', dependsOn: { isRegistered: false }, initial: true },
	name: { type: Types.Text, label: 'name', hidden: true, noedit: true, initial: false },
	onBehalfOf: { type: Types.Text, label: 'on behalf of', initial: true }
});

// presave hook
Donation.schema.pre( 'save', function( next ) {
	'use strict';

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
				console.error( `an error occurred fetching the user model to set the donator name - ${ err }` );
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

// define default columns in the admin interface and register the model
Donation.defaultColumns = 'name, amount, date';
Donation.register();
