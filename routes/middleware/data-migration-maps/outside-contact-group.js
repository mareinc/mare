var dataMigrationService	= require('../service_data-migration'),
	async					= require('async');

exports.getOutsideContactGroupsMap = function getOutsideContactGroupsMap(req, res, done) {

	var locals = res.locals;

	async.parallel([
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Outside Contact Group', targetField: 'name', targetValue: 'adoption parties', returnTarget: 'adoptionPartyList'  }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Outside Contact Group', targetField: 'name', targetValue: 'family pages', returnTarget: 'familyPagesList' }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Outside Contact Group', targetField: 'name', targetValue: 'photolisting pages', returnTarget: 'photolistingPagesListList' }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Outside Contact Group', targetField: 'name', targetValue: 'newsletters', returnTarget: 'NewslettersList' }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Outside Contact Group', targetField: 'name', targetValue: 'e-mail single parent matching', returnTarget: 'emailSingleParentMatchingList' }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Outside Contact Group', targetField: 'name', targetValue: 'contracted adoption workers', returnTarget: 'contractedAdoptionWorkersList' }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Outside Contact Group', targetField: 'name', targetValue: 'DCF adoption workers', returnTarget: 'DCFAdoptionWorkersList' }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Outside Contact Group', targetField: 'name', targetValue: 'video libraries', returnTarget: 'videoLibrariesList' }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Outside Contact Group', targetField: 'name', targetValue: 'non-DCF/contracted contacts', returnTarget: 'nonDCFContractedContactsList' }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Outside Contact Group', targetField: 'name', targetValue: 'board of directors', returnTarget: 'boardOfDirectorsList' }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Outside Contact Group', targetField: 'name', targetValue: 'Boston coalition', returnTarget: 'bostonCoalitionList' }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Outside Contact Group', targetField: 'name', targetValue: 'DCF area/reg. dir. & APMs', returnTarget: 'DCFAreaRegDirAndAPMsList' }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Outside Contact Group', targetField: 'name', targetValue: 'honorary board of directors', returnTarget: 'honoraryBoardofDirectorsList' }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Outside Contact Group', targetField: 'name', targetValue: 'out of country newsletters', returnTarget: 'outOfCountryNewslettersList' }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Outside Contact Group', targetField: 'name', targetValue: 'DCF adoption supervisors', returnTarget: 'DCFAdoptionSupervisorsList' }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Outside Contact Group', targetField: 'name', targetValue: 'contracted adoption sups', returnTarget: 'contractedAdoptionSupsList' }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Outside Contact Group', targetField: 'name', targetValue: 'contracted exec. directors', returnTarget: 'contractedExecDirectorsList' }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Outside Contact Group', targetField: 'name', targetValue: 'adoption mixer families 2002', returnTarget: 'adoptionMixerFamilies2002List' }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Outside Contact Group', targetField: 'name', targetValue: 'e-mail newsletter', returnTarget: 'emailNewsletterList' }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Outside Contact Group', targetField: 'name', targetValue: 'Heart Gallery 2005', returnTarget: 'heartGallery2005List' }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Outside Contact Group', targetField: 'name', targetValue: 'e-mail adoption parties', returnTarget: 'emailAdoptionPartiesList' }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Outside Contact Group', targetField: 'name', targetValue: 'fundraising', returnTarget: 'fundraisingList' }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Outside Contact Group', targetField: 'name', targetValue: 'single parent matching night', returnTarget: 'singleParentMatchingNightList' }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Outside Contact Group', targetField: 'name', targetValue: 'Heart Gallery photographers', returnTarget: 'heartGalleryPhotographersList' }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Outside Contact Group', targetField: 'name', targetValue: 'Latino families', returnTarget: 'latinoFamiliesList' }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Outside Contact Group', targetField: 'name', targetValue: '2007 family follow-up project', returnTarget: 'familyFollowupProjectList2007' }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Outside Contact Group', targetField: 'name', targetValue: 'former board of directors', returnTarget: 'formerBoardofDirectorsList' }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Outside Contact Group', targetField: 'name', targetValue: 'statewide recruitment', returnTarget: 'statewideRecruitmentList' }); },
		function(done) { dataMigrationService.getModelId(req, res, done, { model: 'Outside Contact Group', targetField: 'name', targetValue: 'AUKFY 2015', returnTarget: 'AUKFY2015List' }); }
	], function(err, results) {

		if (err) {
			console.log(`Error ${err}`);
		}

		locals.outsideContactGroupsMap = {
			1: locals.adoptionPartyList,
			3: locals.familyPagesList,
			4: locals.photolistingPagesListList,
			5: locals.NewslettersList,
			7: locals.emailSingleParentMatchingList,
			10: locals.contractedAdoptionWorkersList,
			11: locals.DCFAdoptionWorkersList,
			12: locals.videoLibrariesList,
			16: locals.nonDCFContractedContactsList,
			32: locals.boardOfDirectorsList,
			33: locals.bostonCoalitionList,
			35: locals.DCFAreaRegDirAndAPMsList,
			36: locals.honoraryBoardofDirectorsList,
			38: locals.outOfCountryNewslettersList,
			39: locals.DCFAdoptionSupervisorsList,
			40: locals.contractedAdoptionSupsList,
			41: locals.contractedExecDirectorsList,
			42: locals.adoptionMixerFamilies2002List,
			43: locals.emailNewsletterList,
			1001: locals.heartGallery2005List,
			1002: locals.emailAdoptionPartiesList,
			1003: locals.fundraisingList,
			1004: locals.singleParentMatchingNightList,
			1005: locals.heartGalleryPhotographersList,
			1006: locals.latinoFamiliesList,
			1007: locals.familyFollowupProjectList2007,
			1008: locals.formerBoardofDirectorsList,
			1010: locals.statewideRecruitmentList,
			1011: locals.AUKFY2015List
		};

		done();
	});
}
