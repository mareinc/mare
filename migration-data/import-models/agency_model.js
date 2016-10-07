/**
 * Created by Adrian Suciu.
 */

var family_model = require('models/Agency.js');

var columns = ["agn_id","code","name","address_1","address_2","city","state","zip","phone","fax","url","rgn_id"];
var importArray;

var keystone = require('keystone'),
	Agency = keystone.list('Agency'),
	csv2arr = require("csv-to-array");

module.exports = {
	importAgencies: function(){
		csv2arr({
			file: "db_exports/June14th_Expors/agency.csv",
			columns: columns
		}, function (err, array) {
			if (err) {
				throw "An error occurred!\n" + err;
			} else {
				importArray = array;

				for (var i=0,_count=importArray.length; i <_count; i++) {
					var _agency = importArray[i];

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
							state: _agency.state,
							zipCode: _agency.zip,
							region: _agency.rgn_id
						},

						url: _agency.url,
						generalInquiryContact: _agency.generalInquiryContact

					});

					if (shouldBePublished) {
						newAgency.state = 'published';
					}

					// call save method on Child object
					newAgency.save(function(err) {
						// newChild object has been saved
						if (err) {
							throw "[ID#" + _agency.agn_id +"] an error occured while saving " + newAgency + " object."
						}
						else {
							console.log("[ID#" + _agency.agn_id + "] child successfully saved!");
						}
					});

				}
			}
		})
	}
}
