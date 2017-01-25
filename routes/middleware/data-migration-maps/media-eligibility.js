var dataMigrationService	= require( '../service_data-migration' ),
	async					= require( 'async' );

exports.getMediaEligibilitiesMap = ( req, res, done ) => {

	console.log( `fetching media eligibilities map` );

	var locals = res.locals;
	// create an area in locals for the media eligibilities map
	locals.migration.maps.mediaEligibilities = {};

	// const adoptUSkidsArray = [ '2017 Family Fun Day', '2017 Gaming Party', 'ACONE Newsletter', 'Action Unlimited' ];
	const adoptUSkidsArray = [ 46, 1102 ]; // ** missing the 2017 sources
	const annualReportArray = [];
	// const facebookArray = [ 'Adopt-US-Kids-Facebook' ];
	const facebookArray = [ 1118 ];
	// const heartGalleryArray = [ 'Adopt-US-Kids-Twitter', 'Adoptalk', 'Adoptive Families Mag', 'AdoptUsKids/Faces', 'Annual Report', 'AUK "Perfect Parent"  2014' ];
	const heartGalleryArray = [ 1119, 1134, 88, 68, 43, 1210 ];
	// const mareWebsiteArray = [ 'Barre Gazette- Turley', 'BayState Parent Magazine', 'Belchertown Sentinel- Turley', 'Boston Coalition Topics Group' ];
	const mareWebsiteArray = [ 1046, 115, 1044 ]; // ** missing Boston Coalition Topics Group
	// const otherTextboxArray = [ 'The Catalyst Newspaper', 'The Daily Item', 'The Gardner News', 'The Westfield News', 'Town Reminder -  Turley', 'Turley Publishing', 'TV PSA', 'Univision' ];
	const otherTextboxArray = [ 1251, 1260, 1263, 1257, 1042, 1051, 1094, 1013 ];
	// const otherMAREPublicationsArray = [ 'Boston Family Support Group', 'Boston Globe Magazine', 'Boston Herald', 'Brockton Parents Magazine', 'Chicopee Registerl- Turley' ];
	const otherMAREPublicationsArray = [ 1245, 1179, 7, 1247, 1038 ];
	// const otherPrintArray = [ 'Child of the month', 'Choosing Adoption', 'Choosing Adoption - Spanish', 'Concord Journal', 'Country Journal-  Turley', 'Daily Hampshire Gazette', 'Daily Times Chronicle', 'Dorchester Reporter', 'El Mundo', 'El Planeta', 'El Pueblo Latino News', 'Facebook-MARE', 'Faith-based/Church Initiative', 'Foster Focus Magazine', 'Free Bird Times', 'Heart Gallery', 'Heart Gallery 2012', 'Heart Gallery 2013', 'Heart Gallery 2014', 'Heart Gallery 2015', 'Heart Gallery 2016', 'Holyoke Sun -  Turley', 'Home for the Holidays', 'Instagram- MARE', 'Journal Register  -  Turley', 'La Semana', 'Ludlow Register -  Turley', 'Lunch and Learn', 'Lynnfield Villager', 'MARE Moment', 'MARE Newsletter', 'MARE Web', 'MBTA Walk Ads', 'Metro Boston', 'Middlesex East', `Mom's Night Out`, 'North Reading Transcript', `Parent's Paper`, `People's Voice`, 'Quaboag Current -  Turley', 'Rumbo', 'Siglo21', 'Southwick Suffield News-Turley', 'Stonebridge Press Newspapers', 'Stoneham Independent', `Sunday's Child`, 'Tantasqua Town Common-Turley', 'Taunton Gazette' ];
	const otherPrintArray = [ 69, 11, 42, 1175, 1052, 109, 1014, 1253, 76, 1133, 1031, 1107, 1233, 1154, 47, 1218, 1157, 1187, 1209, 1235, 1246, 1040, 1100, 1053, 19, 1047, 1234, 1015, 1112, 21, 33, 1142, 1105, 1008, 1113, 1016, 27, 45, 1045, 38, 1005, 1043, 1262, 1017, 3, 1037, 37 ]; // ** missing Instagram- MARE
	// const otherTVArray = [ 'Video Snapshots', 'Vocero Hispano' ];
	const otherTVArray = [ 86, 44 ];
	// const spanishTVArray = [ 'West County News -  Turley', 'Wilbraham Hamden Times-Turley', 'Telemundo' ];
	const spanishTVArray = [ 1041, 1054, 1149 ];
	const spanishOtherMediaArray = [];
	// const spanishPrintArray = [ 'Walk 2012 Metro Newspaper Ad', 'Walk for Adoption', 'Ware River News -  Turley', 'WBZ.com Car Donation Campaign', `Wednesday's Child`, `Wendy's Wonderful Kids` ];
	const spanishPrintArray = [ 1166, 1109, 1039, 1121, 2, 1026 ];
	// const sundaysChildArray = [ 'Wilmington Town Crier' ];
	const sundaysChildArray = [ 1018 ];
	// const videoSnapshotsArray = [ 'Woburn Daily Times' ];
	const videoSnapshotsArray = [ 1256 ];
	// const wednesdaysChildArray = [ 'Worcester Telegram & Gazette' ];
	const wednesdaysChildArray = [ 35 ];
	// const WWKArray = [ 'YMCA Core Newsletter' ];
	const WWKArray = [ 1084 ];

	async.parallel([
		done => { dataMigrationService.getModelId( { model: 'Media Eligibility', field: 'mediaEligibility', value: 'AdoptUSkids', mapTo: adoptUSkidsArray, namespace: locals.migration.maps.mediaEligibilities }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Media Eligibility', field: 'mediaEligibility', value: 'annual report', mapTo: annualReportArray, namespace: locals.migration.maps.mediaEligibilities }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Media Eligibility', field: 'mediaEligibility', value: 'Facebook', mapTo: facebookArray, namespace: locals.migration.maps.mediaEligibilities }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Media Eligibility', field: 'mediaEligibility', value: 'heart gallery', mapTo: heartGalleryArray, namespace: locals.migration.maps.mediaEligibilities }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Media Eligibility', field: 'mediaEligibility', value: 'MARE website', mapTo: mareWebsiteArray, namespace: locals.migration.maps.mediaEligibilities }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Media Eligibility', field: 'mediaEligibility', value: 'other - text box', mapTo: otherTextboxArray, namespace: locals.migration.maps.mediaEligibilities }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Media Eligibility', field: 'mediaEligibility', value: 'other MARE publications', mapTo: otherMAREPublicationsArray, namespace: locals.migration.maps.mediaEligibilities }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Media Eligibility', field: 'mediaEligibility', value: 'other print', mapTo: otherPrintArray, namespace: locals.migration.maps.mediaEligibilities }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Media Eligibility', field: 'mediaEligibility', value: 'other TV', mapTo: otherTVArray, namespace: locals.migration.maps.mediaEligibilities }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Media Eligibility', field: 'mediaEligibility', value: 'Spanish TV', mapTo: spanishTVArray, namespace: locals.migration.maps.mediaEligibilities }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Media Eligibility', field: 'mediaEligibility', value: 'Spanish other media', mapTo: spanishOtherMediaArray, namespace: locals.migration.maps.mediaEligibilities }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Media Eligibility', field: 'mediaEligibility', value: 'Spanish print', mapTo: spanishPrintArray, namespace: locals.migration.maps.mediaEligibilities }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Media Eligibility', field: 'mediaEligibility', value: 'Sunday\'s Child', mapTo: sundaysChildArray, namespace: locals.migration.maps.mediaEligibilities }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Media Eligibility', field: 'mediaEligibility', value: 'videosnapshots', mapTo: videoSnapshotsArray, namespace: locals.migration.maps.mediaEligibilities }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Media Eligibility', field: 'mediaEligibility', value: 'Wednesday\'s Child', mapTo: wednesdaysChildArray, namespace: locals.migration.maps.mediaEligibilities }, done ); },
		done => { dataMigrationService.getModelId( { model: 'Media Eligibility', field: 'mediaEligibility', value: 'WWK', mapTo: WWKArray, namespace: locals.migration.maps.mediaEligibilities }, done ); }
	
	], () => {

		console.log( `media eligibilities map set` );
		done();
	});
}