/**
 * Created by Adrian Suciu.
 */

var async                   = require('async'),
    keystone                = require('keystone'),
    Types                   = keystone.Field.Types,
    UserFamily              = keystone.list('User_Family'),
    csv2arr                 = require('csv-to-array'),
    dataMigrationService    = require('../service_data-migration')
    ;


var columns = ["agn_id","code","name","address_1","address_2","city","state","zip","phone","fax","url","rgn_id"];
var importArray;

module.exports.importUserFamily = function importUserFamily(req, res, done) {

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

            for (var i=0,_count=importArray.length; i <_count; i++) {
                var _agency = importArray[i];

                // populate instance for Family object
                var newAgency = new UserFamily.model({

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
