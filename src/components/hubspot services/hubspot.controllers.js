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
