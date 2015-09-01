var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var Featured = new keystone.List('Featured Item', {
	track: true,
	autokey: { path: 'key', from: 'title', unique: true },
	map: { name: 'title' }
});

// Create fields
Featured.add(
	{ title: { type: Types.Text, default: 'Featured Items', noedit: true, initial: true } },

	{ heading: 'About Us' }, {
		aboutUsTarget: { type: Types.Relationship, ref: 'Page', label: 'target page', filter: { type: 'aboutUs' }, required: true, initial: true },
		aboutUsTitle: { type: Types.Text, label: 'title', noedit: true, index: true },
		aboutUsSummary: { type: Types.Textarea, label: 'summary', noedit: true },
		aboutUsImage: { type: Types.CloudinaryImage, folder: 'featured/', autoCleanup: true },
		aboutUsImage_stretched: {type: Types.Url, hidden: true},
		aboutUsImage_scaled: {type: Types.Url, hidden: true},
		aboutUsUrl: { type: Types.Url, noedit: true } },

	{ heading: 'Success Story' }, {
		successStoryTarget: { type: Types.Relationship, ref: 'SuccessStory', label: 'target page', filter: { type: 'successStory' }, required: true, initial: true },
		successStoryTitle: { type: Types.Text, label: 'title', noedit: true, index: true },
		successStorySummary: { type: Types.Textarea, label: 'summary', noedit: true },
		successStoryImage: { type: Types.CloudinaryImage, folder: 'featured/', autoCleanup: true },
		successStoryImage_stretched: {type: Types.Url, hidden: true},
		successStoryImage_scaled: {type: Types.Url, hidden: true},
		successStoryUrl: { type: Types.Url, noedit: true } },

	{ heading: 'Upcoming Event' }, {
		upcomingEventTarget: { type: Types.Relationship, ref: 'Event', label: 'target event', required: true, initial: true },
		upcomingEventTitle: { type: Types.Text, label: 'title', noedit: true, index: true },
		upcomingEventSummary: { type: Types.Textarea, label: 'summary', noedit: true },
		upcomingEventImage: { type: Types.CloudinaryImage, folder: 'featured/', autoCleanup: true },
		upcomingEventImage_stretched: {type: Types.Url, hidden: true},
		upcomingEventImage_scaled: {type: Types.Url, hidden: true},
		upcomingEventUrl: { type: Types.Url, noedit: true } }
);

// Pre Save
Featured.schema.pre('save', function(next) {
	'use strict';

	var self = this;

	// TODO: These need to truncate to 250 characters (to the nearest word)
	// TODO: These should append an elipses if the summary was truncated
	keystone.list('Page').model.find()
			.where('_id', this.aboutUsTarget)
			.exec()
			.then(function(page) {

					self.aboutUsTitle = page[0].title;
					self.aboutUsSummary = page[0].content.replace(/<\/?[^>]+(>|$)/g, '');
					self.aboutUsUrl = page[0].url;
					self.aboutUsImage_stretched = self._.aboutUsImage.scale(400,250,{ quality: 80 });
					self.aboutUsImage_scaled = self._.aboutUsImage.thumbnail(400,250,{ quality: 80 });

			}, function(err) {
				console.log(err);
			}).then(keystone.list('SuccessStory').model.find()
				.where('_id', this.successStoryTarget)
				.exec()
				.then(function(successStory) {

		       		self.successStoryTitle = successStory[0].heading;
		       		self.successStorySummary = successStory[0].content.replace(/<\/?[^>]+(>|$)/g, '');
		       		self.successStoryUrl = '/success-stories/';
		       		self.successStoryImage_stretched = self._.successStoryImage.scale(400,250,{ quality: 80 });
					self.successStoryImage_scaled = self._.successStoryImage.thumbnail(400,250,{ quality: 80 });

			}, function(err) {
				console.log(err);
			}).then(keystone.list('Event').model.find()
				.where('_id', this.upcomingEventTarget)
				.exec()
				.then(function(event) {

					self.upcomingEventTitle = event[0].title;
					self.upcomingEventSummary = event[0].description.replace(/<\/?[^>]+(>|$)/g, '');
					self.upcomingEventUrl = event[0].url;
					self.upcomingEventImage_stretched = self._.upcomingEventImage.scale(400,250,{ quality: 80 });
					self.upcomingEventImage_scaled = self._.upcomingEventImage.thumbnail(400,250,{ quality: 80 });

					next();

					console.log(self.aboutUsImage_stretched);
					console.log(self.aboutUsImage_scaled);
					console.log(self.successStoryImage_stretched);
					console.log(self.successStoryImage_scaled);
					console.log(self.upcomingEventImage_stretched);
					console.log(self.upcomingEventImage_scaled);
			})
		));
	});

// Define default columns in the admin interface and register the model
Featured.defaultColumns = 'title, aboutUsTarget, successStoryTarget, upcomingEventTarget';
Featured.register();