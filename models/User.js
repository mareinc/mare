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
User.add('Login Information', {

	email: { type: Types.Email, label: 'email address', unique: true, required: true, initial: true },
	password: { type: Types.Password, label: 'password', required: true, initial: true }

}, {

	userType: { type: Types.Text, hidden: true }

});

// Define default columns in the admin interface and register the model
User.defaultColumns = 'email';
User.register();

// Export to make it available using require.  The keystone.list import throws a ReferenceError when importing a list
// that comes later when sorting alphabetically
exports = module.exports = User;
