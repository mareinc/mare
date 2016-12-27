/**
 * Created by Adrian Suciu.
 */

var async					= require('async'),
	keystone				= require('keystone'),
	Types 					= keystone.Field.Types,
	Agency					= keystone.list('Agency'),
	SocialWorker   			= keystone.list('Social Worker'),
    csv2arr					= require('csv-to-array'),
	dataMigrationService	= require('../service_data-migration'),
	statesMap				= require('../data-migration-maps/state')
	;

// var columns = ["agn_id","code","name","address_1","address_2","city","state","zip","phone","fax","url","rgn_id"];
// var columns_agency_contact = ["agc_id","agn_id","first_name","last_name","phone","phone_ext","fax","email","is_active","notes"];
var importArray;
var _allExistingSocialWorkers;

//Converter Class 
var Converter = require("csvtojson").Converter;
var converter = new Converter({});
var converter2 = new Converter({});

module.exports.importSocialWorker = (req, res, done) => {


    var self = this,
        locals = res.locals;

		converter.fromFile("./migration-data/csv-data/agency.csv", function(err,array) {

		if (err) {
			throw "An error occurred!\n" + err;
		} else {
			
			importArray = array;

			async.parallel([
				function loadAllSocialWorkers(callback) {
					let allSocialWorkers = [];
					let _localImportArray = [];

					converter2.fromFile("./migration-data/csv-data/agency_contact.csv",function(err,array){

						if (err) {
							throw "An error occurred!\n" + err;
						} else {
							_localImportArray = array;

							for (var i=1,_count=_localImportArray.length; i <_count; i++) {
								allSocialWorkers.push(_localImportArray[i])
							}

							_allExistingSocialWorkers = allSocialWorkers;
						}

						callback(null, self.processData());
					})
				},
				function(done) { statesMap.getStatesMap(req, res, done) } 

			], function(err, results) {
				
				for (var i=1,_count=importArray.length; i <_count; i++) {
					let _socialWorkerAgency = importArray[i];
					let _allSocialWorkersForAgency = self.fetchSocialWorker(_socialWorkerAgency.agn_id, _allExistingSocialWorkers);

					for (var j=0, _len=_allSocialWorkersForAgency.length; j < _len; j++) {
						let _currentSocialWorker = _allSocialWorkersForAgency[j];

						console.log('find the new ID based on the name of the agency');
						console.log(_socialWorkerAgency.name);

						// Agency.model.find()
						// 	.where('name', _socialWorkerAgency.name)
						// 	.exec()
						// 	.then(function (model) {
						// 		let _newAgencyID = model[0]._id;

						// 		// populate instance for SocialWorker object
						// 		let newSocialWorker = new SocialWorker.model({

						// 			name: {
						// 				first: _currentSocialWorker.first_name,
						// 				last: _currentSocialWorker.last_name
						// 			},

						// 			email: _currentSocialWorker.email,

						// 			phone: {
						// 				work: _currentSocialWorker.phone
						// 			},

						// 			agency: _newAgencyID, // this needs to get the newly created agency ID
									
						// 			address: {
						// 				street1: _socialWorker.address_1,
						// 				street2: _socialWorker.address_2,
						// 				city: _socialWorker.city,
						// 				state: locals.statesMap[_socialWorker.state],
						// 				zipCode: _socialWorker.zip,
						// 				region: _socialWorker.rgn_id
						// 			},

						// 			notes: _currentSocialWorker.notes,
						// 			oldId: _currentSocialWorker.agc_id
						// 		});

						// 		// call save method on SocialWorker object
						// 		newSocialWorker.save(function (err) {
						// 			// newSocialWorker object has been saved
						// 			if (err) {
						// 				console.log('================================');
						// 				console.log(err);
						// 				console.log('[ID#' + _socialWorker.ocn_id + '] an error occured while saving the newly created object.');
						// 				console.log(newSocialWorker);
						// 				throw "[ID#" + _socialWorker.agn_id + "] an error occured while saving " + newSocialWorker + " object."
						// 			}
						// 			else {
						// 				console.log("[ID#" + _socialWorker.agn_id + "] child successfully saved!");
						// 			}
						// 		});

						// 		done();

						// 	}, function(err) {

						// 		console.log(err);

						// 		done();

						// 	});



						// populate instance for SocialWorker object
						let newSocialWorker = new SocialWorker.model({

							name: {
								first: _currentSocialWorker.first_name,
								last: _currentSocialWorker.last_name,
								//full: _socialWorker. // do not worry about it it is automatically generated
							},

							// avatar:,

							email: _currentSocialWorker.email,

							phone: {
								work: _currentSocialWorker.phone
								// mobile: _socialWorker.,
								// preferred: _socialWorker.
							},

							//position: _socialWorker., // no worries
							agency: _socialWorker.agn_id, // this needs to get the newly created agency ID

							//agencyNotListed: _socialWorker.,
							//agencyText: _socialWorker., // ???

							address: {
								street1: _socialWorker.address_1,
								street2: _socialWorker.address_2,
								city: _socialWorker.city,
								state: locals.statesMap[_socialWorker.state],
								zipCode: _socialWorker.zip,
								region: _socialWorker.rgn_id
							},

							// title: _socialWorker.,
							notes: _currentSocialWorker.notes,
							oldId: _currentSocialWorker.agc_id

							//bookmarkedChildren: _socialWorker. // no worries only for the new system
						});

						// call save method on SocialWorker object
						newSocialWorker.save(function (err) {
							// newSocialWorker object has been saved
							if (err) {
								console.log('================================');
								console.log(err);
								console.log('[ID#' + _socialWorker.ocn_id + '] an error occured while saving the newly created object.');
								console.log(newSocialWorker);
								throw "[ID#" + _socialWorker.agn_id + "] an error occured while saving " + newSocialWorker + " object."
							}
							else {
								console.log("[ID#" + _socialWorker.agn_id + "] child successfully saved!");
							}
						});
					}
				}

			});

		}
	})
},

exports.processData = function processData() {
	console.log("Process data!");
}

//returns an array of all social workers that are under a specific agency that has the psased id
exports.fetchSocialWorker = (id, haystack) => {
	var agencySocialWorkers = [];

	if (id && haystack) {
		for (var i=0,_count=haystack.length; i <_count; i++) {
			var _socialWorker = haystack[i];

			if (_socialWorker && _socialWorker.agn_id == id) {
				agencySocialWorkers.push(_socialWorker);
			}

		}
	}

	return agencySocialWorkers;
}

exports.loadAllSocialWorkers = function loadAllSocialWorkers() {
	let allSocialWorkers = [];
	let _localImportArray = [];

	converter2.fromFile("./migration-data/csv-data/agency_contact.csv",function(err,array){

		if (err) {
			throw "An error occurred!\n" + err;
		} else {
			_localImportArray = array;

			for (var i=0,_count=_localImportArray.length; i <_count; i++) {
				allSocialWorkers.push(_localImportArray[i])
			}

			_allExistingSocialWorkers = allSocialWorkers;
		}
	})
}
