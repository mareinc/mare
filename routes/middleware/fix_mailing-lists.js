const keystone          = require( 'keystone' ),
      Mailchimp         = require( 'mailchimp-api-v3' ),
      MD5               = require( 'md5' );

// set constants
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
// configure the Mailchimp connection instance
const _mailchimp = new Mailchimp( MAILCHIMP_API_KEY );

module.exports.fixMailingLists = function fixMailingLists( req, res, next ) {

    // if the user is trying to run this script against the production database
    if( /^.*\/production.*$/.test( process.env.MONGO_URI ) ) {
        // alert them of what they're doing and how to get around this message
        return res.send(`

            WARNING:

            You are running this script against the production database.

            To allow execution, open fix_mailing_lists.js and comment out the if block in fixMailingLists()` );
    }

    let mailingListId = req.params.mailingListId;

    if ( !mailingListId ) {
        let err = new Error( 'cannot fix mailing lists without a mailing list ID' );
        console.error( err );
        return res.status( 500 ).send( err.message );
    }

    Promise.all([
        // get mailing list members
        _mailchimp.request({
            method: 'get',
            path: '/lists/{list_id}/members',
            path_params: {
                list_id: mailingListId
            },
            query: {
                count: 11108,
                status: 'subscribed',
                fields: 'members.email_address'

            }
        }),
        // get all users we care about
        keystone.list( 'User' ).model
            .find( { userType: 'site visitor' } ) // 'family' 'social worker'
            .exec(),
        keystone.list( 'Mailchimp List' ).model
            .find()
            .lean()
            .exec()
    ])
    .then( results => {

        // parse results
        let [ listMembers, users, mailingLists ] = results;
        let subscribedMembers = listMembers.members; // filter for subscribers is applied in Mailchimp API call

        // get a list of mailing list IDs
        let mailingListIds = mailingLists.map( mailingList => mailingList._id.toString() );

        // match emails to get a list of the MARE users requiring updates to their mailing list subscriptions
        let userUpdates = [];
        for ( let subscriber of subscribedMembers ) {
            let userRequiringUpdate = users.find( user => user.email === subscriber.email_address );
            if ( userRequiringUpdate ) {
                // subscribe user to all mailing lists
                userRequiringUpdate.mailingLists = mailingListIds;
                userUpdates.push( userRequiringUpdate.save() ); // this is where we could sub in a serialize approach
            }
        }

        // return promise of all save operations
        return Promise.all( userUpdates );
    })
    .then( updatedUserDocs => {

        // create a batch of tag update operations to set user type tags in MailChimp
        let tagUpdateBatch = updatedUserDocs.map( userDoc => {

            return {
                method: 'post',
                path: '/lists/{list_id}/members/{subscriber_hash}/tags',
                path_params: {
                    list_id: mailingListId,
                    subscriber_hash: MD5( userDoc.email )
                },
                body: {
                    tags: [
                        {
                            name: userDoc.userType,
                            status: 'active'
                        }
                    ]
                }
            };
        });

        // execute batch operation
        return _mailchimp.batch( tagUpdateBatch );
    })
    .then( returnedItems => {
        console.log( returnedItems );
        res.status( 200 ).send( 'great success' );
    })
    .catch( err => {
        console.error( new Error( err.message ) );
        res.status( 500 ).send( err );
    });
};

module.exports.addFamilyStatusTags = function addFamilyStatusTags( req, res, next ) {

     // if the user is trying to run this script against the production database
     if( /^.*\/production.*$/.test( process.env.MONGO_URI ) ) {
        // alert them of what they're doing and how to get around this message
        return res.send(`

            WARNING:

            You are running this script against the production database.

            To allow execution, open fix_mailing_lists.js and comment out the if block in addFamilyStatusTags()` );
    }

    const mailingListId = req.params.mailingListId;

    if ( !mailingListId ) {
        let err = new Error( 'cannot add tags to family subscribers without a mailing list ID' );
        console.error( err );
        return res.status( 500 ).send( err.message );
    }

    // get tag labels from schema definition
    const MAPPTrainingLabel = keystone.list( 'Family' ).model.schema.tree.stages.MAPPTrainingCompleted.completed.label,
          homestudyLabel = keystone.list( 'Family' ).model.schema.tree.homestudy.completed.label;

    // Newsletter ID
    // 5cd4b1fd3d63a400f53acd75

    // Events ID
    // 5cd4b1b23d63a400f53acd73

    // Fundraising ID
    // 5cd4b1e13d63a400f53acd74

    keystone.list( 'Family' ).model
        .find( { mailingLists: { $in: [ mailingListId ] } } )
        .lean()
        .exec()
        .then( familyUserDocs => {

            // create a batch of tag update operations to set family status tags in Mailchimp
            let tagUpdateBatch = familyUserDocs.map( familyUserDoc => {

                return {
                    method: 'post',
                    path: '/lists/{list_id}/members/{subscriber_hash}/tags', // this is not a template string, rather a mailchimp-api-v3 library convention
                    path_params: {
                        list_id: mailingListId,
                        subscriber_hash: MD5( familyUserDoc.email )
                    },
                    body: {
                        tags: [
                            {
                                name: MAPPTrainingLabel,
                                status: familyUserDoc.stages.MAPPTrainingCompleted.completed ? 'active' : 'inactive'
                            },
                            {
                                name: homestudyLabel,
                                status: familyUserDoc.homestudy.completed ? 'active' : 'inactive'
                            }
                        ]
                    }
                };
            });

            // execute batch operation
            return _mailchimp.batch( tagUpdateBatch );
        })
        .then( returnedItems => {
            console.log( returnedItems );
            res.status( 200 ).send( 'great success' );
        })
        .catch( err => {
            console.error( err );
            res.status( 500 ).send();
        });
};
