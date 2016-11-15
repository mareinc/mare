/**
 * Created by Adrian Suciu.
 *
 * Send Jared this because he needs to create an oldid field because there is only one locatio nfield that cannot be split up
 *
 */

var async					= require('async'),
	keystone				= require('keystone'),
	Types 					= keystone.Field.Types,
	Event  					= keystone.list('Event'),
    csv2arr					= require('csv-to-array'),
	dataMigrationService	= require('../service_data-migration')
	;

var columns = ["evt_id","rcs_id","schedule_datetime","location","directions","notes","is_active"];
var columnsRecruitment = ["rcs_id","name","is_media_outlet","is_media_outlet_active","media_frequency","media_type"];
var columnsEventAttendees = ["eva_id","evt_id","type","fam_id","chd_id","agc_id","chd_brought_by_type","chd_brought_by_agc_id","chd_brought_by_name","chd_notes","chd_first_name","chd_last_name","chd_siblings","chd_race","chd_dob","chd_status","fam_rgn_id","fam_is_home_studied","fam_others","fam_source","fam_registration_type","agc_first_name","agc_last_name","agc_agency","agc_phone","agc_others","agc_assignments"];

var importArray;
var recruitmentSourceArray;
var eventAttendeesArray;

module.exports.importEvents = function importEvents(req, res, done) {

	var self = this,
		locals = res.locals;

	csv2arr({
		file: "./migration-data/csv-data/event.csv",
		columns: columns
	}, function (err, array) {
		if (err) {
			throw "An error occurred!\n" + err;
		} else {

			importArray = array;

			async.parallel([
				loadRecruitmentSources(),
				loadEventAttendees()
			], function() {

				for (var i=0,_count=importArray.length; i <_count; i++) {
					var _event = importArray[i];
					var _name = findRecordInArray(_event.rcs_id, recruitmentSourceArray, 0, 1);

					var _dateTimeArray = splitDateTime(_event.schedule_datetime);

					// populate instance for Event object
					var newEvent = new Event.model({

						name: _event._name, // map to recruiment_source via the rcs_id on the event table and fetch the name field value
						isActive: _event.is_active,
						/* Jared will add a checkbox that says the event comes from the old system and i should dump location under a new location textbox */
						address: {
							street1: _event.address_1,
							street2: _event.address_2,
							city: _event.city,
							state: _event.state,
							zipCode: _event.zip,
							region: _event.rgn_id
						},

						contact: _event., // same generic user from the user_admin table (be careful there is a relationship here)

						date: _dateTimeArray[0], // take the date and split it and the time goes to startime, and then add 2 hours for the endtime
						startTime: _dateTimeArray[1],
						endTime: increaseHours(_dateTimeArray[1]),

						// PROBLEM !!! >>> I the old Database we have more than one entry for this agc_id
						socialWorkerAttendees: _event., // get it from event_attendees table under agc_id col
						familyAttendees: _event., // get it from event_attendees table under fam_id col
						childAttendees: _event., // get it from event_attendees table under chd_id col
						outsideContactAttendees: _event. // so if not in social workers table they should be a n outside contact
						
						notes: _event.notes

					});

					// call save method on Event object
					newEvent.save(function(err) {
						// newEvent object has been saved
						if (err) {
							throw "[ID#" + _event.evt_id +"] an error occured while saving " + newEvent + " object."
						}
						else {
							console.log("[ID#" + _event.evt_id + "] event successfully saved!");
						}
					});

				}
			}
		}
	})

}

function loadRecruitmentSources(){
	csv2arr({
		file: "./migration-data/csv-data/recruiment_source.csv",
		columns: columnsRecruitment
	}, function (err, array) {
		if (err) {
			throw "An error occurred!\n" + err;
		} else {

			recruitmentSourceArray = array;
		}
	});
}

function loadEventAttendees(){
	csv2arr({
		file: "./migration-data/csv-data/event_attendees.csv",
		columns: columnsEventAttendees
	}, function (err, array) {
		if (err) {
			throw "An error occurred!\n" + err;
		} else {

			eventAttendeesArray = array;
		}
	});
}

function findRecordInArray(needle, haystack, comparatorFieldIndex, returnFieldIndex) {
	var _found = "";
	for (var i=0; i<haystack.length; i++) {
		if (haystack[i][comparatorFieldIndex] == needle) {
			_found = haystack[i][returnFieldIndex];
			break;
		}
	}

	return _found;
}

function splitDateTime(dateTime) {
	return dateTime.split(" ");
}

function increaseHours(time) {
	var timeComponents = time.replace(" AM","").replace(" PM", "").split(":");
	timeComponents[0] = parseInt(timeComponents[0]) + 2;

	return timeComponents.join(":");
}