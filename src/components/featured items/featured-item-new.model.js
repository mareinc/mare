const keystone			= require( 'keystone' ),
	  Types				= keystone.Field.Types;

// configure the s3 storage adapters
const imageStorage = new keystone.Storage({
	adapter: require( 'keystone-storage-adapter-s3' ),
	s3: {
		key: process.env.S3_KEY, // required; defaults to process.env.S3_KEY
		secret: process.env.S3_SECRET, // required; defaults to process.env.S3_SECRET
		bucket: process.env.S3_BUCKET_NAME, // required; defaults to process.env.S3_BUCKET
		region: process.env.S3_REGION, // optional; defaults to process.env.S3_REGION, or if that's not specified, us-east-1
		path: '/featured-items/images',
		// use the file name with spaces replaced by dashes instead of randomly generating a value
		// NOTE: this is needed to prevent access errors when trying to view the files
		generateFilename: file => file.originalname.replace( /\s/g, '_' ),
		publicUrl: file => `${ process.env.CLOUDFRONT_URL }/featured-items/images/${ file.originalname.replace( /\s/g, '_' ) }`
	},
	schema: {
		bucket: true, // optional; store the bucket the file was uploaded to in your db
		etag: true, // optional; store the etag for the resource
		path: true, // optional; store the path of the file in your db
		url: true // optional; generate & store a public URL
	}
});

// create model
const FeaturedItem = new keystone.List( 'Featured Item v2', {
	autokey: { path: 'key', from: 'title', unique: true },
	map: { name: 'title' }
});

// create fields
FeaturedItem.add({

	title: { type: Types.Text, label: 'title', default: 'Featured Items', noedit: true, initial: true }

}, 'Featured Item 1', {

	featuredItem1: {
		title: { type: Types.Text, label: 'title', initial: true, required: true },
		image: { type: Types.File, storage: imageStorage, label: 'image' },
		url: { type: Types.Url, label: 'url', initial: true, required: true }
	}

}, 'Featured Item 2', {

	featuredItem2: {
		title: { type: Types.Text, label: 'title', initial: true, required: true },
		image: { type: Types.File, storage: imageStorage, label: 'image' },
		url: { type: Types.Url, label: 'url', initial: true, required: true }
	}

}, 'Featured Item 3', {

	featuredItem3: {
		title: { type: Types.Text, label: 'title', initial: true, required: true },
		image: { type: Types.File, storage: imageStorage, label: 'image' },
		url: { type: Types.Url, label: 'url', initial: true, required: true }
	}
});

FeaturedItem.schema.virtual( 'featuredItem1HasImage' ).get( function() {
	'use strict';

	return !!this.featuredItem1.image.url;
});

FeaturedItem.schema.virtual( 'featuredItem2HasImage' ).get( function() {
	'use strict';

	return !!this.featuredItem2.image.url;
});

FeaturedItem.schema.virtual( 'featuredItem3HasImage' ).get( function() {
	'use strict';

	return !!this.featuredItem3.image.url;
});

FeaturedItem.register();