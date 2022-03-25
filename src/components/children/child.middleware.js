const keystone = require( 'keystone' );

/* NOTE: the accessing user must be a social worker */
exports.getChildrenByRecruitmentWorker = async function( req, res, next ) {
	'use strict';

	const fieldsToPopulate = [ 'adoptionWorker', 'adoptionWorkerAgency', 'recruitmentWorker', 'recruitmentWorkerAgency', 'siblings', 'status' ];

	// fetch the models of the removed staff attendees, populating only the full name field
	const children = await keystone.list( 'Child' ).model
		.find({
			$or: [
				{ 'adoptionWorker': req.user.get( '_id' ) },
				{ 'recruitmentWorker': req.user.get( '_id' ) }
			]
		})
		.populate( fieldsToPopulate )
		.exec()
		.then( children => {

			// filter out inactive children
			let activeChildren = children.filter( child => 
				child.status.childStatus === 'active' || child.status.childStatus === 'on hold'
			);

			res.locals.recruitmentWorkersChildren = {
				saveDetails: activeChildren.map( child => {

					const adoptionWorkersPreferredPhone = child.get( 'adoptionWorker.phone.preferred' );
					const recruitmentWorkersPreferredPhone = child.get( 'recruitmentWorker.phone.preferred' );
					
					let adoptionWorkerPhone = adoptionWorkersPreferredPhone === 'work'
						? child.get( 'adoptionWorker.phone.work' ) || child.get( 'adoptionWorker.phone.mobile' )
						: child.get( 'adoptionWorker.phone.mobile' ) || child.get( 'adoptionWorker.phone.work' );

					let recruitmentWorkerPhone = recruitmentWorkersPreferredPhone === 'work'
						? child.get( 'recruitmentWorker.phone.work' ) || child.get( 'recruitmentWorker.phone.mobile' )
						: child.get( 'recruitmentWorker.phone.mobile' ) || child.get( 'recruitmentWorker.phone.work' );
					
					return {
						name: child.get( 'name.full' ),
						isPartOfSiblingGroup: child.get( 'mustBePlacedWithSiblings' ) === true ? 'Yes' : 'No',
						adoptionWorker: child.get( 'adoptionWorker.name.full' ),
						adoptionWorkerAgency: child.get( 'adoptionWorkerAgency.name' ),
						adoptionWorkerPhone,
						adoptionWorkerEmail: child.get( 'adoptionWorker.email' ),
						recruitmentWorker: child.get( 'recruitmentWorker.name.full' ),
						recruitmentWorkerAgency: child.get( 'recruitmentWorkerAgency.name' ),
						recruitmentWorkerPhone,
						recruitmentWorkerEmail: child.get( 'recruitmentWorker.email' ),
						'matchingExclusions[]': child.get( 'exclusions' )
					};
				}),
				editDetails: activeChildren.map( child => {

					const adoptionWorkersPreferredPhone = child.get( 'adoptionWorker.phone.preferred' );
					const recruitmentWorkersPreferredPhone = child.get( 'recruitmentWorker.phone.preferred' );
					
					let adoptionWorkerPhone = adoptionWorkersPreferredPhone === 'work'
						? child.get( 'adoptionWorker.phone.work' ) || child.get( 'adoptionWorker.phone.mobile' )
						: child.get( 'adoptionWorker.phone.mobile' ) || child.get( 'adoptionWorker.phone.work' );

					let recruitmentWorkerPhone = recruitmentWorkersPreferredPhone === 'work'
						? child.get( 'recruitmentWorker.phone.work' ) || child.get( 'recruitmentWorker.phone.mobile' )
						: child.get( 'recruitmentWorker.phone.mobile' ) || child.get( 'recruitmentWorker.phone.work' );

					return {
						name: child.get( 'name.full' ),
						registrationNumber: child.get( 'registrationNumber' ),
						firstName: child.get( 'name.first' ),
						lastName: child.get( 'name.last' ),
						alias: child.get( 'name.alias' ),
						adoptionWorker: child.get( 'adoptionWorker.name.full' ),
						adoptionWorkerAgency: child.get( 'adoptionWorkerAgency.name' ),
						adoptionWorkerPhone,
						adoptionWorkerEmail: child.get( 'adoptionWorker.email' ),
						recruitmentWorker: child.get( 'recruitmentWorker.name.full' ),
						recruitmentWorkerAgency: child.get( 'recruitmentWorkerAgency.name' ),
						recruitmentWorkerPhone,
						recruitmentWorkerEmail: child.get( 'recruitmentWorker.email' ),
						'matchingExclusions[]': child.get( 'exclusions' ),
						aspirations: child.get( 'aspirations' ),
						careFacility: child.get( 'careFacilityName' ),
						// childInvalidFamilyConstellationReason: don't have this info, it's the reason a child can't be placed with same-sex couples
						city: child.get( 'city' ),
						currentResidence: child.get( 'residence' ),
						dateOfBirth: `${ child.get( 'birthDate' ).getMonth() + 1 }/${ child.get( 'birthDate' ).getDate() }/${ child.get( 'birthDate' ).getFullYear() }`,
						'disabilities[]': child.get( 'disabilities' ),
						emotionalNeeds: child.get( 'emotionalNeedsDescription' ),
						familyContactDescription: child.get( 'birthFamilyTypeOfContact' ),
						familyLife: child.get( 'familyLife' ),
						gender: child.get( 'gender' ),
                        'pronouns[]': child.get( 'pronouns' ),
                        doesIdentifyAsLGBTQ: child.get( 'identifiesAsLGBTQ' ),
                        lgbtqIdentityComments: child.get( 'identifiesAsLGBTQDetails' ),
                        shareIdentityInProfile: child.get( 'shareIdentity' ),
                        shareIdentityComments: child.get( 'shareIdentityDetails' ),
						intellectualNeeds: child.get( 'intellectualNeedsDescription' ),
						isFamilyContactNeeded: child.get( 'hasContactWithBirthFamily' ) ? 'Yes' : 'No',
						isNotMACity: child.get( 'isOutsideMassachusetts' ) ? 'on' : 'off',
						isPartOfSiblingGroup: child.get( 'hasContactWithSiblings' ) ? 'Yes' : 'No', // ?
						isSiblingContactNeeded: child.get( 'hasContactWithSiblings' ) ? 'Yes': 'No', // ?
						'languages[]': child.get( 'languages' ),
						legalStatus: child.get( 'legalStatus' ),
						nickName: child.get( 'name.nickName' ),
						nonMACity: child.get( 'cityText' ),
						// otherEthnicBackground: "test" // don't have this info
						otherRecruitmentConsiderations: child.get( 'otherRecruitmentConsiderations' ),
						personality: child.get( 'personality' ),
						physicalNeeds: child.get( 'physicalNeedsDescription' ),
						'race[]': child.get( 'race' ),
						schoolLife: child.get( 'schoolLife' ),
						siblingContactDescription: child.get( 'siblingTypeOfContact' ),
						siblingNames: child.get( 'siblings' ).map( child => child.get( 'name.full' ) ),
						socialNeeds: child.get( 'socialNeedsDescription' ),
						yearEnteredCare: child.get( 'yearEnteredCare' ),
						outOfStateFamiliesNewEngland: child.get( 'outOfStateFamilyNewEngland' ) ? 'Yes' : 'No',
						outOfStateFamiliesAny: child.get( 'outOfStateFamilyAny' ) ? 'Yes' : 'No'
					}
				})
			};

			next();
		})
		.catch( err => {
			throw new Error( `Could not fetch recruitment worker's children` );
		});
};