
/**
 * Created by Adrian Suciu.
 */

const async					= require( 'async' );
const keystone				= require( 'keystone' );
const Types 				= keystone.Field.Types;
const Agency 				= keystone.list( 'Agency' );
const Region				= keystone.list( 'Region' );
const csv2arr				= require( 'csv-to-array' );
const dataMigrationService	= require( '../service_data-migration' );

// id mappings between systems
const statesMap				= require( '../data-migration-maps/state' );
const regionsMap			= require( '../data-migration-maps/region' );

// agency import file
const importFile			= require( '../../../migration-data/csv-data/agency.csv' );
const columns = [ 'agn_id', 'code', 'name', 'address_1', 'address_2', 'city', 'state', 'zip', 'phone', 'fax', 'url', 'rgn_id' ];

/* the import function for agencies */
module.exports.importAgencies = ( req, res, done ) => {
		// create a reference to locals where variables shared across functions will be bound
		let locals = res.locals;
		// fetch all the agency data from the exported csv file
		csv2arr({
			file: importFile,
			columns: columns
		}, ( err, array ) => {

			if( err ) {
				throw `An error occurred!
					   ${ err }`;
			} else {
				locals.importArray = array;


				async.parallel([
					function(done) { statesMap.getStatesMap(req, res, done) } ,
					function(done) { regionsMap.getRegionsMap(req, res, done) }
				], function() {

					for (var i=1,_count=locals.importArray.length; i <_count; i++) {
						var _agency = locals.importArray[i];

						// console.log('#' + i);

						// populate instance for agency object
						var newAgency = new Agency.model({

							code: _agency.code,
							name: _agency.name,

							phone: _agency.phone,
							fax: _agency.fax,

							address: {
								street1: _agency.address_1,
								street2: _agency.address_2,
								city: _agency.city,
								state: locals.statesMap[_agency.state],
								zipCode: _agency.zip,
								region: locals.regionsMap[_agency.rgn_id]
							},

							url: _agency.url,
							generalInquiryContact: _agency.generalInquiryContact

						});


						// console.log('#2');

						// call save method on Child object
						newAgency.save(function(err) {
							// newChild object has been saved
							if (err) {
								console.log('#3');
								throw "[ID#" + _agency.agn_id +"] an error occured while saving " + newAgency + " object."
							}
							else {
								console.log('#4');
								console.log("[ID#" + _agency.agn_id + "] child successfully saved!");
							}
						});
					}

				});
			}	

		});
	}

