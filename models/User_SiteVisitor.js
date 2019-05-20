const keystone		= require( 'keystone' ),
	  Types			= keystone.Field.Types,
	  User			= require( './User' ),
	  Validators	= require( '../routes/middleware/validators' );

// configure the s3 storage adapters
const imageStorage = new keystone.Storage({
	adapter: require( 'keystone-storage-adapter-s3' ),
	s3: {
		key: process.env.S3_KEY, // required; defaults to process.env.S3_KEY
		secret: process.env.S3_SECRET, // required; defaults to process.env.S3_SECRET
		bucket: process.env.S3_BUCKET_NAME, // required; defaults to process.env.S3_BUCKET
		region: process.env.S3_REGION, // optional; defaults to process.env.S3_REGION, or if that's not specified, us-east-1
		path: '/Site Visitors/Images',
		// use the file name with spaces replaced by dashes instead of randomly generating a value
		// NOTE: this is needed to prevent access errors when trying to view the files
		generateFilename: file => file.originalname.replace( /\s/g, '_' ),
		publicUrl: file => `${ process.env.CLOUDFRONT_URL }/Site Visitors/Images/${ file.originalname.replace( /\s/g, '_' ) }`
	},
	schema: {
		bucket: true, // optional; store the bucket the file was uploaded to in your db
		etag: true, // optional; store the etag for the resource
		path: true, // optional; store the path of the file in your db
		url: true // optional; generate & store a public URL
	}
});

// Create model
const SiteVisitor = new keystone.List( 'Site Visitor', {
	inherits: User,
	map: { name: 'name.full' },
	defaultSort: 'name.full',
	hidden: false
});

// Create fields
SiteVisitor.add( 'Permissions', {

	isActive: { type: Boolean, label: 'is active' },

	permissions: {
		isVerified: { type: Boolean, label: 'has a verified email address', default: false, noedit: true }
	}

}, 'General Information', {

	name: {
		first: { type: Types.Text, label: 'first name', required: true, initial: true },
		last: { type: Types.Text, label: 'last name', required: true, initial: true },
		full: { type: Types.Text, label: 'name', hidden: true, noedit: true, initial: false }
	},

	avatar: { type: Types.File, storage: imageStorage, label: 'avatar' }

}, 'Contact Information', {

	phone: {
		home: { type: Types.Text, label: 'home phone number', initial: true, validate: Validators.phoneValidator },
		mobile: { type: Types.Text, label: 'mobile phone number', initial: true, validate: Validators.phoneValidator },
		work: { type: Types.Text, label: 'work phone number', initial: true, validate: Validators.phoneValidator },
		preferred: { type: Types.Select, label: 'preferred phone', options: 'work, home, mobile', initial: true }
	},

	address: {
	    street1: { type: Types.Text, label: 'street 1', initial: true },
		street2: { type: Types.Text, label: 'street 2', initial: true },
		isOutsideMassachusetts: { type: Types.Boolean, label: 'is outside Massachusetts', initial: true },
		city: { type: Types.Relationship, label: 'city', ref: 'City or Town', dependsOn: { 'address.isOutsideMassachusetts': false }, initial: true },
		cityText: { type: Types.Text, label: 'city', dependsOn: { 'address.isOutsideMassachusetts': true }, initial: true },
		state: { type: Types.Relationship, label: 'state', ref: 'State', initial: true },
		zipCode: { type: Types.Text, label: 'zip code', initial: true, validate: Validators.zipValidator }
    }

}, 'Info Preferences', {

	infoPacket: {
		preference: { type: Types.Select, options: 'Email, Hard Copy, Referred to AUK', label: 'packet', initial: true },
		date: { type: Types.Date, label: 'date info packet sent', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, initial: true },
		notes: { type: Types.Textarea, label: 'notes', initial: true }
	}

}, 'Heard About MARE From', {

	heardAboutMAREFrom: { type: Types.Relationship, label: 'how did you hear about mare?', ref: 'Way To Hear About MARE', many: true, initial: true },
	heardAboutMAREOther: { type: Types.Text, label: 'other', note: 'only fill out if "other" is selected in the field above', initial: true }

});

// Set up relationship values to show up at the bottom of the model if any exist
SiteVisitor.relationship( { ref: 'Event', refPath: 'siteVisitorAttendees', path: 'events', label: 'events' } );
SiteVisitor.relationship( { ref: 'Donation', refPath: 'siteVisitor', path: 'donations', label: 'donations' } );

/* TODO: VERY IMPORTANT:  Need to fix this to provide the link to access the keystone admin panel again */
/* 						  Changing names or reworking this file changed the check in node_modules/keystone/templates/views/signin.jade
/*						  for user.isAdmin on line 14 */
// Provide access to Keystone
SiteVisitor.schema.virtual( 'canAccessKeystone' ).get( function() {
	'use strict';

	return false;
});

SiteVisitor.schema.virtual( 'displayName' ).get( function() {
	'use strict';

	return `${ this.name.first } ${ this.name.last }`;
});

// Pre Save
SiteVisitor.schema.pre( 'save', function( next ) {
	'use strict';
	// trim whitespace characters from any type.Text fields
	this.trimTextFields();
	// Populate the full name string for better identification when linking through Relationship field types
	this.name.full = this.name.first + ' ' + this.name.last;
	// Set the userType for role based page rendering
	this.userType = 'site visitor';

	next();
});

/* text fields don't automatically trim(), this is to ensure no leading or trailing whitespace gets saved into url, text, or text area fields */
SiteVisitor.schema.methods.trimTextFields = function() {

	if( this.get( 'name.first' ) ) {
		this.set( 'name.first', this.get( 'name.first' ).trim() );
	}

	if( this.get( 'name.last' ) ) {
		this.set( 'name.last', this.get( 'name.last' ).trim() );
	}

	if( this.get( 'name.full' ) ) {
		this.set( 'name.full', this.get( 'name.full' ).trim() );
	}

	if( this.get( 'phone.home' ) ) {
		this.set( 'phone.home', this.get( 'phone.home' ).trim() );
	}

	if( this.get( 'phone.mobile' ) ) {
		this.set( 'phone.mobile', this.get( 'phone.mobile' ).trim() );
	}

	if( this.get( 'phone.work' ) ) {
		this.set( 'phone.work', this.get( 'phone.work' ).trim() );
	}

	if( this.get( 'address.street1' ) ) {
		this.set( 'address.street1', this.get( 'address.street1' ).trim() );
	}

	if( this.get( 'address.street2' ) ) {
		this.set( 'address.street2', this.get( 'address.street2' ).trim() );
	}

	if( this.get( 'address.cityText' ) ) {
		this.set( 'address.cityText', this.get( 'address.cityText' ).trim() );
	}

	if( this.get( 'address.zipCode' ) ) {
		this.set( 'address.zipCode', this.get( 'address.zipCode' ).trim() );
	}

	if( this.get( 'infoPacket.notes' ) ) {
		this.set( 'infoPacket.notes', this.get( 'infoPacket.notes' ).trim() );
	}

	if( this.get( 'heardAboutMAREOther' ) ) {
		this.set( 'heardAboutMAREOther', this.get( 'heardAboutMAREOther' ).trim() );
	}
};

// Define default columns in the admin interface and register the model
SiteVisitor.defaultColumns = 'name.full, email, isActive';
SiteVisitor.register();

// Export to make it available using require.  The keystone.list import throws a ReferenceError when importing a list
// that comes later when sorting alphabetically
exports = module.exports = SiteVisitor;
