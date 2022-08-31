const hubspot = require( '@hubspot/api-client' );
const hubspotClient = new hubspot.Client({ accessToken: process.env.HUBSPOT_API_KEY });

// find hubspot cms contact by email address
exports.findContactByEmail = async function findContactByEmail( email ) {

    // configure search filter
    const filter = { propertyName: 'email', operator: 'EQ', value: email };
    const filterGroup = { filters: [ filter ] };

    // search hubspot contacts by email
    const hubspotApiResponse = await hubspotClient.crm.contacts.searchApi.doSearch({
        filterGroups: [ filterGroup ]
    });

    return hubspotApiResponse;
}
