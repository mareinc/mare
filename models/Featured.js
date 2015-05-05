var keystone = require('keystone'),
    _ = require('underscore'),
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
    { aboutUsTitle: { type: Types.Text, label: 'title', required: true, initial: true, index: true } },
    { aboutUsSummary: { type: Types.Textarea, label: 'summary', required: true, initial: true } },
    { aboutUsTarget: { type: Types.Relationship, ref: 'Page', label: 'target page', filter: { type: 'aboutUs' }, initial: true } },
      // Need URL field.  Should auto-populate from the selected page

    { heading: 'Success Story' },
    { successStoryTitle: { type: Types.Text, label: 'title', required: true, initial: true, index: true } },
    { successStorySummary: { type: Types.Textarea, label: 'summary', required: true, initial: true } },
    { successStoryTarget: { type: Types.Relationship, ref: 'Page', label: 'target page', filter: { type: 'successStory' }, initial: true } },
      // Need URL field.  Should auto-populate from the selected page

    { heading: 'Upcoming Event' },
    { upcomingEventTitle: { type: Types.Text, label: 'title', required: true, initial: true, index: true } },
    { upcomingEventSummary: { type: Types.Textarea, label: 'summary', required: true, initial: true } },
    { upcomingEventTarget: { type: Types.Relationship, ref: 'Event', label: 'target event', initial: true } }
      // Need URL field.  Should auto-populate from the selected page
);

// Define default columns in the admin interface and register the model
Featured.defaultColumns = 'title, aboutUsTarget, successStoryTarget, upcomingEventTarget';
Featured.register();