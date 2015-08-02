var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model
var User = new keystone.List('User');

// Create fields
User.add({
	name: { type: Types.Name, required: true, index: true },
	email: { type: Types.Email, initial: true, required: true, index: true },
	password: { type: Types.Password, initial: true, required: true },
    avatar: { type: Types.CloudinaryImage, folder: 'users/', autoCleanup: true }
}, 'Permissions', {
	isAdmin: { type: Boolean, label: 'Can access Keystone', index: true }
});

// Provide access to Keystone
User.schema.virtual('canAccessKeystone').get(function() {
	'use strict';
	
	return this.isAdmin;
});

// Define default columns in the admin interface and register the model
User.defaultColumns = 'name, email, isAdmin';
User.register();