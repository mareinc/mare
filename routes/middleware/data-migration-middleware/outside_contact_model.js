/**
 * Created by Adrian Suciu.
 */

var async					= require('async'),
	keystone				= require('keystone'),
	Types 					= keystone.Field.Types,
    OutsideContact			= keystone.list('Outside Contact'),
    csv2arr					= require('csv-to-array'),
	dataMigrationService	= require('../service_data-migration'),
	mailingListsMap			= require('../data-migration-maps/outside-contact-group');
	statesMap				= require('../data-migration-maps/state');

// var columns = ['ocn_id','name','organization','address_1','address_2','city','state','zip','phone','email','contact_type','country','notes'];
// var importArray = [];

//Converter Class 
var Converter = require("csvtojson").Converter;
var converter = new Converter({});

const csvFilePath = './migration-data/csv-data/outside_contact.csv';
const csv = require( 'csvtojson' );

module.exports.importOutsideContacts = ( req, res, done ) => {
	// create a reference to locals where variables shared across functions will be bound
	let locals = res.locals;

	async.parallel([
		function(done) { mailingListsMap.getOutsideContactGroupsMap(req, res, done) },
		function(done) { statesMap.getStatesMap(req, res, done) } 
	], function() {

		let remainingRecords = 0;

		csv().fromFile( csvFilePath )
			.on( 'json', ( outsideContact, index ) => {	// this will fire once per row of data in the file
				// increment the counter keeping track of how many records we still need to process
				remainingRecords++;

				// let _outsideContact = locals.importArray[i];
				let _splitName = exports.splitName(outsideContact.name);
				let _isVolunteer = false;

				if (outsideContact.contact_type) {
					_isVolunteer = true;
				}

				// populate instance for Outside Contact object
				let newOutsideContact = new OutsideContact.model({

					type: locals.outsideContactGroupsMap[outsideContact.ocn_id],
					// type: { type: Types.Relationship, label: 'type of contact', ref: 'Mailing List', many: true, required: true, initial: true },

					// from the outside_contact table get the ocn_id and go to mailing_list_subscription table, where based on the ocn_id, get the mlt_id and then
					// go to mailing_list table and get the name associated with the mlt_id, once you have the name, go to the new system and fetch the new hash id

					name: {
						first: _splitName.first,
						last: _splitName.last
					},

					organization: outsideContact.organization,

					email: outsideContact.email,

					phone: {
						work: outsideContact.phone,
						preferred: outsideContact.phone
					},

					address: {
						street1: outsideContact.address_1,
						street2: outsideContact.address_2,
						city: outsideContact.city,
						state: locals.statesMap[outsideContact.state],
						zipCode: (outsideContact.zip.length > 4) ? outsideContact.zip : '0' + outsideContact.zip
					},

					isVolunteer: _isVolunteer,
					oldId: outsideContact.ocn_id

				});

				newOutsideContact.save(function(err) {
					if (err) {
						console.log( `[ID#${ outsideContact.ocn_id }] an error occured while saving ${ newOutsideContact.code } object.` );
						console.log(outsideContact);
					}
					else {
						console.log( `[ID#${ outsideContact.ocn_id }] agency successfully saved!` );
					}

					// decrement the counter keeping track of how many records we still need to process
					remainingRecords--;
					// if there are no more records to process call done to move to the next migration file
 					if( remainingRecords === 0 ) {
						done();
					}
				});
			})
			.on( 'end', () => {
				console.log( `end` ); // this should never execute but should stay for better debugging
			});

	});
}

exports.fetchMailingLists = function fetchMailingLists(ocn_id) {
	var mailingListArray = [];

	converter.fromFile("./migration-data/csv-data/mailing_list.csv",function(err,array){

		if (err) {

            throw 'Migration Error - Outside Contacts' + err;

        } else {

			for (var i = 1, _count = array.length - 1; i <= _count; i++) {

				let mailingListItem = array[i];

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

	if (name) {

		if (name.indexOf(',') > 0){
			_last = name.substr(0, name.indexOf(','));
			_first = name.substr(name.indexOf(',') + 1);
		}
		else
		{
			_first = name.substr(0, name.indexOf(' '));
			_last = name.substr(name.indexOf(' ') + 1);
		}

	}
    

    return {
        first: _first,
        last: _last
    }
}
