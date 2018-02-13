/* 
 * READ BEFORE RUNNING THIS SCRIPT: please follow the instructions in each IMPORTANT comment below
 *
 * IMPORTANT: specifying a target in the url will update only image fields for that model type in the database
 *
 * EXAMPLES: localhost:3000/fix/cloudinary-images/children
 * 			 localhost:3000/fix/cloudinary-images/featuredItems
 * 
 * IMPORTANT: not specifying a target in the url will update all image fields in the database
 * 
 * EXAMPLE: localhost:3000/fix/cloudinary-image
 */

const keystone		= require( 'keystone' ),
	  middleware	= require( './middleware' ),
	  utilities		= require( './utilities' );

 // IMPORTANT: the folder is different depending on which server you're targeting.  Be sure to use the correct
//			   folder in the cloudinaryData object below
const developmentFolder	= 'website-development';
const stagingFolder		= 'website-staging';
const productionFolder	= 'website-production';

const cloudinaryData = {
	account: 'dbe9nfmbx',
	folder: developmentFolder, // IMPORTANT: change this based on the environment you're targeting
	version: utilities.generateNumber( 10 ) // generate a random 10-digit number used for cache busting images in Cloudinary
};

// instantiate the generator used to save cloudinary images to the specified model at a controlled rate
const generator = fixModels();

// create a Map to bind url targets to information needed to process each
let targetModels = new Map();
// creates mappings for url targets
targetModels.set( 'children',			{ name: 'Child',			plural: 'children' } );
targetModels.set( 'families',			{ name: 'Family',			plural: 'families' } );
targetModels.set( 'socialWorkers',		{ name: 'Social Worker',	plural: 'social workers'} );
targetModels.set( 'siteVisitors',		{ name: 'Site Visitor',		plural: 'site visitors' } );
targetModels.set( 'admin',				{ name: 'Admin',			plural: 'admin' } );
targetModels.set( 'siteVisitors',		{ name: 'Site Visitor',		plural: 'site visitors' } );
targetModels.set( 'events',				{ name: 'Event',			plural: 'events' } );
targetModels.set( 'mareInTheNews',		{ name: 'MARE in the News',	plural: 'MARE in the news stories' } );
targetModels.set( 'slideshowItems',		{ name: 'Slideshow Item',	plural: 'slideshow items' } );
targetModels.set( 'successStories',		{ name: 'Success Story',	plural: 'success stories' } );
// create an array to hold models that need to be processed
let modelsToProcess = [];

exports.fixCloudinaryImages = function( req, res, next ) {
	// if the user is trying to run this script against the production database
	if( /^.*\/mare$/.test( process.env.MONGO_URI ) ) {
		// alert them of what they're doing and how to get around this message
		return res.send(`
		
			WARNING:
		
			You are running this script against the production database.
		
			To allow execution, open fix_cloudinary-images.js and comment out the if block in fixCloudinaryImages()` );
	}
	// extract request object parameters into variables for use by the functions and generator below
	const targetModel = req.params.model;
	// if a target model was specified
	if( targetModel ) {
		// if there the url the user enterd doesn't align with a model this script is set to fix
		if( !targetModels.get( targetModel ) ) {
			// respond with an error message and halt execution
			return res.send( `ERROR: no script has been created to process the model you're targeting.  Please check fix_cloudinary-images.js to see if your route is wrong` );
		}
		// ensure we are processing just the specified model
		modelsToProcess.push( targetModel );
	// if no target model was specified
	} else {
		// put the fear in developers who may not have read the directions
		console.warn( `WARNING: YOU ARE ABOUT TO UPDATE EVERY MODEL IN THE DATABASE, ABORT IF THIS WASN'T WHAT YOU INTENDED` );
		// ensure we are processing all models with Cloudinary images site-wide
		targetModel.push( 'children', 'families', 'socialWorkers', 'siteVisitors', 'admin',
						  'siteVisitors', 'events', 'featuredItems', 'mareInTheNews',
						  'slideshow items', 'successStories');
	}
	// kick off the first run of our generator
	generator.next();
};

/* loops through every record, resaving them */
function* fixModels() {
	// create an array to capture error information
	let errors = [];
	// loop through each model that's been specified as needing image field updates
	for( let modelToProcess of modelsToProcess ) {
		if( modelsToProcess === 'families' ) {
			console.log( 'here' );
		}
		// set the page of models to fetch
		let page = 1,
			modelDetails = targetModels.get( modelToProcess );

		while( page ) {
			console.info( `saving ${ modelDetails.plural } ${ ( page - 1 ) * 100 } - ${ page * 100 }` );
			// fetch the page of models, waiting to execute further code until we have a result
			const fetchedModels = yield fetchModelsByPage( modelDetails.name, page );
			// if there was an error fetching the page of models
			if( fetchedModels.responseType === 'error' ) {
				// log the error for debugging purposes
				console.error( `error fetching page ${ page } of ${ modelDetails.plural } - ${ fetchedModels.error }` );
			// if the page of models was fetched successfully
			} else {
				// loop through each of the returned models
				for( let model of fetchedModels.results ) {
					// save the model using the saveModel generator
					const savedModel = yield saveModel( model );
					// if there was an error
					if( savedModel.responseType === 'error' ) {
						// push it to the errors array for display after all families have saved
						errors.push( savedModel.message );
					}
				}
			}
			// increment the page to fetch for the next run, or set it to false if there are no more pages to fetch
			page = fetchedModels.nextPage;
		}
	}
	// loop through each saved error
	for( let error of errors ) {
		// log the error for debugging purposes
		console.error( error );
	}
	// let the user know all records have been processed
	console.info( 'all records have been updated' );
}

function fetchModelsByPage( modelName, page ) {
	// fetch the request page of family records
	keystone.list( modelName )
		.paginate ({
			page: page || 1,
			perPage: 100,
			filters: {} // add any needed filters as { key: value }
		})
		.exec ( ( err, models ) => {
			// if there was an error
			if( err ) {
				// reject the promise with the error and the next page to fetch ( false if this is the last page )
				generator.next({
					responseType: 'error',
					error: err,
					nextPage: models.next });
			// if the cloudinary images were fetched successfully
			} else {
				// resolve the promise with the cloudinary images and the next page to fetch ( false if this is the last page )
				generator.next({
					responseType: 'success',
					results: models.results,
					nextPage: models.next });
			}
		});
}

function saveModel( model ) {

	// create regular expressions to match any possible public_id, url, and secure url
	const publicIdRegExp	= /^(?:website-development|website-staging|website-production)?\/?(.*)$/,
		  urlRegExp			= /^(.+)(?:dbe9nfmbx|autoboxer)(.+)(?:v\d{10})(?:\/website-development|website-staging|website-production)?(.+)/;

	// search for image fields
	for( let fieldName in model._doc ) {
		// get the image field
		let field = model.get( fieldName );
		// if the field is an object and has a public_id field, it's a cloudinary image
		if( field && typeof field === 'object' && field.public_id ) {
			// create an object with the updated image fields
			let newImageData = {
				// replace the folder prefix with one appropriate for the target environment
				public_id: field.public_id.replace( publicIdRegExp, `${ cloudinaryData.folder }/$1` ),
				// replace the version of the child's image with the randomly generated one for cache busting
				version: cloudinaryData.version,
				// replace the account field, image version, and folder prefix in both image url fields
				url: field.url.replace( urlRegExp, `$1${ cloudinaryData.account }$2v${ cloudinaryData.version }/${ cloudinaryData.folder }$3` ),
				secure_url: field.secure_url.replace( urlRegExp, `$1${ cloudinaryData.account }$2v${ cloudinaryData.version }/${ cloudinaryData.folder }$3` )
			};
			// merge the new image details into the original image and save the new object to the model
			model.set( fieldName, Object.assign( field, newImageData ) );
		}
		// if the field contains an array of cloudinary image object
		if( Array.isArray( field ) && field[ 0 ] && field[ 0 ].public_id ) {
			// create an array to hold the replacement image objects
			let newImagesArray = [];
			// loop through each image in the array
			for( let image of field ) {
				// create an object with the updated image fields
				let newImageData = {
					// replace the folder prefix with one appropriate for the target environment
					public_id: image.public_id.replace( publicIdRegExp, `${ cloudinaryData.folder }/$1` ),
					// replace the version of the child's image with the randomly generated one for cache busting
					version: cloudinaryData.version,
					// replace the account field, image version, and folder prefix in both image url fields
					url: image.url.replace( urlRegExp, `$1${ cloudinaryData.account }$2v${ cloudinaryData.version }/${ cloudinaryData.folder }$3` ),
					secure_url: image.secure_url.replace( urlRegExp, `$1${ cloudinaryData.account }$2v${ cloudinaryData.version }/${ cloudinaryData.folder }$3` )
				};
				// merge the new image details into the original image and save the new object to the array of new images
				newImagesArray.push( Object.assign( image, newImageData ) );
			}
			// save the new images array to the model
			model.set( fieldName, newImagesArray );
		}
	}

	// attempt to save the model
	model.save( ( err, savedModel ) => {
		// if we run into an error
		if( err ) {
			// return control to the generator with information about the error
			generator.next({
				responseType: 'error',
				message: `${ model.get( '_id' ) } - ${ err }` } );
		// if the model saved successfully
		} else {
			// return control to the generator
			generator.next( { responseType: 'success' } );
		}
	});
};