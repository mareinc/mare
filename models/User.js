var keystone	= require('keystone'),
	Types		= keystone.Field.Types;

// Create model
var User = new keystone.List('User', {
	track: true,
	autokey: { path: 'key', from: 'email', unique: true },
	map: { name: 'email' },
	defaultSort: 'email'
});

// Create fields
User.add('Permissions', {

	permissions: {
		isVerified: { type: Boolean, label: 'has a verified email address', default: false, noedit: true },
		isActive: { type: Boolean, label: 'is active', default: true, noedit: true }
	}

}, 'General Information', {

	email: { type: Types.Email, label: 'email address', unique: true, required: true, index: true, initial: true },
	password: { type: Types.Password, label: 'password', required: true, initial: true }

});

/* TODO: VERY IMPORTANT:  Need to fix this to provide the link to access the keystone admin panel again */
/* 						  Changing names or reworking this file changed the check in node_modules/keystone/templates/views/signin.jade
/*						  for user.isAdmin on line 14 */
// Provide access to Keystone
User.schema.virtual('canAccessKeystone').get(function() {
	'use strict';

	return true;
});

// Define default columns in the admin interface and register the model
User.defaultColumns = 'name.full, email, isActive, isVerified';
User.register();