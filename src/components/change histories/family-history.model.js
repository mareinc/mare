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
    date: { type: Types.Date, label: 'date', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: Date.now, utc: true, required: true, noedit: true },
    summary: { type: Types.Text, label: 'summary of changes', noedit: true, initial: false },
    changes: { type: Types.Html, label: 'changes', wysiwyg: true, noedit: true, initial: false },
    modifiedBy: { type: Types.Relationship, label: 'modified by', ref: 'Admin', required: true, noedit: true, initial: true }

});

// Define default columns in the admin interface and register the model
FamilyHistory.defaultColumns = 'date|20%, summary|55%, modifiedBy|15%';
FamilyHistory.register();
