var keystone = require('keystone'),
    Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var InternalNotes = new keystone.List('Internal Note', {
    autokey: { path: 'key', from: 'slug', unique: true },
    defaultSort: '-date'
});

// Create fields
InternalNotes.add( 'Target', {
    target: { type: Types.Select, label: 'target', options: 'child, family, social worker', initial: true },
    child: { type: Types.Relationship, label: 'child', ref: 'Child', dependsOn: { target: 'child' }, initial: true },
    family: { type: Types.Relationship, label: 'family', ref: 'Family', dependsOn: { target: 'family' }, filters: { isActive: true }, initial: true },
    socialWorker: { type: Types.Relationship, label: 'social worker', ref: 'Social Worker', dependsOn: { target: 'social worker' }, filters: { isActive: true }, initial: true }

}, 'Note Details', {

    date: { type: Types.Date, label: 'note date', format: 'MM/DD/YYYY', default: Date.now, required: true, noedit: true },
    employee: { type: Types.Relationship, label: 'note creator', ref: 'Admin', filters: { isActive: true }, required: true, noedit: true, initial: true },
    note: { type: Types.Textarea, label: 'note', required: true, initial: true }

});

// Define default columns in the admin interface and register the model
InternalNotes.defaultColumns = 'date|15%, note|70%';
InternalNotes.register();