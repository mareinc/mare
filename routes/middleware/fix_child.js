const keystone		= require( 'keystone' ),
	  middleware	= require( './middleware' );

// instantiate the generator used to save children at a controlled rate
const childrenGenerator = fixChildrenGenerator();

exports.fixChildren = function( req, res, next ) {
	// if the user is trying to run this script against the production database
	if( /^.*\/production.*$/.test( process.env.MONGO_URI ) ) {
		// alert them of what they're doing and how to get around this message
		return res.send(`
		
			WARNING:
		
			You are running this script against the production database.
		
			To allow execution, open fix_child.js and comment out the if block in fixChildren()` );
	}
	// kick off the first run of our generator
	childrenGenerator.next();
};

/* loops through every child record, resaving them */
function* fixChildrenGenerator() {
	// set the page of children to fetch
	let page = 1,
		errors = [];

	while( page ) {
		console.info( `saving children ${ ( page - 1 ) * 100 } - ${ page * 100 }` );
		// fetch the page of children, waiting to execute further code until we have a result
		const fetchedChildren = yield fetchChildrenByPage( page );
		// if there was an error fetching the page of children
		if( fetchedChildren.responseType === 'error' ) {
			// log the error for debugging purposes
			console.error( `error fetching page ${ page } of children - ${ fetchedChildren.error }` );
		// if the page of children was fetched successfully
		} else {
			// loop through each of the returned child models
			for( let child of fetchedChildren.children ) {
				// save the child using the saveChild generator
				const savedChild = yield saveChild( child );
				// if there was an error
				if( savedChild.responseType === 'error' ) {
					// push it to the errors array for display after all children have saved
					errors.push( savedChild.message );
				}
			}
		}
		// increment the page to fetch for the next run, or set it to false if there are no more pages to fetch
		page = fetchedChildren.nextPage;
	}
	// loop through each saved error
	for( let error of errors ) {
		// log the error for debugging purposes
		console.error( error );
	}
};

function fetchChildrenByPage( page ) {

	return new Promise( ( resolve, reject ) => {
		// fetch the request page of child records
		keystone.list( 'Child' )
			.paginate ({
				page: page || 1,
				perPage: 100,
				filters: {} // add any needed filters as { key: value }
			})
			.exec ( ( err, children ) => {

				// if there was an error
				if( err ) {
					// reject the promise with the error and the next page to fetch ( false if this is the last page )
					childrenGenerator.next({
						responseType: 'error',
						error: err,
						nextPage: children.next });
				// if the children were fetched successfully
				} else {
					// resolve the promise with the children and the next page to fetch ( false if this is the last page )
					childrenGenerator.next({
						responseType: 'success',
						children: children.results,
						nextPage: children.next });
				}
			});
	});
}

function saveChild( child ) {

	return new Promise( ( resolve, reject ) => {

		// delete the attachment fields.  Strict needs to be set to false since the fields are no longer part of the schema
		// child.set( 'attachment1', undefined, { strict: false } );
		// child.set( 'attachment2', undefined, { strict: false } );
		// child.set( 'attachment3', undefined, { strict: false } );
		// child.set( 'attachment4', undefined, { strict: false } );
		// child.set( 'attachment5', undefined, { strict: false } );

		// attempt the save the child
		child.save( ( err, savedModel ) => {
			// if we run into an error
			if( err ) {
				// return control back to the generator with details about the error
				childrenGenerator.next({
					responseType: 'error',
					message: `${ child.get( 'name.full' ) } - ${ child.get( 'id' ) } - ${ err }` } );
			// if the model saved successfully
			} else {
				// return control back to the generator
				childrenGenerator.next( { responseType: 'success' } );
			}
		});
	});
};
