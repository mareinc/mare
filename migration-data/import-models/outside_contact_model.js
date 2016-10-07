/**
 * Created by Adrian Suciu.
 */

var family_model = require('models/OutsideContact.js');

var columns = ["ocn_id","name","organization","address_1","address_2","city","state","zip","phone","email","contact_type","country","notes"];
var importArray;

var keystone = require('keystone'),
    OutsideContact = keystone.list('OutsideContact'),
    csv2arr = require("csv-to-array");

module.exports = {
    importOutsideContactss: function(){
        csv2arr({
            file: "db_exports/June14th_Expors/outside_contact.csv",
            columns: columns
        }, function (err, array) {
            if (err) {
                throw "An error occurred!\n" + err;
            } else {
                importArray = array;

                for (var i=0,_count=importArray.length; i <_count; i++) {
                    var _outsideContact = importArray[i];
                    var _splitName = self.splitName(_outsideContact.name);
                    var _isVolunteer = false;

                    if (_outsideContact.contact_type != null && _outsideContact.contact_type != "") {
                        _isVolunteer = true;
                    }

                    // populate instance for Outside Contact object
                    var newOutsideContact = new OutsideContact.model({

                        type: { type: Types.Relationship, label: 'type of contact', ref: 'Mailing List', many: true, required: true, initial: true },

                        // from the outside_contact table get the ocn_id and go to mailing_list_subscription table, where based on the ocn_id, get the mlt_id and then
                        // go to mailing_list table and get the name associated with the mlt_id, once you have the name, go to the new system and fetch the new hash id

                        name: {
                            first: _splitName.first,
                            last: _splitName.last
                        },

                        organization: _outsideContact.organization,

                        email: _outsideContact.email,

                        phone: {
                            work: _outsideContact.phone,
                            preferred: _outsideContact.phone
                        },

                        address: {
                            street1: _outsideContact.address_1,
                            street2: _outsideContact.address_2,
                            city:  _outsideContact.city,
                            state:  _outsideContact.state,
                            zipCode:  _outsideContact.zip
                        },

                        isVolunteer: _isVolunteer

                    });

                    if (shouldBePublished) {
                        newOutsideContact.state = 'published';
                    }

                    // call save method on Outside Contact object
                    newOutsideContact.save(function(err) {
                        // newOutsideContact object has been saved
                        if (err) {
                            throw "[ID#" + _outsideContact.ocn_id +"] an error occured while saving " + newOutsideContact + " object."
                        }
                        else {
                            console.log("[ID#" + _outsideContact.ocn_id + "] outside contact successfully saved!");
                        }
                    });

                }
            }
        })
    },
    splitName: function(str) {
        var _first="";
        var _last="";

        if (name.indexOf(',') > 0){
            _last = str.substr(0,str.indexOf(','));
            _first = str.substr(str.indexOf(',')+1);
        }
        else
        {
            _first = str.substr(0,str.indexOf(' '));
            _last = str.substr(str.indexOf(' ') + 1);
        }

        return {
            first: _first,
            last: _last
        }
    }
}
