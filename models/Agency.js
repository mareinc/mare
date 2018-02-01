const keystone				= require( 'keystone' ),
	  Types					= keystone.Field.Types,
	  ListServiceMiddleware	= require( '../routes/middleware/service_lists' );

// create model
var Agency = new keystone.List('Agency', {
	autokey: { path: 'key', from: 'code', unique: true },
	map: { name: 'code' }
});

// create fields
Agency.add({

	isActive: { type: Boolean, label: 'is active', default: true },

	code: { type: Types.Text, label: 'agency code', required: true, initial: true },
	name: { type: Types.Text, label: 'agency name', required: true, initial: true },

	phone: { type: Types.Text, label: 'phone number', initial: true },
	fax: { type: Types.Text, label: 'fax number', initial: true },

	address: {
		street1: { type: Types.Text, label: 'street 1', initial: true },
		street2: { type: Types.Text, label: 'street 2', initial: true },
		isOutsideMassachusetts: { type: Types.Boolean, label: 'is outside Massachusetts', initial: true },
		city: { type: Types.Relationship, label: 'city/town', ref: 'City or Town', dependsOn: { 'address.isOutsideMassachusetts': false }, initial: true },
		cityText: { type: Types.Text, label: 'city/town', dependsOn: { 'address.isOutsideMassachusetts': true }, initial: true },
		state: { type: Types.Relationship, label: 'state', ref: 'State', initial: true },
		zipCode: { type: Types.Text, label: 'zip code', initial: true },
		region: { type: Types.Relationship, label: 'region', ref: 'Region', noedit: true }
	},

	url: { type: Types.Text, label: 'agency url', initial: true },
	MAREgeneralInquiryContact: { type: Types.Boolean, label: 'is agency contact in the MARE system', default: true, initial: true },
	generalInquiryContact: { type: Types.Relationship, label: 'general inquiry contact', ref: 'Social Worker', dependsOn: { MAREgeneralInquiryContact: true }, filters: { isActive: true }, initial: true },
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
	// attempt to update the no-edit region field
	this.updateRegion()
		.then( () => {
			next();
		})
		.catch( err => {
			console.error( `errors saving agency ${ this.code }: ${ err }` );

			next();
		});
});

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
					reject( `region could not be updated - ${ err }` );
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
					reject( `region could not be updated - ${ err }` );
				});
		}
	});
};

// Define default columns in the admin interface and register the model
Agency.defaultColumns = 'code, name, phone';
Agency.register();