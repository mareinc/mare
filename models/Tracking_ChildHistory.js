var keystone = require('keystone'),
    Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var ChildHistory = new keystone.List('Child History', {
    // hidden: true
    autokey: { path: 'key', from: 'slug', unique: true },
    defaultSort: '-date'
});

// Create fields
ChildHistory.add({

    child: { type: Types.Relationship, label: 'child', ref: 'Child', required: true, noedit: true, initial: true },
    date: { type: Types.Date, label: 'date', format: 'MM/DD/YYYY', default: Date.now, required: true, noedit: true },
    changes: { type: Types.Textarea, label: 'changes', required: true, noedit: true, initial: true },
    modifiedBy: { type: Types.Relationship, label: 'modified by', ref: 'Admin', required: true, noedit: true, initial: true }

});

// Define default columns in the admin interface and register the model
ChildHistory.defaultColumns = 'date|10%, changes|65%, modifiedBy|15%';
ChildHistory.register();
