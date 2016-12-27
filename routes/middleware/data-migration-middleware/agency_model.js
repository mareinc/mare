
/**
 * Created by Adrian Suciu.
 */

const async					= require( 'async' );
const keystone				= require( 'keystone' );
const Types 				= keystone.Field.Types;
const Agency 				= keystone.list( 'Agency' );
const Region				= keystone.list( 'Region' );
const dataMigrationService	= require( '../service_data-migration' );

// id mappings between systems
const statesMap				= require( '../data-migration-maps/state' );
const regionsMap			= require( '../data-migration-maps/region' );

// agency import file
const columns = [ 'agn_id', 'code', 'name', 'address_1', 'address_2', 'city', 'state', 'zip', 'phone', 'fax', 'url', 'rgn_id' ];

//Converter Class 
var Converter = require("csvtojson").Converter;
var converter = new Converter({});

/* the import function for agencies */
module.exports.importAgencies = ( req, res, done ) => {
		// create a reference to locals where variables shared across functions will be bound
		let locals = res.locals;

		converter.fromFile("./migration-data/csv-data/agency.csv",function(err,array){

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
						let _agency = locals.importArray[i];
						
						// 1002 is the id from region.csv for "others" and 1007 is for "out of state"
						let _region = locals.regionsMap[_agency.rgn_id] ? locals.regionsMap[_agency.rgn_id] : _agency.state === 'MA' ? locals.regionsMap[1002] : locals.regionsMap[1007] 

						let newAgency = new Agency.model({

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
								region: _region
							},

							url: _agency.url,
							generalInquiryContact: _agency.generalInquiryContact

						});

						newAgency.save(function(err) {
							if (err) {
								console.log('#3');
								console.log("[ID#" + _agency.agn_id +"] an error occured while saving " + newAgency + " object.");
								throw "[ID#" + _agency.agn_id +"] an error occured while saving " + newAgency + " object."
							}
							else {
								console.log('#4');
								console.log("[ID#" + _agency.agn_id + "] child successfully saved!");
							}
						});
					}

					console.log('Execution Finished?!');

				});
			}	

		});
	}


