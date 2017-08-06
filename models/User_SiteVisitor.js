var keystone	= require('keystone'),
	Types		= keystone.Field.Types,
	User		= require('./User');

// Create model
var SiteVisitor = new keystone.List('Site Visitor', {
	inherits: User,
	map: { name: 'name.full' },
	defaultSort: 'name.full',
	hidden: false
});

// Create fields
SiteVisitor.add( 'Permissions', {

	isActive: { type: Boolean, label: 'is active', default: true },

	permissions: {
		isVerified: { type: Boolean, label: 'has a verified email address', default: false, noedit: true }
	}

}, 'General Information', {

	name: {
		first: { type: Types.Text, label: 'first name', required: true, initial: true },
		last: { type: Types.Text, label: 'last name', required: true, initial: true },
		full: { type: Types.Text, label: 'name', hidden: true, noedit: true, initial: false }
	},

	avatar: { type: Types.CloudinaryImage, label: 'avatar', folder: 'users/site visitors', select: true, selectPrefix: 'users/site visitors', autoCleanup: true } // TODO: add publicID attribute for better naming in Cloudinary

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
		city: { type: Types.Relationship, label: 'city', ref: 'City or Town', dependsOn: { isOutsideMassachusetts: false }, initial: true },
		isOutsideMassachusetts: { type: Types.Boolean, label: 'is outside Massachusetts', initial: true },
		cityText: { type: Types.Text, label: 'city', dependsOn: { isOutsideMassachusetts: true }, initial: true },
		state: { type: Types.Relationship, label: 'state', ref: 'State', initial: true },
		zipCode: { type: Types.Text, label: 'zip code', initial: true }
	}

}, 'Info Preferences', {

	infoPacket: {
		packet: { type: Types.Select, options: 'English, Spanish, none', label: 'Packet', initial: true },
		date: { type: Types.Date, label: 'date info packet sent', format: 'MM/DD/YYYY', initial: true },
		notes: { type: Types.Textarea, label: 'notes', initial: true }
	}

}, 'Heard About MARE From', {

	heardAboutMAREFrom: { type: Types.Relationship, label: 'how did you hear about mare?', ref: 'Way To Hear About MARE', many: true, initial: true },
	heardAboutMAREOther: { type: Types.Text, label: 'other', note: 'only fill out if "other" is selected in the field above', initial: true }

});

// Set up relationship values to show up at the bottom of the model if any exist
SiteVisitor.relationship({ ref: 'Mailing List', refPath: 'siteVisitorSubscribers', path: 'mailing-lists', label: 'mailing lists' });
SiteVisitor.relationship({ ref: 'Event', refPath: 'siteVisitorAttendees', path: 'events', label: 'events' });

// Pre Save
SiteVisitor.schema.pre('save', function(next) {
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

// Define default columns in the admin interface and register the model
SiteVisitor.defaultColumns = 'name.full, email, isActive';
SiteVisitor.register();

// Export to make it available using require.  The keystone.list import throws a ReferenceError when importing a list
// that comes later when sorting alphabetically
exports = module.exports = SiteVisitor;
