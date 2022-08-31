const hubspot = require( '@hubspot/api-client' );
const hubspotClient = new hubspot.Client({ accessToken: process.env.HUBSPOT_API_KEY });

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

// helper function to find an existing contact or create a new one if it doesn't exist
exports.findOrCreateNewContact = async function findOrCreateNewContact( email, firstName, lastName ) {

    console.log( `Creating a new HubSpot contact for user with email: ${email}` );
    
    try {

        // search for an existing contact
        const findContactByEmailResponse = await exports.findContactByEmail( email );

        // if the contact already exists, do not create a duplicate contact
        if ( findContactByEmailResponse && findContactByEmailResponse.total > 0 ) {

            console.log( `HubSpot contact already exists for user with email: ${email}` );
            return;
        }

        // create a new contact
        const createNewContactResponse = await exports.createNewContact( email, firstName, lastName );
        
        // if the contact was created successfully...
        if ( !createNewContactResponse.message ) {
            
            console.log( `Created a new HubSpot contact for user with email: ${email}` );
            console.log( `HubSpot contact ID: ${createNewContactResponse.id}` );
        
        // if there was an error during contact creation...
        } else {

            console.log( 'Failed to create a new HubSpot contact.' );
            console.error( JSON.stringify( createNewContactResponse ) );
        }
        
        return;

    } catch ( error ) {

        // log any errors
        error.message === 'HTTP request failed'
            ? console.error( JSON.stringify( error.response, null, 2 ) )
            : console.error( error );
    }
}
