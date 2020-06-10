var keystone	= require( 'keystone' ),
Types			= keystone.Field.Types,
Validators		= require( '../../utils/field-validator.controllers' ),
Utils 			= require( '../../utils/model.controllers' );

// create model. Additional options allow menu name to be used what auto-generating URLs
var Legalization = new keystone.List( 'Legalization' );

// create fields
Legalization.add( 'Legalization', {

	legalizationDate: { type: Types.Date, label: 'legalization date', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, initial: true },

	source: { type: Types.Relationship, label: 'source', ref: 'Source', filters: { isActive: true }, initial: true },
	additionalSources: { type: Types.Relationship, label: 'additional sources', ref: 'Source', filters: { isActive: true }, many: true, initial: true },
	notes: { type: Types.Textarea, label: 'notes', initial: true }

}, 'Child', {

	isUnregisteredChild: { type: Types.Boolean, label: 'unregistered child', initial: true },

	child: { type: Types.Relationship, label: 'child', ref: 'Child', dependsOn: { isUnregisteredChild: false }, initial: true },

	childDetails: {
    	firstName: { type: Types.Text, label: 'first name', dependsOn: { isUnregisteredChild: true }, initial: true },
		lastName: { type: Types.Text, label: 'last name', dependsOn: { isUnregisteredChild: true }, initial: true },
		status: { type: Types.Relationship, label: 'status', ref: 'Child Status', dependsOn: { isUnregisteredChild: true }, initial: true }
    }

}, 'Family', {

	isUnregisteredFamily: { type: Types.Boolean, label: 'unregistered family', initial: true },

	family: { type: Types.Relationship, label: 'family', ref: 'Family', dependsOn: { isUnregisteredFamily: false }, initial: true },

	familyDetails: {
		name: { type: Types.Text, label: 'family name', dependsOn: { isUnregisteredFamily: true }, initial: true },

		agency: { type: Types.Relationship, label: `family's agency`, ref: 'Agency', note: 'this will be populated automatically if the family is registered with MARE and nothing has been selected', filters: { isActive: true }, initial: true },
		constellation: { type: Types.Relationship, label: 'constellation', ref: 'Family Constellation', dependsOn: { isUnregisteredFamily: true }, initial: true },
		race: { type: Types.Relationship, label: 'race', ref: 'Race', dependsOn: { isUnregisteredFamily: true }, many: true, initial: true },

		address: {
			street1: { type: Types.Text, label: 'address Line 1', dependsOn: { isUnregisteredFamily: true }, initial: true },
			street2: { type: Types.Text, label: 'address Line 2', dependsOn: { isUnregisteredFamily: true }, initial: true },
			city: { type: Types.Text, label: 'city', dependsOn: { isUnregisteredFamily: true }, initial: true },
			state: { type: Types.Relationship, label: 'state', ref: 'State', dependsOn: { isUnregisteredFamily: true }, initial: true },
			zipCode: { type: Types.Text, label: 'zip code', dependsOn: { isUnregisteredFamily: true }, initial: true, validate: Validators.zipValidator },
			country: { type: Types.Text, label: 'country', dependsOn: { isUnregisteredFamily: true }, initial: true },
			region: { type: Types.Relationship, label: 'region', dependsOn: { isUnregisteredFamily: true }, ref: 'Region', initial: true }
		},

		phone: {
			work: { type: Types.Text, label: 'work phone number', dependsOn: { isUnregisteredFamily: true }, initial: true, validate: Validators.phoneValidator },
			home: { type: Types.Text, label: 'home phone number', dependsOn: { isUnregisteredFamily: true }, initial: true, validate: Validators.phoneValidator },
			mobile: { type: Types.Text, label: 'mobile phone number', dependsOn: { isUnregisteredFamily: true }, initial: true, validate: Validators.phoneValidator },
			preferred: { type: Types.Select, label: 'preferred phone', options: 'work, home, mobile', dependsOn: { isUnregisteredFamily: true }, initial: true }
		},

		email: { type: Types.Email, label: 'email address', dependsOn: { isUnregisteredFamily: true }, initial: true }
	}
});

Legalization.schema.pre( 'save', function( next ) {
	'use strict';
	// trim whitespace characters from any type.Text fields
	this.trimTextFields();

	// define dynamically required fields
	const DYNAMIC_REQUIREMENTS = [
		{
			// if 'isUnregisteredChild' is set to true...
			condition: { path: 'isUnregisteredChild', value: true },
			// treat the following fields as required
			requiredFields: [
				{ path: 'childDetails.firstName', type: 'text' },
				{ path: 'childDetails.lastName', type: 'text' }
			]
		},
		{
			// if 'isUnregisteredChild' is set to false...
			condition: { path: 'isUnregisteredChild', value: false },
			// treat the following fields as required
			requiredFields: [
				{ path: 'child', type: 'relationship-single' }
			]
		}
	];
	// ensure dynamic requirements are met - if not, an Error message will be presented and the save will not occur
	Utils.validateDynamicRequiredFields( this, DYNAMIC_REQUIREMENTS );

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
Legalization.schema.methods.trimTextFields = function() {

	if( this.get( 'notes' ) ) {
		this.set( 'notes', this.get( 'notes' ).trim() );
	}

	if( this.get( 'childDetails.firstName' ) ) {
		this.set( 'childDetails.firstName', this.get( 'childDetails.firstName' ).trim() );
	}

	if( this.get( 'childDetails.lastName' ) ) {
		this.set( 'childDetails.lastName', this.get( 'childDetails.lastName' ).trim() );
	}

	if( this.get( 'familyDetails.name' ) ) {
		this.set( 'familyDetails.name', this.get( 'familyDetails.name' ).trim() );
	}

	if( this.get( 'familyDetails.address.street1' ) ) {
		this.set( 'familyDetails.address.street1', this.get( 'familyDetails.address.street1' ).trim() );
	}

	if( this.get( 'familyDetails.address.street2' ) ) {
		this.set( 'familyDetails.address.street2', this.get( 'familyDetails.address.street2' ).trim() );
	}

	if( this.get( 'familyDetails.address.city' ) ) {
		this.set( 'familyDetails.address.city', this.get( 'familyDetails.address.city' ).trim() );
	}

	if( this.get( 'familyDetails.address.zipCode' ) ) {
		this.set( 'familyDetails.address.zipCode', this.get( 'familyDetails.address.zipCode' ).trim() );
	}

	if( this.get( 'familyDetails.address.country' ) ) {
		this.set( 'familyDetails.address.country', this.get( 'familyDetails.address.country' ).trim() );
	}

	if( this.get( 'familyDetails.phone.work' ) ) {
		this.set( 'familyDetails.phone.work', this.get( 'familyDetails.phone.work' ).trim() );
	}

	if( this.get( 'familyDetails.phone.home' ) ) {
		this.set( 'familyDetails.phone.home', this.get( 'familyDetails.phone.home' ).trim() );
	}

	if( this.get( 'familyDetails.phone.mobile' ) ) {
		this.set( 'familyDetails.phone.mobile', this.get( 'familyDetails.phone.mobile' ).trim() );
	}

	if( this.get( 'familyDetails.email' ) ) {
		this.set( 'familyDetails.email', this.get( 'familyDetails.email' ).trim() );
	}
};

Legalization.schema.methods.populateAgency = function() {

	return new Promise( ( resolve, reject ) => {	
		// if the family is unregistered or an agency has already been selected
		if( this.isUnregisteredFamily || this.familyDetails.agency ) {
			// resolve the promise and prevent the rest of the function from executing
			return resolve();
		// if the family is registered and the agency hasn't already been selected
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
					this.familyDetails.agency = this.family.socialWorkerAgency;
				}
				// resolve the promise
				resolve( this );
			})
		}
	});
};

// Define default columns in the admin interface and register the model
Legalization.defaultColumns = 'legalizationDate, child, family, familyDetails.name, source';
Legalization.register();