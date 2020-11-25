const keystone	= require( 'keystone' );
const Types		= keystone.Field.Types;

const Mentorship = new keystone.List( 'Mentorship', {
    defaultSort: '-mentorshipDate'
});

// Create fields
Mentorship.add( 'Mentorship', {

	mentorshipDate: { type: Types.Date, inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, required: true, initial: true },
	notes: { type: Types.Textarea, label: 'notes', initial: true }

}, 'Child', {

    child: { type: Types.Relationship, label: 'child', ref: 'Child', initial: true }
    
}, 'Family', {

	family: { type: Types.Relationship, label: 'family', ref: 'Family', initial: true }
});

Mentorship.schema.pre( 'save', function( next ) {
    'use strict';
    
	// trim whitespace characters from any type.Text fields
    this.trimTextFields();
    
    next();
});

/* text fields don't automatically trim(), this is to ensure no leading or trailing whitespace gets saved into url, text, or text area fields */
Mentorship.schema.methods.trimTextFields = function() {

	if( this.get( 'notes' ) ) {
		this.set( 'notes', this.get( 'notes' ).trim() );
	}
};

// Define default columns in the admin interface and register the model
Mentorship.defaultColumns = 'mentorshipDate, child, family';
Mentorship.register();