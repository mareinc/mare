/**
 * Created by Adrian Suciu.
 */

var inquiry_model = require('models/Inquiry.js');

// look at ext_inquiry > ext_family > cll_id from the call table

// from ext_inquiry table go through each item and based on the cll_id go to the call table
// if there is an id in the agc_id column then the inquirer field will be populated with the equivalent hash id for the new systems social worker match
// if the fam_id is showing then we do the same thing with the family

// var coluns = ["exf_id","chd_id","created_datetime"] // ext_automativ_inquiry_history

// NOTES Nov-15-2016
/*

For every chd_id we go to child.csv and we find the recruitment_agc_id
Next go to agency_contact.csv and find the agency contact based on the agc_id column and the recruitment_agc_id found earlier
Next based on the cll_id in the ext_inquiry.csv file find the record in call.csv and from here we will pick out the fam_id and the rcs_id
Next from family.csv select the family base don the found fam_id
Next from recruitment_source.csv select the recruitment_source.csv name column correspondingt with the rcs_id found

If under call.csv the inquiry type is a:
C = Child Inquiry
G = General Inquiry
L = Complaint



From ext_inquiry.csv, for every chd_id we go to call.csv and we find which fam_id called about the child and which rcs_id was assigned to this call.
Next get the name from recruitment_source.csv based on the rcs_id
Next from the call_child.csv file based on the cll_id get the chd_id
Next go to the child.csv file and based on the chd_id get the recruitment_agc_id
Next go to agency_contact.csv and based on the recruitment_agc_id found earlier, look it up in the agc_id column 

*/

//Converter Class 
var Converter = require("csvtojson").Converter;
var converter = new Converter({});

// var columns = ["exi_id","exf_id","chd_id","primary_match","on_behalf_of","inquiry_type","inquiry_status","inquiry_sent_datetime","cll_id","cll_import_datetime"];
var importArray;

var keystone = require('keystone'),
    Inquiry = keystone.list('Inquiry'),
    csv2arr = require("csv-to-array");

module.exports = {
    importInquiries: function(){
        
        converter.fromFile("./migration-data/csv-data/ext_inquiry.csv",function(err,array){
            if (err) {
                throw "An error occurred!\n" + err;
            } else {
                importArray = array;

                for (var i=0,_count=importArray.length; i <_count; i++) {
                    var _inquiry = importArray[i];

                    // populate instance for Inquiry object
                   var newInquiry = new Inquiry.model({

                        takenBy: { type: Types.Relationship, label: 'taken by', ref: 'Admin', required: true, initial: true },
                        takenOn: { type: Types.Date, label: 'taken on', format: 'MM/DD/YYYY', required: true, initial: true }, // call > call_date

                        inquirer: { type: Types.Select, label: 'inquirer', options: 'family, social worker', default: 'family', initial: true }, //
                        inquiryType: _inquiry.inquiryType,
                        inquiryMethod: { type: Types.Relationship, label: 'inquiry method', ref: 'Inquiry Method', required: true, initial: true },

                        source: { type: Types.Relationship, label: 'source', ref: 'Source', required: true, initial: true },

                        child: { type: Types.Relationship, label: 'child', ref: 'Child', dependsOn: { inquiryType: ['child inquiry', 'complaint', 'family support consultation'] }, initial: true },

                        //childsSocialWorker: // not needed - autmatically generated
                        //previousChildsSocialWorker: // not needed - automatically generated

                        family: { type: Types.Relationship, label: 'family', ref: 'Family', dependsOn: { inquirer: 'family' }, initial: true },
                        socialWorker: { type: Types.Relationship, label: 'social worker', ref: 'Social Worker', dependsOn: { inquirer: 'social worker' }, initial: true },
                        onBehalfOfMAREFamily: { type: Types.Boolean, label: 'is the family registered?', default: true, dependsOn: { inquirer: 'social worker' }, initial: true },
                        onBehalfOfFamily: { type: Types.Relationship, label: 'on behalf of', ref: 'Family', dependsOn: { inquirer: 'social worker', onBehalfOfMAREFamily: true }, initial: true },
                        onBehalfOfFamilyText: { type: Types.Text, label: 'on behalf of', dependsOn: { inquirer: 'social worker', onBehalfOfMAREFamily: false }, initial: true },
                        comments: { type: Types.Textarea, label: 'comments', initial: true },

                        agency: { type: Types.Relationship, label: 'agency at time of inquiry', ref: 'Agency', dependsOn: { inquiryType: ['child inquiry', 'complaint', 'family support consultation'] }, noedit: true },
                        agencyReferral: { type: Types.Relationship, label: 'agency referrals', ref: 'Agency', dependsOn: { inquiryType: 'general inquiry' }, many: true, initial: true }

                        thankInquirer: true,
                        inquiryAccepted: true,

                        thankYouSentToInquirer: true,
                        emailSentToCSC: true,
                        emailSentToInquirer: true,
                        emailSentToChildsSocialWorker: true,
                        emailSentToAgencies: true


                    });

                    if (shouldBePublished) {
                        newInquiry.state = 'published';
                    }

                    // call save method on Inquiry object
                    newInquiry.save(function(err) {
                        // newInquiry object has been saved
                        if (err) {
                            throw "[ID#" + _inquiry.agn_id +"] an error occured while saving " + newInquiry + " object."
                        }
                        else {
                            console.log("[ID#" + _inquiry.agn_id + "] inquiry successfully saved!");
                        }
                    });

                }
            }
        })
    },
    findRegionToChildRelation: function() {
        var inquiryMapping = [];
        Inquiry.find()
            .where('region', child.region)
            .exec()
            .then(function(inquiries){
                _.each(inquiries, function(inquiry){
                    // relationship mix comes here
                })
            })
    }
}
