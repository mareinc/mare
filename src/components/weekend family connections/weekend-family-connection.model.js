const keystone	= require( 'keystone' );
const Types		= keystone.Field.Types;

// Create model
const WeekendFamilyConnection = new keystone.List( 'Weekend Family Connection' );

// Create fields
WeekendFamilyConnection.add( 'Weekend Family Connection', {

	wfcDate: { type: Types.Date, label: 'match date', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, required: true, initial: true },

	status: { type: Types.Select, label: 'status', options: 'matched, not matched', required: true, initial: true },
	source: { type: Types.Relationship, label: 'source', ref: 'Source', filters: { isActive: true }, initial: true },
	additionalSources: { type: Types.Relationship, label: 'additional sources', ref: 'Source', filters: { isActive: true }, many: true, initial: true },
	notes: { type: Types.Textarea, label: 'notes', initial: true }

}, 'Child', {

	child: { type: Types.Relationship, label: 'child', ref: 'Child', initial: true, required: true }

}, 'Family', {

	family: { type: Types.Relationship, label: 'family', ref: 'Family', initial: true },
	familyAgency: { type: Types.Relationship, label: `family's agency`, ref: 'Agency', note: 'this will be populated automatically from the family record on save', noedit: true }

});

WeekendFamilyConnection.schema.pre( 'save', function( next ) {
	'use strict';
	// trim whitespace characters from any type.Text fields
	this.trimTextFields();
	// populate the family's agency field if it hasn't already been populated
	const agencyPopulated = this.populateAgency();

	agencyPopulated
		// if there was an error populating the agency
		.catch( err => {
			// log the error for debugging purposes
			console.error( err );
		})
		// if the agency was populated successfully
		.then( () => {
			// pass the flow of control out of this function
			next();
		});
});

/* text fields don't automatically trim(), this is to ensure no leading or trailing whitespace gets saved into url, text, or text area fields */
WeekendFamilyConnection.schema.methods.trimTextFields = function() {

	if( this.get( 'notes' ) ) {
		this.set( 'notes', this.get( 'notes' ).trim() );
	}

};

WeekendFamilyConnection.schema.methods.populateAgency = function() {

	return new Promise( ( resolve, reject ) => {	
		// if the family  has already been selected
		if( this.familyAgency ) {
			// resolve the promise and prevent the rest of the function from executing
			return resolve();
		// if the agency hasn't already been selected
		} else {
			// populate the family Relationship on the model
			this.populate( 'family', err => {
				// if there was an error populating the family field
				if ( err ) {
					// reject the promise with details of the error, preventing the rest of the function from executing
					return reject( new Error( `error populating family field for placement with id ${ this.get( '_id' ) }` ) );
				}
				// if there were no errors and a MARE family has been selected
				if( this.family ) {
					// populate the agency field with the family's social worker's agency
					this.familyAgency = this.family.socialWorkerAgency;
				}
				// resolve the promise
				resolve( this );
			})
		}
	});
};

// Define default columns in the admin interface and register the model
WeekendFamilyConnection.defaultColumns = 'wfcDate, child, family, source';
WeekendFamilyConnection.register();