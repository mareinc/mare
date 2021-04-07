const keystone = require( 'keystone' );
const Search = keystone.list( 'Profile Search' );

exports.saveProfileSearch = function saveProfileSearch( req, res, next ) {

    const searchCriteria = req.body;
    
    // if there is no authenticated user, do not save search criteria
    if ( !req.user ) {
        // send empty success response
        return res.status(200).send();
    }

    // check for existing searches by this user
    exports.getProfileSearch( req.user._id.toString() )
        .catch( error => {
            
            // log errors
            console.error( 'Failed to retrieve saved Child Search' );
            console.error( error );
            // continue execution. pass null to simulate non-existent child search
            return null;
        })
        .then( profileSearchDoc => {

            // use existing child search doc or create a new one if none exists
            profileSearchDoc = profileSearchDoc || new Search.model({
                email: req.user.email,
                user: req.user._id.toString()
            });

            // update child search criteria
            profileSearchDoc.genders = searchCriteria.genders;
            profileSearchDoc.minChildren = Number( searchCriteria.minimumChildren );
            profileSearchDoc.maxChildren = Number( searchCriteria.maximumChildren );
            profileSearchDoc.minAge = Number( searchCriteria.youngestAge );
            profileSearchDoc.maxAge = Number( searchCriteria.oldestAge );
            profileSearchDoc.races = searchCriteria.races;
            profileSearchDoc.languages = searchCriteria.primaryLanguages;
            profileSearchDoc.contactWithSiblings = searchCriteria.contactWithBiologicalSiblings === 'false' ? false : true;
            profileSearchDoc.contactWithParents = searchCriteria.contactWithBiologicalParents === 'false' ? false : true;
            profileSearchDoc.mustHaveVideo = searchCriteria.videoOnly === 'true' ? true : false;
            profileSearchDoc.mustBeLegallyFree = searchCriteria.legallyFreeOnly === 'true' ? true : false;
            profileSearchDoc.lastProfileUpdate = searchCriteria.updatedWithin;
            profileSearchDoc.maxPhysicalNeeds = searchCriteria.maximumPhysicalNeeds ? Number( searchCriteria.maximumPhysicalNeeds ) : 3;
            profileSearchDoc.maxEmotionalNeeds = searchCriteria.maximumEmotionalNeeds ? Number( searchCriteria.maximumEmotionalNeeds ) : 3;
            profileSearchDoc.maxIntellectualNeeds = searchCriteria.maximumIntellectualNeeds ? Number( searchCriteria.maximumIntellectualNeeds ) : 3;
            profileSearchDoc.developmentalNeeds = searchCriteria.disabilities;
            profileSearchDoc.familyConstellation = searchCriteria.familyConstellation;
            profileSearchDoc.numChildrenInHome = searchCriteria.numberOfChildrenInHome === 'NaN' ? null : searchCriteria.numberOfChildrenInHome;
            profileSearchDoc.youngestChildAge = searchCriteria.youngestChildAgeInHome === 'NaN' ? null : searchCriteria.youngestChildAgeInHome;
            profileSearchDoc.oldestChildAge = searchCriteria.oldestChildAgeInHome === 'NaN' ? null : searchCriteria.oldestChildAgeInHome;
            profileSearchDoc.hasPetsInHome = searchCriteria.petsInHome === 'true' ? true : false;

            return profileSearchDoc.save();
        })
        .catch( error => {

            // log errors
            console.error( 'Failed to save Child Search' );
            console.error( error );
        })
        .finally(() => res.status(200).send());
};

exports.getProfileSearch = function getProfileSearch( key ) {
    return new Promise( (resolve, reject) => {
        Search.model.findOne({ key })
            .exec()
            .then( profileSearchDoc => resolve( profileSearchDoc ) )
            .catch( error => reject( error ) );
    });
};
