/**
 * Created by Adrian Suciu.
 */

var async                   = require('async'),
    keystone                = require('keystone'),
    Types                   = keystone.Field.Types,
    MailingList             = keystone.list('MailingList'),
    csv2arr                 = require('csv-to-array'),
    dataMigrationService    = require('../service_data-migration')
    ;

var ml_coluns = ["mlt_id","name"]
var mls_columns = ["mls_id","mlt_id","fam_id","agc_id","ocn_id"];
var importArray;

module.exports.importMailingLists = function importMailingLists(req, res, done) {

    var self = this,
        locals = res.locals;

        var allMLS = loadMailingSubscriptions();

        csv2arr({
            file: "./migration-data/csv-data/mailing_list.csv",
            columns: ml_columns
        }, function (err, array) {
            if (err) {
                throw "An error occurred!\n" + err;
            } else {
                importArray = array;

                for (var i=0,_count=importArray.length; i <_count; i++) {
                    var _mailinglist = importArray[i];
                    var _mailingListSubscribers = fetchMailingListSubscriptions(_mailinglist.mlt_id, allMLS);

                    for (var j=0,_len=_mailingListSubscribers.length; j < _len; j++) {


                        // populate instance for Mailing List object
                        var newMailingList = new MailingList.model({

                            mailingList: _mailinglist.name,
                            socialWorkerSubscribers:  _mailingListSubscribers[j]['agc_id'],
                            familySubscribers: _mailingListSubscribers[j]['fam_id'],
                            outsideContactSubscribers:  _mailingListSubscribers[j]['ocn_id']

                        });

                        // call save method on Mailing List object
                        newMailingList.save(function (err) {
                            // newMailingList object has been saved
                            if (err) {
                                throw "[ID#" + _mailinglist.agn_id + "] an error occured while saving " + newMailingList + " object."
                            }
                            else {
                                console.log("[ID#" + _mailinglist.agn_id + "] child successfully saved!");
                            }
                        });
                    }
                }
            }
        })
    }
}

function loadMailingSubscriptions(){
        var allMailingListsSubscriptions = [];
        csv2arr({
            file: "./migration-data/csv-data/mailing_list_subscription.csv",
            columns: mls_columns
        }, function (err, array) {
            if (err) {
                throw "An error occurred!\n" + err;
            } else {
                importArray = array
                var resultArray = [];

                for (var i=0,_count=importArray.length; i <_count; i++) {

                    allMailingListsSubscriptions.push(importArray[i]);
                }

                return allMailingListsSubscriptions;
            }
        })
    }

function fetchMailingListSubscriptions(id, haystack){

    var resultArray = [];

    for (var i=0,_count=haystack.length; i <_count; i++) {
        var _newMailingListItem = new Object();
        var _mailinglist = importArray[i];

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
}

function fetchAgencyIdEquivalent(id) {
    // fetch the related id for the same thing from the new database
}

function fetchOutsideContactIdEquivalent(id) {
    // fetch the related id for the same thing from the new database
}
