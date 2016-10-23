/**
 * Created by Adrian Suciu.
 */

var async					= require('async'),
	keystone				= require('keystone'),
	Types 					= keystone.Field.Types,
    OutsideContact			= keystone.list('Outside Contact'),
    csv2arr					= require('csv-to-array'),
	dataMigrationService	= require('../service_data-migration'),
	mailingListsMap			= require('../data-migration-maps/outside-contact-groups');
	statesMap				= require('../data-migration-maps/states');

var columns = ['ocn_id','name','organization','address_1','address_2','city','state','zip','phone','email','contact_type','country','notes'];
var importArray = [];

module.exports.importOutsideContacts = function importOutsideContacts(req, res, done){

	var self = this,
		locals = res.locals;

    csv2arr({

        file: './migration-data/csv-data/outside_contact.csv',
        columns: columns

    }, function (err, array) {

        if (err) {

            throw 'Migration Error - Outside Contacts' + err;

        } else {

            importArray = array;

            for (var i = 1, _count = importArray.length - 1; i <= _count; i++) {

                var _outsideContact = importArray[i];
                var _splitName = exports.splitName(_outsideContact.name);
                var _isVolunteer = false;

                if (_outsideContact.contact_type) {
                    _isVolunteer = true;
                }

				async.parallel([
					function(done) { mailingListsMap.getOutsideContactGroupsMap(req, res, done) },
					function(done) { statesMap.getStatesMap(req, res, done) } // TODO: THIS CAN BE UNCOMMENTED WHEN THE MAP FILE IS CREATED
				], function() {

					//console.log(locals.outsideContactGroupsMap);
					// populate instance for Outside Contact object
	                var newOutsideContact = new OutsideContact.model({

	                	type: locals.mailingListsMap[_outsideContact.ocn_id],
	                    // type: { type: Types.Relationship, label: 'type of contact', ref: 'Mailing List', many: true, required: true, initial: true },

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
	                        state:  locals.statesMap[_outsideContact.state],
	                        zipCode:  _outsideContact.zip
	                    },

	                    isVolunteer: _isVolunteer

	                });

	                // call save method on Outside Contact object
	                newOutsideContact.save(function(err) {
	                    // newOutsideContact object has been saved
	                    if (err) {

							console.log('saving 1');
	                        throw '[ID#' + _outsideContact.ocn_id + '] an error occured while saving ' + newOutsideContact + ' object.'

						}
	                    else {

							console.log('saving 2');
	                        console.log('[ID#' + _outsideContact.ocn_id + '] outside contact successfully saved!');

						}
	                });
				});

            }

			done();
        }
    });
}

exports.fetchMailingLists = function fetchMailingLists(ocn_id) {
	var mailingListArray = [];

	csv2arr({

        file: './migration-data/csv-data/mailing_list.csv',
        columns: columns

    }, function(err, array) {

		if (err) {

            throw 'Migration Error - Outside Contacts' + err;

        } else {

			for (var i = 1, _count = array.length - 1; i <= _count; i++) {

				var mailingListItem = array[i];

				if (mailingListItem[4] === ocn_id) {

					mailingListArray.push(mailingListMap[mailingListItem[0]]);
				}
			}
		}
	});
}

exports.splitName = function splitName(name) {
    var _first = '';
    var _last = '';

    if (name.indexOf(',') > 0){
        _last = name.substr(0, name.indexOf(','));
        _first = name.substr(name.indexOf(',') + 1);
    }
    else
    {
        _first = name.substr(0, name.indexOf(' '));
        _last = name.substr(name.indexOf(' ') + 1);
    }

    return {
        first: _first,
        last: _last
    }
}
