/**
 * Created by Adrian Suciu.
 */

var async					= require( 'async' ),
	keystone				= require( 'keystone' ),
	Types 					= keystone.Field.Types,
	Agency					= keystone.list( 'Agency' ),
	SocialWorker   			= keystone.list( 'Social Worker' );

// migration file location
const csvFilePath = './migration-data/csv-data/agency_contact.csv';
const csv = require( 'csvtojson' );
// create an array to hold all social workers.  This is created here to be available to multiple functions below
let socialWorkers = [];

module.exports.importSocialWorker = ( req, res, done ) => {

	csv().fromFile( csvFilePath )
		.on( 'end_parsed', socialWorkersArray => {
			// populate the social workers our generator keys off of
			socialWorkers = socialWorkersArray;
			// kick off the first run of our generator
			socialWorkerGenerator.next();
		})
}

/* a generator to allow us to control the processing of each record */
module.exports.generateSocialWorkers = function* generateSocialWorkers() {
	// create a monitor variable to assess how many records we still need to process
	let remainingRecords = socialWorkers.length;
	// loop through each social worker object we need to create a record for
	for( let socialWorker of socialWorkers ) {
		// pause after each call to createSocialWorkerRecord and don't resume until next() is called
		yield exports.createSocialWorkerRecord( socialWorker );
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {
			done();
		}
	}
}

// a function paired with the generator to create a record and request the generator to process the next once finished
module.exports.createSocialWorkerRecord = socialWorker => {
	// create a placeholder for the agency we're going to fetch related to the current social worker
	let agency = undefined;
	
	async.series([
		// fetch the agency associated with the social worker before attempting to create the record
		done => {
			Agency.model.findOne()
				.where( 'oldId', socialWorker.agn_id )
				.exec()
				.then( retrievedAgency => {
					agency = retrievedAgency;
					done();
				 });
		}
	], () => {
		// populate instance for SocialWorker object
		let newSocialWorker = new SocialWorker.model({
			// every social worker needs a password, this will generate one we can easily determine while still being unique
			password: `${ socialWorker.first_name }_${ socialWorker.last_name }_${ socialWorker.agc_id }`,

			permissions: {
				isVerified: socialWorker.email ? true : false,			// they can only have verified their email address if they have one
				isActive: socialWorker.is_active === 'Y' ? true : false
			},

			name: {
				first: socialWorker.first_name,
				last: socialWorker.last_name
			},
			// TODO: every social worker needs an email address, this is just a placeholder until Lisa tells us how to handle these records
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
			// fire off the next iteration of our generator now that the record has been saved
			socialWorkerGenerator.next();
		});
	});
};

// instantiates the generator used to create social worker records one at a time ( preventing a memory leak issue )
const socialWorkerGenerator = exports.generateSocialWorkers();