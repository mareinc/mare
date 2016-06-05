var keystone = require('keystone'),
    Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var InternalNotes = new keystone.List('Internal Note', {
    track: true,
    autokey: { path: 'key', from: 'slug', unique: true },
    defaultSort: 'date'
});

// Create fields
InternalNotes.add( 'Target', {

    child: { type: Types.Relationship, label: 'child', ref: 'Child', initial: true, },
    family: { type: Types.Relationship, label: 'family', ref: 'Family', initial: true },
    socialWorker: { type: Types.Relationship, label: 'social worker', ref: 'Social Worker', initial: true }

}, 'Note Details', {

    date: { type: Types.Date, label: 'note date', format: 'MM/DD/YYYY', required: true, noedit: true, initial: true, },
    employee: { type: Types.Relationship, label: 'note creator', ref: 'Admin', required: true, noedit: true, initial: true, },
    note: { type: Types.Textarea, label: 'note', required: true, initial: true, }

});

// Define default columns in the admin interface and register the model
InternalNotes.defaultColumns = 'date, note';
InternalNotes.register();