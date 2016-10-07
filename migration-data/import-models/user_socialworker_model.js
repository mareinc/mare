/**
 * Created by Adrian Suciu.
 */

var socialworker_model = require('models/User_SocialWorker.js');

var columns = ["agn_id","code","name","address_1","address_2","city","state","zip","phone","fax","url","rgn_id"];
var columns_agency_contact = ["agc_id","agn_id","first_name","last_name","phone","phone_ext","fax","email","is_active","notes"];
var importArray;

var keystone = require('keystone'),
	SocialWorker = keystone.list('User_SocialWorker'),
	csv2arr = require("csv-to-array");

module.exports = {
	importSocialWorker: function(){
		csv2arr({
			file: "db_exports/June14th_Expors/agency.csv",
			columns: columns
		}, function (err, array) {
			if (err) {
				throw "An error occurred!\n" + err;
			} else {
				var _allExistingSocialWorkers = self.loadAllSocialWorker();
				importArray = array;

				for (var i=0,_count=importArray.length; i <_count; i++) {
					var _socialWorker = importArray[i];
					var _allSocialWorkersForAgency = self.fetchSocialWorker(_socialWorker.agn_id, _allExistingSocialWorkers);

					for (var j=0, _len=_allSocialWorkersForAgency.length; j < _len; j++) {
						var _currentSocialWorker = _allSocialWorkersForAgency[j];

						// populate instance for SocialWorker object
						var newSocialWorker = new Agency.model({

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
							agency: _socialWorker.agn_id,
							//agencyNotListed: _socialWorker.,
							agencyText: _socialWorker., // ???

							address: {
								street1: _socialWorker.address_1,
								street2: _socialWorker.address_2,
								city: _socialWorker.city,
								state: _socialWorker.state,
								zipCode: _socialWorker.zip,
								region: _socialWorker.rgn_id
							},

							// title: _socialWorker.,
							notes: _currentSocialWorker.notes

							//bookmarkedChildren: _socialWorker. // no worries only for the new system
						});

						if (shouldBePublished) {
							newSocialWorker.state = 'published';
						}

						// call save method on SocialWorker object
						newSocialWorker.save(function (err) {
							// newSocialWorker object has been saved
							if (err) {
								throw "[ID#" + _socialWorker.agn_id + "] an error occured while saving " + newSocialWorker + " object."
							}
							else {
								console.log("[ID#" + _socialWorker.agn_id + "] child successfully saved!");
							}
						});
					}
				}
			}
		})
	},
	//returns an array of all social workers that are under a specific agency that has the psased id
	fetchSocialWorker: function(id, haystack){
		var agencySocialWorkers = [];

		for (var i=0,_count=haystack.length; i <_count; i++) {
			var _socialWorker = importArray[i];
			var _socialWorkerContactDetails = new Object();

			if (_socialWorker[i].agn_id == id) {
				_socialWorkerContactDetails["first_name"] = _socialWorker.first_name;
				_socialWorkerContactDetails["last_name"] = _socialWorker.last_name;
				_socialWorkerContactDetails["phone"] = _socialWorker.phone;
				_socialWorkerContactDetails["email"] = _socialWorker.email;
				_socialWorkerContactDetails["notes"] = _socialWorker.notes;

				agencySocialWorkers.push(_socialWorkerContactDetails)
			}

		}

		return agencySocialWorkers;

	},
	loadAllSocialWorker: function(){
		var allSocialWorkers = [];

		csv2arr({
			file: "db_exports/June14th_Expors/agency_contact.csv",
			columns: columns
		}, function (err, array) {
			if (err) {
				throw "An error occurred!\n" + err;
			} else {
				importArray = array;

				for (var i=0,_count=importArray.length; i <_count; i++) {
					allSocialWorkers.push(importArray[i])
				}

				return allSocialWorkers;
			}
		})
	}
}
