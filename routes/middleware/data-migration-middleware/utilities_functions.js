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