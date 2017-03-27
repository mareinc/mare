const keystone	= require('keystone');
const Types		= keystone.Field.Types;
const User		= require('./User');

// Create model
var SystemBot = new keystone.List( 'System Bot', {
	inherits: User,
	hidden: false
});

// Create fields
SystemBot.add( 'Permissions', {

	isActive: { type: Boolean, label: 'is active', default: true },

	permissions: {
		isVerified: { type: Boolean, label: 'has a verified email address', default: true, noedit: true },
        canMigrate: { type: Boolean, label: 'can migrate data', default: false, noedit: true }
	}

}, 'General Information', {

    name: {
        first: { type: Types.Text, label: 'first name', required: true, initial: true },
        last: { type: Types.Text, label: 'last name', required: true, initial: true },
        full: { type: Types.Text, label: 'name', hidden: true, noedit: true, initial: false }
    }

});

// Pre Save
SystemBot.schema.pre('save', function( next ) {
	'use strict';
	// Set the userType for role based page rendering
	this.userType = 'system bot';
	// Populate the full name string for better identification
	this.name.full = `${ this.name.first } ${ this.name.last }`;

	next();
});

// Provide access to Keystone
SystemBot.schema.virtual( 'canAccessKeystone' ).get( function() {
	'use strict';

	return true;
});

// Provides access to data migration middleware
SystemBot.schema.virtual( 'canMigrateData' ).get( function() {
	'use strict';

	return this.canMigrate;
});

// Define default columns in the admin interface and register the model
SystemBot.defaultColumns = 'name.full';
SystemBot.register();

// Export to make it available using require.  The keystone.list import throws a ReferenceError when importing a list
// that comes later when sorting alphabetically
exports = module.exports = SystemBot;