var keystone	= require('keystone'),
	Types		= keystone.Field.Types;

// Create model
var User = new keystone.List('User', {
	track: true,
	autokey: { path: 'key', from: 'email', unique: true },
	map: { name: 'email' },
	hidden: true
});

// Create fields
User.add('Permissions', {

	permissions: {
		isVerified: { type: Boolean, label: 'has a verified email address', default: false, noedit: true },
		isActive: { type: Boolean, label: 'is active', default: true, noedit: true }
	}

}, 'General Information', {

	email: { type: Types.Email, label: 'email address', unique: true, required: true, initial: true },
	password: { type: Types.Password, label: 'password', required: true, initial: true }

}, {

	userType: { type: Types.Text, hidden: true }

});

// Define default columns in the admin interface and register the model
User.defaultColumns = 'email, permissions.isActive, permissions.isVerified';
User.register();