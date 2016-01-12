var keystone = require('keystone'),
    Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var ChildHistory = new keystone.List('Child History', {
    autokey: { path: 'key', from: 'field', unique: true },
    map: { name: 'field' }
});

// Create fields
ChildHistory.add({
    date: { type: Types.Text, label: 'Date', note: 'mm/dd/yyyy', required: true, initial: true, noedit: true },
    field: { type: Types.Text, label: 'Field', required: true, initial: true, noedit: true },
    previousValue: { type: Types.Text, label: 'Previous Value', required: true, initial: true, noedit: true },
    newValue: { type: Types.Text, label: 'New Value', required: true, initial: true, noedit: true },
    modifiedBy: { type: Types.Relationship, label: 'Modified By', ref: 'User', required: true, initial: true, noedit: true }
});

// Define default columns in the admin interface and register the model
ChildHistory.defaultColumns = 'field, previousValue, newValue, modifiedBy';
ChildHistory.register();