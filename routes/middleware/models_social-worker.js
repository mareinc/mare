var keystone = require( 'keystone' );

/* take in an array of child ids and returns an array of their registration numbers */
exports.removeChildBookmarks = bookmarkedChildrenToRemove => {
    console.time( 'social worker - remove child bookmarks' );
    keystone.list( 'Social Worker' ).model.find()
            .where( 'bookmarkedChildren' ).in( bookmarkedChildrenToRemove )
            .exec()
            .then( socialWorkers => {
                console.timeEnd( 'social worker - remove child bookmarks' );
                for( let socialWorker of socialWorkers ) {  
                    // get the current list of bookmarked children
                    let bookmarkedChildren	= socialWorker.get( 'bookmarkedChildren' );
                    // loop through the children bookmarks to be removed
                    for( let childId of bookmarkedChildrenToRemove ) {    
                        // store the index of the current child id in the bookmarkedChildren array if one exists
                        const bookmarkIndex	= bookmarkedChildren.indexOf( childId );   
                        // if we find the child, remove the bookmark
                        if( bookmarkIndex !== -1 ) {
                            bookmarkedChildren.splice( bookmarkIndex, 1 );
                        }
                    }
                    // save the social worker
					socialWorker.save();
                };

            }, err => {

                console.log( err );
            });
};

exports.removeSiblingBookmarks = bookmarkedSiblingsToRemove => {
    console.time( 'social worker - remove sibling bookmarks' );
    keystone.list( 'Social Worker' ).model.find()
            .where( 'bookmarkedSiblings' ).in( bookmarkedSiblingsToRemove )
            .exec()
            .then( socialWorkers => {
                console.timeEnd( 'social worker - remove sibling bookmarks' );
                for( let socialWorker of socialWorkers ) {  
                    // get the current list of bookmarked children
                    let bookmarkedSiblings	= socialWorker.get( 'bookmarkedSiblings' );
                    // loop through the children bookmarks to be removed
                    for( let childId of bookmarkedSiblingsToRemove ) {    
                        // store the index of the current child id in the bookmarkedChildren array if one exists
                        const bookmarkIndex	= bookmarkedSiblings.indexOf( childId );   
                        // if we find the child, remove the bookmark
                        if( bookmarkIndex !== -1 ) {
                            bookmarkedSiblings.splice( bookmarkIndex, 1 );
                        }
                    }
                    // save the social worker
					socialWorker.save();
                };
                
            }, err => {

                console.log( err );
            });
}
