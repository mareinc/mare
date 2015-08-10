var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model
var User = new keystone.List('User');

// Create fields
User.add({
	name: { type: Types.Name, required: true, index: true, initial: true },
	email: { type: Types.Email, required: true, index: true, initial: true },
	password: { type: Types.Password, required: true, initial: true },
    avatar: { type: Types.CloudinaryImage, folder: 'users/', select: true, selectPrefix: 'users/', autoCleanup: true }
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