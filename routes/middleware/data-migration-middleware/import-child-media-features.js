const keystone				= require( 'keystone' );
const Child 				= keystone.list( 'Child' );
// utility middleware
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all child media features.  This is created here to be available to multiple functions below
// let mediaFeatures,
let childMediaFeatures;
// create our mapping objects
// let latestMediaFeaturesMap = {},
let childMediaFeatureGroupMap = {};
// expose done to be available to all functions below
let childMediaFeatureGroupsImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];

module.exports.appendMediaFeatures = ( req, res, done ) => {
	// expose done to our generator
	childMediaFeatureGroupsImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// // create a promise for converting the media features CSV file to JSON
	// const mediaFeaturesLoaded = CSVConversionMiddleware.fetchMediaFeatures();

	// if the files were successfully converted, they will return individual arrays
	// mediaFeaturesLoaded.then( mediaFeaturesArray => {
	// 	// store the media features in a variable accessible throughout this file
	// 	mediaFeatures = mediaFeaturesArray;
	// 	// call the function to build the media features latest date map
	// 	exports.buildLatestMediaFeaturesMap();

		// create a promise for converting the child media features CSV file to JSON
		const childMediaFeaturesLoaded = CSVConversionMiddleware.fetchMediaFeatureChildren();

		childMediaFeaturesLoaded.then( childMediaFeaturesArray => {
			// store the child media features in a variable accessible throughout this file
			childMediaFeatures = childMediaFeaturesArray;
			// call the function to build the child media features map
			exports.buildChildMediaFeatureGroupMap();
			// kick off the first run of our generator
			childMediaFeatureGenerator.next();
		// if there was an error converting the child media features file
		}).catch( reason => {
			console.error( `error processing child media features` );
			console.error( reason );
			// aborting the import
			return done();
		});
	// // if there was an error converting the media features file
	// }).catch( reason => {
	// 	console.error( `error processing media features` );
	// 	console.error( reason );
	// 	// aborting the import
	// 	return done();
	// });
};

// module.exports.buildLatestMediaFeaturesMap = () => {
// 	// load all media features
// 	for( let mediaFeature of mediaFeatures ) {
// 		// for each media feature, get the recruitment source id
// 		const recruitmentSourceId = mediaFeature.rcs_id;
// 		// and use the id as a key, and add each recruitment source's id in an object key
// 		if( recruitmentSourceId ) {
// 			// if it's the first time running into the recruitment source id, create a placeholder
// 			if( !latestMediaFeaturesMap[ recruitmentSourceId ] ) {
// 				latestMediaFeaturesMap[ recruitmentSourceId ] = {};
// 			}
// 			// store the media feature id in the recruitment source object
// 			latestMediaFeaturesMap[ recruitmentSourceId ][ 'mediaFeatures' ] ?
// 				latestMediaFeaturesMap[ recruitmentSourceId ][ 'mediaFeatures' ].push( mediaFeature.mft_id ) :
// 				latestMediaFeaturesMap[ recruitmentSourceId ][ 'mediaFeatures' ] = [ mediaFeature.mft_id ];
// 			// if mediaFeature.schedule_date exists but map[ rcs_id ] does not, store mediaFeature.schedule_date
// 			if( mediaFeature.schedule_date ) {
// 				// if there's no date already stored
// 				if ( !latestMediaFeaturesMap[ recruitmentSourceId ][ 'date' ] ) {
// 					latestMediaFeaturesMap[ recruitmentSourceId ][ 'date' ] = new Date( mediaFeature.schedule_date );
// 				// otherwise, if we've already stored a date
// 				} else {
// 					const currentDate = latestMediaFeaturesMap[ recruitmentSourceId ][ 'date' ];
// 					const newDate = new Date( mediaFeature.schedule_date );
// 					const latestDate = newDate > currentDate ? newDate : currentDate;

// 					latestMediaFeaturesMap[ recruitmentSourceId ][ 'date' ] = latestDate;
// 				}
// 			}
// 		}
// 	}
// };

module.exports.buildChildMediaFeatureGroupMap = () => {
	// load all media feature children
	for( let childMediaFeature of childMediaFeatures ) {
		// for each media feature child, get the child id
		const childId = childMediaFeature.chd_id;
	 	// and use the id as a key, and add each child’s _id in a key object
		if( childId ) {

			if( childMediaFeatureGroupMap[ childId ] ) {

					childMediaFeatureGroupMap[ childId ].add( childMediaFeature.mft_id );

			} else {

				let newChildMediaFeatureSet = new Set( [ childMediaFeature.mft_id ] );
				// create an entry containing a set with the one media feature child
				childMediaFeatureGroupMap[ childId ] = newChildMediaFeatureSet;
			}
		}
	}
};

/* a generator to allow us to control the processing of each record */
module.exports.generateChildMediaFeatures = function* generateChildMediaFeatures() {

	console.log( `appending media features to children in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords					= Object.keys( childMediaFeatureGroupMap ).length,
		remainingRecords 				= totalRecords,
		batchCount				        = 200, // number of records to be process simultaneously
		childMediaFeatureGroupNumber	= 0; // keeps track of the current media feature child number being processed.  Used for batch processing
	// loop through each child media feature object we need to append to each record
	for( let key in childMediaFeatureGroupMap ) {
		// increment the childMediaFeatureGroupNumber
		childMediaFeatureGroupNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( childMediaFeatureGroupNumber % batchCount === 0 ) {
			yield exports.updateChildRecord( childMediaFeatureGroupMap[ key ], key, true );
		} else {
			exports.updateChildRecord( childMediaFeatureGroupMap[ key ], key, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		console.log( `child media features remaining: ${ remainingRecords }` );
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			console.log( `the following records weren't saved correctly:` );

			importErrors.forEach( error => {
				console.log( error )
			});

			const resultsMessage = `finished appending ${ totalRecords } media features to children in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'Media Features - Children',
				results: resultsMessage
			});

			console.log( resultsMessage );
			// return control to the data migration view
			return childMediaFeatureGroupsImportComplete();
		}
	}
};

// a function paired with the generator to append data to a record and request the generator to process the next once finished
module.exports.updateChildRecord = ( childMediaFeatureGroupIds, childOldId, pauseUntilSaved ) => {
	// fetch the first child
	const childLoaded = utilityModelFetch.getChildByRegistrationNumber( childOldId );
	// // fetch the media feature associated with the child
	// const mediaFeatureLoaded = utilityModelFetch.getMediaFeatureById( childMediaFeature.mft_id );

	// Promise.all( [ childLoaded, mediaFeatureLoaded ] ).then( values => {
	childLoaded.then( child => {

		// const [ child, mediaFeature ] = values;

		// "86","Video Snapshots" // have this already, should we check ( ask Lisa ).  Maybe see which source is trustworthy
		// "68","AdoptUsKids/Faces" // have the checkbox, should we check ( ask Lisa ). Maybe see which source is trustworthy
		// "1","MARE Photolisting"
		// "2","Wednesday's Child"

		// "90","Matching Meetings","N","N","",""
		// "93","Single Parent Matching Night","N","N","",""
		// "103","MARE Matching Program","N","N","",""
		// "1000","MARE On-line Matching- Family","N","N","",""
		// "1020","MARE On-line Matching- SW","N","N","",""
		// "1101","2010 Family Matching Night","N","N","",""
		// "1139","2011 Girls Matching Night","N","N","",""
		// "1159","2012 Casey Matching Night","N","N","",""
		// "1167","2012 Southeast Matching Night","N","N","",""
		// "1198","2014 Boston/Southern Matching","N","N","",""
		// "1225","2015 DCF LYNN MATCHING NIGHT","Y","Y","1/27/15","W"


		// have: video snapshot with date
		// 	  adoptuskids but not adoptuskids date

		// `coalition meeting` // no match
		// `matching event`	// lots of potential matches ( see above )
		// `adoption parties`	// lots of potential matches.  See recruitment_source.csv

		console.log( `stop here` ); // NOTE: no idea what this means

		// save the child record
		child.save( ( err, savedModel ) => {
			// if we run into an error
			if( err ) {
				// store a reference to the entry that caused the error
				importErrors.push( { id: childMediaFeature.chd_id, error: err.err } );
			}

			// fire off the next iteration of our generator after saving
			if( pauseUntilSaved ) {
				childMediaFeatureGenerator.next();
			}
		});
	});
};

// instantiates the generator used to create child records at a regulated rate
const childMediaFeatureGenerator = exports.generateChildMediaFeatures();