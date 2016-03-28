var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model
var SiteUser = new keystone.List('Site User', {
	track: true,
	map: { name: 'name.full' },
	defaultSort: 'name.full'
});

// Create fields
SiteUser.add('Permissions', {

	permissions: {
		isVerified: { type: Boolean, label: 'has a verified email address', default: false, noedit: true },
		isActive: { type: Boolean, label: 'is active', default: true, noedit: true }
	}

}, 'User Information', {

	name: {
		first: { type: Types.Text, label: 'first name', required: true, initial: true },
		last: { type: Types.Text, label: 'last name', required: true, initial: true },
		full: { type: Types.Text, label: 'name', hidden: true, noedit: true, initial: false }
	},

	password: { type: Types.Password, label: 'password', required: true, initial: true },
	avatar: { type: Types.CloudinaryImage, label: 'avatar', folder: 'users/site users', autoCleanup: true }

}, 'Contact Information', {

	email: { type: Types.Email, label: 'email address', unique: true, required: true, initial: true },

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

}, 'Heard About MARE From', {
	heardAboutMAREFrom: { type: Types.Relationship, label: 'how did you hear about mare?', ref: 'Way To Hear About MARE', many: true, initial: true },
	heardAboutMAREOther: { type: Types.Text, label: 'other', note: 'only fill out if "other" is selected in the field above', initial: true }
});

SiteUser.relationship({ path: 'mailing-lists', ref: 'Mailing List', refPath: 'siteUserAttendees' });

// Pre Save
SiteUser.schema.pre('save', function(next) {
	'use strict';

	// Populate the full name string for better identification when linking through Relationship field types
	this.name.full = this.name.first +  ' ' + this.name.last;

	next();
});


SiteUser.schema.post('save', function() {
	// this.sendNotificationEmail();
});

SiteUser.schema.methods.sendNotificationEmail = function(callback) {

	if ('function' !== typeof callback) {
		callback = function() {
			console.log('Inside keystone.Email() callback: ',arguments);
		};
	}

	var user = this;

	//Find the email template in templates/emails/
	new keystone.Email({
    		templateExt: 'hbs',
    		templateEngine: require('handlebars'),
    		templateName: 'welcome'
  	}).send({
		to: ['tommysalsa@gmail.com', 'jared.j.collier@gmail.com'],
		from: {
			name: 'MARE',
			email: 'info@mareinc.org'
		},
		subject: 'Thank you for registering',
		message: 'This is a test welcome email from the MARE site. Thank you for registering!',
		user: user
	}, callback);

};

// Define default columns in the admin interface and register the model
SiteUser.defaultColumns = 'name.full, email, isActive, isVerified';
SiteUser.register();