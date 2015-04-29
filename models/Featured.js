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
Featured.add({
    title: { type: Types.Text, required: true, initial: true, index: true },
    summary: { type: Types.Textarea, required: true, initial: true },
    url: { type: Types.Url, noedit: true },
    isEvent: { type: Types.Boolean, label: 'is an event', initial: true },
    eventReference: { type: Types.Relationship, label: 'event', ref: 'Event', many: false, dependsOn: { isEvent: true }, initial: true },
    pageReference: { type: Types.Relationship, label: 'page', ref: 'Page', many: false, dependsOn: { isEvent: false }, initial: true },
    image: { type: Types.CloudinaryImage }
});

// Pre Save
Featured.schema.pre('save', function(next) {
    this.url = this.isEvent ? this.eventReference.url : this.pageReference.url;
    next();
});

// Define default columns in the admin interface and register the model
Featured.defaultColumns = 'title, summary, url, image';
Featured.register();