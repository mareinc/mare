const _ = require('underscore');

/* A place for generic utility functions for data processing and other common tasks */
exports.truncateText = function truncateText(text, options) {
    // If the text is empty, return an empty string
    if(text.length === 0) {
        return '';
    }
    // Remove leading and trailing whitespace
    var trimText = text.trim();

    // If the trimmed text is <= options.targetLength characters, return it.
    if(trimText.length <= options.targetLength) {
        return trimText;
    }
    // If the character at options.targetLength is a space, return the clean character substring
    if(trimText.charAt(options.targetLength) === ' ') {
        return trimText.substr(0, options.targetLength);
    }
    // If the character at options.targetLength is not a space, return the longest substring ending in a space
    if(trimText.charAt(options.targetLength) !== ' ') {
        var lastSpace = trimText.substr(0, options.targetLength).lastIndexOf(' ');
        return trimText.substr(0, lastSpace) + '&#8230;';
    }
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