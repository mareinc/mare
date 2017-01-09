/* NOTE: probably not needed as this stuff can be handled with single model fetches */

var dataMigrationService	= require('../service_data-migration'),
	async					= require('async');

 /* agencyMap will end up looking like:

    { oldId1: newId1,
      oldId2: newId2,
      oldId3: newId3,
      ... }

    and can be used by typing let newId = locals.agencyMap[ oldId ], where oldId is the actual id value */
exports.mapAgencyIds = function mapAgencyIds( req, res, done ) {

    let locals = res.locals;
    locals.agencyMap = {};

    async.parallel([
        done => { dataMigrationService.getModelMap( done, { model: 'Agency', map: locals.agencyMap } ); }
    ], () => {

        done();      
    });
};