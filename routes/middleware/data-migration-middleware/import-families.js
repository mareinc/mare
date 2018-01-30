const keystone					= require( 'keystone' );
const Family 					= keystone.list( 'Family' );
// utility middleware
const utilityFunctions			= require( './utilities_functions' );
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all families.  This is created here to be available to multiple functions below
let families;
// create references to the maps that we stored on locals.  These are bound here to be available to multiple functions below since res can't be passed to the generator
let statesMap,
	gendersMap,
	languagesMap,
	legalStatusesMap,
	racesMap,
	disabilityStatusesMap,
	disabilitiesMap,
	familyConstellationsMap,
	closedReasonsMap,
	familyStatusesMap,
	cityRegionsMap;

// expose done to be available to all functions below
let familyImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];
// create a set to store problems with unrecognized city or town names.  A set is used to capture unique values
let cityOrTownNameError = new Set();

module.exports.importFamilies = ( req, res, done ) => {
	// expose the maps we'll need for this import
	statesMap				= res.locals.migration.maps.states;
	gendersMap				= res.locals.migration.maps.genders;
	languagesMap			= res.locals.migration.maps.languages;
	legalStatusesMap		= res.locals.migration.maps.legalStatuses;
	racesMap				= res.locals.migration.maps.races;
	disabilityStatusesMap	= res.locals.migration.maps.disabilityStatuses;
	disabilitiesMap			= res.locals.migration.maps.disabilities;
	familyConstellationsMap	= res.locals.migration.maps.familyConstellations;
	closedReasonsMap		= res.locals.migration.maps.closedReasons;
	familyStatusesMap		= res.locals.migration.maps.familyStatuses;
	cityRegionsMap			= res.locals.migration.maps.cityRegions;
	// expose done to our generator
	familyImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the families CSV file to JSON
	const familiesLoaded = CSVConversionMiddleware.fetchFamilies();

	// if the file was successfully converted, it will return the array of families
	familiesLoaded.then( familiesArray => {
		// store the families in a variable accessible throughout this file
		families = familiesArray;
		// kick off the first run of our generator
		familyGenerator.next();
	// if there was an error converting the families file
	}).catch( reason => {
		console.error( `error processing families` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

/* a generator to allow us to control the processing of each record */
module.exports.generateFamilies = function* generateFamilies() {

	console.log( `creating families in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords			= families.length,
		remainingRecords 		= totalRecords,
		batchCount				= 100, // number of records to be process simultaneously
		familyNumber			= 0; // keeps track of the current family number being processed.  Used for batch processing
	// loop through each family object we need to create a record for
	for( let family of families ) {
		// increment the familyNumber
		familyNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( familyNumber % batchCount === 0 ) {
			yield exports.createFamilyRecord( family, true );
		} else {
			exports.createFamilyRecord( family, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		console.log( `families remaining: ${ remainingRecords }` );
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			console.log( `the following records weren't saved correctly:` );

			importErrors.forEach( error => {
				console.log( error )
			});

			cityOrTownNameError.forEach( cityOrTown => {
				console.log( `bad city: ${ cityOrTown }` );
			});

			const resultsMessage = `finished creating ${ totalRecords } families in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'Families',
				results: resultsMessage
			});

			console.log( resultsMessage );
			// return control to the data migration view
			return familyImportComplete();
		}
	}
};

// a function paired with the generator to create a record and request the generator to process the next once finished
module.exports.createFamilyRecord = ( family, pauseUntilSaved ) => {

	// create variables to hold the primary language _id and all other language _ids
	let primaryLanguage,
		otherLanguagesArray = [],
		// set gender matching preferences
		matchingGenderPreferences = [],
		// set legal status matching preferences with a default of wanting to see legally free kids
		matchingLegalStatusPreferences = [ legalStatusesMap[ 'F' ] ];

	if( family.accept_female === 'Y' ) { matchingGenderPreferences.push( gendersMap[ 'F' ] ); }
	if( family.accept_male === 'Y' ) { matchingGenderPreferences.push( gendersMap[ 'M' ] ); }

	if( family.accept_legal_risk === 'Y' ) { matchingLegalStatusPreferences.push( legalStatusesMap[ 'R' ] ); }
	
	// if the record has a primary language listed
	if( family.primary_language ) {
		// split the string on commas to create an array of languages
		let allLanguagesArray = family.primary_language
									.trim()
									.replace( '/', ',' )
									.replace( 'Haitian Creole', 'haitiancreole' )
									.replace( '-', ',' )
									.replace( ' ', ',' )
									.split( ',' ); // redo to get dash handling back, add break on space ( 'english spanish' ) and / ( French/English )
		// store the first language as the primary and all other languages in other
		const [ primary, ...other ] = allLanguagesArray;
		// map the primary language listed to the _id value in the new system
		primaryLanguage = languagesMap[ primary.toLowerCase().trim() ];
		// loop through the other languages if any exist
		for( let language of other ) {
			// map each language to the _id value in the new system and push it to the other languages array
			otherLanguagesArray.push( languagesMap[ language.toLowerCase().trim() ] );
		}
	// if the record doesn't have a primary language listed
	} else {
		// default the primary language to English
		primaryLanguage = languagesMap[ 'english' ];
	}

	// if the family has no constellation listed
	if( !family.family_constellation ) {
		// store a reference to the entry that caused the error
		importErrors.push( { id: family.fam_id, error: `missing family constellation: ${ family.family_constellation }` } );
	}
	// if the family has no primary language listed
	if( !primaryLanguage ) {
		// store a reference to the entry that caused the error
		importErrors.push( { id: family.fam_id, error: `missing primary language: ${ primaryLanguage }` } );
	}
	// if the family has no city listed
	if( !family.city ) {
		// push an error so we can easily identify to problematic entries
		importErrors.push( { id: family.fam_id, error: 'no city information provided' } );
	}
	// adjust cities / towns in MA to have names the system expects so it can find their records
	switch( family.city.trim() ) {
		case `?`: family.city = `not specified`; break;
		case `1`: family.city = `not specified`; break;
		case `11`: family.city = `not specified`; break;
		case `111`: family.city = `not specified`; break;
		case `1111`: family.city = `not specified`; break;
		case `11111`: family.city = `not specified`; break;
		case `111111`: family.city = `not specified`; break;
		case `Any City`: family.city = `not specified`; break;
		case `Anycity`: family.city = `not specified`; break;
		case `Anytown`: family.city = `not specified`; break;
		case `Anytown,`: family.city = `not specified`; break;
		case `Anywhere`: family.city = `not specified`; break;
		case `APO`: family.city = `not specified`; break;
		case `Armed Forces`: family.city = `not specified`; break;
		case `ASCC`: family.city = `not specified`; break;
		case `Assonet`: family.city = `not specified`; break;
		case `Atlanta`: family.city = `not specified`; break;
		case `Bad Address`: family.city = `not specified`; break;
		case `Berkshire`: family.city = `not specified`; break;
		case `Bristol`: family.city = `not specified`; break;
		case `Burwick`: family.city = `not specified`; break;
		case `Butler`: family.city = `not specified`; break;
		case `Calais`: family.city = `not specified`; break;
		case `City`: family.city = `not specified`; break;
		case `city`: family.city = `not specified`; break;
		case `City unknown`: family.city = `not specified`; break;
		case `Cranberry`: family.city = `not specified`; break;
		case `Cumberland`: family.city = `not specified`; break;
		case `Dexter`: family.city = `not specified`; break;
		case `East Providence`: family.city = `not specified`; break;
		case `Essex County`: family.city = `not specified`; break;
		case `Essex Street`: family.city = `not specified`; break;
		case `Exeter`: family.city = `not specified`; break;
		case `FPO`: family.city = `not specified`; break;
		case `HAB H`: family.city = `not specified`; break;
		case `Hagerstown`: family.city = `not specified`; break;
		case `Hometown`: family.city = `not specified`; break;
		case `io`: family.city = `not specified`; break;
		case `Kingsboro`: family.city = `not specified`; break;
		case `Lees Summit`: family.city = `not specified`; break;
		case `Litchfield`: family.city = `not specified`; break;
		case `Living in NC`: family.city = `not specified`; break;
		case `Lusaka`: family.city = `not specified`; break;
		case `Main`: family.city = `not specified`; break;
		case `main`: family.city = `not specified`; break;
		case `Martinsville`: family.city = `not specified`; break;
		case `Massachusetts`: family.city = `not specified`; break;
		case `Moberly`: family.city = `not specified`; break;
		case `Mount Hermon`: family.city = `not specified`; break;
		case `Mt Hermon`: family.city = `not specified`; break;
		case `Murfreesboro`: family.city = `not specified`; break;
		case `n/a`: family.city = `not specified`; break;
		case `NA`: family.city = `not specified`; break;
		case `na`: family.city = `not specified`; break;
		case `Nashua`: family.city = `not specified`; break;
		case `New Haven`: family.city = `not specified`; break;
		case `North Shore`: family.city = `not specified`; break;
		case `Newport`: family.city = `not specified`; break;
		case `no`: family.city = `not specified`; break;
		case `No address given`: family.city = `not specified`; break;
		case `no city`: family.city = `not specified`; break;
		case `no city provided`: family.city = `not specified`; break;
		case `none`: family.city = `not specified`; break;
		case `No state`: family.city = `not specified`; break;
		case `None Given`: family.city = `not specified`; break;
		case `Northern region`: family.city = `not specified`; break;
		case `Northern Region`: family.city = `not specified`; break;
		case `Not available`: family.city = `not specified`; break;
		case `Not given`: family.city = `not specified`; break;
		case `Not Given`: family.city = `not specified`; break;
		case `not given`: family.city = `not specified`; break;
		case `not provided`: family.city = `not specified`; break;
		case `Otter River`: family.city = `not specified`; break;
		case `Out of Country`: family.city = `not specified`; break;
		case `Plaistow`: family.city = `not specified`; break;
		case `Portsmouth`: family.city = `not specified`; break;
		case `Rindge`: family.city = `not specified`; break;
		case `Rockwood`: family.city = `not specified`; break;
		case `Scarborough`: family.city = `not specified`; break;
		case `See Comments`: family.city = `not specified`; break;
		case `Seogwipo`: family.city = `not specified`; break;
		case `Southern Region`: family.city = `not specified`; break;
		case `Stonington`: family.city = `not specified`; break;
		case `stoughton`: family.city = `Stoughton`; break;
		case `Stratham`: family.city = `Stoughton`; break;
		case `Sturgeon`: family.city = `not specified`; break;
		case `Suffok`: family.city = `not specified`; break;
		case `Surrender Call`: family.city = `not specified`; break;
		case `Switzerland`: family.city = `not specified`; break;
		case `town`: family.city = `not specified`; break;
		case `unknown`: family.city = `not specified`; break;
		case `Unknown`: family.city = `not specified`; break;
		case `UNKNOWN`: family.city = `not specified`; break;
		case `UNSURE`: family.city = `not specified`; break;
		case `Vancouver`: family.city = `not specified`; break;
		case `Verona`: family.city = `not specified`; break;
		case `western MA`: family.city = `not specified`; break;
		case `Western MA`: family.city = `not specified`; break;
		case `will not give`: family.city = `not specified`; break;
		case `Wilton`: family.city = `not specified`; break;
		case `Winston`: family.city = `not specified`; break;
		case `Woonsocket`: family.city = `not specified`; break;
		case `x`: family.city = `not specified`; break;
		case `X`: family.city = `not specified`; break;
		case `xx`: family.city = `not specified`; break;
		case `xxx`: family.city = `not specified`; break;
		case `xxxx`: family.city = `not specified`; break;
		case `xxxxx`: family.city = `not specified`; break;
		case `xxxxxx`: family.city = `not specified`; break;
		case `xxxxxxx`: family.city = `not specified`; break;
		case `xxxxxxxx`: family.city = `not specified`; break;
		case `xxxxxxxxx`: family.city = `not specified`; break;
		case `xxxxxxxxxxx`: family.city = `not specified`; break;
		case `xxxxxxxxxxxxxxx`: family.city = `not specified`; break;
		case `YYYYYY`: family.city = `not specified`; break;
		case `Dorcehster`: family.city = `Dorchester`; break;
		case `Bpston`: family.city = `Boston`; break;
		case `.Danvers`: family.city = `Danvers`; break;
		case `North Marshfield`: family.city = `Marshfield`; break;
		case `W. Peabody`: family.city = `Peabody`; break;
		case `Nactick`: family.city = `Natick`; break;
		case `Beverley`: family.city = `Beverly`; break;
		case `Middleboro`: family.city = `Middleborough`; break;
		case `N Attleboro`: family.city = `North Attleborough`; break;
		case `E Boston`: family.city = `East Boston`; break;
		case `West Yarmouth`: family.city = `Yarmouth`; break;
		case `Westboro`: family.city = `Westborough`; break;
		case `N. Easton`: family.city = `North Easton`; break;
		case `South Boston`: family.city = `Dorchester`; break;
		case `south boston`: family.city = `Dorchester`; break;
		case `South Bridge`: family.city = `Southbridge`; break;
		case `S Easton`: family.city = `South Easton`; break;
		case `Lunenberg`: family.city = `Lunenburg`; break;
		case `South Hamilton`: family.city = `Hamilton`; break;
		case `North Hampton`: family.city = `Northampton`; break;
		case `No Easton`: family.city = `North Easton`; break;
		case `Sudsbury`: family.city = `Sudbury`; break;
		case `Beberly`: family.city = `Beverly`; break;
		case `Aphol`: family.city = `Athol`; break;
		case `South Lawrence`: family.city = `Lawrence`; break;
		case `West Medford`: family.city = `Medford`; break;
		case `East Sandwich`: family.city = `Sandwich`; break;
		case `palmer`: family.city = `Palmer`; break;
		case `South Grafton`: family.city = `Grafton`; break;
		case `Randoplh`: family.city = `Randolph`; break;
		case `West Roxbury`: family.city = `Roxbury`; break;
		case `West roxbury`: family.city = `Roxbury`; break;
		case `Marlboro`: family.city = `Marlborough`; break;
		case `N Andover`: family.city = `North Andover`; break;
		case `No. Dartmouth`: family.city = `Dartmouth`; break;
		case `Tauton`: family.city = `Taunton`; break;
		case `West Barnstable`: family.city = `Barnstable`; break;
		case `west boylston`: family.city = `West Boylston`; break;
		case `West boylston`: family.city = `West Boylston`; break;
		case `South Attleboro`: family.city = `Attleboro`; break;
		case `Bridgwater`: family.city = `Bridgewater`; break;
		case `cohasset`: family.city = `Cohasset`; break;
		case `Wellesly`: family.city = `Wellesley`; break;
		case `W. Bridgewater`: family.city = `West Bridgewater`; break;
		case `S. Hadley`: family.city = `South Hadley`; break;
		case `East Falmouth`: family.city = `Falmouth`; break;
		case `North Carver`: family.city = `Carver`; break;
		case `Newtonville`: family.city = `Newton`; break;
		case `Marshfield Hills`: family.city = `Marshfield`; break;
		case `West Newton`: family.city = `Newton`; break;
		case `No Falmouth`: family.city = `Falmouth`; break;
		case `Barrington`: family.city = `Great Barrington`; break;
		case `Whitensville`: family.city = `Whitinsville`; break;
		case `N Grafton`: family.city = `Grafton`; break;
		case `Tyngsboro`: family.city = `Tyngsborough`; break;
		case `E Bridgewater`: family.city = `East Bridgewater`; break;
		case `N. Chelmsford`: family.city = `Chelmsford`; break;
		case `Harwichport`: family.city = `Harwich`; break;
		case `Boxboro`: family.city = `Boxborough`; break;
		case `S. Boston`: family.city = `Dorchester`; break;
		case `No. Reading`: family.city = `North Reading`; break;
		case `N Chatham`: family.city = `Chatham`; break;
		case `N. Reading`: family.city = `North Reading`; break;
		case `N. Attleboro`: family.city = `North Attleborough`; break;
		case `E. Weymouth`: family.city = `Weymouth`; break;
		case `E. Douglas`: family.city = `Douglas`; break;
		case `Walthan`: family.city = `Waltham`; break;
		case `Sout Easton`: family.city = `South Easton`; break;
		case `chelmsford`: family.city = `Chelmsford`; break;
		case `W Wareham`: family.city = `Wareham`; break;
		case `Needham Heights`: family.city = `Needham`; break;
		case `W. Sommerville`: family.city = `Somerville`; break;
		case `pepperell`: family.city = `Pepperell`; break;
		case `N. Andover`: family.city = `North Andover`; break;
		case `boston`: family.city = `Boston`; break;
		case `Sommerville`: family.city = `Somerville`; break;
		case `South Weymouth`: family.city = `Weymouth`; break;
		case `Boxford.`: family.city = `Boxford`; break;
		case `N  Attleboro`: family.city = `North Attleborough`; break;
		case `N Billerica`: family.city = `Billerica`; break;
		case `southbridge`: family.city = `Southbridge`; break;
		case `brookline`: family.city = `Brookline`; break;
		case `Brookline Village`: family.city = `Brookline`; break;
		case `Brooklyn`: family.city = `Brookline`; break;
		case `Malboro`: family.city = `Marlborough`; break;
		case `Worburn`: family.city = `Woburn`; break;
		case `W Barnstable`: family.city = `Barnstable`; break;
		case `E. Walpole`: family.city = `Walpole`; break;
		case `dedham`: family.city = `Dedham`; break;
		case `Deham`: family.city = `Dedham`; break;
		case `norfolk`: family.city = `Norfolk`; break;
		case `E Weymouth`: family.city = `Weymouth`; break;
		case `Barry`: family.city = `Barre`; break;
		case `N, Andover`: family.city = `North Andover`; break;
		case `N Chelmsford`: family.city = `Chelmsford`; break;
		case `West Somerville`: family.city = `Somerville`; break;
		case `Yarmouth Port`: family.city = `Yarmouth`; break;
		case `Yarmouth-Port`: family.city = `Yarmouth`; break;
		case `East Weymouth`: family.city = `Weymouth`; break;
		case `Milbury`: family.city = `Millbury`; break;
		case `Beverly Farms`: family.city = `Beverly`; break;
		case `paxton`: family.city = `Paxton`; break;
		case `2nd floor,Taunton`: family.city = `Taunton`; break;
		case `East Freetown`: family.city = `Freetown`; break;
		case `S. Dartmouth`: family.city = `Dartmouth`; break;
		case `N. Brookfield`: family.city = `North Brookfield`; break;
		case `S Natick`: family.city = `Natick`; break;
		case `E Falmouth`: family.city = `Falmouth`; break;
		case `Topfield`: family.city = `Topsfield`; break;
		case `West Townsend`: family.city = `Townsend`; break;
		case `Blechertown`: family.city = `Belchertown`; break;
		case `West Tisbury MV`: family.city = `West Tisbury`; break;
		case `Merrimack`: family.city = `Merrimac`; break;
		case `S. Weymouth`: family.city = `Weymouth`; break;
		case `S Boston`: family.city = `Dorchester`; break;
		case `E Wareham`: family.city = `Wareham`; break;
		case `Plymoutth`: family.city = `Plymouth`; break;
		case `Millibury`: family.city = `Millbury`; break;
		case `N Quincy`: family.city = `Quincy`; break;
		case `W Medford`: family.city = `Medford`; break;
		case `N. Quincy`: family.city = `Quincy`; break;
		case `Nofolk`: family.city = `Norfolk`; break;
		case `Southboro`: family.city = `Southborough`; break;
		case `Mefield`: family.city = `Medfield`; break;
		case `N. Weymouth`: family.city = `Weymouth`; break;
		case `W Roxbury`: family.city = `Roxbury`; break;
		case `georgetown`: family.city = `Georgetown`; break;
		case `East Walpole`: family.city = `Walpole`; break;
		case `No Reading`: family.city = `North Reading`; break;
		case `Otis ANGB`: family.city = `Otis`; break;
		case `Haverill`: family.city = `Haverhill`; break;
		case `Charlton City`: family.city = `Charlton`; break;
		case `Adover`: family.city = `Andover`; break;
		case `andover`: family.city = `Andover`; break;
		case `mansfield`: family.city = `Mansfield`; break;
		case `W Lynn`: family.city = `Lynn`; break;	
		case `Wesminster`: family.city = `Westminster`; break;	
		case `S Attleboro`: family.city = `Attleboro`; break;
		case `W Warren`: family.city = `Warren`; break;
		case `Yarmouthport`: family.city = `Yarmouth`; break;
		case `LINCOLN`: family.city = `Lincoln`; break;
		case `Marlblehead`: family.city = `Marblehead`; break;
		case `N Oxford`: family.city = `Oxford`; break;
		case `BOURNE`: family.city = `Bourne`; break;
		case `Lanesboro`: family.city = `Lanesborough`; break;
		case `DEDHAM`: family.city = `Dedham`; break;
		case `No  Attleboro`: family.city = `North Attleborough`; break;
		case `W Springfield`: family.city = `Springfield`; break;
		case `Somervillle`: family.city = `Somerville`; break;
		case `CAMBRIDGE`: family.city = `Cambridge`; break;
		case `cambridge`: family.city = `Cambridge`; break;
		case `BOXBOROUGH`: family.city = `Boxborough`; break;
		case `LITTLETON`: family.city = `Littleton`; break;
		case `S. Barre`: family.city = `Barre`; break;
		case `PRINCETON`: family.city = `Princeton`; break;
		case `Berkeley`: family.city = `Berkley`; break;
		case `N Adams`: family.city = `North Adams`; break;
		case `Blasckton`: family.city = `Blackstone`; break;
		case `Wilimington`: family.city = `Wilmington`; break;
		case `N Reading`: family.city = `North Reading`; break;
		case `South Dartmouth`: family.city = `Dartmouth`; break;
		case `MIDDLEBORO`: family.city = `Middleborough`; break;
		case `Agawan`: family.city = `Agawam`; break;
		case `Westboro`: family.city = `Westborough`; break;
		case `Monponsett`: family.city = `Mattapoisett`; break;
		case `South Harwich`: family.city = `Harwich`; break;
		case `S Lawrence`: family.city = `Lawrence`; break;
		case `Newton Centre`: family.city = `Newton`; break;
		case `N Harwich`: family.city = `Harwich`; break;
		case `Stowe`: family.city = `Stow`; break;
		case `stowe`: family.city = `Stow`; break;
		case `Winchendon Springs`: family.city = `Winchendon`; break;
		case `W. Roxbury`: family.city = `Roxbury`; break;
		case `S Carver`: family.city = `Carver`; break;
		case `N Orange`: family.city = `Orange`; break;
		case `W Brookfield`: family.city = `West Brookfield`; break;
		case `Dennisport`: family.city = `Dennis`; break;
		case `North Orange`: family.city = `Orange`; break;
		case `Whitenville`: family.city = `Whitinsville`; break;
		case `whitinsville`: family.city = `Whitinsville`; break;
		case `Whittensville`: family.city = `Whitinsville`; break;
		case `whitman`: family.city = `Whitman`; break;
		case `W Yarmouth`: family.city = `Yarmouth`; break;
		case `N Dartmouth`: family.city = `Dartmouth`; break;
		case `1Dorchester`: family.city = `Dorchester`; break;
		case `South Dennis`: family.city = `Dennis`; break;
		case `S. Easton`: family.city = `South Easton`; break;
		case `Hanscom`: family.city = `Bedford`; break;
		case `Hanscomb AFB`: family.city = `Bedford`; break;
		case `Hanscom AFB`: family.city = `Bedford`; break;
		case `Hanscom Air Force`: family.city = `Bedford`; break;
		case `Harwich Port`: family.city = `Harwich`; break;
		case `Plymton`: family.city = `Plympton`; break;
		case `S Atlleboro`: family.city = `Attleboro`; break;
		case `Seeknok`: family.city = `Seekonk`; break;
		case `seekonk`: family.city = `Seekonk`; break;
		case `West Peabody`: family.city = `Peabody`; break;
		case `W Newbury`: family.city = `West Newbury`; break;
		case `Hyannisport`: family.city = `Hyannis`; break;
		case `hyde park`: family.city = `Boston`; break;
		case `Hydepark`: family.city = `Boston`; break;
		case `Hypark`: family.city = `Boston`; break;
		case `E Douglas`: family.city = `Douglas`; break;
		case `West Falmouth`: family.city = `Falmouth`; break;
		case `North Quincy`: family.city = `Quincy`; break;
		case `Swansee`: family.city = `Swansea`; break;
		case `No Adams`: family.city = `North Adams`; break;
		case `North Weymouth`: family.city = `Weymouth`; break;
		case `Harwidh`: family.city = `Harwich`; break;
		case `S Hadley`: family.city = `South Hadley`; break;
		case `/E.Bridgewater`: family.city = `East Bridgewater`; break;
		case `Abbington`: family.city = `Abington`; break;
		case `Abigton`: family.city = `Abington`; break;
		case `Acqshnet`: family.city = `Acushnet`; break;
		case `Ahburnham`: family.city = `Ashburnham`; break;
		case `ASHBURNHAM`: family.city = `Ashburnham`; break;
		case `Ahmerst`: family.city = `Amherst`; break;
		case `Air Sta Cape Cod`: family.city = `Hyannis`; break;
		case `Allstown`: family.city = `Allston`; break;
		case `Amhers`: family.city = `Amherst`; break;
		case `arlington`: family.city = `Arlington`; break;
		case `Arrleboro`: family.city = `Attleboro`; break;
		case `Asburnham`: family.city = `Ashburnham`; break;
		case `Ashburham`: family.city = `Ashburnham`; break;
		case `ashland`: family.city = `Ashland`; break;
		case `Ashely Falls`: family.city = `Sheffield`; break;
		case `Ashley Falls`: family.city = `Sheffield`; break;
		case `Asland`: family.city = `Ashland`; break;
		case `Attlboro`: family.city = `Attleboro`; break;
		case `Attleborogh`: family.city = `Attleboro`; break;
		case `Auberndale`: family.city = `Newton`; break;
		case `Auburndale`: family.city = `Newton`; break;
		case `auburndale`: family.city = `Newton`; break;
		case `Ayre`: family.city = `Ayer`; break;
		case `Babson`: family.city = `Wellesley`; break;
		case `Baldwinville`: family.city = `Baldwinville`; break;
		case `Baldwinsville`: family.city = `Baldwinville`; break;
		case `Barrie`: family.city = `Barre`; break;
		case `Bartlett`: family.city = `Webster`; break;
		case `Belingham`: family.city = `Bellingham`; break;
		case `bellingham`: family.city = `Bellingham`; break;
		case `Bellingtom`: family.city = `Bellingham`; break;
		case `bernardston`: family.city = `Bernardston`; break;
		case `beverly`: family.city = `Beverly`; break;
		case `BEVERLY`: family.city = `Beverly`; break;
		case `Bilerica`: family.city = `Billerica`; break;
		case `Billerca`: family.city = `Billerica`; break;
		case `Billercia`: family.city = `Billerica`; break;
		case `Blackston`: family.city = `Blackstone`; break;
		case `Blanford`: family.city = `Blandford`; break;
		case `Blckstone`: family.city = `Blackstone`; break;
		case `Bondsville`: family.city = `Palmer`; break;
		case `Bosnto`: family.city = `Boston`; break;
		case `Bowlingham`: family.city = `Bellingham`; break;
		case `Boyloston`: family.city = `Boylston`; break;
		case `braintree`: family.city = `Braintree`; break;
		case `Brant Rock`: family.city = `Marshfield`; break;
		case `Bridgerwater`: family.city = `Bridgewater`; break;
		case `BRIGHTON`: family.city = `Brighton`; break;
		case `Brocton`: family.city = `Brockton`; break;
		case `brockton`: family.city = `Brockton`; break;
		case `BROCKTON`: family.city = `Brockton`; break;
		case `Brooklline`: family.city = `Brookline`; break;
		case `Brooksfield`: family.city = `Brookfield`; break;
		case `Brooline`: family.city = `Brookline`; break;
		case `Bryantville`: family.city = `Pembroke`; break;
		case `Burnardston`: family.city = `Bernardston`; break;
		case `Buzzards`: family.city = `Bourne`; break;
		case `Buzzards Bay`: family.city = `Bourne`; break;
		case `Buzzard's Bay`: family.city = `Bourne`; break;
		case `Byfield`: family.city = `Newbury`; break;
		case `Byield`: family.city = `Newbury`; break;
		case `Cape Cod`: family.city = `Hyannis`; break;
		case `Cataumet`: family.city = `Bourne`; break;
		case `Cedarville`: family.city = `Plymouth`; break;
		case `Centerville`: family.city = `Barnstable`; break;
		case `Charleston`: family.city = `Charlestown`; break;
		case `Chartley`: family.city = `Norton`; break;
		case `Chelmford`: family.city = `Chelmsford`; break;
		case `CHELMSFORD`: family.city = `Chelmsford`; break;
		case `chelsea`: family.city = `Chelsea`; break;
		case `Cherry Valley`: family.city = `Leicester`; break;
		case `Chesire`: family.city = `Cheshire`; break;
		case `Chestnut Hill`: family.city = `Newton`; break;
		case `Chicope`: family.city = `Chicopee`; break;	
		case `Combridge`: family.city = `Cambridge`; break;	
		case `Corchester`: family.city = `Dorchester`; break;
		case `Cotuit`: family.city = `Barnstable`; break;
		case `Cummington Road`: family.city = `Cummington`; break;
		case `Dancers`: family.city = `Danvers`; break;
		case `danvers`: family.city = `Danvers`; break;
		case `Danville`: family.city = `Granville`; break;	
		case `Darmouth`: family.city = `Dartmouth`; break;
		case `Darthmouth`: family.city = `Dartmouth`; break;
		case `Dennis Port`: family.city = `Dennis`; break;
		case `Devens`: family.city = `Ayer`; break;
		case `Dorcherster`: family.city = `Dorchester`; break;
		case `Dochester`: family.city = `Dorchester`; break;
		case `Dorcester`: family.city = `Dorchester`; break;
		case `Dorchester Center`: family.city = `Dorchester`; break;
		case `Dorchestere`: family.city = `Dorchester`; break;
		case `Dorchseter`: family.city = `Dorchester`; break;
		case `Doschester`: family.city = `Dorchester`; break;
		case `douglas`: family.city = `Douglas`; break;
		case `Doylestown`: family.city = `Boylston`; break;
		case `Duxsbury`: family.city = `Duxbury`; break;
		case `Dudely`: family.city = `Dudley`; break;
		case `E Freetown`: family.city = `Freetown`; break;
		case `E Longmeadow`: family.city = `East Longmeadow`; break;
		case `E Sandwich`: family.city = `Sandwich`; break;
		case `E Taunton`: family.city = `Taunton`; break;
		case `E Walpole`: family.city = `Walpole`; break;
		case `E. Boston`: family.city = `East Boston`; break;
		case `E. Bridgewater`: family.city = `East Bridgewater`; break;
		case `E. Brookfield`: family.city = `East Brookfield`; break;
		case `E. Falmouth`: family.city = `Falmouth`; break;
		case `E. Freetown`: family.city = `Freetown`; break;
		case `E. Longmeadow`: family.city = `East Longmeadow`; break;
		case `E. Sandwich`: family.city = `Sandwich`; break;
		case `E. Taunton`: family.city = `Taunton`; break;
		case `E. Wareham`: family.city = `Wareham`; break;
		case `E.Bridgewater`: family.city = `East Bridgewater`; break;
		case `E.Dennis`: family.city = `Dennis`; break;
		case `E.Falmouth`: family.city = `Falmouth`; break;
		case `East Alpole`: family.city = `Walpole`; break;
		case `East  Weymouth`: family.city = `Weymouth`; break;
		case `East Bridgwater`: family.city = `East Bridgewater`; break;
		case `east bridgewater`: family.city = `East Bridgewater`; break;
		case `East Dennis`: family.city = `Dennis`; break;
		case `East Douglas`: family.city = `Douglas`; break;
		case `East Hampton`: family.city = `Easthampton`; break;
		case `East Harwich`: family.city = `Harwich`; break;
		case `East Kingston`: family.city = `Kingston`; break;
		case `East Long Meadow`: family.city = `East Longmeadow`; break;
		case `East Longfellow`: family.city = `East Longmeadow`; break;
		case `east longmeadow`: family.city = `East Longmeadow`; break;
		case `East Longmeadow,`: family.city = `East Longmeadow`; break;
		case `East Lynn`: family.city = `Lynn`; break;
		case `East Orleans`: family.city = `Orleans`; break;
		case `East Otis`: family.city = `Otis`; break;
		case `East Pepperell`: family.city = `Pepperell`; break;
		case `East Raynham`: family.city = `Raynham`; break;
		case `East Sandiwch`: family.city = `Sandwich`; break;
		case `east sandwich`: family.city = `Sandwich`; break;
		case `East Taunton`: family.city = `Taunton`; break;
		case `east taunton`: family.city = `Taunton`; break;
		case `East Tauton`: family.city = `Taunton`; break;
		case `East Templeton`: family.city = `Templeton`; break;
		case `East Wareham`: family.city = `Wareham`; break;
		case `easthampton`: family.city = `Easthampton`; break;
		case `Easy Weymouth`: family.city = `Weymouth`; break;
		case `Edgemere`: family.city = `Shrewsbury`; break;
		case `Egdartown`: family.city = `Edgartown`; break;
		case `Evereet`: family.city = `Everett`; break;
		case `Everret`: family.city = `Everett`; break;
		case `E7 Chelmsford`: family.city = `Chelmsford`; break;
		case `Fair Haven`: family.city = `Fairhaven`; break;
		case `FALMOUTH`: family.city = `Falmouth`; break;
		case `Fall  River`: family.city = `Fall River`; break;
		case `FAll River`: family.city = `Fall River`; break;
		case `fall river`: family.city = `Fall River`; break;
		case `Fayville`: family.city = `Southborough`; break;
		case `Feeding Hill`: family.city = `Agawam`; break;
		case `Feeding Hills`: family.city = `Agawam`; break;
		case `Feeding HIlls`: family.city = `Agawam`; break;
		case `Feeding Hillls`: family.city = `Agawam`; break;
		case `Fiskdale`: family.city = `Sturbridge`; break;
		case `fiskdale`: family.city = `Sturbridge`; break;
		case `FISKDALE`: family.city = `Sturbridge`; break;
		case `Fiskeale`: family.city = `Sturbridge`; break;
		case `Fitburg`: family.city = `Fitchburg`; break;
		case `Fitchburgh`: family.city = `Fitchburg`; break;
		case `fitchburg`: family.city = `Fitchburg`; break;
		case `Fitchbury`: family.city = `Fitchburg`; break;
		case `Fitchuburg`: family.city = `Fitchburg`; break;
		case `Florence`: family.city = `Northampton`; break;
		case `florence`: family.city = `Northampton`; break;
		case `Foresdale`: family.city = `Sandwich`; break;
		case `Forestdale`: family.city = `Sandwich`; break;
		case `Foxboro`: family.city = `Foxborough`; break;
		case `foxboro`: family.city = `Foxborough`; break;
		case `Framigham`: family.city = `Framingham`; break;
		case `framingham`: family.city = `Framingham`; break;
		case `Framinghan`: family.city = `Framingham`; break;
		case `FRAMINGHAM`: family.city = `Framingham`; break;
		case `Framinham`: family.city = `Framingham`; break;
		case `Frankin`: family.city = `Franklin`; break;
		case `Frankliln`: family.city = `Franklin`; break;
		case `Freeman`: family.city = `Freetown`; break;
		case `Gagner`: family.city = `Gardner`; break;
		case `Gardiner`: family.city = `Gardner`; break;
		case `gardner`: family.city = `Gardner`; break;
		case `GARDNER`: family.city = `Gardner`; break;
		case `Gardner Street`: family.city = `Gardner`; break;
		case `Gilbertsville`: family.city = `Hardwick`; break;
		case `Gilbertville`: family.city = `Hardwick`; break;
		case `Gloucster`: family.city = `Gloucester`; break;
		case `Glouster`: family.city = `Gloucester`; break;
		case `Grainville`: family.city = `Granville`; break;
		case `Grandy`: family.city = `Granby`; break;
		case `great barrington`: family.city = `Great Barrington`; break;
		case `Greefield`: family.city = `Greenfield`; break;
		case `Greenfiled`: family.city = `Greenfield`; break;
		case `Green Harbor`: family.city = `Marshfield`; break;
		case `GROTON`: family.city = `Groton`; break;
		case `Gt Barrington`: family.city = `Great Barrington`; break;
		case `HAFB`: family.city = `Bedford`; break;
		case `HAFB(Bedford)`: family.city = `Bedford`; break;
		case `HANOVER`: family.city = `Hanover`; break;
		case `Hamden`: family.city = `Hampden`; break;
		case `hampden`: family.city = `Hampden`; break;
		case `Hampden County`: family.city = `Hampden`; break;
		case `Hampton`: family.city = `Hampden`; break;
		case `HANSCOM AFB`: family.city = `Bedford`; break;
		case `Hanscom Afb`: family.city = `Bedford`; break;
		case `Hatchville`: family.city = `Falmouth`; break;
		case `Havard`: family.city = `Harvard`; break;
		case `Havehill`: family.city = `Haverhill`; break;
		case `haverhill`: family.city = `Haverhill`; break;
		case `Havilhill`: family.city = `Haverhill`; break;
		case `Hawich`: family.city = `Harwich`; break;
		case `Haydenville`: family.city = `Williamsburg`; break;
		case `High Park`: family.city = `Hyde Park`; break;
		case `Higham`: family.city = `Hingham`; break;
		case `Hoeverhill`: family.city = `Haverhill`; break;
		case `Hollis`: family.city = `Holliston`; break;
		case `holliston`: family.city = `Holliston`; break;
		case `holyoke`: family.city = `Holyoke`; break;
		case `Hopkington`: family.city = `Hopkinton`; break;
		case `Housatonic`: family.city = `Great Barrington`; break;
		case `Hubbarston`: family.city = `Hubbardston`; break;
		case `Hul`: family.city = `Hull`; break;
		case `Humarock`: family.city = `Scituate`; break;
		case `Humarock, Scituate`: family.city = `Scituate`; break;
		case `Hyannis Port`: family.city = `Hyannis`; break;
		case `Indian Orchard`: family.city = `Springfield`; break;
		case `Indian orchard`: family.city = `Springfield`; break;
		case `Ipswitch`: family.city = `Ipswich`; break;
		case `Jamaica  Plain`: family.city = `Jamaica Plain`; break;
		case `Jamiaca Plain`: family.city = `Jamaica Plain`; break;
		case `Jamaica Park`: family.city = `Jamaica Plain`; break;
		case `Jefferson`: family.city = `Holden`; break;
		case `kingston`: family.city = `Kingston`; break;
		case `Laicester`: family.city = `Leicester`; break;
		case `lakeville`: family.city = `Lakeville`; break;
		case `Lakeville,`: family.city = `Lakeville`; break;
		case `Lawrance`: family.city = `Lawrence`; break;
		case `Lawrenced`: family.city = `Lawrence`; break;
		case `Lawrecen`: family.city = `Lawrence`; break;
		case `lawrence`: family.city = `Lawrence`; break;
		case `Leeds`: family.city = `Northampton`; break;
		case `Lenox Dale`: family.city = `Lenox`; break;
		case `Lenoxdale`: family.city = `Lenox`; break;
		case `Lennoxdate`: family.city = `Lenox`; break;
		case `Leominister`: family.city = `Leominster`; break;
		case `LEOMINSTER`: family.city = `Leominster`; break;
		case `Leominster MA`: family.city = `Leominster`; break;
		case `Leonandster`: family.city = `Leominster`; break;
		case `Lexinton`: family.city = `Lexington`; break;
		case `Lester`: family.city = `Leicester`; break;
		case `Linwood`: family.city = `Northbridge`; break;
		case `Littleon`: family.city = `Littleton`; break;
		case `Littlleton`: family.city = `Littleton`; break;
		case `Loeminster`: family.city = `Leominster`; break;
		case `Long Meadow`: family.city = `Longmeadow`; break;
		case `longmeadow`: family.city = `Longmeadow`; break;
		case `lowell`: family.city = `Lowell`; break;
		case `Ludllow`: family.city = `Ludlow`; break;
		case `Lynfield`: family.city = `Lynnfield`; break;
		case `lynn`: family.city = `Lynn`; break;
		case `Lynn,`: family.city = `Lynn`; break;
		case `Lynnnfield`: family.city = `Lynnfield`; break;
		case `Lynnefield`: family.city = `Lynnfield`; break;
		case `lynnfield`: family.city = `Lynnfield`; break;
		case `Lynwood`: family.city = `Lynnfield`; break;
		case `Magnolia`: family.city = `Gloucester`; break;
		case `Malborough`: family.city = `Marlborough`; break;
		case `MARLBOROUGH`: family.city = `Marlborough`; break;
		case `malden`: family.city = `Malden`; break;
		case `Manchaug`: family.city = `Sutton`; break;
		case `Manchester by Sea`: family.city = `Manchester`; break;
		case `Manchester bythe Sea`: family.city = `Manchester`; break;
		case `Manomet`: family.city = `Plymouth`; break;
		case `marblehead`: family.city = `Marblehead`; break;
		case `Marboro`: family.city = `Marlborough`; break;
		case `Marborough`: family.city = `Marlborough`; break;
		case `Marim`: family.city = `Marion`; break;
		case `Marllborough`: family.city = `Marlborough`; break;
		case `Marlborogh`: family.city = `Marlborough`; break;
		case `Marlborohead`: family.city = `Marlborough`; break;
		case `Marston Mills`: family.city = `Barnstable`; break;
		case `Marstons`: family.city = `Barnstable`; break;
		case `Marstons Mills`: family.city = `Barnstable`; break;
		case `Marthas Vineyard`: family.city = `Martha's Vineyard`; break;
		case `Martha's Vineyard`: family.city = `Martha's Vineyard`; break;
		case `Martons Mills`: family.city = `Barnstable`; break;
		case `MASHPEE`: family.city = `Mashpee`; break;
		case `Mashapee`: family.city = `Mashpee`; break;
		case `Mathuen`: family.city = `Methuen`; break;
		case `Mattapan`: family.city = `Boston`; break;
		case `mattapan`: family.city = `Boston`; break;
		case `Mattapisett`: family.city = `Mattapoisett`; break;
		case `medford`: family.city = `Medford`; break;
		case `melrose`: family.city = `Melrose`; break;
		case `mendon`: family.city = `Mendon`; break;
		case `Metheuen`: family.city = `Methuen`; break;
		case `Metheun`: family.city = `Methuen`; break;
		case `methuen`: family.city = `Methuen`; break;
		case `Middletown`: family.city = `Middleton`; break;
		case `middleton`: family.city = `Middleton`; break;
		case `Mill River`: family.city = `Williamsburg`; break;
		case `Millburry`: family.city = `Millbury`; break;
		case `millbury`: family.city = `Millbury`; break;
		case `Millers Falls`: family.city = `Montague`; break;
		case `milton`: family.city = `Milton`; break;
		case `Mision Park`: family.city = `Boston`; break;
		case `Monton`: family.city = `Monson`; break;
		case `Monument Beach`: family.city = `Bourne`; break;
		case `Mouthbridge`: family.city = `Southbridge`; break;
		case `Munson`: family.city = `Monson`; break;
		case `N. Adams`: family.city = `North Adams`; break;
		case `N. Amherst`: family.city = `Amherst`; break;
		case `N. Bedford`: family.city = `New Bedford`; break;
		case `N. Billerica`: family.city = `Billerica`; break;
		case `N. Dartrmouth`: family.city = `Dartmouth`; break;
		case `N. Dighton`: family.city = `Dighton`; break;
		case `N. Falmouth`: family.city = `Falmouth`; break;
		case `N. Grafton`: family.city = `Grafton`; break;
		case `N. Harwich`: family.city = `Harwich`; break;
		case `N. Quincy,`: family.city = `Quincy`; break;
		case `N. Waltham`: family.city = `Waltham`; break;
		case `N.Grafton`: family.city = `Grafton`; break;
		case `Natck`: family.city = `Natick`; break;
		case `NATICK`: family.city = `Natick`; break;
		case `natick`: family.city = `Natick`; break;
		case `NEWTON`: family.city = `Newton`; break;
		case `NEwton`: family.city = `Newton`; break;
		case `newton`: family.city = `Newton`; break;
		case `Neddham`: family.city = `Needham`; break;
		case `NEEDHAM`: family.city = `Needham`; break;
		case `Neeham`: family.city = `Needham`; break;
		case `New BeDford`: family.city = `New Bedford`; break;
		case `New bedford`: family.city = `New Bedford`; break;
		case `new bedford`: family.city = `New Bedford`; break;
		case `New Befdford`: family.city = `New Bedford`; break;
		case `Newbedford`: family.city = `New Bedford`; break;
		case `Newbraintree`: family.city = `New Braintree`; break;
		case `Newburport`: family.city = `Newburyport`; break;
		case `Newton Center`: family.city = `Newton`; break;
		case `NEWTON CENTER`: family.city = `Newton`; break;
		case `Newton Highlands`: family.city = `Newton`; break;
		case `Newton Upper Falls`: family.city = `Newton`; break;
		case `No.  Adams`: family.city = `North Adams`; break;
		case `No Andover`: family.city = `North Andover`; break;
		case `No. Andover`: family.city = `North Andover`; break;
		case `No Attleboro`: family.city = `North Attleborough`; break;
		case `No. Attleboro`: family.city = `North Attleborough`; break;
		case `No. Easton`: family.city = `North Easton`; break;
		case `No. Grafton`: family.city = `Grafton`; break;
		case `No. Worcester`: family.city = `Worcester`; break;
		case `Norfalk`: family.city = `Norfolk`; break;
		case `Norfold`: family.city = `Norfolk`; break;
		case `Norfork`: family.city = `Norfolk`; break;
		case `Norht Attleborough`: family.city = `North Attleborough`; break;
		case `North Attelboro`: family.city = `North Attleborough`; break;
		case `North  Andover`: family.city = `North Andover`; break;
		case `North Attleboro`: family.city = `North Attleborough`; break;
		case `north attleboro`: family.city = `North Attleborough`; break;
		case `North Attleoboro`: family.city = `North Attleborough`; break;
		case `north adams`: family.city = `North Adams`; break;
		case `North Adover`: family.city = `North Andover`; break;
		case `north andover`: family.city = `North Andover`; break;
		case `North Auburn`: family.city = `Auburn`; break;
		case `North Billerica`: family.city = `Billerica`; break;
		case `north billerica`: family.city = `Billerica`; break;
		case `North brookfield`: family.city = `North Brookfield`; break;
		case `North Chatham`: family.city = `Chatham`; break;
		case `North Chelmsford`: family.city = `Chelmsford`; break;
		case `North chelmsford`: family.city = `Chelmsford`; break;
		case `North Chelsford`: family.city = `Chelmsford`; break;
		case `North Darthmouth`: family.city = `Dartmouth`; break;
		case `North Dartmouth`: family.city = `Dartmouth`; break;
		case `North Dighton`: family.city = `Dighton`; break;
		case `North End`: family.city = `Boston`; break;
		case `North Eastham`: family.city = `Eastham`; break;
		case `North Eaton`: family.city = `North Easton`; break;
		case `North Falmouth`: family.city = `Falmouth`; break;
		case `North falmouth`: family.city = `Falmouth`; break;
		case `North Grafton`: family.city = `Grafton`; break;
		case `north grafton`: family.city = `Grafton`; break;
		case `North Hatfield`: family.city = `Hatfield`; break;
		case `North Oxford`: family.city = `Oxford`; break;
		case `North oxford`: family.city = `Oxford`; break;
		case `North Pembroke`: family.city = `Pembroke`; break;
		case `north reading`: family.city = `North Reading`; break;
		case `North. Attleboro`: family.city = `North Attleborough`; break;
		case `Northboro`: family.city = `Northborough`; break;
		case `Northborugh`: family.city = `Northborough`; break;
		case `Northbrige`: family.city = `Northbridge`; break;
		case `Northbrookfield`: family.city = `North Brookfield`; break;
		case `Northhampton`: family.city = `Northampton`; break;
		case `northmpton`: family.city = `Northampton`; break;
		case `Noth Andover`: family.city = `North Andover`; break;
		case `Noth Billerica`: family.city = `Billerica`; break;
		case `Noth Chelmsford`: family.city = `Chelmsford`; break;
		case `Nothampton`: family.city = `Northampton`; break;
		case `Oak Bluff`: family.city = `Oak Bluffs`; break;
		case `Oak bluffs`: family.city = `Oak Bluffs`; break;
		case `Onset`: family.city = `Wareham`; break;
		case `Osterville`: family.city = `Barnstable`; break;
		case `Oxbridge`: family.city = `Uxbridge`; break;
		case `Ozford`: family.city = `Oxford`; break;
		case `peabody`: family.city = `Peabody`; break;
		case `PEABODY`: family.city = `Peabody`; break;
		case `Peapody`: family.city = `Peabody`; break;
		case `Pembrook`: family.city = `Pembroke`; break;
		case `Peppeerell`: family.city = `Pepperell`; break;
		case `Pitfsfield`: family.city = `Pittsfield`; break;
		case `pittsfield`: family.city = `Pittsfield`; break;
		case `Planfield`: family.city = `Plainfield`; break;
		case `Plimpton`: family.city = `Plympton`; break;
		case `Plymounth`: family.city = `Plymouth`; break;
		case `plymouth`: family.city = `Plymouth`; break;
		case `Plymouth region`: family.city = `Plymouth`; break;
		case `Pymouth`: family.city = `Plymouth`; break;
		case `Pocasset`: family.city = `Bourne`; break;
		case `Prides Crossing`: family.city = `Beverly`; break;
		case `QUINCY`: family.city = `Quincy`; break;
		case `Quin cy`: family.city = `Quincy`; break;
		case `Qunicy`: family.city = `Quincy`; break;
		case `quincy`: family.city = `Quincy`; break;
		case `RAndolph`: family.city = `Randolph`; break;
		case `Randoph`: family.city = `Randolph`; break;
		case `randolph`: family.city = `Randolph`; break;
		case `Raynaham`: family.city = `Raynham`; break;
		case `raynham`: family.city = `Raynham`; break;
		case `Raynham Center`: family.city = `Raynham`; break;
		case `reading`: family.city = `Reading`; break;
		case `Readville`: family.city = `Boston`; break;
		case `Reboboth`: family.city = `Rehoboth`; break;
		case `Rehobeth`: family.city = `Rehoboth`; break;
		case `revere`: family.city = `Revere`; break;
		case `Revere Beach`: family.city = `Revere`; break;
		case `Rochdale`: family.city = `Leicester`; break;
		case `Rosindale`: family.city = `Roslindale`; break;
		case `Rosllindale`: family.city = `Roslindale`; break;
		case `Rsolindale`: family.city = `Roslindale`; break;
		case `Roslindale, MA`: family.city = `Roslindale`; break;
		case `Rowely`: family.city = `Rowley`; break;
		case `roxbury`: family.city = `Roxbury`; break;
		case `Roxbury Crossing`: family.city = `Roxbury`; break;
		case `Rutline`: family.city = `Rutland`; break;
		case `S Deerfield`: family.city = `Deerfield`; break;
		case `s deerfield`: family.city = `Deerfield`; break;
		case `S Dennis`: family.city = `Dennis`; break;
		case `S Wellfleet`: family.city = `Wellfleet`; break;
		case `S Weymouth`: family.city = `Weymouth`; break;
		case `S Yarmouth`: family.city = `Yarmouth`; break;
		case `S Youmouth`: family.city = `Yarmouth`; break;
		case `S. Attleboro`: family.city = `Attleboro`; break;
		case `S. Boro`: family.city = `Southborough`; break;
		case `S. Bridge`: family.city = `Southbridge`; break;
		case `S. Carver`: family.city = `Carver`; break;
		case `S. Chatham`: family.city = `Chatham`; break;
		case `S. Deerfield`: family.city = `Deerfield`; break;
		case `S. Dennis`: family.city = `Dennis`; break;
		case `S. Hamilton`: family.city = `Hamilton`; break;
		case `S. Lancaster`: family.city = `Lancaster`; break;
		case `S. Lawrence`: family.city = `Lawrence`; break;
		case `S.Chatham`: family.city = `Chatham`; break;
		case `S.Hamilton`: family.city = `Hamilton`; break;
		case `S.Ludlow`: family.city = `Ludlow`; break;
		case `salem`: family.city = `Salem`; break;
		case `Salem/Peabody`: family.city = `Salem`; break;
		case `STOW`: family.city = `Stow`; break;
		case `Sagamore Beach`: family.city = `Sagamore`; break;
		case `saugus`: family.city = `Saugus`; break;
		case `Sgus`: family.city = `Saugus`; break;
		case `Sharon, MA`: family.city = `Sharon`; break;
		case `Shattuckville`: family.city = `Colrain`; break;
		case `Shelbourne Falls`: family.city = `Shelburne`; break;
		case `Shelburne Falls`: family.city = `Shelburne`; break;
		case `Shelburne falls`: family.city = `Shelburne`; break;
		case `Sherbon`: family.city = `Sherborn`; break;
		case `Sherly`: family.city = `Shirley`; break;
		case `Shrewbury`: family.city = `Shrewsbury`; break;
		case `SHREWSBURY`: family.city = `Shrewsbury`; break;
		case `Siasconset`: family.city = `Nantucket`; break;
		case `So. Hamilton`: family.city = `Hamilton`; break;
		case `Somervile`: family.city = `Somerville`; break;
		case `somerville`: family.city = `Somerville`; break;
		case `SOMERVILLE`: family.city = `Somerville`; break;
		case `Soth Attleboro`: family.city = `Attleboro`; break;
		case `Soutboro`: family.city = `Southborough`; break;
		case `South Barre`: family.city = `Barre`; break;
		case `South Borough`: family.city = `Southborough`; break;
		case `South Darmouth`: family.city = `Dartmouth`; break;
		case `South Darthmouth`: family.city = `Dartmouth`; break;
		case `South Deerfield`: family.city = `Deerfield`; break;
		case `south deerfield`: family.city = `Deerfield`; break;
		case `south hadley`: family.city = `South Hadley`; break;
		case `South Haldey`: family.city = `South Hadley`; break;
		case `South Hampton`: family.city = `Southampton`; break;
		case `S Lancaster`: family.city = `Lancaster`; break;
		case `South Lancaster`: family.city = `Lancaster`; break;
		case `South Natick`: family.city = `Natick`; break;
		case `South Orleans`: family.city = `Orleans`; break;
		case `South Walpole`: family.city = `Walpole`; break;
		case `South Waolpole`: family.city = `Walpole`; break;
		case `South Yarmouth`: family.city = `Yarmouth`; break;
		case `South yarmouth`: family.city = `Yarmouth`; break;
		case `south yarmouth`: family.city = `Yarmouth`; break;
		case `Southbrige`: family.city = `Southbridge`; break;
		case `Southeaston`: family.city = `South Easton`; break;
		case `Southfield`: family.city = `New Marlborough`; break;
		case `Southfiled`: family.city = `New Marlborough`; break;
		case `spencer`: family.city = `Spencer`; break;
		case `SPENCER`: family.city = `Spencer`; break;
		case `Sprinfield`: family.city = `Springfield`; break;
		case `springfield`: family.city = `Springfield`; break;
		case `Springfield,`: family.city = `Springfield`; break;
		case `Springfiled`: family.city = `Springfield`; break;
		case `Springlfield`: family.city = `Springfield`; break;
		case `Springhill`: family.city = `Somerville`; break;
		case `Squantum`: family.city = `Quincy`; break;
		case `Still River`: family.city = `Harvard`; break;
		case `Stougton`: family.city = `Stoughton`; break;
		case `Stowghton`: family.city = `Stoughton`; break;
		case `Strubridge`: family.city = `Sturbridge`; break;
		case `Teaticket`: family.city = `Falmouth`; break;
		case `Templetown`: family.city = `Templeton`; break;
		case `Tewbsbury`: family.city = `Tewksbury`; break;
		case `Tewsksbury`: family.city = `Tewksbury`; break;
		case `tewksbury`: family.city = `Tewksbury`; break;
		case `Tewsbury`: family.city = `Tewksbury`; break;
		case `Tewskbury`: family.city = `Tewksbury`; break;
		case `Thorndike`: family.city = `Palmer`; break;
		case `Three Rivers`: family.city = `Palmer`; break;
		case `Touton`: family.city = `Taunton`; break;
		case `Turner Falls`: family.city = `Montague`; break;
		case `Turners Fall`: family.city = `Montague`; break;
		case `Turners Falls`: family.city = `Montague`; break;
		case `Turners falls`: family.city = `Montague`; break;
		case `Tyngsgro`: family.city = `Tyngsborough`; break;
		case `Tynsboro`: family.city = `Tyngsborough`; break;
		case `unbridge`: family.city = `Uxbridge`; break;
		case `Uphams Corner`: family.city = `Dorchester`; break;
		case `Vineyard Harvard`: family.city = `Tisbury`; break;
		case `Vineyard Haven`: family.city = `Tisbury`; break;
		case `Vineyard haven`: family.city = `Tisbury`; break;
		case `Vineyardhaven`: family.city = `Tisbury`; break;
		case `Vinyard Haven`: family.city = `Tisbury`; break;
		case `W Bridgewater`: family.city = `West Bridgewater`; break;
		case `W Falmouth`: family.city = `Falmouth`; break;
		case `W Haverhill`: family.city = `Haverhill`; break;
		case `W Newton`: family.city = `Newton`; break;
		case `W Townsend`: family.city = `Townsend`; break;
		case `W. Barnstable`: family.city = `Barnstable`; break;
		case `W. Boylston`: family.city = `West Boylston`; break;
		case `W. Falmouth`: family.city = `Falmouth`; break;
		case `W. Newbury`: family.city = `West Newbury`; break;
		case `W. Newton`: family.city = `Newton`; break;
		case `W. Springfield`: family.city = `Springfield`; break;
		case `W. Wareham`: family.city = `Wareham`; break;
		case `W. Yarmouth`: family.city = `Yarmouth`; break;
		case `W.Roxbury`: family.city = `Roxbury`; break;
		case `Waban`: family.city = `Newton`; break;
		case `Ward`: family.city = `Ware`; break;
		case `ware`: family.city = `Ware`; break;
		case `Warehmam`: family.city = `Wareham`; break;
		case `WASHINGTON`: family.city = `Washington`; break;
		case `Waquoit`: family.city = `Falmouth`; break;
		case `WEYMOUTH`: family.city = `Weymouth`; break;
		case `weymouth`: family.city = `Weymouth`; break;
		case `Watetown`: family.city = `Watertown`; break;
		case `Waymouth`: family.city = `Weymouth`; break;
		case `wayland`: family.city = `Wayland`; break;
		case `wellesley`: family.city = `Wellesley`; break;
		case `Wellesley Hills`: family.city = `Wellesley`; break;
		case `Wellsley`: family.city = `Wellesley`; break;
		case `Wells`: family.city = `Wellesley`; break;
		case `Wesborough`: family.city = `Westborough`; break;
		case `Wesford`: family.city = `Westford`; break;
		case `Wesftord`: family.city = `Westford`; break;
		case `West Branstable`: family.city = `Barnstable`; break;
		case `WEST BRIDGEWATER`: family.city = `West Bridgewater`; break;
		case `West bridgewater`: family.city = `West Bridgewater`; break;
		case `West Brook`: family.city = `West Brookfield`; break;
		case `WEST BROOKFIELD`: family.city = `West Brookfield`; break;
		case `West Chatham`: family.city = `Chatham`; break;
		case `West Deerfield`: family.city = `Deerfield`; break;
		case `West Dennis`: family.city = `Dennis`; break;
		case `West Groton`: family.city = `Groton`; break;
		case `West Harwich`: family.city = `Harwich`; break;
		case `West Lynn`: family.city = `Lynn`; break;
		case `West  Newbury`: family.city = `West Newbury`; break;
		case `West Point`: family.city = `Westport`; break;
		case `West. Roxbury`: family.city = `Roxbury`; break;
		case `West Spingfield`: family.city = `Springfield`; break;
		case `West Sprinfield`: family.city = `Springfield`; break;
		case `West Springfield`: family.city = `Springfield`; break;
		case `west springfield`: family.city = `Springfield`; break;
		case `West Wareham`: family.city = `Wareham`; break;
		case `West wareham`: family.city = `Wareham`; break;
		case `West Warehem`: family.city = `Wareham`; break;
		case `West Waren`: family.city = `Warren`; break;
		case `West Warren`: family.city = `Warren`; break;
		case `West Whately`: family.city = `Whately`; break;
		case `Westbrook`: family.city = `West Brookfield`; break;
		case `Westbrookfield`: family.city = `West Brookfield`; break;
		case `westfield`: family.city = `Westfield`; break;
		case `Westminister`: family.city = `Westminster`; break;
		case `westminster`: family.city = `Westminster`; break;
		case `Westood`: family.city = `Westwood`; break;
		case `westwood`: family.city = `Westwood`; break;
		case `Westport Point`: family.city = `Westport`; break;
		case `Whaltham`: family.city = `Waltham`; break;
		case `Whatley`: family.city = `Whately`; break;
		case `Wheelwright`: family.city = `Hardwick`; break;
		case `Whitan`: family.city = `Whitman`; break;
		case `White Horse Beach`: family.city = `Plympton`; break;
		case `Wichendon Springs`: family.city = `Winchendon`; break;
		case `Wilmingtom`: family.city = `Wilmington`; break;
		case `Wilminghton`: family.city = `Wilmington`; break;
		case `wilmington`: family.city = `Wilmington`; break;
		case `Winchedon`: family.city = `Winchendon`; break;
		case `winchendon`: family.city = `Winchendon`; break;
		case `winchester`: family.city = `Winchester`; break;
		case `woburn`: family.city = `Woburn`; break;
		case `Woburn,`: family.city = `Woburn`; break;
		case `Wollaston`: family.city = `Quincy`; break;
		case `Womerville`: family.city = `Somerville`; break;
		case `Woods Hole`: family.city = `Falmouth`; break;
		case `Worcesster`: family.city = `Worcester`; break;
		case `Worcetser`: family.city = `Worcester`; break;
		case `worcester`: family.city = `Worcester`; break;
		case `Worchester`: family.city = `Worcester`; break;
		case `Worcster`: family.city = `Worcester`; break;
		case `Wrenthan`: family.city = `Wrentham`; break;
		case `Wretham`: family.city = `Wrentham`; break;
		case `Wymouth`: family.city = `Weymouth`; break;
	}

	// create a promise for fetching the MA city or town associated with the agency
	const cityOrTownLoaded = utilityModelFetch.getCityOrTownByName( family.city.trim(), family.state );
	// once we've fetch the city or town
	cityOrTownLoaded
		.then( cityOrTown => {
			// populate instance for Family object
			let newFamily = new Family.model({

				isActive: family.status === 'A' || family.status === 'H',

				registrationNumber: family.fam_id,
				initialContact: family.listing_date ? new Date( family.listing_date ) : undefined,
				flagCalls: family.flag_calls === 'Y',
				familyConstellation: familyConstellationsMap[ family.family_constellation ],	// this is required in the new system

				language: primaryLanguage,
				otherLanguages: otherLanguagesArray,

				address: {
					street1: family.address_1.trim(),
					street2: family.address_2.trim(),
					city: cityOrTown,
					isOutsideMassachusetts: family.state !== 'MA',
					cityText: family.state !== 'MA' ? family.city.trim() : undefined,
					state: statesMap[ family.state ],
					zipCode: utilityFunctions.padZipCode( family.zip ),
					region: cityRegionsMap[ family.city.trim() ]
				},

				homePhone: family.home_phone,

				numberOfChildren: 0, // This will be updated in the family child import

				stages: {
					gatheringInformation: {
						started: family.is_gathering_info === 'Y',
						date: family.gathering_info_date ? new Date( family.gathering_info_date ) : undefined
					},
					lookingForAgency: {
						started: family.is_looking_for_agency === 'Y',
						date: family.looking_for_agency_date ? new Date( family.looking_for_agency_date ) : undefined
					},
					workingWithAgency: {
						started: family.is_working_with_agency === 'Y',
						date: family.working_with_agency_date ? new Date( family.working_with_agency_date ) : undefined
					},
					MAPPTrainingCompleted: {
						completed: !!family.mapp_training_date,	// no match for this
						date: family.mapp_training_date ? new Date( family.mapp_training_date ) : undefined
					}
				},

				homestudy: {
					completed: family.is_home_studied === 'Y',
					initialDate: family.home_study_date ? new Date( family.home_study_date ) : undefined,
					mostRecentDate: family.home_study_date ? new Date( family.home_study_date ) : undefined // This is correct per Lisa, it's not in the old system
				},

				onlineMatching: { // This may come out if the new system handles this funtionality correctly
					started: !!family.online_matching_date, // this comes from the extranet in the old system
					date: family.online_matching_date ? new Date( family.online_matching_date ) : undefined
				},

				registeredWithMARE: {
					registered: family.is_registered === 'Y',
					date: family.registered_date ? new Date( family.registered_date ) : undefined,
					status: familyStatusesMap[ family.status ]
				},

				familyProfile: {
					created: family.has_family_profile === 'Y',
					date: family.family_profile_date ? new Date( family.family_profile_date ) : undefined
				},

				closed: {
					isClosed: family.is_closed === 'Y',
					date: family.closed_date ? new Date( family.closed_date ) : undefined,
					reason: closedReasonsMap[ family.closed_reason ]
				},
			
				infoPacket: { // English/Electronic, English/Hardcopy, Spanish/Electronic, Spanish/Hardcopy, None
					packet: family.info_pack === 'EE' || family.info_pack === 'EH' ? 'English' :
							family.info_pack === 'SE' || family.info_pack === 'SH' ? 'Spanish' :
							'none',
					date: family.info_pack_sent_date ? new Date( family.info_pack_sent_date ) : undefined,
					notes: family.info_pack_notes.trim()
				},

				matchingPreferences: {
					gender: matchingGenderPreferences,
					legalStatus: matchingLegalStatusPreferences,

					adoptionAges: {
						from: family.adoption_ages_from ? parseInt( family.adoption_ages_from, 10 ) : undefined,
						to: family.adoption_ages_to ? parseInt( family.adoption_ages_to, 10 ) : undefined
					},

					numberOfChildrenToAdopt: family.number_of_children_to_adopt ? parseInt( family.number_of_children_to_adopt, 10 ) : undefined,
					siblingContact: family.accept_sibling_contact === 'Y',
					birthFamilyContact: family.accept_birth_family_contact === 'Y',
					
					maxNeeds: { // if these don't exist, we'll need a default value
						physical: disabilityStatusesMap[ family.max_physical_dst_id ]  || 'none',
						intellectual: disabilityStatusesMap[ family.max_intellectual_dst_id ] || 'none',
						emotional: disabilityStatusesMap[ family.max_emotional_dst_id ] || 'none'
					}
				}

			});

			newFamily.save( ( err, savedModel ) => {
				// if we run into an error
				if( err ) {
					console.error( `error saving family - ${ err }` );
					// store a reference to the entry that caused the error
					importErrors.push( { id: family.fam_id, error: err } );
				}

				// fire off the next iteration of our generator
				if( pauseUntilSaved ) {
					familyGenerator.next();
				}
			});
		})
		.catch( err => {
			// if a error was provided
			if( err ) {
				console.error( `error fetching city or town ${ family.city.trim() } in state ${ family.state }` );
				// we can assume it was a reject from trying to fetch the city or town by an unrecognized name
				cityOrTownNameError.add( `error fetching city or town ${ family.city.trim() } in state ${ family.state } - ${ err }` );
			}

			if( pauseUntilSaved ) {
				familyGenerator.next();
			}
		});
};

// instantiates the generator used to create family records at a regulated rate
const familyGenerator = exports.generateFamilies();