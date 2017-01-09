/**
 * Created by Adrian Suciu.
 */

var async                   = require('async'),
    keystone                = require('keystone'),
    Types                   = keystone.Field.Types,
    InternalNote            = keystone.list('Internal Note'),
    dataMigrationService    = require('../service_data-migration')
    ;

// migration file location
const csvFilePath = './migration-data/csv-data/agency.csv';
const csv = require( 'csvtojson' );

//Converter Class 
var Converter = require("csvtojson").Converter;
var converter = new Converter({});

// this is the call_note table which relates to call table
// var columns = ["cln_id","cll_id","comment","created_by","created_datetime","updated_by","updated_datetime"];
// var columns_call = ["cll_id","agc_id","fam_id","taken_by","call_date","inquiry_type","inquiry_method","rcs_id",
//                     "recruitment_agc_id","confirm_print_date","generate_letter","scheduled_print_date",
//                     "last_print_date","generate_confirmation","family"];

var callChild = [];

module.exports.importInternalNotes = (req, res, done) => {

        var self = this,
            locals = res.locals,
            allCalls = self.preloadCalls();

            async.parallel([
                
                function preloadCalls(done){
                    var _allCalls = [];

                    converter.fromFile("./migration-data/csv-data/call.csv",function(err,array) {
                        if (err) {
                            throw "An error occurred!\n" + err;
                        } else {
                            var importArray = array;

                            for (var i=0,_count=importArray.length; i <_count; i++) {
                                _allCalls.push(importArray[i]);
                            }

                            allCalls = _allCalls;
                        }

                        done();
                    })
                },
                function preloadCallChildTable(done){
                    var _allCalls = [];

                    converter.fromFile("./migration-data/csv-data/call_child.csv",function(err,array) {
                        if (err) {
                            throw "An error occurred!\n" + err;
                        } else {
                            var importArray = array;

                            for (var i=0,_count=importArray.length; i <_count; i++) {
                                _allCalls.push(importArray[i]);
                            }

                            callChild = _allCalls;
                        }

                        done();
                    })
                }

            ], function() {

                let remainingRecords = 0;

                csv().fromFile( csvFilePath )
                    .on( 'json', ( _internalNote, index ) => {	// this will fire once per row of data in the file
                        // increment the counter keeping track of how many records we still need to process
                        remainingRecords++;

                        var _relatedCallObject = fetchCall(_internalNote.cll_id, allCalls);

                        if (typeof(_relatedCallObject) != "undefined" && _relatedCallObject != null) {
                            var newInternalNote = new InternalNote.model({

                                /* GO FETCH THE NEW ID FROM THE NEW EXISTING CHILD TABLE */
                                child: fetchCall(_internalNote.cll_id, callChild),
                                // {type: Types.Relationship, label: 'child', ref: 'Child', initial: true},

                                family: _relatedCallObject.fam_id, 
                                socialWorker: _relatedCallObject.agc_id,
                                date: _internalNote.created_datetime,

                                employee: _relatedCallObject.agc_id,
                                note: _internalNote.comment

                            });

                            // call save method on Internal Note object
                            newInternalNote.save(function (err) {
                                if (err) {
                                    console.log( `[ID#${ _internalNote.agn_id }] an error occured while saving ${ newInternalNote.code } object.` );
                                    // throw `[ID#${ agency.agn_id }] an error occured while saving ${ newAgency } object.`
                                }
                                else {
                                    console.log( `[ID#${ _internalNote.agn_id }] agency successfully saved!` );
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

            })
        }
    
    
function fetchCall(id, haystack){
    for (var i=0,_count=haystack.length; i <_count; i++) {
        var _callList = haystack[i];

        if (_callList.cll_id == id) {
            return _callList;
        }
    }
}

// function fetchChildId(id, haystack){
//     for (var i=0,_count=haystack.length; i <_count; i++) {
//         var _callList = haystack[i];

//         if (_callList.cll_id == id) {
//             return _callList;
//         }
//     }
// }