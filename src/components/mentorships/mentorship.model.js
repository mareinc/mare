const keystone	= require( 'keystone' );
const Types		= keystone.Field.Types;

const Mentorship = new keystone.List( 'Mentorship', {
    defaultSort: '-mentorshipDate'
});

// Create fields
Mentorship.add( 'Mentorship', {

	mentorshipDate: { type: Types.Date, label: 'date of match', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, required: true, initial: true },
	notes: { type: Types.Textarea, label: 'notes', initial: true }

}, 'Mentor', {

    mentor: { type: Types.Relationship, label: 'mentor family', ref: 'Family', initial: true, required: true }
    
}, 'Mentee', {

	mentee: { type: Types.Relationship, label: 'mentee family', ref: 'Family', initial: true, required: true }
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
Mentorship.defaultColumns = 'mentorshipDate, mentor, mentee';
Mentorship.register();