const keystone			= require( 'keystone' ),
	  Types				= keystone.Field.Types,
	  random			= require( 'mongoose-simple-random' ),
	  SourceMiddleware	= require( '../routes/middleware/models_source' ),
	  Validators		= require( '../routes/middleware/validators' );

// create model
var ChildMatchingHistory = new keystone.List( 'Child Matching History', {
	autokey: { path: 'key', from: 'slug', unique: true },
    defaultSort: '-date'
});

// create fields
ChildMatchingHistory.add( 'General Information', {
	
	registrationNumber: { type: Types.Text, label: 'child registration number', required: true, initial: true },
	family: { type: Types.Relationship, label: 'family', ref: 'Family', many: false, initial: true },
	child: { type: Types.Relationship, label: 'child', ref: 'Child', many: false, initial: true },
	createdBy: { type: Types.Relationship, label: 'created by', ref: 'Admin', required: true, noedit: true, initial: true },
	homestudySent: { type: Types.Boolean, label: 'homestudy sent', default: false, initial: true },
	notes: { type: Types.Textarea, label: 'notes', initial: true },
	date: { type: Types.Date, label: 'date', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: Date.now, utc: true, required: true, noedit: true }
	
});

// define default columns in the admin interface and register the model
ChildMatchingHistory.defaultColumns = 'child,family,homestudySent|10%,notes|40%,date|15%';
ChildMatchingHistory.register();
