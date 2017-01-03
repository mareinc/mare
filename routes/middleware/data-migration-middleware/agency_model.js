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

// [ 'agn_id', 'code', 'name', 'address_1', 'address_2', 'city', 'state', 'zip', 'phone', 'fax', 'url', 'rgn_id' ];

// migration file location
const csvFilePath = './migration-data/csv-data/agency.csv';
const csv = require( 'csvtojson' );

/* the import function for agencies */
module.exports.importAgencies = ( req, res, done ) => {
	// create a reference to locals where variables shared across functions will be bound
	let locals = res.locals;

	async.parallel([
		function( done ) { statesMap.getStatesMap( req, res, done ) } ,
		function( done ) { regionsMap.getRegionsMap( req, res, done ) }
	], function() {

		let remainingRecords = 0;

		csv().fromFile( csvFilePath )
			.on( 'json', ( agency, index ) => {	// this will fire once per row of data in the file
				// increment the counter keeping track of how many records we still need to process
				remainingRecords++;
				
				// 1002 is the id from region.csv for "others" and 1007 is for "out of state"
				let region = locals.regionsMap[ agency.rgn_id ] ?	// if the region is an expected value
							 locals.regionsMap[ agency.rgn_id ] :	// use the id from the old system to get the id in the new system
							 agency.state === 'MA' ?				// otherwise, if the state is Massachusetts
							 locals.regionsMap[ 1002 ] :			// set the region to 'others'
							 locals.regionsMap[ 1007 ] 				// if the state is not Massachusetts, set the region to 'out of state'

				let newAgency = new Agency.model({

					oldId: agency.agn_id,
					code: agency.code,
					name: agency.name,

					phone: agency.phone,
					fax: agency.fax,

					address: {
						street1: agency.address_1,
						street2: agency.address_2,
						city: agency.city,
						state: locals.statesMap[ agency.state ],
						zipCode: (agency.zip.length > 4) ? agency.zip : '0' + agency.zip,
						region: region
					},

					url: agency.url
				});

				newAgency.save(function(err) {
					if (err) {
						console.log( `[ID#${ agency.agn_id }] an error occured while saving ${ newAgency.code } object.` );
						// throw `[ID#${ agency.agn_id }] an error occured while saving ${ newAgency } object.`
					}
					else {
						console.log( `[ID#${ agency.agn_id }] agency successfully saved!` );
					}

					// decrement the counter keeping track of how many records we still need to process
					remainingRecords--;
					// if there are no more records to process call done to move to the next migration file
 					if( remainingRecords === 0 ) {
						done();
					}
				});
			})
			.on( 'end', () => {
				console.log( `end` ); // this should never execute but should stay for better debugging
			});
	});	
};