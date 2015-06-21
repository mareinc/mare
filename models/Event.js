var keystone = require('keystone'),
    _ = require('underscore'),
    Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var Event = new keystone.List('Event', {
    track: true,
    autokey: { path: 'key', from: 'title', unique: true },
    map: { name: 'title' }
});

// Create fields
Event.add({
    title: { type: String, label: 'event name', required: true, initial: true, index: true },
    url: { type: Types.Url, noedit: true },
    location: { type: Types.Location, initial: true },
    starts: { type: Types.Datetime, default: Date.now, initial: true },
    ends: { type: Types.Datetime, initial: true },
    description: { type: Types.Html, wysiwyg: true, initial: true },
    graphic: { type: Types.CloudinaryImage, folder: 'events/', autoCleanup : true }
    //contact: { type: Types.Relationship, label: 'contact person', ref: 'Contact'}
});

// Pre Save
Event.schema.pre('save', function(next) {
    this.url = '/events/' + this.key;
    next();
});

// Define default columns in the admin interface and register the model
Event.defaultColumns = 'title, url, starts, ends';
Event.register();