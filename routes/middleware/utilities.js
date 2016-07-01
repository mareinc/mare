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
}