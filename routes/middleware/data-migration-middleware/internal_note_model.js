/**
 * Created by Adrian Suciu.
 */


/*
!!!
!!! MOVE THE comment FOR ALL OF THESE INTO THE inquiry_model.js UNDER comments
!!!
*/

var async                   = require('async'),
    keystone                = require('keystone'),
    Types                   = keystone.Field.Types,
    InternalNote            = keystone.list('InternalNote'),
    csv2arr                 = require('csv-to-array'),
    dataMigrationService    = require('../service_data-migration')
    ;

//Converter Class 
var Converter = require("csvtojson").Converter;
var converter = new Converter({});

// this is the call_note table which relates to call table
// var columns = ["cln_id","cll_id","comment","created_by","created_datetime","updated_by","updated_datetime"];
// var columns_call = ["cll_id","agc_id","fam_id","taken_by","call_date","inquiry_type","inquiry_method","rcs_id",
//                     "recruitment_agc_id","confirm_print_date","generate_letter","scheduled_print_date","last_print_date","generate_confirmation","family"];
var importArray;

module.exports.importInternalNotes = function importInternalNotes(req, res, done) {

        var self = this,
            locals = res.locals,
            allCalls = self.preloadCalls();
        
        converter.fromFile("./migration-data/csv-data/call_note.csv",function(err,array){

        // csv2arr({
        //     file: "./migration-data/csv-data/call_note.csv",
        //     columns: columns
        // }, function (err, array) {
            if (err) {
                throw "An error occurred!\n" + err;
            } else {
                importArray = array;

                async.parallel([
                    
                    preloadCalls()

                ], function() {

                    for (var i=0,_count=importArray.length; i <_count; i++) {
                        var _internalNote = importArray[i];
                        var _relatedCallObject = fetchCall(_internalNote.cll_id, allCalls);
                        // populate instance for Family object

                        if (typeof(_relatedCallObject) != "undefined" && _relatedCallObject != null) {
                            var newInternalNote = new InternalNote.model({

                                /* !!! Dont know where to pull this from!? */
                                child: {type: Types.Relationship, label: 'child', ref: 'Child', initial: true},

                                family: _relatedCallObject.fam_id, 
                                socialWorker: _relatedCallObject.agc_id,
                                date: _internalNote.created_datetime,

                                /* !!! Dont know where to pull this from!? */
                                employee: _relatedCallObject.agc_id //{ type: Types.Relationship, label: 'note creator', ref: 'Admin', required: true, noedit: true, initial: true },
                                /* !!! Dont know where to pull this from!? */
                                note: {type: Types.Textarea, label: 'note', required: true, initial: true}

                            });

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
            }
        })
    }
    
}

function preloadCalls(){
    var _allCalls = [];

    converter.fromFile("./migration-data/csv-data/call.csv",function(err,array){
    // csv2arr({
    //     file: "./migration-data/csv-data/call.csv",
    //     columns: columns_call
    // }, function (err, array) {
        if (err) {
            throw "An error occurred!\n" + err;
        } else {
            var importArray = array;

            for (var i=0,_count=importArray.length; i <_count; i++) {
                _allCalls.push(importArray[i]);
            }

            allCalls = _allCalls;
        }
    })
}
    
function fetchCall(id, haystack){
    for (var i=0,_count=haystack.length; i <_count; i++) {
        var _callList = importArray[i];

        if (_callList.cll_id == id) {
            return _callList;
        }
    }
}