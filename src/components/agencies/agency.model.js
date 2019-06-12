const keystone				= require( 'keystone' ),
	  Types					= keystone.Field.Types,
	  ListServiceMiddleware	= require( '../../components/lists/list.controllers' ),
	  Validators			= require( '../../routes/middleware/validators' );

// create model
var Agency = new keystone.List('Agency', {
	autokey: { path: 'key', from: 'code', unique: true },
	map: { name: 'code' }
});

// create fields
Agency.add({

	isActive: { type: Boolean, label: 'is active' },

	code: { type: Types.Text, label: 'agency code', required: true, initial: true },
	name: { type: Types.Text, label: 'agency name', required: true, initial: true },

	phone: { type: Types.Text, label: 'phone number', initial: true, validate: Validators.phoneValidator },
	fax: { type: Types.Text, label: 'fax number', initial: true },

	address: {
		street1: { type: Types.Text, label: 'street 1', initial: true },
		street2: { type: Types.Text, label: 'street 2', initial: true },
		isOutsideMassachusetts: { type: Types.Boolean, label: 'is outside Massachusetts', initial: true },
		city: { type: Types.Relationship, label: 'city/town', ref: 'City or Town', dependsOn: { 'address.isOutsideMassachusetts': false }, initial: true },
		cityText: { type: Types.Text, label: 'city/town', dependsOn: { 'address.isOutsideMassachusetts': true }, initial: true },
		state: { type: Types.Relationship, label: 'state', ref: 'State', initial: true },
		zipCode: { type: Types.Text, label: 'zip code', initial: true, validate: Validators.zipValidator },
		region: { type: Types.Relationship, label: 'region', ref: 'Region', noedit: true }
	},

	url: { type: Types.Text, label: 'agency url', initial: true },
	MAREgeneralInquiryContact: { type: Types.Boolean, label: 'is agency contact in the MARE system', initial: true },
	generalInquiryContact: { type: Types.Relationship, label: 'general inquiry contact', ref: 'Social Worker', dependsOn: { MAREgeneralInquiryContact: true }, initial: true },
	generalInquiryContactText: { type: Types.Email, label: 'general inquiry contact email', dependsOn: { MAREgeneralInquiryContact: false }, initial: true }

/* container for data migration fields ( these should be kept until after phase 2 and the old system is phased out completely ) */
}, {
	// system field to store an appropriate file prefix
	oldId: { type: Types.Text, hidden: true }

});

// set up relationship values to show up at the bottom of the model if any exist
// TODO: set up a relationship for Social Workers as agency contacts.  This doesn't seem to work as Social Worker extends User
Agency.relationship({ ref: 'Inquiry', refPath: 'agency', path: 'agency', label: 'inquries' });
Agency.relationship({ ref: 'Inquiry', refPath: 'agencyReferral', path: 'agencyReferral', label: 'agency referral inquiries' });

// pre-save
Agency.schema.pre( 'save', function( next ) {
	'use strict';
	// trim whitespace characters from any type.Text fields
	this.trimTextFields();
	// attempt to update the no-edit region field
	this.updateRegion()
		.then( () => {
			next();
		})
		.catch( err => {
			console.error( `errors saving agency ${ this.code }`, err );

			next();
		});
});

/* text fields don't automatically trim(), this is to ensure no leading or trailing whitespace gets saved into url, text, or text area fields */
Agency.schema.methods.trimTextFields = function() {

	if( this.get( 'code' ) ) {
		this.set( 'code', this.get( 'code' ).trim() );
	}

	if( this.get( 'name' ) ) {
		this.set( 'name', this.get( 'name' ).trim() );
	}

	if( this.get( 'phone' ) ) {
		this.set( 'phone', this.get( 'phone' ).trim() );
	}

	if( this.get( 'fax' ) ) {
		this.set( 'fax', this.get( 'fax' ).trim() );
	}

	if( this.get( 'street1' ) ) {
		this.set( 'street1', this.get( 'street1' ).trim() );
	}

	if( this.get( 'street2' ) ) {
		this.set( 'street2', this.get( 'street2' ).trim() );
	}

	if( this.get( 'cityText' ) ) {
		this.set( 'cityText', this.get( 'cityText' ).trim() );
	}

	if( this.get( 'zipCode' ) ) {
		this.set( 'zipCode', this.get( 'zipCode' ).trim() );
	}

	if( this.get( 'url' ) ) {
		this.set( 'url', this.get( 'url' ).trim() );
	}
};

Agency.schema.methods.updateRegion = function() {
	'use strict';

	return new Promise( ( resolve, reject ) => {
		// if the agency is outside MA
		if( this.address.isOutsideMassachusetts ) {
			// fetch the region model with the name 'out of state'
			const fetchRegion = ListServiceMiddleware.getRegionByName( 'Out of state' );
			// if the region was fetched without error
			fetchRegion
				.then( region => {
					// update the region field for the agency
					this.address.region = region;
					// resolve the promise
					resolve();
				})
				// if there was an error fetching the region
				.catch( err => {
					// reject the promise with the error
					reject( new Error( `region could not be updated` ) );
				});
		// otherwise, if the agency is in MA
		} else {
			// fetch the city or town model saved for the agency
			const fetchCityOrTown = ListServiceMiddleware.getCityOrTownById( this.address.city );
			// if the city or town was fetched without error
			fetchCityOrTown
				.then( cityOrTown => {
					// update the region field for the agency
					this.address.region = cityOrTown.region;
					// resolve the promise
					resolve();
				})
				// if there was an error fetching the city or town
				.catch( err => {
					// reject the promise with the error
					reject( new Error( `region could not be updated` ) );
				});
		}
	});
};

// Define default columns in the admin interface and register the model
Agency.defaultColumns = 'code, name, phone';
Agency.register();