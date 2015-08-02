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

	{ heading: 'About Us' },
	{ aboutUsTarget: { type: Types.Relationship, ref: 'Page', label: 'target page', filter: { type: 'aboutUs' }, initial: true } },
	{ aboutUsTitle: { type: Types.Text, label: 'title', noedit: true, index: true } },
	{ aboutUsSummary: { type: Types.Textarea, label: 'summary', noedit: true } },
	{ aboutUsUrl: { type: Types.Url, noedit: true } },

	{ heading: 'Success Story' },
	{ successStoryTarget: { type: Types.Relationship, ref: 'SuccessStory', label: 'target page', filter: { type: 'successStory' }, initial: true } },
	{ successStoryTitle: { type: Types.Text, label: 'title', noedit: true, index: true } },
	{ successStorySummary: { type: Types.Textarea, label: 'summary', noedit: true } },
	{ successStoryUrl: { type: Types.Url, noedit: true } },

	{ heading: 'Upcoming Event' },
	{ upcomingEventTarget: { type: Types.Relationship, ref: 'Event', label: 'target event', initial: true } },
	{ upcomingEventTitle: { type: Types.Text, label: 'title', noedit: true, index: true } },
	{ upcomingEventSummary: { type: Types.Textarea, label: 'summary', noedit: true } },
	{ upcomingEventUrl: { type: Types.Url, noedit: true } }
);

// Pre Save
Featured.schema.pre('save', function(next) {
	'use strict';
	
	// keystone.list('Page').model.find()
	//         .where('_id', this.aboutUs);

	// keystone.list('SuccessStory').find()
	//         .where('_id', this.successStory);

	// keystone.list('Event').model.find()
	//         .where('_id', this.upcomingEvent);

	// this.aboutUsTitle = aboutUs.title;
	// this.successStoryTitle = successStory.title;
	// this.upcomingEventTitle = upcomingEvent.title;

	// // These need to truncate to 250 characters (to the nearest word)
	// // These should append an elipses if the summary was truncated
	// this.aboutUsSummary = aboutUs.content;
	// this.successStorySummary = successStory.content;
	// this.upcomingEventSummary = upcomingEvent.description;

	// this.aboutUsUrl = aboutUs.url;
	// this.successStoryUrl = successStory.url;
	// this.upcomingEventUrl = upcomingEvent.url;

	next();
});

// Define default columns in the admin interface and register the model
Featured.defaultColumns = 'title, aboutUsTarget, successStoryTarget, upcomingEventTarget';
Featured.register();