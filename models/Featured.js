const keystone			= require( 'keystone' );
const Types				= keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var Featured = new keystone.List( 'Featured Item', {
	autokey: { path: 'key', from: 'title', unique: true },
	map: { name: 'title' }
});

// Create fields
Featured.add({

	title: { type: Types.Text, default: 'Featured Items', noedit: true, initial: true }

}, 'About Us', {

	aboutUs: {
		target: { type: Types.Relationship, ref: 'Page', label: 'target page', filter: { type: 'aboutUs' }, required: true, initial: true },
		image: { type: Types.CloudinaryImage, folder: 'featured/', select: true, selectPrefix: 'featured/', autoCleanup: true }, // TODO: add publicID attribute for better naming in Cloudinary
		title: { type: Types.Text, hidden: true, noedit: true },
		imageScaled: { type: Types.Url, hidden: true },
		url: { type: Types.Url, noedit: true }
	}

}, 'Success Story', {

	successStory: {
		target: { type: Types.Relationship, ref: 'Success Story', label: 'target page', required: true, initial: true },
		image: { type: Types.CloudinaryImage, folder: 'featured/', select: true, selectPrefix: 'featured/', autoCleanup: true }, // TODO: add publicID attribute for better naming in Cloudinary
		title: { type: Types.Text, hidden: true, noedit: true },
		imageScaled: { type: Types.Url, hidden: true },
		url: { type: Types.Url, noedit: true }
	}

}, 'Upcoming Event', {

	upcomingEvent: {
		target: { type: Types.Relationship, ref: 'Event', label: 'target event', filters: { isActive: true }, required: true, initial: true },
		image: { type: Types.CloudinaryImage, folder: 'featured/', select: true, selectPrefix: 'featured/', autoCleanup: true }, // TODO: add publicID attribute for better naming in Cloudinary
		title: { type: Types.Text, hidden: true, noedit: true },
		imageScaled: { type: Types.Url, hidden: true },
		url: { type: Types.Url, noedit: true }
	}
});

// Pre Save
Featured.schema.pre( 'save', function(next) {
	'use strict';

	keystone.list( 'Page' ).model.find()
			.where( '_id', this.aboutUs.target )
			.exec()
			.then( page => {

				this.aboutUs.title = page[ 0 ].title;
				this.aboutUs.url = page[ 0 ].url;
				this.aboutUs.imageScaled = this._.aboutUs.image.thumbnail( 300,350,{ quality: 100 } );

			}, err => {

				console.log( err );

			}).then( keystone.list( 'Success Story' ).model.find()
				.where( '_id', this.successStory.target )
				.exec()
				.then( successStory => {

		       		this.successStory.title = successStory[ 0 ].heading;
		       		this.successStory.url = '/success-stories/';
					this.successStory.imageScaled = this._.successStory.image.thumbnail( 300,350,{ quality: 100 } );

			}, err => {

				console.log( err );

			}).then( keystone.list( 'Event' ).model.find()
				.where( '_id', this.upcomingEvent.target )
				.exec()
				.then( event => {

					this.upcomingEvent.title = event[ 0 ].name;
					this.upcomingEvent.url = event[ 0 ].url;
					this.upcomingEvent.imageScaled = this._.upcomingEvent.image.thumbnail( 300,350,{ quality: 100 } );

					next();
			}, err => {

				console.log( err );
			})
		));
	});

// Define default columns in the admin interface and register the model
Featured.defaultColumns = 'title, aboutUs.target, successStory.target, upcomingEvent.target';
Featured.register();