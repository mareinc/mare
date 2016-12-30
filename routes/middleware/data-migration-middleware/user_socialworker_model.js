/**
 * Created by Adrian Suciu.
 */

var async					= require('async'),
	keystone				= require('keystone'),
	Types 					= keystone.Field.Types,
	Agency					= keystone.list('Agency'),
	SocialWorker   			= keystone.list('Social Worker'),
	dataMigrationService	= require('../service_data-migration'),
	statesMap				= require('../data-migration-maps/state'),
	agencyMap				= require('../data-migration-maps/agency');

// migration file location
const csvFilePath = './migration-data/csv-data/agency_contact.csv';
const csv = require( 'csvtojson' );

module.exports.importSocialWorker = (req, res, done) => {

    let locals = res.locals,
		socialWorkers = [];

		async.parallel([
			done => { statesMap.getStatesMap(req, res, done) }
			// done => { agencyMap.mapAgencyIds(req, res, done) }
		], function() {

			let remainingRecords = 0;

			csv().fromFile( csvFilePath )
				.on( 'json', ( socialWorker, index ) => {	// this will fire once per row of data in the file
					// increment the counter keeping track of how many records we still need to process
					remainingRecords++;

					Agency.model.findOne()
						.where( 'oldId', socialWorker.agn_id )
						.exec()
						.then( agency => {
							// populate instance for SocialWorker object
							let newSocialWorker = new SocialWorker.model({

								password: `${ socialWorker.first_name }_${ socialWorker.last_name }_${ socialWorker.agc_id }`,

								permissions: {
									isVerified: true,
									isActive: socialWorker.is_active === 'Y' ? true : false
								},

								name: {
									first: socialWorker.first_name,
									last: socialWorker.last_name
								},

							email: socialWorker.email.toLowerCase() || `placeholder${ socialWorker.agc_id }@email.com`,

								phone: {
									work: socialWorker.phone
								},

								agency: agency._id,
								
								address: {
									street1: agency.address.street1,
									street2: agency.address.street2,
									city: agency.address.city,
									state: agency.address.state,
									zipCode: agency.address.zipCode,
									region: agency.address.region
								},

								notes: socialWorker.notes,
								oldId: socialWorker.agc_id
							});


							newSocialWorker.save(function( err ) {
								if( err ) {
									console.log( `[ID#${ socialWorker.agc_id }] an error occured while saving ${ socialWorker.first_name } ${ socialWorker.last_name }.` );
								} else {
									console.log( `[ID#${ socialWorker.agc_id }] ${ socialWorker.first_name } ${ socialWorker.last_name } successfully saved!` );
								}

								// decrement the counter keeping track of how many records we still need to process
								remainingRecords--;
								// if there are no more records to process call done to move to the next migration file
								if( remainingRecords === 0 ) {
									done();
								}
							});
						})
				})
				.on( 'end', () => {
					console.log( `end` ); // this should never execute but should stay for better debugging
				});
		});
}
