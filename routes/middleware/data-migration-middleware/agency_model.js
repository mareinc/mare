
/**
 * Created by Adrian Suciu.
 */

var async					= require('async'),
	keystone				= require('keystone'),
	Types 					= keystone.Field.Types,
    Agency 					= keystone.list('Agency'), // NOTE: this may not work, for keystone to access the database using a model reference, you may need the keystone.list('Agency'); syntax here
    Region					= keystone.list('Region'),
    csv2arr					= require('csv-to-array'),
	dataMigrationService	= require('../service_data-migration');
	statesMap				= require('../data-migration-maps/states');
	regionsMap				= require('../data-migration-maps/regions');

var columns = ["agn_id","code","name","address_1","address_2","city","state","zip","phone","fax","url","rgn_id"];
var importArray;

module.exports.importAgencies = function importAgencies(req, res, done) {

		var self = this,
			locals = res.locals;

		csv2arr({

			file: "./migration-data/csv-data/agency.csv",
			columns: columns

		}, function (err, array) {

			if (err) {
				throw "An error occurred!\n" + err;
			} else {
				importArray = array;


				async.parallel([
					function(done) { statesMap.getStatesMap(req, res, done) } ,
					function(done) { regionsMap.getRegionsMap(req, res, done) }
				], function() {

					for (var i=1,_count=importArray.length; i <_count; i++) {
						var _agency = importArray[i];

						console.log('#' + i);

						// populate instance for agency object
						var newAgency = new Agency.model({

							code: _agency.code,
							name: _agency.name,

							phone: _agency.phone,
							fax: _agency.fax,

							address: {
								street1: _agency.address_1,
								street2: _agency.address_2,
								city: _agency.city,
								state: locals.statesMap[_agency.state],
								zipCode: _agency.zip,
								region: locals.regionsMap[_agency.rgn_id]
							},

							url: _agency.url,
							generalInquiryContact: _agency.generalInquiryContact

						});


						console.log('#2');

						// call save method on Child object
						newAgency.save(function(err) {
							// newChild object has been saved
							if (err) {
								console.log('#3');
								throw "[ID#" + _agency.agn_id +"] an error occured while saving " + newAgency + " object."
							}
							else {
								console.log('#4');
								console.log("[ID#" + _agency.agn_id + "] child successfully saved!");
							}
						});
					}

				});
			}	

		})
	}

