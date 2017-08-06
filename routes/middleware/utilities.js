/* A place for generic utility functions for data processing and other common tasks */

const _			= require( 'underscore' ),
	  crypto	= require( 'crypto' );

/* remove any HTML style tags from text */
exports.stripTags = text => {
	return text.replace( /(<([^>]+)>)/ig, '' );
}

// TODO: add in a failure case similar to getReadableStringFromArray()
exports.truncateText = ( text, options ) => {
	// If the text is empty, return an empty string
	if( !text || text.length === 0 ) {
		return '';
	}
	// Remove leading and trailing whitespace
	var trimmedText = text.trim();

	// If the trimmed text is <= options.targetLength characters, return it.
	if( trimmedText.length <= options.targetLength ) {
		return trimmedText;
	}
	// If the character at options.targetLength is a space, return the clean character substring
	if( trimmedText.charAt( options.targetLength ) === ' ' ) {
		return trimmedText.substr( 0, options.targetLength ) + '&#8230;';
	}
	// If the character at options.targetLength is not a space, return the longest substring ending in a space
	if( trimmedText.charAt( options.targetLength ) !== ' ' ) {
		var lastSpace = trimmedText.substr(0, options.targetLength).lastIndexOf(' ');
		return trimmedText.substr( 0, lastSpace ) + '&#8230;';
	}
};

// TODO: match the destructured parameters and default values in all server-side functions

/* Convert an array into a readable comma separated string */
/* ['Bob'] => 'Bob'
   ['Bob', 'Sam'], delimiter = 'and' => 'Bob and Sam'
   ['Bob', 'Sam', 'John'], delimiter = 'or' => 'Bob, Sam, or John' */

/* if it is indicated that the contents of the array are email addresses, wrap them in <a> tags */
/* ['admin@mareinc.org'] => <a href="mailto:admin@mareinc.org">admin@mareinc.org</a>
   ['admin@mareinc.org'], subject = 'subject' => <a href="mailto:admin@mareinc.org?Subject=subject">admin@mareinc.org</a> */
exports.getReadableStringFromArray = ({ array, delimiter = 'and' }) => {
	// if the passed in array is not an array, or delimiter isn't a string, return and log a message
	if( !Array.isArray( array ) || typeof delimiter !== 'string' ) {
		console.log( `invalid arguments passed to getReadableStringFromArray(). array: ${ array }, delimiter: ${ delimiter }, returning ''` );
		return '';
	}
	// if we were passed an empty array, return and log a message
	if( array.length === 0 ) {
		console.log( `empty array passed in to getReadableStringFromArray(), returning ''` );
		return '';
	}
	// converts the array into a comma separated string
	let string = array.join(', ');
	// if there was only one element in the array, no more work is needed
	if( array.length === 1 ) {
		return string;
	}
	// get the indices of the first and last comma
	const firstCommaIndex = string.indexOf(',');
	const lastCommaIndex = string.lastIndexOf(',');
	// if there's only one comma, replace it with the delimiter
	if( firstCommaIndex === lastCommaIndex ) {
		return string.replace( `, `, ` ${ delimiter } ` );
	// if there is more than one comma, replace the last one with the delimiter
	} else {
		// lastCommaIndex + 2 comes from ignoring the last comma and the single space after it
		return `${ string.slice( 0, lastCommaIndex ) } ${ delimiter } ${ string.slice( lastCommaIndex + 2, string.length ) }`;
	}
};

/* takes in the object containing the field to be modified, the name of the content field, and any modification specification */
exports.modifyWYSIWYGContent = ( object, content, options ) => {
	
	options.forEach( option => {

		switch( option.action ) {

			case 'add more links':
			
				console.log( `add 'em in` );
				
				break;

			case 'add classes':

				const matchString		= new RegExp( `<${ option.element }>` );
				const globalMatchString	= new RegExp( `<${ option.element }>`, 'g' );
				// NOTE: This will fail when confronted with WYSIWYG content that already has ids/classes/attributes attached.  To handle
				// more complex cases, this will need to be changed to a regular expression match
				if( option.targetAll ) {
					object[ content ] = object[ content ].replace( globalMatchString, `<${ option.element } class="${ option.classesToAdd }">`);
				} else {
					object[ content ] = object[ content ].replace( matchString, `<${ option.element } class="${ option.classesToAdd }">`);
				}
				
				break;
		}
	});
};
/* generates a random string to be used as a temporary password */
exports.generateAlphanumericHash = ( length ) => {
	// because it's a hex encoding, each unit will be two characters long, so we must divide by 2
	return crypto.randomBytes( Math.ceil( length / 2 ) ).toString( 'hex' );
};

/* add functionality to ES6 Set type for finding the union of two sets */
/* { a, b, c }, { b, c, d } => { a, b, c, d } */
Set.prototype.union = function( setB ) {
	var union = new Set( this );
	for ( var elem of setB ) {
		union.add( elem );
	}
	return union;
}

/* add functionality to ES6 Set type for finding the intersection of two sets */
/* { a, b, c }, { b, c, d } => { b, c } */
Set.prototype.intersection = function( setB ) {
	var intersection = new Set();
	for ( var elem of setB ) {
		if ( this.has( elem ) ) {
			intersection.add( elem );
		}
	}
	return intersection;
}

/* add functionality to ES6 Set type for finding the difference between two sets */
/* { a, b, c }, { b, c, d } => { a, d } */
Set.prototype.difference = function( setB ) {
	var difference = new Set( this );
	for ( var elem of setB ) {
		difference.delete( elem );
	}  
	return difference;
}

/* add functionality to ES6 Set type for finding the items that are exclusively in the first Set */
/* { a, b, c }, { b, c, d } => { a } */
Set.prototype.leftOuterJoin = function( setB ) {
	var difference = new Set( this );
	for( item of this ) {
		if( setB.has( item ) ) {
			difference.delete( item );
		}
	}; 
	return difference;
}

/* add functionality to ES6 Set type for finding the items that are exclusively in the second Set */
/* { a, b, c }, { b, c, d } => { d } */
Set.prototype.rightOuterJoin = function( setB ) {
	var difference = new Set( setB );
	for( item of setB ) {
		if( this.has( item ) ) {
			difference.delete( item );
		}
	};
	return difference;
}