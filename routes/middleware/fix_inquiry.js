const keystone		= require( 'keystone' ),
	  middleware	= require( './middleware' );

// instantiate the generator used to save inquiries at a controlled rate
const inquiriesGenerator = fixInquiriesGenerator();

exports.fixInquiries = function( req, res, next ) {
	// if the user is trying to run this script against the production database
	if( /^.*\/production.*$/.test( process.env.MONGO_URI ) ) {
		// alert them of what they're doing and how to get around this message
		return res.send(`
		
			WARNING:
		
			You are running this script against the production database.
		
			To allow execution, open fix_child.js and comment out the if block in fixInquiries()` );
	}
	// kick off the first run of our generator
	inquiriesGenerator.next();
};

/* loops through every child record, resaving them */
function* fixInquiriesGenerator() {
	// set the page of inquiries to fetch
	let page = 1,
		errors = [];

	while( page ) {
		console.info( `saving inquiries ${ ( page - 1 ) * 100 } - ${ page * 100 }` );
		// fetch the page of inquiries, waiting to execute further code until we have a result
		const fetchedInquiries = yield fetchInquiriesByPage( page );
		// if there was an error fetching the page of inquiries
		if( fetchedInquiries.responseType === 'error' ) {
			// log the error for debugging purposes
			console.error( `error fetching page ${ page } of inquiries - ${ fetchedInquiries.error }` );
		// if the page of inquiries was fetched successfully
		} else {
			// loop through each of the returned inquiry models
			for( let inquiry of fetchedInquiries.inquiries ) {
				// save the inquiry using the saveInquiry generator
				const savedInquiry = yield saveInquiry( inquiry );
				// if there was an error
				if( savedInquiry.responseType === 'error' ) {
					// push it to the errors array for display after all inquiries have saved
					errors.push( savedInquiry.message );
				}
			}
		}
		// increment the page to fetch for the next run, or set it to false if there are no more pages to fetch
		page = fetchedInquiries.nextPage;
	}
	// loop through each saved error
	for( let error of errors ) {
		// log the error for debugging purposes
		console.error( error );
	}
};

function fetchInquiriesByPage( page ) {

	return new Promise( ( resolve, reject ) => {
		// fetch the request page of inquiry records
		keystone.list( 'Inquiry' )
			.paginate ({
				page: page || 1,
				perPage: 100,
				filters: {} // add any needed filters as { key: value }
			})
			.exec ( ( err, inquiries ) => {

				// if there was an error
				if( err ) {
					// reject the promise with the error and the next page to fetch ( false if this is the last page )
					inquiriesGenerator.next({
						responseType: 'error',
						error: err,
						nextPage: inquiries.next });
				// if the inquiries were fetched successfully
				} else {
					// resolve the promise with the inquiries and the next page to fetch ( false if this is the last page )
					inquiriesGenerator.next({
						responseType: 'success',
						inquiries: inquiries.results,
						nextPage: inquiries.next });
				}
			});
	});
}

function saveInquiry( inquiry ) {

	return new Promise( ( resolve, reject ) => {

		// delete the number of inquiries to adopt field.  Strict needs to be set to false since the field is no longer part of the schema
		inquiry.set( 'agency', undefined, { strict: false } );
		// attempt the save the inquiry
		inquiry.save( ( err, savedModel ) => {
			// if we run into an error
			if( err ) {
				// return control back to the generator with details about the error
				inquiriesGenerator.next({
					responseType: 'error',
					message: `${ inquiry.get( 'name.full' ) } - ${ inquiry.get( 'id' ) } - ${ err }` } );
			// if the model saved successfully
			} else {
				// return control back to the generator
				inquiriesGenerator.next( { responseType: 'success' } );
			}
		});
	});
};
