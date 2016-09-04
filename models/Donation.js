var keystone 		= require('keystone'),
	Types 			= keystone.Field.Types,
	// Export to make it available using require.  The keystone.list import throws a ReferenceError when importing a list
	// that comes later when sorting alphabetically
	SiteVisitor		= require('./User_SiteVisitor'),
	SocialWorker	= require('./User_SocialWorker'),
	Family			= require('./User_Family'),
	Admin			= require('./User_Admin');

// Create model. Additional options allow menu name to be used to auto-generate the URL
var Donation = new keystone.List('Donation');

// Create fields
Donation.add({

	date: { type: Types.Date, label: 'date', format: 'MM/DD/YYYY', required: true, initial: true },
	amount: { type: Types.Money, format: '$0,0.00', label: 'amount', required: true, initial: true },

	isRegistered: { type: Types.Boolean, label: 'is a registered user', default: true, required: true, initial: true },
	userType: { type: Types.Select, label: 'user type', options: 'site visitor, social worker, family, admin', dependsOn: { isRegistered: true }, initial: true },
	siteVisitor: { type: Types.Relationship, label: 'donation from', dependsOn: { isRegistered: true, userType: 'site visitor' }, ref: 'Site Visitor', initial: true },
	socialWorker: { type: Types.Relationship, label: 'donation from', dependsOn: { isRegistered: true, userType: 'social worker' }, ref: 'Social Worker', initial: true },
	family: { type: Types.Relationship, label: 'donation from', dependsOn: { isRegistered: true, userType: 'family' }, ref: 'Family', initial: true },
	admin: { type: Types.Relationship, label: 'donation from', dependsOn: { isRegistered: true, userType: 'admin' }, ref: 'Admin', initial: true },
	unregisteredUser: { type: Types.Text, label: 'donation from', dependsOn: { isRegistered: false }, initial: true },
	name: { type: Types.Text, label: 'name', hidden: true, noedit: true, initial: false }

});

// Pre Save
Donation.schema.pre('save', function(next) {
	'use strict';

	var targetUserType,
		targetId;

	if(this.isRegistered) {
		switch(this.userType) {
			case 'site visitor': targetUserType = SiteVisitor; targetId = this.siteVisitor; break;
			case 'social worker': targetUserType = SocialWorker; targetId = this.socialWorker; break;
			case 'family': targetUserType = Family; targetId = this.family; break;
			case 'admin': targetUserType = Admin; targetId = this.admin;
		}

		var model = this;

		targetUserType.model.findById(targetId)
				.exec()
				.then(function(user) {
					console.log('user:',typeof user);
					console.log('user.name:',user.name);
					// If the user has a name, they aren't a family.  Use this info to pull the correct name
					if(user.name) {
						model.name = user.name.full;
					} else {
						// TODO: This functionality is identical to that in event, pull both out and put them in the model as a virtual
						// if the targetGroup is families, we need to prettify the attendee name
						var contact2Exists = user.contact2.name.full.length > 0 ? true : false;
						var sameLastName = user.contact1.name.last === user.contact2.name.last ? true : false;

						if(contact2Exists && sameLastName) {
							model.name = user.contact1.name.first + ' and ' + user.contact2.name.full;
						} else if(contact2Exists && !sameLastName) {
							model.name = user.contact1.name.full + ' and ' + user.contact2.name.full;
						} else {
							model.name = user.contact1.name.full;
						}
					}

					next();

				}, function(err) {
					console.log(err);
					next();
				});
	} else {

		this.name = this.unregisteredUser;
	}
});

// Define default columns in the admin interface and register the model
Donation.defaultColumns = 'name, amount, date';
Donation.register();
