const moment = require( 'moment' );
const hubspot = require( '@hubspot/api-client' );
const hubspotClient = new hubspot.Client({ accessToken: process.env.HUBSPOT_API_KEY });
const ALLOW_UPDATES = process.env.ALLOW_HUBSPOT_API_UPDATES === 'true';
const listServices = require( '../lists/list.controllers' );

// helper to generate a keystone record URL from the record id and type
function generateKeystoneRecordUrl( recordId, userType ) {

    const recordUrlBase = 'https://mareinc.org/keystone/';

    if ( userType === 'site visitor' ) {

        return `${recordUrlBase}site-visitors/${recordId}`;

    } else {

        return `${recordUrlBase}families/${recordId}`; 
    }
}

// find HubSpot cms contact by email address
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

// create a HubSpot cms contact
async function createNewContact( contactProperties ) {

    let hubspotApiResponse = false;

    try {

        // create the contact in hubspot
        hubspotApiResponse = await hubspotClient.crm.contacts.basicApi.create({
            properties: contactProperties
        });

    } catch ( error ) {

        // log any errors
        error.message === 'HTTP request failed'
            ? console.error( JSON.stringify( error.response, null, 2 ) )
            : console.error( error );
    }

    return hubspotApiResponse;
}

// update a HubSpot cms contact
async function updateContact( contactId, contactProperties ) {

    let hubspotApiResponse = false;

    try {

        // update existing hubspot contact
        hubspotApiResponse = await hubspotClient.crm.contacts.basicApi.update(
            contactId,
            { properties: contactProperties }
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
async function updateOrCreateContact( contactProperties ) {

    if ( ALLOW_UPDATES ) {

        console.log( `Updating or creating HubSpot contact for user with email: ${contactProperties.email}` );

    } else {

        console.log( 'HubSpot updates are disabled by envrironment variables.  To enable, set ALLOW_HUBSPOT_API_UPDATES variable to true' );
        return;
    }
    
    try {

        // search for an existing contact
        const findContactByEmailResponse = await exports.findContactByEmail( contactProperties.email );

        // if the contact already exists, update the existing contact
        if ( findContactByEmailResponse && findContactByEmailResponse.total > 0 ) {

            console.log( `HubSpot contact already exists, updating contact properties` );

            // get the contact id from the response
            const contactId = findContactByEmailResponse.results[0].id;
            // update the contact properties to ensure they're in sync with Keystone data
            const updateExistingContactResponse = await updateContact( contactId, contactProperties );

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
            const createNewContactResponse = await createNewContact( contactProperties );
            
            // if the contact was created successfully...
            if ( !createNewContactResponse.message ) {
                
                console.log( `Created a new HubSpot contact for user with email: ${contactProperties.email}` );
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

exports.updateOrCreateSiteVisitorContact = async function updateOrCreateSiteVisitorContact( siteVisitorDoc ) {

    // destructure data from site visitor doc
    const contactProperties = {
        'email': siteVisitorDoc.get( 'email' ),
        'firstname': siteVisitorDoc.get( 'name.first' ),
        'lastname': siteVisitorDoc.get( 'name.last' ),
        'keystone_record': generateKeystoneRecordUrl( siteVisitorDoc._id, siteVisitorDoc.get( 'userType' ) )
    };

    // update or create HubSpot contact
    updateOrCreateContact( contactProperties );
}

exports.updateOrCreateFamilyContacts = async function updateOrCreateFamilyContacts( familyDoc ) {

    // destructure shared contact data from family doc
    const sharedProperties = {
        keystone_record: generateKeystoneRecordUrl( familyDoc._id, familyDoc.get( 'userType' ) ),
        registration_number: familyDoc.get( 'registrationNumber' ),
        address: familyDoc.get( 'address.street1' ) + familyDoc.get( 'address.street2' ),
        city: familyDoc.get( 'address.displayCity' ),
        zip: familyDoc.get( 'address.zipCode' )
    };
    // populate and normalize region data
    sharedProperties.region = await normalizeRegionData( familyDoc.address.region );

    // destructure contact 1 data from family doc
    const contact1Properties = {
        email: familyDoc.get( 'email' ),
        firstname: familyDoc.get( 'contact1.name.first' ),
        lastname: familyDoc.get( 'contact1.name.last' ),
        phone: familyDoc.get( 'contact1.phone.mobile' ) || familyDoc.get( 'contact1.phone.work' ) || familyDoc.get( 'homePhone' ),
        ...sharedProperties
    };

    // filter out missing/invalid birth date
    if ( familyDoc.contact1.birthDate && moment.utc( familyDoc.contact1.birthDate ).isValid() ) {

        // convert birth date to proper format
        contact1Properties.date_of_birth = moment.utc( familyDoc.contact1.birthDate ).format( 'YYYY-MM-DD' );
       
    } else { contact1Properties.date_of_birth = undefined; }

    // update or create contact 1 HubSpot contact
    updateOrCreateContact( contact1Properties );

    // destructure contact 2 data from family doc
    const contact2Properties = {
        email: familyDoc.get( 'contact2.email' ),
        firstname: familyDoc.get( 'contact2.name.first' ),
        lastname: familyDoc.get( 'contact2.name.last' ),
        phone: familyDoc.get( 'contact2.phone.mobile' ) || familyDoc.get( 'contact2.phone.work' ) || familyDoc.get( 'homePhone' ),
        ...sharedProperties
    };

    // filter out missing/invalid birth date
    if ( familyDoc.contact2.birthDate && moment.utc( familyDoc.contact2.birthDate ).isValid() ) {

        // convert birth date to proper format
        contact2Properties.date_of_birth = moment.utc( familyDoc.contact2.birthDate ).format( 'YYYY-MM-DD' );
       
    } else { contact2Properties.date_of_birth = undefined; }

    // determine if contact 2 exists and HubSpot contact needs to be created/updated
    const shouldCreateOrUpdateContact2 = !!contact2Properties.email;
    if ( shouldCreateOrUpdateContact2 ) {
        updateOrCreateContact( contact2Properties );
    }
}

async function normalizeRegionData( regionId ) {

    // get the region document using the region ID
    let region = undefined;

    try {

        const _region = await listServices.getRegionById( regionId );
        region = _region.region;

    } catch ( error ) { console.error( error ); }

    // ensure a region has been specified
    if ( !!region ) {

        // handle special case(s)
        if ( region === 'Specialized Recruitment Coordination' ) {
            
            return 'src';

        // apply standard formatting
        } else {
            return region.replace( /\s+/g, '-' ).toLowerCase();
        }

    // if no region has been specified, return undefined
    } else { return undefined; }
}
