var keystone = require('keystone'),
    Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var FamilyHistory = new keystone.List('Family History', {
    // hidden: true,
    autokey: { path: 'key', from: 'slug', unique: true },
    defaultSort: '-date'
});

// Create fields
FamilyHistory.add({

    family: { type: Types.Relationship, label: 'family', ref: 'Family', required: true, noedit: true, initial: true },
    date: { type: Types.Date, label: 'date', format: 'MM/DD/YYYY', default: Date.now, required: true, noedit: true },
    changes: { type: Types.Textarea, label: 'changes', required: true, noedit: true, initial: true },
    modifiedBy: { type: Types.Relationship, label: 'modified by', ref: 'Admin', required: true, noedit: true, initial: true }

});

// Define default columns in the admin interface and register the model
FamilyHistory.defaultColumns = 'date|10%, changes|65%, modifiedBy|15%';
FamilyHistory.register();
