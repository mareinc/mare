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
		path: '/Slideshow/Images',
		// use the file name with spaces replaced by dashes instead of randomly generating a value
		// NOTE: this is needed to prevent access errors when trying to view the files
		generateFilename: file => file.originalname.replace( /\s/g, '_' ),
		publicUrl: file => `${ process.env.CLOUDFRONT_URL }/Slideshow/Images/${ file.originalname.replace( /\s/g, '_' ) }`
	},
	schema: {
		bucket: true, // optional; store the bucket the file was uploaded to in your db
		etag: true, // optional; store the etag for the resource
		path: true, // optional; store the path of the file in your db
		url: true // optional; generate & store a public URL
	}
});

// Create model. Additional options allow menu name to be used what auto-generating URLs
var SlideshowItem = new keystone.List('Slideshow Item', {
	autokey: { path: 'key', from: 'heading', unique: true },
	map: { name: 'heading' }
});

// Create fields
SlideshowItem.add({

	tempImage: { type: Types.File, storage: imageStorage, label: 'temp image' },
	image: {
		type: Types.CloudinaryImage,
		folder: `${ process.env.CLOUDINARY_DIRECTORY }/slideshow/`,
		select: true,
		selectPrefix: `${ process.env.CLOUDINARY_DIRECTORY }/slideshow/`,
		autoCleanup: true,
		whenExists: 'overwrite',
		filenameAsPublicID: true
	},
	parent: { type: Types.Relationship, label: 'slideshow', ref: 'Slideshow', initial: true },
	order: { type: Types.Number, label: 'order', initial: true }

});

SlideshowItem.schema.virtual( 'hasImage' ).get( function() {
	'use strict';

	return !!this.image.url;
});

// Define default columns in the admin interface and register the model
SlideshowItem.defaultColumns = 'heading, order, parent';
SlideshowItem.register();