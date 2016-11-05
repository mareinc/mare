var keystone 	        = require( 'keystone' ),
	_			        = require( 'underscore' ),
	moment		        = require( 'moment' ),
	async		        = require( 'async' ),
    UtilitiesMiddleware	= require('./utilities');

/* updates sibling fields for chidren listed as siblings by adding missing entries */
exports.updateMySiblings = ( mySiblings, childId, done ) => {

	// Fetch all siblings who were added
	keystone.list( 'Child' ).model.find()
			.where( '_id' ).in( Array.from( mySiblings ) )
			.exec()
			.then( ( siblings ) => {

                // loop through each added sibling
				_.each( siblings, ( child ) => {
                    // store the childs current sibling as an array of strings
                    const currentSiblingsArray = child.siblings ? child.siblings.map( sibling => sibling.toString() ) : [];
                    // convert the array to a set
                    const currentSiblings = new Set( currentSiblingsArray );
                    // get the id of the current child in the loop we need to update
                    const targetChildId = child.get('_id').toString();
                    // copy the original siblings into a set to prevent changes from affecting mySiblings, and to prevent duplicates
                    let newSiblings = new Set( [ ...mySiblings ] );
                    // add the current child in the loop to the set
                    newSiblings.add( childId );
                    // remove the current child in the loop because we don't want to add him/her as a sibling of himself/herself
                    newSiblings.delete( targetChildId );       
                    // create a set of the siblings to add, derived from looking at which siblings are already included
                    const siblingsToAdd = currentSiblings.rightOuterJoin( newSiblings );
                    // if there are siblings to add to the child
					if( siblingsToAdd.size > 0 ) {
                        // child.isUpdatingSiblings = true;
                        // add any new siblings to the child
						child.siblings.push( ...siblingsToAdd );
                        // save the child
						child.save();
					}
				});

				done();
			// TODO: Update all error messages to make it clear what action failed (THIS IS A UNIVERSAL CHANGE)
			}, ( err ) => {

				console.log( err );
				done();
			});
};

// start              {b,c}   {a,c}   {a,b}         remaining   removed
// part 1
// set a is updating to true
// a removes {c}      {b}     {a,c}   {a,b}         {b}         {c}
// for remaining siblings, set isUpdating to true, match with an id swap
// for removed siblings, set isUpdating to true, remove everything

// a => isUpdating: true
// a => {b,c} to {b}
// a calls updating remaining
// b => isUpdating: true
// {c} is updating, sets isUpdating to tue

// part 2
// b removes {c}      {b}     {a}     {b}
// c removes {b}      {b}     {a}     {}
// d removes {b,c}    {b}     {a}     {}






// set is updating var
// update removed siblings to blank
// update remaining siblings with current list but child id's swapped
// prevent their post save 

// start              {b,c}   {a,c}   {a,b}         remaining   removed
// part 1
// a removes {c}      {b}     {a,c}   {a,b}         {b}         {c}
// c removes {a}      {b}     {a,c}   {b}           {b}         {a}

// part 2
// b removes {c}      {b}     {a}     {b}
// c removes {b}      {b}     {a}     {}
// d removes {b,c}    {b}     {a}     {}

// a saves, triggers c and d
// c saves, triggers a and d 
// d saves, triggers a and c
// a checks but doesnt save 
// d checks but doesnt save 
// a checks but doesnt save 
// c checks but doesnt save

// first base case: if none of the removed siblings exist in the siblings field

// b saves, triggers c and d 
// c saves, triggers b 
// d saves, triggers b 
// b checks but doesnt save 
// b checks but doesnt save

// second base case: if none of the removed siblings exist in the siblings field

// go through all removed siblings and swap their id with the targetID and remove from siblings field
// go through all remaining siblings and remove from siblings field

exports.updateMyRemovedSiblings = ( removedSiblings, childId, done ) => {

    // Fetch all siblings who were removed from the target child ( childId )
    keystone.list( 'Child' ).model.find()
            .where( '_id' ).in( Array.from( removedSiblings ) )
            .exec()
            .then( ( siblings ) => {
                // loop through each added sibling
				_.each( siblings, ( child ) => {
                    // store the childs current sibling as an array of strings
                    const currentSiblingsArray = child.siblings ? child.siblings.map( sibling => sibling.toString() ) : [];
                    // convert the array to a set
                    const currentSiblings = new Set( currentSiblingsArray );
                    // get the id of the current child in the loop we need to update
                    const targetChildId = child.get('_id').toString();
                    // copy the original siblings into a set to prevent changes from affecting removedSiblings, and to prevent duplicates
                    let deletedSiblings = new Set( [ ...removedSiblings ] );
                    // add the current child in the loop to the set
                    deletedSiblings.add( childId );
                    // remove the current child in the loop because we don't want to add him/her as a sibling of himself/herself
                    deletedSiblings.delete( targetChildId );       
                    // create a set of the siblings to add, derived from looking at which siblings are already included
                    const siblingsToRemove = currentSiblings.intersection( deletedSiblings );
                    // if the child has any siblings
                    if( siblingsToRemove.size > 0 ) {
                        // create a set of the remaining siblings after removing the children who don't belong
                        const remainingChildren = currentSiblings.leftOuterJoin( siblingsToRemove );
                        // remove all siblings from the child
                        child.siblings = [ ...remainingChildren ];
                        // save the child
                        child.save();
                    }
                });

                done();
            // TODO: Update all error messages to make it clear what action failed (THIS IS A UNIVERSAL CHANGE)
            }, ( err ) => {

                console.log( err );
                done();
            });
};

exports.updateMyRemainingSiblings = ( remainingSiblings, removedSiblings, childId, done ) => {

    // Fetch all siblings who remain after siblings have been removed from the target child ( childId )
    keystone.list( 'Child' ).model.find()
            .where( '_id' ).in( Array.from( remainingSiblings ) )
            .exec()
            .then( ( siblings ) => {
                // loop through each added sibling
				_.each( siblings, ( child ) => {
                    // store the childs current sibling as an array of strings
                    const currentSiblingsArray = child.siblings ? child.siblings.map( sibling => sibling.toString() ) : [];
                    // convert the array to a set
                    const currentSiblings = new Set( currentSiblingsArray );
                    // get the id of the current child in the loop we need to update
                    const targetChildId = child.get('_id').toString();
                    // copy the original siblings into a set to prevent changes from affecting removedSiblings, and to prevent duplicates
                    let deletedSiblings = new Set( [ ...removedSiblings ] );
                    // if( deletedSiblings.has( targetChildId ) ) {
                    //     // add the current child in the loop to the set
                    //     deletedSiblings.add( childId );
                    //     // remove the current child in the loop because we don't want to add him/her as a sibling of himself/herself
                    //     deletedSiblings.delete( targetChildId ); 
                    // }      
                    // create a set of the siblings to add, derived from looking at which siblings are already included
                    const siblingsToRemove = currentSiblings.intersection( deletedSiblings );
                    // if the child has any siblings
                    if( siblingsToRemove.size > 0 ) {
                        // create a set of the remaining siblings after removing the children who don't belong
                        const remainingChildren = currentSiblings.leftOuterJoin( siblingsToRemove );
                        // remove all siblings from the child
                        child.siblings = [ ...remainingChildren ];
                        // save the child
                        child.save();
                    }
                });

                done();
            // TODO: Update all error messages to make it clear what action failed (THIS IS A UNIVERSAL CHANGE)
            }, ( err ) => {

                console.log( err );
                done();
            });
};









// exports.updateAddedSiblingsToBePlacedWith = ( addedSiblingsToBePlacedWith, childId, done ) => {
// 	'use strict';
// 	// if the must be placed with siblings checkbox isn't checked, do nothing (TODO: CHECKWITH LISA TO SEE IF WE SHOULD WIPE THE STORED FIELD VALUES)
// 	if( !this.mustBePlacedWithSiblings ) {
//         done();
//     }

//     // Get all children listed as siblings to be placed with and make sure they have the current child listed
//     // and the must be placed with siblings checkbox checked
//     keystone.list( 'Child' ).model.find()
//             .where('_id').in( addedSiblingsToBePlacedWith )
//             .exec()
//             .then( siblings => {

//                 _.each( siblings, sibling => {
//                     // Update the list of siblings to be placed together in listed children if needed
//                     if(sibling.siblingsToBePlacedWith.indexOf( childId ) === -1) {

//                         sibling.mustBePlacedWithSiblings = true;
//                         sibling.siblingsToBePlacedWith.push( childId );

//                         sibling.save();
//                     }
//                 });

//                 done();
//             // TODO: Update all error messages to make it clear what action failed (THIS IS A UNIVERSAL CHANGE)
//             }, function(err) {

//                 console.log(err);

//                 done();
//             });
// };
// // Updates the group profile data of siblings this child must be placed with
// exports.updateSiblingGroupProfiles = function( done ) {
// 	'use strict';
// 	// if the must be placed with siblings checkbox is checked
// 	if(this.mustBePlacedWithSiblings) {

// 		const siblingsBeforeSave = this._original.siblingsToBePlacedWith,
// 			siblingsAfterSave = this.siblingsToBePlacedWith,

// 			removedSiblings = [],

// 			profilePart1 = this.groupProfile.part1,
// 			profilePart2 = this.groupProfile.part2,
// 			profilePart3 = this.groupProfile.part3;

// 		// add fields to all siblings
// 		// Fetch all siblings child must be placed with and update their group profile fields
// 		keystone.list( 'Child' ).model.find()
// 				.where('_id').in(siblingsAfterSave)
// 				.exec()
// 				.then(function(siblings) {

// 					_.each(siblings, function(sibling) {
// 						sibling.groupProfile.part1 = profilePart1;
// 						sibling.groupProfile.part2 = profilePart2;
// 						sibling.groupProfile.part3 = profilePart3;
// 					});

// 					done();

// 				}, function(err) {
// 					console.log(err);
// 					done();
// 				});
// 	// if the must be placed with siblings checkbox is not checked, we don't need to update anything
// 	} else {
// 		done();
// 	}
// };