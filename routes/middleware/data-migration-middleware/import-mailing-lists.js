/**
 * Created by Adrian Suciu.
 */

var async                   = require('async'),
    keystone                = require('keystone'),
    Types                   = keystone.Field.Types,
    MailingList             = keystone.list('Mailing List'),
    dataMigrationService    = require('../service_data-migration');

// migration file location
const csvFilePath = './migration-data/csv-data/mailing_list.csv';
const csv = require( 'csvtojson' );

//Converter Class 
var Converter = require("csvtojson").Converter;
var converter = new Converter({});

// var ml_coluns = ["mlt_id","name"]
// var mls_columns = ["mls_id","mlt_id","fam_id","agc_id","ocn_id"];

module.exports.importMailingLists = (req, res, done) => {

    let locals = res.locals;

	async.parallel([
		function loadMailingSubscriptions(done){
            let importArray;
            
            converter.fromFile("./migration-data/csv-data/mailing_list_subscription.csv",function(err,array){
                if (err) {
                    throw "An error occurred!\n" + err;
                } else {
                    importArray = array
                    var resultArray = [];

                    for (var i=0,_count=importArray.length; i <_count; i++) {
                        allMailingListsSubscriptions.push(importArray[i]);
                    }
                }

                done();
            })
        }
	], function() {

		let remainingRecords = 0;

		csv().fromFile( csvFilePath )
			.on( 'json', ( _mailinglist, index ) => {	// this will fire once per row of data in the file
				// increment the counter keeping track of how many records we still need to process
				remainingRecords++;

                var _mailingListSubscribers = fetchMailingListSubscriptions(_mailinglist.mlt_id, allMLS);

                for (var j=0,_len=_mailingListSubscribers.length; j < _len; j++) {

                    // populate instance for Mailing List object
                    var newMailingList = new MailingList.model({

                        mailingList: _mailinglist.name,
                        socialWorkerSubscribers: _mailingListSubscribers[j]['agc_id'],
                        familySubscribers: _mailingListSubscribers[j]['fam_id'],
                        outsideContactSubscribers: _mailingListSubscribers[j]['ocn_id']

                    });

                    // call save method on Mailing List object
                    newMailingList.save(function (err) {
                        if (err) {
							console.log( `[ID#${ _mailinglist.agn_id  }] an error occured while saving ${ newMailingList.code } object.` );
							// throw `[ID#${ agency.agn_id }] an error occured while saving ${ newAgency } object.`
						}
						else {
							console.log( `[ID#${ _mailinglist.agn_id  }] agency successfully saved!` );
						}
						
						// decrement the counter keeping track of how many records we still need to process
						remainingRecords--;
						// if there are no more records to process call done to move to the next migration file
						if( remainingRecords === 0 ) {
							done();
						}
                    });
                }
            })
            .on( 'end', () => {
                console.log( `end` ); // this should never execute but should stay for better debugging
            });
    });
}



function fetchMailingListSubscriptions(id, haystack){

    var resultArray = [];

    for (var i=0,_count=haystack.length; i <_count; i++) {
        var _newMailingListItem = new Object();
        var _mailinglist = haystack[i];

        if (_mailinglist.mlt_id == id) {
            newMailingListItem['fam_id'] = fetchFamIdEquivalent(_mailinglist.fam_id);
            newMailingListItem['agc_id'] = fetchAgencyIdEquivalent(_mailinglist.agc_id);
            newMailingListItem['ocn_id'] = fetchOutsideContactIdEquivalent(_mailinglist.ocn_id);
        }

        resultArray.push(_newMailingListItem);
    }

    return resultArray;

}

function fetchFamIdEquivalent(id) {
    // fetch the related id for the same thing from the new database
    async.series([
        dataMigrationService.getModelId(req, res, done, { 
            model: 'Family', 
            targetField: 'oldId', 
            targetValue: id, 
            returnTarget: 'familyID' })
	], function() {

		return locals.familyID;

		done();
	});
    
}

function fetchAgencyIdEquivalent(id) {
    // fetch the related id for the same thing from the new database
    async.series([
        dataMigrationService.getModelId(req, res, done, { 
            model: 'Agency', 
            targetField: 'oldId', 
            targetValue: id, 
            returnTarget: 'agencyID' })
	], function() {

		return locals.agencyID;

		done();
	});
    
}

function fetchOutsideContactIdEquivalent(id) {
    // fetch the related id for the same thing from the new database
    async.series([
        dataMigrationService.getModelId(req, res, done, { 
            model: 'Outside Contact', 
            targetField: 'oldId', 
            targetValue: id, 
            returnTarget: 'outsideContactID' })
	], function() {

		return locals.outsideContactID;

		done();
	});
    
}