const keystone 		= require( 'keystone' ),
	  Types 		= keystone.Field.Types,
	  // export to make it available using require.  The keystone.list import throws a ReferenceError when importing a list
	  // that comes later when sorting alphabetically
	  SiteVisitor	= require( './User_SiteVisitor' ),
	  SocialWorker	= require( './User_SocialWorker' ),
	  Family		= require( './User_Family' ),
	  Admin			= require( './User_Admin' );

// Create model. Additional options allow menu name to be used to auto-generate the URL
var Donation = new keystone.List('Donation');

// Create fields
Donation.add({

	date: { type: Types.Date, label: 'date', format: 'MM/DD/YYYY', required: true, initial: true },
	amount: { type: Types.Money, format: '$0,0.00', label: 'amount', required: true, initial: true },

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

// Pre Save
Donation.schema.pre( 'save', function( next ) {
	'use strict';

	let targetUserType,
		targetId;

	if( this.isRegistered ) {

		switch( this.userType ) {
			case 'site visitor'	: targetUserType = SiteVisitor;		targetId = this.siteVisitor; break;
			case 'social worker': targetUserType = SocialWorker;	targetId = this.socialWorker; break;
			case 'family'		: targetUserType = Family;			targetId = this.family; break;
			case 'admin'		: targetUserType = Admin;			targetId = this.admin;
		}
		// if there's no targetId, the user type was set, but no user was selected
		if( !targetId ) {
			// clear out the field, which will be populated if the model was saved with a user, then the user was deleted
			this.name = '';
			// continue execution without fetching the user
			return next();
		}
		// fetch the target user model
		targetUserType.model
			.findById( targetId )
			.exec()
			.then( user => {
				// If the user has a name, they aren't a family.  Use this info to pull the correct name
				if( user.name ) {
					this.name = user.name.full;
				// if the user doesn't have a name, they're a family and a combination of the contact names should be used to populate the name field
				} else {
					// TODO: This functionality is identical to that in event, pull both out and put them in the model as a virtual
					// if the targetGroup is families, we need to prettify the attendee name
					const contact2Exists	= user.contact2.name.full.length > 0;
					const sameLastName		= user.contact1.name.last === user.contact2.name.last;

					if( contact2Exists && sameLastName ) {
						this.name = user.contact1.name.first + ' and ' + user.contact2.name.full;
					} else if( contact2Exists && !sameLastName ) {
						this.name = user.contact1.name.full + ' and ' + user.contact2.name.full;
					} else {
						this.name = user.contact1.name.full;
					}
				}

				next();

			}, err => {
				console.error( err );
				next();
			});
	} else {

		this.name = this.unregisteredUser;
	}
});

// Define default columns in the admin interface and register the model
Donation.defaultColumns = 'name, amount, date';
Donation.register();
