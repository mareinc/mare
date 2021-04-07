const keystone = require( 'keystone' );
const Search = keystone.list( 'Child Search' );

exports.saveChildSearch = function saveChildSearch( req, res, next ) {

    const searchCriteria = req.body;
    
    // if there is no authenticated user, do not save search criteria
    if ( !req.user ) {
        // send empty success response
        return res.status(200).send();
    }

    // check for existing searches by this user
    exports.getChildSearch( req.user._id.toString() )
        .catch( error => {
            
            // log errors
            console.error( 'Failed to retrieve saved Child Search' );
            console.error( error );
            // continue execution. pass null to simulate non-existent child search
            return null;
        })
        .then( childSearchDoc => {

            // use existing child search doc or create a new one if none exists
            childSearchDoc = childSearchDoc || new Search.model({
                email: req.user.email,
                user: req.user._id.toString()
            });

            // update child search criteria
            childSearchDoc.genders = searchCriteria.genders;
            childSearchDoc.minChildren = Number( searchCriteria.minimumChildren );
            childSearchDoc.maxChildren = Number( searchCriteria.maximumChildren );
            childSearchDoc.minAge = Number( searchCriteria.youngestAge );
            childSearchDoc.maxAge = Number( searchCriteria.oldestAge );
            childSearchDoc.races = searchCriteria.races;
            childSearchDoc.languages = searchCriteria.primaryLanguages;
            childSearchDoc.contactWithSiblings = searchCriteria.contactWithBiologicalSiblings === 'false' ? false : true;
            childSearchDoc.contactWithParents = searchCriteria.contactWithBiologicalParents === 'false' ? false : true;
            childSearchDoc.mustHaveVideo = searchCriteria.videoOnly === 'true' ? true : false;
            childSearchDoc.mustBeLegallyFree = searchCriteria.legallyFreeOnly === 'true' ? true : false;
            childSearchDoc.lastProfileUpdate = searchCriteria.updatedWithin;
            childSearchDoc.maxPhysicalNeeds = searchCriteria.maximumPhysicalNeeds ? Number( searchCriteria.maximumPhysicalNeeds ) : 3;
            childSearchDoc.maxEmotionalNeeds = searchCriteria.maximumEmotionalNeeds ? Number( searchCriteria.maximumEmotionalNeeds ) : 3;
            childSearchDoc.maxIntellectualNeeds = searchCriteria.maximumIntellectualNeeds ? Number( searchCriteria.maximumIntellectualNeeds ) : 3;
            childSearchDoc.developmentalNeeds = searchCriteria.disabilities;
            childSearchDoc.familyConstellation = searchCriteria.familyConstellation;
            childSearchDoc.numChildrenInHome = searchCriteria.numberOfChildrenInHome === 'NaN' ? null : searchCriteria.numberOfChildrenInHome;
            childSearchDoc.youngestChildAge = searchCriteria.youngestChildAgeInHome === 'NaN' ? null : searchCriteria.youngestChildAgeInHome;
            childSearchDoc.oldestChildAge = searchCriteria.oldestChildAgeInHome === 'NaN' ? null : searchCriteria.oldestChildAgeInHome;
            childSearchDoc.hasPetsInHome = searchCriteria.petsInHome === 'true' ? true : false;

            return childSearchDoc.save();
        })
        .catch( error => {

            // log errors
            console.error( 'Failed to save Child Search' );
            console.error( error );
        })
        .finally(() => res.status(200).send());
};

exports.getChildSearch = function getChildSearch( key ) {
    return new Promise( (resolve, reject) => {
        Search.model.findOne({ key })
            .exec()
            .then( childSearchDoc => resolve( childSearchDoc ) )
            .catch( error => reject( error ) );
    });
};
