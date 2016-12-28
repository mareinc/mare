var keystone	= require('keystone'),
	Types		= keystone.Field.Types,
	User		= require('./User');

// Create model
var DataMigrator = new keystone.List('Data Migrator', {
	inherits: User,
	hidden: false
});

// Create fields
DataMigrator.add( 'Permissions', {

	permissions: {
		isVerified: { type: Boolean, label: 'has a verified email address', default: true, noedit: true },
		isActive: { type: Boolean, label: 'is active', default: true }
	}

});

// Pre Save
DataMigrator.schema.pre('save', function(next) {
	'use strict';
	// Set the userType for role based page rendering
	this.userType = 'data migrator';

	next();
});

// Provide access to Keystone
DataMigrator.schema.virtual( 'canAccessKeystone' ).get(function() {
	'use strict';

	return false;
});

// Provides access to data migration middleware
DataMigrator.schema.virtual( 'canMigrateData' ).get(function() {
	'use strict';

	return true;
});

// Define default columns in the admin interface and register the model
DataMigrator.defaultColumns = 'email';
DataMigrator.register();

// Export to make it available using require.  The keystone.list import throws a ReferenceError when importing a list
// that comes later when sorting alphabetically
exports = module.exports = DataMigrator;
