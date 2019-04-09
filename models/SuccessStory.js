var keystone = require( 'keystone' ),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var SuccessStory = new keystone.List( 'Success Story', {
	autokey: { path: 'key', from: 'heading', unique: true },
	map: { name: 'heading' }
});

// Create fields
SuccessStory.add({

	heading: { type: Types.Text, label: 'heading', required: true, initial: true },
	url: { type: Types.Url, label: 'url', noedit: true },
	subHeading: { type: Types.Text, label: 'sub-heading', initial: true },
	content: { type: Types.Html, wysiwyg: true, note: 'do not add images or video, instead use the fields below', initial: true },
	image: {
		type: Types.CloudinaryImage,
		note: 'needed to display in the sidebar, success story page, and home page',
		folder: `${ process.env.CLOUDINARY_DIRECTORY }/success-stories/`,
		select: true,
		selectPrefix: `${ process.env.CLOUDINARY_DIRECTORY }/success-stories/`,
		autoCleanup: true,
		whenExists: 'overwrite',
		filenameAsPublicID: true
	},
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

	return this.image.exists;
});

// Pre Save
SuccessStory.schema.pre( 'save', function( next ) {
	'use strict';

	this.url = this.get( 'key' ) ? '/adoption-stories/' + this.get( 'key' ) : undefined;

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
