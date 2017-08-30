var keystone	= require( 'keystone' ),
	Types		= keystone.Field.Types,
	User		= require( './User' );

// Create model
var Admin = new keystone.List( 'Admin', {
	inherits: User,
	map: { name: 'name.full' },
	defaultSort: 'name.full',
	hidden: false
});

// Create fields
Admin.add( 'Permissions', {

	isActive: { type: Boolean, label: 'is active', default: true, noedit: true },

	permissions: {
		isVerified: { type: Boolean, label: 'has a verified email address', default: true, noedit: true, hidden: true },
		canMigrate: { type: Boolean, label: 'can migrate data', default: false, noedit: true }
	}

}, 'General Information', {

	name: {
		first: { type: Types.Text, label: 'first name', required: true, initial: true },
		last: { type: Types.Text, label: 'last name', required: true, initial: true },
		full: { type: Types.Text, label: 'name', hidden: true, noedit: true, initial: false }
	},

	avatar: { type: Types.CloudinaryImage, label: 'avatar', folder: 'users/admin', select: true, selectPrefix: 'users/admin', autoCleanup: true } // TODO: add publicID attribute for better naming in Cloudinary

}, 'Contact Information', {

	phone: {
		work: { type: Types.Text, label: 'work phone number', initial: true },
		home: { type: Types.Text, label: 'home phone number', initial: true },
		mobile: { type: Types.Text, label: 'mobile phone number', initial: true },
		preferred: { type: Types.Select, label: 'preferred phone', options: 'work, home, mobile', initial: true }
	},

	address: {
	    street1: { type: Types.Text, label: 'street 1', initial: true },
		street2: { type: Types.Text, label: 'street 2', initial: true },
		city: { type: Types.Text, label: 'city', initial: true },
		state: { type: Types.Relationship, label: 'state', ref: 'State', initial: true },
		zipCode: { type: Types.Text, label: 'zip code', initial: true }
	}

/* Container for data migration fields ( these should be kept until after phase 2 and the old system is phased out completely ) */
}, {

	oldId: { type: Types.Text, hidden: true }

});

// Set up relationship values to show up at the bottom of the model if any exist
Admin.relationship({ ref: 'CSC Region Contact', refPath: 'cscRegionContact', path: 'cscRegionContact', label: 'contact for the following regions' });
Admin.relationship({ ref: 'Mailing List', refPath: 'adminSubscribers', path: 'mailing-lists', label: 'mailing lists' });
Admin.relationship({ ref: 'Event', refPath: 'staffAttendees', path: 'events', label: 'events' });

// Pre Save
Admin.schema.pre( 'save', function( next ) {
	'use strict';
	// Populate the full name string for better identification when linking through Relationship field types
	this.name.full = this.name.first + ' ' + this.name.last;
	// Set the userType for role based page rendering
	this.userType = 'admin';

	next();
});

/* TODO: VERY IMPORTANT:  Need to fix this to provide the link to access the keystone admin panel again */
/* 						  Changing names or reworking this file changed the check in node_modules/keystone/templates/views/signin.jade
/*						  for user.isAdmin on line 14 */
// Provide access to Keystone
User.schema.virtual( 'canAccessKeystone' ).get( () => {
	'use strict';

	return true;
});

Admin.schema.virtual( 'displayName' ).get( function() {
	'use strict';

	return `${ this.name.first } ${ this.name.last }`;
});

// Define default columns in the admin interface and register the model
Admin.defaultColumns = 'name.full, email, phone.work, isActive';
Admin.register();

// Export to make it available using require.  The keystone.list import throws a ReferenceError when importing a list
// that comes later when sorting alphabetically
exports = module.exports = Admin;