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
	image: { type: Types.CloudinaryImage, note: 'needed to display in the sidebar, MARE in the news page, and the home page', folder: 'mare-in-the-news/', select: true, selectPrefix: 'mare-in-the-news/', publicID: 'fileName', autoCleanup: true },
	imageFeatured: { type: Types.Url, hidden: true },
	imageSidebar: { type: Types.Url, hidden: true },
	video: { type: Types.Url, label: 'video', initial: true }

/* Container for all system fields (add a heading if any are meant to be visible through the admin UI) */
}, {

	// system field to store an appropriate file prefix
	fileName: { type: Types.Text, hidden: true }

});

MAREInTheNews.schema.statics.findRandom = function( callback ) {

	this.count( function( err, count ) {
		if ( err ) {
			return callback( err );
		}
    
		var rand = Math.floor( Math.random() * count );
  		this.findOne().skip( rand ).exec( callback );

	}.bind( this ) );
};

// Pre Save
MAREInTheNews.schema.pre( 'save', function(next) {
	'use strict';

	this.imageFeatured	= this._.image.thumbnail( 168, 168, { quality: 80 } );
	this.imageSidebar	= this._.image.thumbnail( 216, 196, { quality: 80 } );
	this.url = '/mare-in-the-news/' + this.key;

	// Create an identifying name for file uploads
	this.fileName = this.key.replace( /-/g, '_' );

	next();

});

// Define default columns in the admin interface and register the model
MAREInTheNews.defaultColumns = 'heading, url';
MAREInTheNews.register();
