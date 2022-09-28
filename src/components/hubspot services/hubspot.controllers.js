const hubspot = require( '@hubspot/api-client' );
const hubspotClient = new hubspot.Client({ accessToken: process.env.HUBSPOT_API_KEY });

// helper to generate a keystone record URL from the record id and type
function generateKeystoneRecordUrl( recordId, userType ) {

    const recordUrlBase = 'https://mareinc.org/keystone/';

    if ( userType === 'site visitor' ) {

        return `${recordUrlBase}site-visitors/${recordId}`;

    } else {

        return `${recordUrlBase}families/${recordId}`; 
    }
}

// find hubspot cms contact by email address
exports.findContactByEmail = async function findContactByEmail( email ) {

    // configure search filter
    const filter = { propertyName: 'email', operator: 'EQ', value: email };
    const filterGroup = { filters: [ filter ] };

    let hubspotApiResponse = false;

    try {

        // search hubspot contacts by email
        hubspotApiResponse = await hubspotClient.crm.contacts.searchApi.doSearch({
            filterGroups: [ filterGroup ]
        });

    } catch ( error ) {

        // log any errors
        error.message === 'HTTP request failed'
            ? console.error( JSON.stringify( error.response, null, 2 ) )
            : console.error( error );
    }

    return hubspotApiResponse;
}

// create a hubspot cms contact
exports.createNewContact = async function createNewContact( email, firstName, lastName ) {

    // configure contact properties
    const properties = {
        'email': email,
        'firstname': firstName,
        'lastname': lastName
    };

    let hubspotApiResponse = false;

    try {

        // create the contact in hubspot
        hubspotApiResponse = await hubspotClient.crm.contacts.basicApi.create({
            properties
        });

    } catch ( error ) {

        // log any errors
        error.message === 'HTTP request failed'
            ? console.error( JSON.stringify( error.response, null, 2 ) )
            : console.error( error );
    }

    return hubspotApiResponse;
}

// update a hubspot cms contact
exports.updateContact = async function updateContact( contactId, userDoc ) {

    const userType = userDoc.get( 'userType' );
    const simplePublicObjectInput = {
        'properties': {
            'firstname': userDoc.get( 'name.first' ),
            'lastname': userDoc.get( 'name.last' ),
            'keystone_record': generateKeystoneRecordUrl( userDoc._id, userType )
        }
    };

    let hubspotApiResponse = false;

    try {

        // update existing hubspot contact
        hubspotApiResponse = await hubspotClient.crm.contacts.basicApi.update(
            contactId,
            simplePublicObjectInput
        );

    } catch ( error ) {

        // log any errors
        error.message === 'HTTP request failed'
            ? console.error( JSON.stringify( error.response, null, 2 ) )
            : console.error( error );
    }

    return hubspotApiResponse;
}

// helper function to update or create a HubSpot contact from a Keystone user
exports.updateOrCreateNewContact = async function updateOrCreateNewContact( userDoc ) {

    const email = userDoc.get( 'email' );

    console.log( `Updating or creating HubSpot contact for user with email: ${email}` );
    
    try {

        // search for an existing contact
        const findContactByEmailResponse = await exports.findContactByEmail( email );

        // if the contact already exists, update the existing contact
        if ( findContactByEmailResponse && findContactByEmailResponse.total > 0 ) {

            console.log( `HubSpot contact already exists, updating contact properties` );

            // get the contact id from the response
            const contactId = findContactByEmailResponse.results[0].id;
            // update the contact properties to ensure they're in sync with Keystone data
            const updateExistingContactResponse = await exports.updateContact( contactId, userDoc );

            // if the contact was updated successfully...
            if ( !updateExistingContactResponse.message ) {
                
                console.log( `Updated existing HubSpot contact with ID: ${contactId}` );
            
            // if there was an error during contact update...
            } else {

                console.log( 'Failed to update HubSpot contact' );
                console.error( JSON.stringify( updateExistingContactResponse ) );
            }

        // if the contact doesn't exist, create a new contact    
        } else {

            // create a new contact
            const createNewContactResponse = await exports.createNewContact( email, firstName, lastName );
            
            // if the contact was created successfully...
            if ( !createNewContactResponse.message ) {
                
                console.log( `Created a new HubSpot contact for user with email: ${email}` );
                console.log( `HubSpot contact ID: ${createNewContactResponse.id}` );
            
            // if there was an error during contact creation...
            } else {

                console.log( 'Failed to create a new HubSpot contact' );
                console.error( JSON.stringify( createNewContactResponse ) );
            }
        }
    } catch ( error ) {

        // log any errors
        error.message === 'HTTP request failed'
            ? console.error( JSON.stringify( error.response, null, 2 ) )
            : console.error( error );
    }
}
