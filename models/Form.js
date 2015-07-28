var keystone = require('keystone'),
    Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var Form = new keystone.List('Form', {
    track: true,
    autokey: { path: 'key', from: 'title', unique: true },
    map: { name: 'title' }
});

// Create fields
Form.add({
    title: { type: String, label: 'form name', required: true, initial: true, index: true },
    url: { type: Types.Url, noedit: true },
    contact: { type: Types.Relationship, ref: 'User', label: 'contact person', initial: true, dependsOn: { selectUnregisteredContact: false } },
    selectUnregisteredContact: { type: Types.Boolean, label: 'contact person isn\'t registered with MARE', initial: true },
    unregisteredContact: { type: String, label: 'contact person\'s email', dependsOn: { selectUnregisteredContact: true } },
    selectFormRange: { type: Types.Boolean, label: 'form valid for specific time range', initial: true },
    availableFrom: { type: Types.Datetime, label: 'available from', initial: true, dependsOn: { selectFormRange: true } },
    availableTo: { type: Types.Datetime, label: 'available to', initial: true, dependsOn: { selectFormRange: true } },
    content: { type: Types.Html, wysiwyg: true, initial: true },
    graphic: { type: Types.CloudinaryImage, folder: 'forms/', autoCleanup : true }
});

// Pre Save
Form.schema.pre('save', function(next) {
    'use strict';

    this.url = '/forms/' + this.key;
    next();
});

// Define default columns in the admin interface and register the model
Form.defaultColumns = 'title, url, contact, starts, ends';
Form.register();