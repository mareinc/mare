var keystone	= require('keystone'),
	Types		= keystone.Field.Types,
	User		= keystone.list('User');

// Create model
var SiteVisitor = new keystone.List('Site Visitor', {
	inherits: User,
	track: true,
	map: { name: 'name.full' },
	defaultSort: 'name.full'
});

// Create fields
SiteVisitor.add('General Information', {

	name: {
		first: { type: Types.Text, label: 'first name', required: true, index: true, initial: true },
		last: { type: Types.Text, label: 'last name', required: true, index: true, initial: true },
		full: { type: Types.Text, label: 'name', hidden: true, noedit: true, initial: false }
	},

	// avatar: { type: Types.CloudinaryImage, label: 'avatar', folder: 'users/site visitors', select: true, selectPrefix: 'users/site visitors', autoCleanup: true }
	avatar: { type: Types.CloudinaryImage, label: 'avatar', folder: 'users/site visitors', autoCleanup: true }

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

}, 'Info Preferences', {

	infoPacket: {
		packet: { type: Types.Select, options: 'English, Spanish, none', label: 'Packet', initial: true },
		date: { type: Types.Text, label: 'date info packet sent', note: 'mm/dd/yyyy', initial: true },
		notes: { type: Types.Textarea, label: 'notes', initial: true }
	}

}, 'Heard About MARE From', {

	heardAboutMAREFrom: { type: Types.Relationship, label: 'how did you hear about mare?', ref: 'Way To Hear About MARE', many: true, initial: true },
	heardAboutMAREOther: { type: Types.Text, label: 'other', note: 'only fill out if "other" is selected in the field above', initial: true }

});

SiteVisitor.relationship({ path: 'mailing-lists', ref: 'Mailing List', refPath: 'siteUserAttendees' });

// Pre Save
User.schema.pre('save', function(next) {
	'use strict';

	// Populate the full name string for better identification when linking through Relationship field types
	this.name.full = this.name.first + ' ' + this.name.last;
	// Set the userType for role based page rendering
	this.userType = 'site visitor';

	next();
});

/* TODO: VERY IMPORTANT:  Need to fix this to provide the link to access the keystone admin panel again */
/* 						  Changing names or reworking this file changed the check in node_modules/keystone/templates/views/signin.jade
/*						  for user.isAdmin on line 14 */
// Provide access to Keystone
SiteVisitor.schema.virtual('canAccessKeystone').get(function() {
	'use strict';

	return false;
});

SiteVisitor.schema.methods.sendNotificationEmail = function(callback) {

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
SiteVisitor.defaultColumns = 'name.full, email, permissions.isActive';
SiteVisitor.register();