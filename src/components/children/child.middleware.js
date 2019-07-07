const keystone = require( 'keystone' );
const modelController = require( '../../utils/model.controllers' );

/* NOTE: the accessing user must be a social worker */
exports.getChildrenByRecruitmentWorker = async function( req, res, next ) {
	'use strict';
	
	// fetch the models of the removed staff attendees, populating only the full name field
	const children = await keystone.list( 'Child' ).model
		.find()
		.where( 'adoptionWorker', req.user.get( '_id' ) )
		.populate( [ 'adoptionWorker', 'adoptionWorkerAgency', 'recruitmentWorker', 'recruitmentWorkerAgency' ] )
		.select( [ 'name', 'adoptionWorker', 'adoptionWorkerAgency', 'recruitmentWorker', 'recruitmentWorkerAgency', 'recommendedFamilyConstellation', 'otherFamilyConstellationConsideration' ] )
		.exec()
		.then( children => {

			res.locals.recruitmentWorkersChildren = children.map( child => {

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
					adoptionWorker: child.get( 'adoptionWorker.name.full' ),
					adoptionWorkerAgency: child.get( 'adoptionWorkerAgency.name' ),
					adoptionWorkerPhone,
					adoptionWorkerEmail: child.get( 'adoptionWorker.email' ),
					recruitmentWorker: child.get( 'recruitmentWorker.name.full' ),
					recruitmentWorkerAgency: child.get( 'recruitmentWorkerAgency.name' ),
					recruitmentWorkerPhone,
					recruitmentWorkerEmail: child.get( 'recruitmentWorker.email' ),
					'recommendedFamilyConstellations[]': child.get( 'recommendedFamilyConstellation' ),
					'otherFamilyConstellationConsiderations[]': child.get( 'otherFamilyConstellationConsideration' )
				};
			});

			next();
		})
		.catch( err => {
			throw new Error( `Could not fetch recruitment worker's children` );
		});
};