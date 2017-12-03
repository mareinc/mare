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
		let allLanguagesArray = family.primary_language.trim().replace( '/', ',' )
														.replace( 'Haitian Creole/Eng', 'french, english' ) // This has to be done since the space is used as a delimeter in some cases
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
		importErrors.push( { id: family.fam_id, error: `missing family constellation: ${ primaryLanguage }` } );
	}
	// if the family has no state listed
	if( !family.state ) {
		// push an error so we can easily identify to problematic entries
		importErrors.push( { id: family.fam_id, error: 'no state information provided' } );
	}
	// if the family has no city listed
	if( !family.city ) {
		// push an error so we can easily identify to problematic entries
		importErrors.push( { id: family.fam_id, error: 'no city information provided' } );
	}
	// adjust cities / towns in MA to have names the system expects so it can find their records
	switch( family.city ) {
		case `1`: family.city = `unknown`; break;
		case `111`: family.city = `unknown`; break;
		case `1111`: family.city = `unknown`; break;
		case `NA`: family.city = `unknown`; break;
		case `Air Sta Cape Cod`: family.city = `unknown`; break;
		case `Any City`: family.city = `unknown`; break;
		case `Anycity`: family.city = `unknown`; break;
		case `Anytown`: family.city = `unknown`; break;
		case `Anytown,`: family.city = `unknown`; break;
		case `Anywhere`: family.city = `unknown`; break;
		case `ASCC`: family.city = `unknown`; break;
		case `Assonet`: family.city = `unknown`; break;
		case `Babson`: family.city = `unknown`; break;
		case `Bad Address`: family.city = `unknown`; break;
		case `Baldwinville`: family.city = `unknown`; break;
		case `Baldwinsville`: family.city = `unknown`; break;
		case `Bartlett`: family.city = `unknown`; break;
		case `Bondsville`: family.city = `unknown`; break;
		case `Bowlingham`: family.city = `unknown`; break;
		case `Brant Rock`: family.city = `unknown`; break;
		case `Bryantville`: family.city = `unknown`; break;
		case `Burwick`: family.city = `unknown`; break;
		case `Butler`: family.city = `unknown`; break;
		case `Buzzards Bay`: family.city = `unknown`; break;
		case `Buzzard's Bay`: family.city = `unknown`; break;
		case `Byfield`: family.city = `unknown`; break;
		case `Byield`: family.city = `unknown`; break;
		case `Calais`: family.city = `unknown`; break;
		case `Cataumet`: family.city = `unknown`; break;
		case `Cedarville`: family.city = `unknown`; break;
		case `Centerville`: family.city = `unknown`; break;
		case `Chartley`: family.city = `unknown`; break;
		case `Cherry Valley`: family.city = `unknown`; break;
		case `Chestnut Hill`: family.city = `unknown`; break;
		case `City unknown`: family.city = `unknown`; break;
		case `Cotuit`: family.city = `unknown`; break;
		case `Devens`: family.city = `unknown`; break;
		case `East Longfellow`: family.city = `unknown`; break;
		case `Edgemere`: family.city = `unknown`; break;
		case `Fayville`: family.city = `unknown`; break;
		case `Feeding Hill`: family.city = `unknown`; break;
		case `Feeding Hills`: family.city = `unknown`; break;
		case `Feeding HIlls`: family.city = `unknown`; break;
		case `Feeding Hillls`: family.city = `unknown`; break;
		case `Fiskdale`: family.city = `unknown`; break;
		case `Fiskeale`: family.city = `unknown`; break;
		case `Florence`: family.city = `unknown`; break;
		case `Foresdale`: family.city = `unknown`; break;
		case `Forestdale`: family.city = `unknown`; break;
		case `Gilbertville`: family.city = `unknown`; break;
		case `Green Harbor`: family.city = `unknown`; break;
		case `Hatchville`: family.city = `unknown`; break;
		case `Haydenville`: family.city = `unknown`; break;
		case `Hometown`: family.city = `unknown`; break;
		case `Housatonic`: family.city = `unknown`; break;
		case `Humarock`: family.city = `unknown`; break;
		case `Indian Orchard`: family.city = `unknown`; break;
		case `io`: family.city = `unknown`; break;
		case `Jefferson`: family.city = `unknown`; break;
		case `Leeds`: family.city = `unknown`; break;
		case `Lester`: family.city = `unknown`; break;
		case `Linwood`: family.city = `unknown`; break;
		case `Litchfield`: family.city = `unknown`; break;
		case `Lusaka`: family.city = `unknown`; break;
		case `Lynwood`: family.city = `unknown`; break;
		case `Magnolia`: family.city = `unknown`; break;
		case `Manomet`: family.city = `unknown`; break;
		case `Marim`: family.city = `unknown`; break;
		case `Marlborohead`: family.city = `Marlborough`; break;
		case `Marston Mills`: family.city = `unknown`; break;
		case `Marstons Mills`: family.city = `unknown`; break;
		case `Marthas Vineyard`: family.city = `unknown`; break;
		case `Martha's Vineyard`: family.city = `unknown`; break;
		case `Martinsville`: family.city = `unknown`; break;
		case `Mattapan`: family.city = `unknown`; break;
		case `Mill River`: family.city = `unknown`; break;
		case `Millers Falls`: family.city = `unknown`; break;
		case `Mision Park`: family.city = `unknown`; break;
		case `Monument Beach`: family.city = `unknown`; break;
		case `Murfreesboro`: family.city = `unknown`; break;
		case `n/a`: family.city = `unknown`; break;
		case `na`: family.city = `unknown`; break;
		case `no`: family.city = `unknown`; break;
		case `no city provided`: family.city = `unknown`; break;
		case `none`: family.city = `unknown`; break;
		case `No state`: family.city = `unknown`; break;
		case `North End`: family.city = `unknown`; break;
		case `Not available`: family.city = `unknown`; break;
		case `Not given`: family.city = `unknown`; break;
		case `Not Given`: family.city = `unknown`; break;
		case `Onset`: family.city = `unknown`; break;
		case `Osterville`: family.city = `unknown`; break;
		case `Oxbridge`: family.city = `unknown`; break;
		case `Plaistow`: family.city = `unknown`; break;
		case `Pocasset`: family.city = `unknown`; break;
		case `Prides Crossing`: family.city = `unknown`; break;
		case `Readville`: family.city = `unknown`; break;
		case `Rindge`: family.city = `unknown`; break;
		case `Rochdale`: family.city = `unknown`; break;
		case `Roslindale`: family.city = `unknown`; break;
		case `Rosllindale`: family.city = `unknown`; break;
		case `Rsolindale`: family.city = `unknown`; break;
		case `See Comments`: family.city = `unknown`; break;
		case `Southfiled`: family.city = `unknown`; break;
		case `Sprinfield`: family.city = `unknown`; break;
		case `Springlfield`: family.city = `unknown`; break;
		case `Squantum`: family.city = `unknown`; break;
		case `Still River`: family.city = `unknown`; break;
		case `Stonington`: family.city = `unknown`; break;
		case `Sturgeon`: family.city = `unknown`; break;
		case `Surrender Call`: family.city = `unknown`; break;
		case `Three Rivers`: family.city = `unknown`; break;
		case `Turners Fall`: family.city = `unknown`; break;
		case `Turners Falls`: family.city = `unknown`; break;
		case `unknown`: family.city = `unknown`; break;
		case `Unknown`: family.city = `unknown`; break;
		case `UNKNOWN`: family.city = `unknown`; break;
		case `Vancouver`: family.city = `unknown`; break;
		case `Vineyard Haven`: family.city = `unknown`; break;
		case `Vineyardhaven`: family.city = `unknown`; break;
		case `Vinyard Haven`: family.city = `unknown`; break;
		case `Waban`: family.city = `unknown`; break;
		case `Waquoit`: family.city = `unknown`; break;
		case `Wells`: family.city = `unknown`; break;
		case `Wheelwright`: family.city = `unknown`; break;
		case `Whitan`: family.city = `unknown`; break;
		case `White Horse Beach`: family.city = `unknown`; break;
		case `will not give`: family.city = `unknown`; break;
		case `Wilton`: family.city = `unknown`; break;
		case `Wollaston`: family.city = `unknown`; break;
		case `Woods Hole`: family.city = `unknown`; break;
		case `x`: family.city = `unknown`; break;
		case `xxx`: family.city = `unknown`; break;
		case `xxxx`: family.city = `unknown`; break;
		case `xxxxxx`: family.city = `unknown`; break;
		case `North Chelmsford`: family.city = `Chelmsford`; break;
		case `Roxbury`: family.city = `Roxbury/Mission Hill`; break;
		case `Dorchester`: family.city = `Boston - Dorchester - Center`; break;
		case `Dorcehster`: family.city = `Boston - Dorchester - Center`; break;
		case `Northboro`: family.city = `Northborough`; break;
		case `Jamaica Plain`: family.city = `Boston - Jamaica Plain`; break;
		case `East Boston`: family.city = `Boston - East Boston`; break;
		case `Boston`: family.city = `Boston - Dorchester - Center`; break;
		case `.Danvers`: family.city = `Danvers`; break;
		case `North Marshfield`: family.city = `Marshfield`; break;
		case `Jamaica  Plain`: family.city = `Boston - Jamaica Plain`; break;
		case `W. Peabody`: family.city = `Peabody`; break;
		case `Nactick`: family.city = `Natick`; break;
		case `Beverley`: family.city = `Beverly`; break;
		case `Tewsbury`: family.city = `Tewksbury`; break;
		case `Middleboro`: family.city = `Middleborough`; break;
		case `N Attleboro`: family.city = `North Attleborough`; break;
		case `E Boston`: family.city = `Boston - East Boston`; break;
		case `West Yarmouth`: family.city = `Yarmouth`; break;
		case `Westboro`: family.city = `Westborough`; break;
		case `N. Easton`: family.city = `North Easton`; break;
		case `South Boston`: family.city = `Boston - Dorchester - Center`; break;
		case `Springfield`: family.city = `West Springfield`; break;
		case `S Easton`: family.city = `South Easton`; break;
		case `Brighton`: family.city = `Boston - Brighton`; break;
		case `Lunenberg`: family.city = `Lunenburg`; break;
		case `South Hamilton`: family.city = `Hamilton`; break;
		case `Foxboro`: family.city = `Foxborough`; break;
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
		case `West Roxbury`: family.city = `Roxbury/Mission Hill`; break;
		case `Shelburne Falls`: family.city = `Shelburne`; break;
		case `Marlboro`: family.city = `Marlborough`; break;
		case `Lennoxdate`: family.city = `Lenox`; break;
		case `Charlestown`: family.city = `Boston - Charlestown`; break;
		case `N Andover`: family.city = `North Andover`; break;
		case `No. Dartmouth`: family.city = `Dartmouth`; break;
		case `Tauton`: family.city = `Taunton`; break;
		case `West Barnstable`: family.city = `Barnstable`; break;
		case `South Attleboro`: family.city = `Attleboro`; break;
		case `Leominister`: family.city = `Leominster`; break;
		case `Bridgwater`: family.city = `Bridgewater`; break;
		case `cohasset`: family.city = `Cohasset`; break;
		case `Wellesly`: family.city = `Wellesley`; break;
		case `North Attleboro`: family.city = `North Attleborough`; break;
		case `W. Bridgewater`: family.city = `West Bridgewater`; break;
		case `S. Hadley`: family.city = `South Hadley`; break;
		case `East Falmouth`: family.city = `Falmouth`; break;
		case `North Billerica`: family.city = `Billerica`; break;
		case `Lenoxdale`: family.city = `Lenox`; break;
		case `Long Meadow`: family.city = `Longmeadow`; break;
		case `North Carver`: family.city = `Carver`; break;
		case `Newtonville`: family.city = `Newton`; break;
		case `Marshfield Hills`: family.city = `Marshfield`; break;
		case `Lynn,`: family.city = `Lynn`; break;
		case `West Newton`: family.city = `Newton`; break;
		case `No Falmouth`: family.city = `Falmouth`; break;
		case `Barrington`: family.city = `Great Barrington`; break;
		case `Whitensville`: family.city = `Whitinsville`; break;
		case `N Grafton`: family.city = `Grafton`; break;
		case `Tyngsboro`: family.city = `Tyngsborough`; break;
		case `E Bridgewater`: family.city = `East Bridgewater`; break;
		case `N. Chelmsford`: family.city = `Chelmsford`; break;
		case `Leominster MA`: family.city = `Leominster`; break;
		case `Harwichport`: family.city = `Harwich`; break;
		case `Boxboro`: family.city = `Boxborough`; break;
		case `S. Boston`: family.city = `Boston - Dorchester - Center`; break;
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
		case `Sgus`: family.city = `Saugus`; break;
		case `Needham Heights`: family.city = `Needham`; break;
		case `W. Sommerville`: family.city = `Somerville`; break;
		case `pepperell`: family.city = `Pepperell`; break;
		case `S Youmouth`: family.city = `Yarmouth`; break;
		case `N. Andover`: family.city = `North Andover`; break;
		case `boston`: family.city = `Boston - Dorchester - Center`; break;
		case `Sommerville`: family.city = `Somerville`; break;
		case `South Weymouth`: family.city = `Weymouth`; break;
		case `Boxford.`: family.city = `Boxford`; break;
		case `N  Attleboro`: family.city = `North Attleborough`; break;
		case `N Billerica`: family.city = `Billerica`; break;
		case `southbridge`: family.city = `Southbridge`; break;
		case `Brooklyn`: family.city = `Brookline`; break;
		case `Malboro`: family.city = `Marlborough`; break;
		case `Worburn`: family.city = `Woburn`; break;
		case `W Barnstable`: family.city = `Barnstable`; break;
		case `E. Walpole`: family.city = `Walpole`; break;
		case `dedham`: family.city = `Dedham`; break;
		case `norfolk`: family.city = `Norfolk`; break;
		case `E Weymouth`: family.city = `Weymouth`; break;
		case `Barry`: family.city = `Barre`; break;
		case `N, Andover`: family.city = `North Andover`; break;
		case `N Chelmsford`: family.city = `Chelmsford`; break;
		case `West Somerville`: family.city = `Somerville`; break;
		case `Yarmouth Port`: family.city = `Yarmouth`; break;
		case `East Weymouth`: family.city = `Weymouth`; break;
		case `Milbury`: family.city = `Millbury`; break;
		case `Beverly Farms`: family.city = `Beverly`; break;
		case `Shrewbury`: family.city = `Shrewsbury`; break;
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
		case `S Boston`: family.city = `Boston - Dorchester - Center`; break;
		case `E Wareham`: family.city = `Wareham`; break;
		case `Plymoutth`: family.city = `Plymouth`; break;
		case `Millibury`: family.city = `Millbury`; break;
		case `N Quincy`: family.city = `Quincy`; break;
		case `W Medford`: family.city = `Medford`; break;
		case `South Yarmouth`: family.city = `Yarmouth`; break;
		case `N. Quincy`: family.city = `Quincy`; break;
		case `Nofolk`: family.city = `Norfolk`; break;
		case `Southboro`: family.city = `Southborough`; break;
		case `Mefield`: family.city = `Medfield`; break;
		case `N. Weymouth`: family.city = `Weymouth`; break;
		case `W Roxbury`: family.city = `Roxbury/Mission Hill`; break;
		case `georgetown`: family.city = `Georgetown`; break;
		case `Newton Center`: family.city = `Newton`; break;
		case `East Walpole`: family.city = `Walpole`; break;
		case `No Reading`: family.city = `North Reading`; break;
		case `Otis ANGB`: family.city = `Otis`; break;
		case `Manchester bythe Sea`: family.city = `Manchester`; break;
		case `Haverill`: family.city = `Haverhill`; break;
		case `Charlton City`: family.city = `Charlton`; break;
		case `Adover`: family.city = `Andover`; break;
		case `mansfield`: family.city = `Mansfield`; break;
		case `W Lynn`: family.city = `Lynn`; break;	
		case `Wesminster`: family.city = `Westminster`; break;	
		case `East Taunton`: family.city = `Taunton`; break;
		case `S Attleboro`: family.city = `Attleboro`; break;
		case `W Warren`: family.city = `Warren`; break;
		case `Yarmouthport`: family.city = `Yarmouth`; break;
		case `LINCOLN`: family.city = `Lincoln`; break;
		case `North Grafton`: family.city = `Grafton`; break;
		case `Marlblehead`: family.city = `Marblehead`; break;
		case `N Oxford`: family.city = `Oxford`; break;
		case `BOURNE`: family.city = `Bourne`; break;
		case `Lanesboro`: family.city = `Lanesborough`; break;
		case `DEDHAM`: family.city = `Dedham`; break;
		case `No  Attleboro`: family.city = `North Attleborough`; break;
		case `W Springfield`: family.city = `West Springfield`; break;
		case `Somervillle`: family.city = `Somerville`; break;
		case `CAMBRIDGE`: family.city = `Cambridge`; break;
		case `BOXBOROUGH`: family.city = `Boxborough`; break;
		case `LITTLETON`: family.city = `Littleton`; break;
		case `S. Barre`: family.city = `Barre`; break;
		case `PRINCETON`: family.city = `Princeton`; break;
		case `Berkeley`: family.city = `Berkley`; break;
		case `NATICK`: family.city = `Natick`; break;
		case `N Adams`: family.city = `North Adams`; break;
		case `Blasckton`: family.city = `Blackstone`; break;
		case `Wilimington`: family.city = `Wilmington`; break;
		case `N Reading`: family.city = `North Reading`; break;
		case `South Dartmouth`: family.city = `Dartmouth`; break;
		case `MIDDLEBORO`: family.city = `Middleborough`; break;
		case `Agawan`: family.city = `Agawam`; break;
		case `Westboro`: family.city = `Westborough`; break;
		case `Framinghan`: family.city = `Framingham`; break;
		case `Monponsett`: family.city = `Mattapoisett`; break;
		case `South Harwich`: family.city = `Harwich`; break;
		case `S Lawrence`: family.city = `Lawrence`; break;
		case `Newton Centre`: family.city = `Newton`; break;
		case `Oak Bluff`: family.city = `Oak Bluffs`; break;	
		case `N Harwich`: family.city = `Harwich`; break;
		case `Stowe`: family.city = `Stow`; break;
		case `Winchendon Springs`: family.city = `Winchendon`; break;
		case `W. Roxbury`: family.city = `Roxbury/Mission Hill`; break;
		case `S Carver`: family.city = `Carver`; break;
		case `Framigham`: family.city = `Framingham`; break;
		case `N Orange`: family.city = `Orange`; break;
		case `W Brookfield`: family.city = `West Brookfield`; break;
		case `Dennisport`: family.city = `Dennis`; break;
		case `North Orange`: family.city = `Orange`; break;
		case `Whitenville`: family.city = `Whitinsville`; break;
		case `W Yarmouth`: family.city = `Yarmouth`; break;
		case `N Dartmouth`: family.city = `Dartmouth`; break;
		case `1Dorchester`: family.city = `Boston - Dorchester - Center`; break;
		case `South Dennis`: family.city = `Dennis`; break;
		case `S. Easton`: family.city = `South Easton`; break;
		case `Hanscom`: family.city = `Bedford`; break;
		case `Hanscom AFB`: family.city = `Bedford`; break;
		case `Hanscom Air Force`: family.city = `Bedford`; break;
		case `Arrleboro`: family.city = `Attleboro`; break;
		case `Plymton`: family.city = `Plympton`; break;
		case `S Atlleboro`: family.city = `Attleboro`; break;
		case `Seeknok`: family.city = `Seekonk`; break;
		case `West Peabody`: family.city = `Peabody`; break;
		case `W Newbury`: family.city = `West Newbury`; break;
		case `Hyannisport`: family.city = `Hyannis`; break;
		case `E Douglas`: family.city = `Douglas`; break;
		case `West Falmouth`: family.city = `Falmouth`; break;
		case `North Quincy`: family.city = `Quincy`; break;
		case `Swansee`: family.city = `Swansea`; break;
		case `No Adams`: family.city = `North Adams`; break;
		case `North Weymouth`: family.city = `Weymouth`; break;
		case `Greefield`: family.city = `Greenfield`; break;
		case `Harwidh`: family.city = `Harwich`; break;
		case `S Hadley`: family.city = `South Hadley`; break;
		case `/E.Bridgewater`: family.city = `East Bridgewater`; break;
		case `Abbington`: family.city = `Abington`; break;
		case `Acqshnet`: family.city = `Acushnet`; break;
		case `Ahburnham`: family.city = `Ashburnham`; break;
		case `Ahmerst`: family.city = `Amherst`; break;
		case `Asburnham`: family.city = `Ashburnham`; break;
		case `Asland`: family.city = `Ashland`; break;
		case `Attlboro`: family.city = `Attleboro`; break;
		case `Attleborogh`: family.city = `Attleboro`; break;
		case `Auberndale`: family.city = `Auburn`; break;
		case `Auburndale`: family.city = `Auburn`; break;
		case `Ayre`: family.city = `Ayer`; break;
		case `Barrie`: family.city = `Barre`; break;
		case `Belingham`: family.city = `Bellingham`; break;
		case `Billercia`: family.city = `Billerica`; break;
		case `Blackston`: family.city = `Blackstone`; break;
		case `Blckstone`: family.city = `Blackstone`; break;
		case `Bosnto`: family.city = `Boston - Dorchester - Center`; break;
		case `Boyloston`: family.city = `Boylston`; break;
		case `Bridgerwater`: family.city = `Bridgewater`; break;
		case `Brocton`: family.city = `Brockton`; break;
		case `Brooklline`: family.city = `Brookline`; break;
		case `Chelmford`: family.city = `Chelmsford`; break;
		case `Chesire`: family.city = `Cheshire`; break;
		case `Danville`: family.city = `Granville`; break;	
		case `Dochester`: family.city = `Boston - Dorchester - Center`; break;
		case `Dorcester`: family.city = `Boston - Dorchester - Center`; break;
		case `Dorchester Center`: family.city = `Boston - Dorchester - Center`; break;
		case `Dorchestere`: family.city = `Boston - Dorchester - Center`; break;
		case `Dorchseter`: family.city = `Boston - Dorchester - Center`; break;
		case `Doschester`: family.city = `Boston - Dorchester - Center`; break;
		case `Doylestown`: family.city = `Boylston`; break;
		case `Duxsbury`: family.city = `Duxbury`; break;
		case `E Freetown`: family.city = `Freetown`; break;
		case `E Sandwich`: family.city = `Sandwich`; break;
		case `E. Boston`: family.city = `Boston - East Boston`; break;
		case `E. Bridgewater`: family.city = `East Bridgewater`; break;
		case `E. Brookfield`: family.city = `East Brookfield`; break;
		case `E. Falmouth`: family.city = `Falmouth`; break;
		case `E. Longmeadow`: family.city = `East Longmeadow`; break;
		case `E. Sandwich`: family.city = `Sandwich`; break;
		case `E. Wareham`: family.city = `Wareham`; break;
		case `E.Bridgewater`: family.city = `East Bridgewater`; break;
		case `E.Dennis`: family.city = `Dennis`; break;
		case `East  Weymouth`: family.city = `Weymouth`; break;
		case `East Bridgwater`: family.city = `East Bridgewater`; break;
		case `East Dennis`: family.city = `Dennis`; break;
		case `East Douglas`: family.city = `Douglas`; break;
		case `East Hampton`: family.city = `Easthampton`; break;
		case `East Harwich`: family.city = `Harwich`; break;
		case `East Kingston`: family.city = `Kingston`; break;
		case `East Lynn`: family.city = `Lynn`; break;
		case `East Tauton`: family.city = `Taunton`; break;
		case `East Templeton`: family.city = `Templeton`; break;
		case `East Wareham`: family.city = `Wareham`; break;
		case `Easy Weymouth`: family.city = `Weymouth`; break;
		case `Egdartown`: family.city = `Edgartown`; break;
		case `FAll River`: family.city = `Fall River`; break;
		case `Fall  River`: family.city = `Fall River`; break;
		case `Fitchbury`: family.city = `Fitchburg`; break;
		case `Freeman`: family.city = `Freetown`; break;
		case `Gardiner`: family.city = `Gardner`; break;
		case `HAFB`: family.city = `Bedford`; break;
		case `HAFB(Bedford)`: family.city = `Bedford`; break;
		case `HANOVER`: family.city = `Hanover`; break;
		case `Hamden`: family.city = `Hampden`; break;
		case `Hampton`: family.city = `Hampden`; break;
		case `Hanscom Afb`: family.city = `Bedford`; break;
		case `Havard`: family.city = `Harvard`; break;
		case `Hawich`: family.city = `Harwich`; break;
		case `High Park`: family.city = `Hyde Park`; break;
		case `Hollis`: family.city = `Holliston`; break;
		case `Hopkington`: family.city = `Hopkinton`; break;
		case `Hubbarston`: family.city = `Hubbardston`; break;
		case `Hyannis Port`: family.city = `Hyannis`; break;
		case `Ipswitch`: family.city = `Ipswich`; break;
		case `Jamiaca Plain`: family.city = `Boston - Jamaica Plain`; break;
		case `Laicester`: family.city = `Leicester`; break;
		case `Lawrenced`: family.city = `Lawrence`; break;
		case `Ludllow`: family.city = `Ludlow`; break;
		case `Lynfield`: family.city = `Lynnfield`; break;
		case `Lynnnfield`: family.city = `Lynnfield`; break;
		case `Malborough`: family.city = `Marlborough`; break;
		case `Marboro`: family.city = `Marlborough`; break;
		case `Marborough`: family.city = `Marlborough`; break;
		case `Marllborough`: family.city = `Marlborough`; break;
		case `Mathuen`: family.city = `Methuen`; break;
		case `Mattapisett`: family.city = `Mattapoisett`; break;
		case `Metheun`: family.city = `Methuen`; break;
		case `Middletown`: family.city = `Middleton`; break;
		case `Monton`: family.city = `Monson`; break;
		case `Munson`: family.city = `Monson`; break;
		case `N. Adams`: family.city = `North Adams`; break;
		case `N. Amherst`: family.city = `Amherst`; break;
		case `N. Bedford`: family.city = `New Bedford`; break;
		case `N. Dartrmouth`: family.city = `Dartmouth`; break;
		case `N. Dighton`: family.city = `Dighton`; break;
		case `N. Falmouth`: family.city = `Falmouth`; break;
		case `N. Grafton`: family.city = `Grafton`; break;
		case `N. Harwich`: family.city = `Harwich`; break;
		case `N. Quincy,`: family.city = `Quincy`; break;
		case `N. Waltham`: family.city = `Waltham`; break;
		case `N.Grafton`: family.city = `Grafton`; break;
		case `NEWTON`: family.city = `Newton`; break;
		case `Neddham`: family.city = `Needham`; break;
		case `Neeham`: family.city = `Needham`; break;
		case `New BeDford`: family.city = `New Bedford`; break;
		case `New bedford`: family.city = `New Bedford`; break;
		case `Newbedford`: family.city = `New Bedford`; break;
		case `Newton Highlands`: family.city = `Newton`; break;
		case `No Andover`: family.city = `North Andover`; break;
		case `No Attleboro`: family.city = `North Attleborough`; break;
		case `No. Attleboro`: family.city = `North Attleborough`; break;
		case `No. Easton`: family.city = `North Easton`; break;
		case `Norfold`: family.city = `Norfolk`; break;
		case `Norfork`: family.city = `Norfolk`; break;
		case `Norht Attleborough`: family.city = `North Attleborough`; break;
		case `North  Andover`: family.city = `North Andover`; break;
		case `North Chatham`: family.city = `Chatham`; break;
		case `North Darthmouth`: family.city = `Dartmouth`; break;
		case `North Dartmouth`: family.city = `Dartmouth`; break;
		case `North Dighton`: family.city = `Dighton`; break;
		case `North Eastham`: family.city = `Eastham`; break;
		case `North Eaton`: family.city = `North Easton`; break;
		case `North Falmouth`: family.city = `Falmouth`; break;
		case `North Hatfield`: family.city = `Hatfield`; break;
		case `North Oxford`: family.city = `Oxford`; break;
		case `North Pembroke`: family.city = `Pembroke`; break;
		case `Northhampton`: family.city = `Northampton`; break;
		case `Pembrook`: family.city = `Pembroke`; break;
		case `Peppeerell`: family.city = `Pepperell`; break;
		case `Planfield`: family.city = `Plainfield`; break;
		case `Plimpton`: family.city = `Plympton`; break;
		case `Pymouth`: family.city = `Plymouth`; break;
		case `QUINCY`: family.city = `Quincy`; break;
		case `Quin cy`: family.city = `Quincy`; break;
		case `Qunicy`: family.city = `Quincy`; break;
		case `RAndolph`: family.city = `Randolph`; break;
		case `Randoph`: family.city = `Randolph`; break;
		case `Raynham Center`: family.city = `Raynham`; break;
		case `Rehobeth`: family.city = `Rehoboth`; break;
		case `Revere Beach`: family.city = `Revere`; break;
		case `Roxbury Crossing`: family.city = `Roxbury/Mission Hill`; break;
		case `Rutline`: family.city = `Rutland`; break;
		case `S Deerfield`: family.city = `Deerfield`; break;
		case `S Wellfleet`: family.city = `Wellfleet`; break;
		case `S Weymouth`: family.city = `Weymouth`; break;
		case `S. Attleboro`: family.city = `Attleboro`; break;
		case `S. Boro`: family.city = `Southborough`; break;
		case `S. Bridge`: family.city = `Southbridge`; break;
		case `S. Carver`: family.city = `Carver`; break;
		case `S. Deerfield`: family.city = `Deerfield`; break;
		case `S. Hamilton`: family.city = `Hamilton`; break;
		case `S. Lawrence`: family.city = `Lawrence`; break;
		case `S.Chatham`: family.city = `Chatham`; break;
		case `S.Hamilton`: family.city = `Hamilton`; break;
		case `S.Ludlow`: family.city = `Ludlow`; break;
		case `STOW`: family.city = `Stow`; break;
		case `Sagamore Beach`: family.city = `Sagamore`; break;
		case `Sherbon`: family.city = `Sherborn`; break;
		case `Sherly`: family.city = `Shirley`; break;
		case `Somervile`: family.city = `Somerville`; break;
		case `Soth Attleboro`: family.city = `Attleboro`; break;
		case `Soutboro`: family.city = `Southborough`; break;
		case `South Barre`: family.city = `Barre`; break;
		case `South Borough`: family.city = `Southborough`; break;
		case `South Darmouth`: family.city = `Dartmouth`; break;
		case `South Deerfield`: family.city = `Deerfield`; break;
		case `South Hampton`: family.city = `Southampton`; break;
		case `South Lancaster`: family.city = `Lancaster`; break;
		case `South Natick`: family.city = `Natick`; break;
		case `South Orleans`: family.city = `Orleans`; break;
		case `South Walpole`: family.city = `Walpole`; break;
		case `South Waolpole`: family.city = `Walpole`; break;
		case `Southbrige`: family.city = `Southbridge`; break;
		case `Southeaston`: family.city = `South Easton`; break;
		case `Stougton`: family.city = `Stoughton`; break;
		case `Stowghton`: family.city = `Stoughton`; break;
		case `Templetown`: family.city = `Templeton`; break;
		case `Tewbsbury`: family.city = `Tewksbury`; break;
		case `Tewsksbury`: family.city = `Tewksbury`; break;
		case `Touton`: family.city = `Taunton`; break;
		case `Tyngsgro`: family.city = `Tyngsborough`; break;
		case `Tynsboro`: family.city = `Tyngsborough`; break;
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
		case `W. Springfield`: family.city = `West Springfield`; break;
		case `W. Yarmouth`: family.city = `Yarmouth`; break;
		case `W.Roxbury`: family.city = `Roxbury/Mission Hill`; break;
		case `WASHINGTON`: family.city = `Washington`; break;
		case `WEYMOUTH`: family.city = `Weymouth`; break;
		case `Watetown`: family.city = `Watertown`; break;
		case `Waymouth`: family.city = `Weymouth`; break;
		case `Wellesley Hills`: family.city = `Wellesley`; break;
		case `Wellsley`: family.city = `Wellesley`; break;
		case `Wesborough`: family.city = `Westborough`; break;
		case `West Branstable`: family.city = `Barnstable`; break;
		case `West Deerfield`: family.city = `Deerfield`; break;
		case `West Dennis`: family.city = `Dennis`; break;
		case `West Groton`: family.city = `Groton`; break;
		case `West Harwich`: family.city = `Harwich`; break;
		case `West Lynn`: family.city = `Lynn`; break;
		case `West Point`: family.city = `Westport`; break;
		case `West Sprinfield`: family.city = `West Springfield`; break;
		case `West Wareham`: family.city = `Wareham`; break;
		case `West Waren`: family.city = `Warren`; break;
		case `West Warren`: family.city = `Warren`; break;
		case `West Whately`: family.city = `Whately`; break;
		case `Westminister`: family.city = `Westminster`; break;
		case `Wichendon Springs`: family.city = `Winchendon`; break;
		case `Wilmingtom`: family.city = `Wilmington`; break;
		case `Winchedon`: family.city = `Winchendon`; break;
		case `Woburn,`: family.city = `Woburn`; break;
		case `Worcetser`: family.city = `Worcester`; break;
		case `Wrenthan`: family.city = `Wrentham`; break;
		case `Wretham`: family.city = `Wrentham`; break;
		case `beverly`: family.city = `Beverly`; break;
		case `middleton`: family.city = `Middleton`; break;
		case `roxbury`: family.city = `Roxbury/Mission Hill`; break;
		case `somerville`: family.city = `Somerville`; break;
	}

	// create a promise for fetching the MA city or town associated with the agency
	const cityOrTownLoaded = utilityModelFetch.getCityOrTownByName( family.city.trim(), family.state );
	// once we've fetch the city or town
	cityOrTownLoaded.then( cityOrTown => {

		// populate instance for Family object
		let newFamily = new Family.model({
			// every family needs an email, this will generate a placeholder which will be updated during the family contacts import
			email: `placeholder0${ family.fam_id }@email.com`,
			// every family needs a password, this will generate a placeholder which will be updated during the family contacts import
			password: `${ family.fam_id }`,

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
				// store a reference to the entry that caused the error
				importErrors.push( { id: family.fam_id, error: err.err } );
			}

			// fire off the next iteration of our generator
			if( pauseUntilSaved ) {
				familyGenerator.next();
			}
		});
	})
	.catch( reason => {
		// if a reason was provided
		if( reason ) {
			// we can assume it was a reject from trying to fetch the city or town by an unrecognized name
			cityOrTownNameError.add( reason );
		}

		if( pauseUntilSaved ) {
			familyGenerator.next();
		}
	});
};

// instantiates the generator used to create family records at a regulated rate
const familyGenerator = exports.generateFamilies();