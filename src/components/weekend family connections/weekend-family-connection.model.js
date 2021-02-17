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

	child: { type: Types.Relationship, label: 'child', ref: 'Child', initial: true, required: true },
	
	// these props are a shim to allow WFC to be compatible with Placement Reporting
	childDetails: {
    	firstName: { type: Types.Text, label: 'first name', default: 'shim', hidden: true },
		lastName: { type: Types.Text, label: 'last name', hidden: true },
		status: { type: Types.Relationship, label: 'status', ref: 'Child Status', hidden: true }
	}

}, 'Family', {

	family: { type: Types.Relationship, label: 'family', ref: 'Family', initial: true },
	familyAgency: { type: Types.Relationship, label: `family's agency`, ref: 'Agency', note: 'this will be populated automatically from the family record on save', noedit: true },

	// these props are a shim to allow WFC to be compatible with Placement Reporting
	familyDetails: {
		name: { type: Types.Text, label: 'family name', default: 'shim', hidden: true },

		agency: { type: Types.Relationship, label: `family's agency`, ref: 'Agency', hidden: true },
		constellation: { type: Types.Relationship, label: 'constellation', ref: 'Family Constellation', hidden: true },
		race: { type: Types.Relationship, label: 'race', ref: 'Race', hidden: true },

		address: {
			street1: { type: Types.Text, label: 'address Line 1', hidden: true },
			street2: { type: Types.Text, label: 'address Line 2', hidden: true },
			city: { type: Types.Text, label: 'city', hidden: true },
			state: { type: Types.Relationship, label: 'state', ref: 'State', hidden: true },
			zipCode: { type: Types.Text, label: 'zip code', hidden: true },
			country: { type: Types.Text, label: 'country', hidden: true },
			region: { type: Types.Relationship, label: 'region', ref: 'Region', hidden: true }
		},

		phone: {
			work: { type: Types.Text, label: 'work phone number', hidden: true },
			home: { type: Types.Text, label: 'home phone number', hidden: true },
			mobile: { type: Types.Text, label: 'mobile phone number', hidden: true },
			preferred: { type: Types.Select, label: 'preferred phone', options: 'work, home, mobile', hidden: true }
		},

		email: { type: Types.Email, label: 'email address', hidden: true }
	}
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