/**
 * Created by Adrian Suciu.
 */

var internal_note_model = require('models/InternalNote.js');
// this is the call_note table which relates to call table
var columns = ["cln_id","cll_id","comment","created_by","created_datetime","updated_by","updated_datetime"];
var columns_call = ["cll_id","agc_id","fam_id","taken_by","call_date","inquiry_type","inquiry_method","rcs_id",
                    "recruitment_agc_id","confirm_print_date","generate_letter","scheduled_print_date","last_print_date","generate_confirmation","family"];
var importArray;

var keystone = require('keystone'),
    InternalNote = keystone.list('InternalNote'),
    csv2arr = require("csv-to-array");

module.exports = {
    importInternalNotes: function(){

        var allCalls = self.preloadCalls();

        csv2arr({
            file: "db_exports/June14th_Expors/agency.csv",
            columns: columns
        }, function (err, array) {
            if (err) {
                throw "An error occurred!\n" + err;
            } else {
                importArray = array;

                for (var i=0,_count=importArray.length; i <_count; i++) {
                    var _internalNote = importArray[i];
                    var _relatedCallObject = self.fetchCall(_internalNote.cll_id, allCalls);
                    // populate instance for Family object

                    if (typeof(_relatedCallObject) != "undefined" && _relatedCallObject != null) {
                        var newInternalNote = new InternalNote.model({

                            child: {type: Types.Relationship, label: 'child', ref: 'Child', initial: true},

                            family: _relatedCallObject.fam_id, //{type: Types.Relationship, label: 'family', ref: 'Family', initial: true},
                            socialWorker: _relatedCallObject.agc_id, //{ type: Types.Relationship, label: 'social worker', ref: 'Social Worker', initial: true },
                            date: _internalNote.created_datetime,

                            employee: { type: Types.Relationship, label: 'note creator', ref: 'Admin', required: true, noedit: true, initial: true },
                            note: {type: Types.Textarea, label: 'note', required: true, initial: true}

                        });

                        if (shouldBePublished) {
                            newInternalNote.state = 'published';
                        }

                        // call save method on Internal Note object
                        newInternalNote.save(function (err) {
                            // newInternalNote object has been saved
                            if (err) {
                                throw "[ID#" + _InternalNote.agn_id + "] an error occured while saving " + newInternalNote + " object."
                            }
                            else {
                                console.log("[ID#" + _InternalNote.agn_id + "] internal note successfully saved!");
                            }
                        });
                    }

                }
            }
        })
    },
    preloadCalls: function(){
        var allCalls = [];
        csv2arr({
            file: "db_exports/June14th_Expors/call.csv",
            columns: columns_call
        }, function (err, array) {
            if (err) {
                throw "An error occurred!\n" + err;
            } else {
                var importArray = array;

                for (var i=0,_count=importArray.length; i <_count; i++) {
                    allCalls.push(importArray[i]);
                }

                return allCalls;
            }
        })
    }
    fetchCall: function(id, haystack){


        for (var i=0,_count=haystack.length; i <_count; i++) {
            var _callList = importArray[i];

            if (_callList.cll_id == id) {
                return _callList;
            }
        }

    }
}
