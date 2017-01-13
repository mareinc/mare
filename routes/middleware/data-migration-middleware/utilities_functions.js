/* utility functions to help beautify migration data */

/* pad a zip code with any leading zeros that may have been removed when csvtojson converted the string to a number */
module.exports.padZipCode = ( zipCode ) => {
	// if zipCode doesn't exist
	if( !zipCode ) {
		// return an empty string
		return '';
	}
	// if zipCode is already a string
	if( typeof zipCode === 'string' ) {
		// return it as is
		return zipCode;
	}
	// convert zipCode from a number to a string
	let zipCodeString = zipCode.toString();
	// while zipCode is less than 5 digits
	while( zipCodeString.length < 5 ) {
		// add a leading zero to it
		zipCodeString = `0${ zipCodeString }`;
	}
	// return the new zipCode string
	return zipCodeString;
}

/* find and list duplicate entries for the passed in field in the given data set array */
module.exports.getDuplicates = ( field, modelArray ) => {

	let values = [],
		duplicates = [];

	for( let model of modelArray ) {

		if( !model[ field ].trim() ) { continue; }

		if(!values.includes( model[ field ].toLowerCase() ) ) {
			values.push( model[ field ].toLowerCase() );
		} else {
			duplicates.push( model[ field ].toLowerCase() );
		}
	}

	// return the array of duplicate field values
	return duplicates;
}