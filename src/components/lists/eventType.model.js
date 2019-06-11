var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var EventType = new keystone.List('Event Type', {
	autokey: { path: 'key', from: 'eventType', unique: true },
	map: { name: 'eventType' }
});

// Create fields
EventType.add({

	eventType: { type: Types.Text, label: 'event type', required: true, initial: true },
	availableOnWebsite: { type: Types.Boolean, label: 'available on website', note: 'this affects the event submission form', initial: true }

});

// Define default columns in the admin interface and register the model
EventType.defaultColumns = 'eventType';
EventType.register();