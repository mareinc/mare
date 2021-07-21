const keystone = require('keystone');
const Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
const RegionalChildCount = new keystone.List( 'Regional Child Count', {
    hidden: true
});

// Create fields
RegionalChildCount.add({

	region:     { type: Types.Text, label: 'region', required: true, initial: true },
    date:       { type: Types.Date, label: 'date', format: 'MM/DD/YYYY', utc: true, required: true, initial: true }

}, 'Child Counts', {

    childCounts: {
        active: { type: Types.Number, label: 'active children', required: true, initial: true },
        onHold: { type: Types.Number, label: 'on-hold children', required: true, initial: true },
        activeAndOnHold: { type: Types.Number, label: 'active and on-hold children', required: true, initial: true },
        total: { type: Types.Number, label: 'total children', required: true, initial: true }
    }

});

// Define default columns in the admin interface and register the model
RegionalChildCount.defaultColumns = 'region, date';
RegionalChildCount.register();