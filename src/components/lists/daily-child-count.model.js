const keystone = require('keystone');
const Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
const DailyChildCount = new keystone.List( 'Daily Child Count', {
    hidden: true
});

// Create fields
DailyChildCount.add({
    
    date:                   { type: Types.Date, label: 'date', format: 'MM/DD/YYYY', utc: true, reuqired: true, initial: true },
    regionalCounts:         { type: Types.Relationship, many: true, ref: 'Regional Child Count', requied: true, initial: true },
    totalActiveProfiles:    { type: Types.Number, label: 'total children active on website', required: true, initial: true }    

});

// Define default columns in the admin interface and register the model
DailyChildCount.defaultColumns = 'date, totalActiveProfiles';
DailyChildCount.register();