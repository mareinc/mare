const keystone	= require( 'keystone' ),
	  Types		= keystone.Field.Types;

// configure the s3 storage adapters
const imageStorage = new keystone.Storage({
	adapter: require( 'keystone-storage-adapter-s3' ),
	s3: {
		key: process.env.S3_KEY, // required; defaults to process.env.S3_KEY
		secret: process.env.S3_SECRET, // required; defaults to process.env.S3_SECRET
		bucket: process.env.S3_BUCKET_NAME, // required; defaults to process.env.S3_BUCKET
		region: process.env.S3_REGION, // optional; defaults to process.env.S3_REGION, or if that's not specified, us-east-1
		path: '/Success Stories/Images',
		// use the file name with spaces replaced by dashes instead of randomly generating a value
		// NOTE: this is needed to prevent access errors when trying to view the files
		generateFilename: file => file.originalname.replace( /\s/g, '_' ),
		publicUrl: file => `${ process.env.CLOUDFRONT_URL }/Success Stories/Images/${ file.originalname.replace( /\s/g, '_' ) }`
	},
	schema: {
		bucket: true, // optional; store the bucket the file was uploaded to in your db
		etag: true, // optional; store the etag for the resource
		path: true, // optional; store the path of the file in your db
		url: true // optional; generate & store a public URL
	}
});

// Create model. Additional options allow menu name to be used what auto-generating URLs
const SuccessStory = new keystone.List( 'Success Story', {
	autokey: { path: 'key', from: 'heading', unique: true },
	map: { name: 'heading' }
});

// Create fields
SuccessStory.add({

	heading: { type: Types.Text, label: 'heading', required: true, initial: true },
	url: { type: Types.Url, label: 'url', noedit: true },
	subHeading: { type: Types.Text, label: 'sub-heading', initial: true },
	content: { type: Types.Html, wysiwyg: true, note: 'do not add images or video, instead use the fields below', initial: true },
	tempImage: { type: Types.File, storage: imageStorage, label: 'temp image', note: 'needed to display in the sidebar, success story page, and home page' },
	image: { type: Types.File, storage: imageStorage, label: 'image', note: 'needed to display in the sidebar, success story page, and home page' },
	// image: {
	// 	type: Types.CloudinaryImage,
	// 	note: 'needed to display in the sidebar, success story page, and home page',
	// 	folder: `${ process.env.CLOUDINARY_DIRECTORY }/success-stories/`,
	// 	select: true,
	// 	selectPrefix: `${ process.env.CLOUDINARY_DIRECTORY }/success-stories/`,
	// 	autoCleanup: true,
	// 	whenExists: 'overwrite',
	// 	filenameAsPublicID: true
	// },
	imageCaption: { type: Types.Text, label: 'image caption', initial: true },
	video: { type: Types.Url, label: 'video', initial: true }

});

SuccessStory.schema.statics.findRandom = function( callback ) {

	this.count( function( err, count ) {
	
		if ( err ) {
			return callback( err );
		}
		
		const rand = Math.floor( Math.random() * count );
		
		this.findOne().skip( rand ).exec( callback );
	
	}.bind( this ) );
};

SuccessStory.schema.virtual( 'hasImage' ).get( function() {
	'use strict';

	return !!this.image.url;
});

// Pre Save
SuccessStory.schema.pre( 'save', function( next ) {
	'use strict';

	this.url = this.get( 'key' ) ? '/success-stories/' + this.get( 'key' ) : undefined;

	next();

});

// TODO IMPORTANT: this is a temporary solution to fix a problem where the autokey generation from Keystone
// 				   occurs after the pre-save hook for this model, preventing the url from being set.  Remove
//				   this hook once that issue is resolved.
SuccessStory.schema.post( 'save', function() {
	if( !this.get( 'url' ) ) {
		this.save();
	}
});

// Define default columns in the admin interface and register the model
SuccessStory.defaultColumns = 'heading, url';
SuccessStory.register();
