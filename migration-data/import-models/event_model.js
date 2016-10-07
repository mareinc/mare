/**
 * Created by Adrian Suciu.
 *
 * Send Jared this because he needs to create an oldid field because there is only one locatio nfield that cannot be split up
 *
 */


var event_model = require('models/Event.js');

var columns = ["evt_id","rcs_id","schedule_datetime","location","directions","notes","is_active"];
var importArray;

var keystone = require('keystone'),
	Event = keystone.list('Event'),
	csv2arr = require("csv-to-array");

module.exports = {
	importEventModels : function(){
		csv2arr({
			file: "db_exports/June14th_Expors/event.csv",
			columns: columns
		}, function (err, array) {
			if (err) {
				throw "An error occurred!\n" + err;
			} else {
				importArray = array;

				for (var i=0,_count=importArray.length; i <_count; i++) {
					var _event = importArray[i];

					// populate instance for Event object
					var newEvent = new Event.model({

						// name: _event., // map to recruiment_source via the rcs_id on the event table and fetch the name field value
						// url: _event., //not needed
						isActive: _event.is_active,
						//type: _event., // not needed
						/* Jared will add a checkbox that says the event comes from the old system and i should dump location under a new location textbox
						 address: {
						 street1: _event.address_1,
						 street2: _event.address_2,
						 city: _event.city,
						 state: _event.state,
						 zipCode: _event.zip,
						 region: _event.rgn_id
						 },

						 contact: _event., // same generic user from the user_admin table (be careful there is a relationship here)
						 //contactEmail: _event., // this is not needed

						 date: _event., // take the date and split it and the tie goes to startime, and then add 2 hours for the endtime
						 startTime: _event.,
						 endTime: _event.,

						 // description: _event., // not needed
						 //cscAttendees: _event., // not needed

						 // siteVisitorAttendees: _event., // not needed
						 socialWorkerAttendees: _event., // get it from event_attendees table under agc_id col
						 familyAttendees: _event., // get it from event_attendees table under fam_id col
						 childAttendees: _event., // get it from event_attendees table under chd_id col
						 outsideContactAttendees: _event. // so if not in social workers table they should be a n outside contact
						 */
						notes: _event.notes

					});

					if (shouldBePublished) {
						newEvent.state = 'published';
					}

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
		})

	}
}
