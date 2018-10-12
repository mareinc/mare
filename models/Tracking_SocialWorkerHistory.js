var keystone = require('keystone'),
    Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var SocialWorkerHistory = new keystone.List('Social Worker History', {
    // hidden: true,
    autokey: { path: 'key', from: 'slug', unique: true },
    defaultSort: '-date'
});

// Create fields
SocialWorkerHistory.add({

    socialWorker: { type: Types.Relationship, label: 'social worker', ref: 'Social Worker', required: true, noedit: true, initial: true },
    date: { type: Types.Date, label: 'date', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', utc: true, default: Date.now, required: true, noedit: true },
    summary: { type: Types.Text, label: 'summary of changes', noedit: true, initial: false },
    changes: { type: Types.Html, label: 'changes', wysiwyg: true, noedit: true, initial: false },
    modifiedBy: { type: Types.Relationship, label: 'modified by', ref: 'Admin', required: true, noedit: true, initial: true }

});

// Define default columns in the admin interface and register the model
SocialWorkerHistory.defaultColumns = 'date|10%, summary|65%, modifiedBy|15%';
SocialWorkerHistory.register();
