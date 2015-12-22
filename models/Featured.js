var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var Featured = new keystone.List('Featured Item', {
	track: true,
	autokey: { path: 'key', from: 'title', unique: true },
	map: { name: 'title' }
});

// Create fields
Featured.add({

	title: { type: Types.Text, default: 'Featured Items', noedit: true, initial: true }

}, 'About Us', {

	aboutUs: {
		target: { type: Types.Relationship, ref: 'Page', label: 'target page', filter: { type: 'aboutUs' }, required: true, initial: true },
		title: { type: Types.Text, label: 'title', index: true, required: true, initial: true },
		summary: { type: Types.Textarea, label: 'summary', initial: true },
		image: { type: Types.CloudinaryImage, folder: 'featured/', select: true, selectPrefix: 'featured/', autoCleanup: true },	
		imageStretched: {type: Types.Url, hidden: true },
		imageScaled: {type: Types.Url, hidden: true },
		url: { type: Types.Url, noedit: true }
	}

}, 'Success Story', {

	successStory: {
		target: { type: Types.Relationship, ref: 'Success Story', label: 'target page', filter: { type: 'successStory' }, required: true, initial: true },
		title: { type: Types.Text, label: 'title', index: true, required: true, initial: true },
		summary: { type: Types.Textarea, label: 'summary', initial: true },
		image: { type: Types.CloudinaryImage, folder: 'featured/', select: true, selectPrefix: 'featured/', autoCleanup: true },
		imageStretched: {type: Types.Url, hidden: true},
		imageScaled: {type: Types.Url, hidden: true},
		url: { type: Types.Url, noedit: true }
	}

}, 'Upcoming Event', {

	upcomingEvent: {
		target: { type: Types.Relationship, ref: 'Event', label: 'target event', required: true, initial: true },
		title: { type: Types.Text, label: 'title', index: true, required: true, initial: true },
		summary: { type: Types.Textarea, label: 'summary', initial: true },
		image: { type: Types.CloudinaryImage, folder: 'featured/', select: true, selectPrefix: 'featured/', autoCleanup: true },
		imageStretched: {type: Types.Url, hidden: true},
		imageScaled: {type: Types.Url, hidden: true},
		url: { type: Types.Url, noedit: true }
	}
});

// Pre Save
Featured.schema.pre('save', function(next) {
	'use strict';

	var self = this;

	// TODO: These need to truncate to 250 characters (to the nearest word)
	self.aboutUs.summary = self.aboutUs.summary.substring(0, 250);
	self.successStory.summary = self.successStory.summary.substring(0, 250);
	self.upcomingEvent.summary = self.upcomingEvent.summary.substring(0, 250);
	// TODO: These should append an elipses if the summary was truncated
	keystone.list('Page').model.find()
			.where('_id', this.aboutUs.target)
			.exec()
			.then(function(page) {

				self.aboutUs.title = page[0].title;
				self.aboutUs.summary = page[0].content.replace(/<\/?[^>]+(>|$)/g, '');
				self.aboutUs.summary = self.aboutUs.summary.substring(0, 200);
				self.aboutUs.url = page[0].url;
				self.aboutUs.imageStretched = self._.aboutUs.image.scale(400,250,{ quality: 80 });
				self.aboutUs.imageScaled = self._.aboutUs.image.thumbnail(400,250,{ quality: 80 });

			}, function(err) {
				console.log(err);
			}).then(keystone.list('SuccessStory').model.find()
				.where('_id', this.successStory.target)
				.exec()
				.then(function(successStory) {

		       		self.successStory.title = successStory[0].heading;
		       		self.successStory.summary = successStory[0].content.replace(/<\/?[^>]+(>|$)/g, '');
		       		self.successStory.summary = self.successStory.summary.substring(0, 200);
		       		self.successStory.url = '/success-stories/';
		       		self.successStory.imageStretched = self._.successStory.image.scale(400,250,{ quality: 80 });
					self.successStory.imageScaled = self._.successStory.image.thumbnail(400,250,{ quality: 80 });

			}, function(err) {
				console.log(err);
			}).then(keystone.list('Event').model.find()
				.where('_id', this.upcomingEvent.target)
				.exec()
				.then(function(event) {

					self.upcomingEvent.title = event[0].title;
					self.upcomingEvent.summary = event[0].description.replace(/<\/?[^>]+(>|$)/g, '');
					self.upcomingEvent.summary = self.upcomingEvent.summary.substring(0, 200);
					self.upcomingEvent.url = event[0].url;
					self.upcomingEvent.imageStretched = self._.upcomingEvent.image.scale(400,250,{ quality: 80 });
					self.upcomingEvent.imageScaled = self._.upcomingEvent.image.thumbnail(400,250,{ quality: 80 });

					next();
			})
		));
	});

// Define default columns in the admin interface and register the model
Featured.defaultColumns = 'title, aboutUs.target, successStory.target, upcomingEvent.target';
Featured.register();