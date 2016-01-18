var keystone = require('keystone'),
    Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var InternalNotes = new keystone.List('Internal Notes', {
    track: true,
    autokey: { path: 'key', from: 'noteId', unique: true },
    map: { name: 'noteId' }
});

// Create fields
InternalNotes.add({

    noteId: { type: Types.Number, label: 'note ID', required: true, initial: true, noedit: true },
    child: { type: Types.Relationship, label: 'child', ref: 'User', required: true, initial: true, noedit: true },
    date: { type: Types.Text, label: 'note date', note: 'mm/dd/yyyy', required: true, initial: true, noedit: true },
    employee: { type: Types.Relationship, label: 'note creator', ref: 'User', required: true, initial: true, noedit: true },
    note: { type: Types.Textarea, label: 'note', required: true, initial: true, noedit: true }

});

// Pre Save
InternalNotes.schema.pre('save', function(next) {
    'use strict';

    // generate an internal ID based on the current highest internal ID
    // get the employee who is currently logged in and save ID to employee

    // TODO: Assign a registration number if one isn't assigned
    next();
});

// Define default columns in the admin interface and register the model
InternalNotes.defaultColumns = 'noteId, date, employee';
InternalNotes.register();