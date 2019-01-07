var keystone	= require( 'keystone' ),
	Types		= keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var MAREInTheNews = new keystone.List( 'MARE in the News', {
	autokey: { path: 'key', from: 'heading', unique: true },
	map: { name: 'heading' },
	label: 'MARE in the News Stories'
});

// Create fields
MAREInTheNews.add({

	heading: { type: Types.Text, label: 'heading', required: true, initial: true },
	url: { type: Types.Url, label: 'url', noedit: true },
	subHeading: { type: Types.Text, label: 'sub-heading', initial: true },
	content: { type: Types.Html, wysiwyg: true, initial: true },
	image: {
		type: Types.CloudinaryImage,
		note: 'needed to display in the sidebar, MARE in the news page, and the home page',
		folder: `${ process.env.CLOUDINARY_DIRECTORY }/mare-in-the-news/`,
		select: true,
		selectPrefix: `${ process.env.CLOUDINARY_DIRECTORY }/mare-in-the-news/`,
		autoCleanup: true,
		whenExists: 'overwrite',
		generateFilename: function( file, attemptNumber ) {
			const originalname = file.originalname;
			const filenameWithoutExtension = originalname.substring( 0, originalname.lastIndexOf( '.' ) );
			const timestamp = new Date().getTime();
			return `${ filenameWithoutExtension }-${ timestamp }`;
		}
	},
	video: { type: Types.Url, label: 'video', initial: true }

});

MAREInTheNews.schema.statics.findRandom = function( callback ) {

	this.count( function( err, count ) {
		
		if ( err ) {
			return callback( err );
		}
    
		const rand = Math.floor( Math.random() * count );
		  
		this.findOne().skip( rand ).exec( callback );

	}.bind( this ) );
};

MAREInTheNews.schema.virtual( 'hasImage' ).get( function() {
	'use strict';

	return this.image.exists;
});

// Pre Save
MAREInTheNews.schema.pre( 'save', function(next) {
	'use strict';

	this.url = this.get( 'key' ) ? '/mare-in-the-news/' + this.get( 'key' ) : undefined;

	next();
});

// TODO IMPORTANT: this is a temporary solution to fix a problem where the autokey generation from Keystone
// 				   occurs after the pre-save hook for this model, preventing the url from being set.  Remove
//				   this hook once that issue is resolved.
MAREInTheNews.schema.post( 'save', function() {
	if( !this.get( 'url' ) ) {
		this.save();
	}
});

// Define default columns in the admin interface and register the model
MAREInTheNews.defaultColumns = 'heading, url';
MAREInTheNews.register();
