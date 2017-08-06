var keystone = require( 'keystone' );

// TODO: these functions are also in models_social-worker.js middleware, they should be combined
/* take in an array of child ids and returns an array of their registration numbers */
exports.removeChildBookmarks = bookmarkedChildrenToRemove => {

    keystone.list( 'Family' ).model
            .find()
            .where( 'bookmarkedChildren' ).in( bookmarkedChildrenToRemove )
            .exec()
            .then( families => {

                for( let family of families ) {  
                    // get the current list of bookmarked children
                    let bookmarkedChildren	= family.get( 'bookmarkedChildren' );
                    // loop through the children bookmarks to be removed
                    for( let childId of bookmarkedChildrenToRemove ) {    
                        // store the index of the current child id in the bookmarkedChildren array if one exists
                        const bookmarkIndex	= bookmarkedChildren.indexOf( childId );   
                        // if we find the child, remove the bookmark
                        if( bookmarkIndex !== -1 ) {
                            bookmarkedChildren.splice( bookmarkIndex, 1 );
                        }
                    }
                    // save the family
					family.save();
                };

            }, err => {

                console.log( err );
            });
};

exports.removeSiblingBookmarks = bookmarkedSiblingsToRemove => {

    keystone.list( 'Family' ).model
            .find()
            .where( 'bookmarkedSiblings' ).in( bookmarkedSiblingsToRemove )
            .exec()
            .then( families => {

                for( let family of families ) {  
                    // get the current list of bookmarked children
                    let bookmarkedSiblings	= family.get( 'bookmarkedSiblings' );
                    // loop through the children bookmarks to be removed
                    for( let childId of bookmarkedSiblingsToRemove ) {    
                        // store the index of the current child id in the bookmarkedChildren array if one exists
                        const bookmarkIndex	= bookmarkedSiblings.indexOf( childId );   
                        // if we find the child, remove the bookmark
                        if( bookmarkIndex !== -1 ) {
                            bookmarkedSiblings.splice( bookmarkIndex, 1 );
                        }
                    }
                    // save the family
					family.save();
                };
                
            }, err => {

                console.log( err );
            });
}
