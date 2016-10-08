/**
 * Created by Adrian Suciu.
 */

var event_model = require('models/Placement.js');

var columns = ["fpl_id","fam_id","chd_id","chd_first_name","chd_last_name","status","status_change_date","comment"];
var columns_child = ["chd_id","registered_date","sibling_group_id","first_name","middle_name","last_name","alias","nickname","status",
	"date_of_birth","gender","rce_id","race_note","legal_status","number_of_siblings","can_place_in_two_parent_home",
	"can_place_with_two_females","can_place_with_two_males","can_place_with_single_female","can_place_with_single_male",
	"can_place_in_childless_home","can_place_in_multi_child_home","require_older_children","require_younger_children",
	"physical_dst_id","emotional_dst_id","intellectual_dst_id","physical_disability_comment","emotional_disability_comment",
	"intellectual_disability_comment","in_therapy","health_notes","adoption_agc_id","recruitment_agc_id","notes","listing_date",
	"allow_sibling_contact","sibling_contact_note","allow_birth_family_contact","birth_family_contact_note","have_media_documentation",
	"on_media_recruitment_hold","media_recruitment_hold_date","have_media_photo","media_photo_date","on_media_location_alert",
	"media_location_alert_place","have_photolisting_writeup","photolisting_writeup_date","have_photolisting_photo",
	"photolisting_photo_date","in_photolisting","photolisting_date","photolisting_page","previous_photolisting_page",
	"have_video_snapshot","video_snapshot_date","referral_packet_request_date","referral_packet_send_date","primary_language",
	"registered_by","last_status_change_datetime","profile_url","is_on_mare_web","is_on_adoptuskids","is_on_online_matching",
	"placement_placed_date","placement_disruption_date","placement_fam_id","placement_family_name","placement_address_1",
	"placement_address_2","placement_city","placement_state","placement_zip","placement_home_phone","placement_country",
	"placement_email","placement_agency","placement_constellation","placement_rce_id"];
var columns_family = ["fam_id","old_family_id","listing_date","family_constellation","primary_language","is_home_studied","home_study_date",
	"is_registered","registered_date","status","last_status_change_date","address_1","address_2","city","state","zip","country",
	"home_phone","fax","info_pack","info_pack_sent_date","info_pack_notes","is_gathering_info","gathering_info_date",
	"is_looking_for_agency","looking_for_agency_date","is_working_with_agency","working_with_agency_date","mapp_training_date",
	"is_closed","closed_date","closed_reason","has_family_profile","family_profile_date","online_matching_date","accept_male",
	"accept_female","accept_legal_risk","accept_sibling_contact","accept_birth_family_contact","number_of_children_to_adopt",
	"adoption_ages_from","adoption_ages_to","max_physical_dst_id","max_intellectual_dst_id","max_emotional_dst_id",
	"social_worker_agc_id","flag_calls","notes"];
var importArray;

var keystone = require('keystone'),
	Placement = keystone.list('Placement'),
	csv2arr = require("csv-to-array");

module.exports = {
	importPlacements : function(){
		csv2arr({
			file: "db_exports/June14th_Expors/family_placement.csv",
			columns: columns
		}, function (err, array) {
			if (err) {
				throw "An error occurred!\n" + err;
			} else {
				var allChildren = self.preloadChildren();
				var allFamilies = self.preloadFamilies();
				importArray = array;

				for (var i=0,_count=importArray.length; i <_count; i++) {
					var _placement = importArray[i];
					var _relatedChildObj = self.fetchChild(_placement.chd_id, allChildren);
					var _relatedFamilyObj = self.fetchFamily(_placement.fam_id, allFamilies);


					if (typeof(_relatedChildObj) != "undefined" && _relatedChildObj != null){

						// populate instance for Placement object
						var newPlacement = new Event.model({

							placementDate: _relatedChildObj.placement_placed_date,
							child: _placement.chd_id,
							childPlacedWithMAREFamily: _placement.,
							placedWithFamily: _relatedChildObj.placement_fam_id,
							familyAgency: _relatedChildObj.placement_agency,
							constellation: _relatedChildObj.placement_constellation,
							race: _relatedChildObj.placement_rce_id,
							source: _placement.,
							/*
							* Based on the child_id fetch the rcs_id from placement_source, once you have the id go to recruitment_source and get
							* the name property > go to the new table check for the smae string and return the hashed _id
							*
							* */

							//notes: _placement.,//no notes in the old system

							family: {
								name: _relatedChildObj.placement_family_name,

								address: {
									street1: _relatedChildObj.placement_address_1,
									street2: _relatedChildObj.placement_address_2,
									city: _relatedChildObj.placement_city,
									state: _relatedChildObj.placement_state,
									zipCode: _relatedChildObj.placement_zip,
									country: _relatedChildObj.placement_country
									//region: _relatedChildObj., //not in the old system
								},

								phone: {
									//work: _relatedFamilyObj., //{ type: Types.Text, label: 'work phone number', dependsOn: { childPlacedWithMAREFamily: false }, initial: true },
									home: _relatedFamilyObj.placement_home_phone,
									//mobile: _relatedFamilyObj., //{ type: Types.Text, label: 'mobile phone number', dependsOn: { childPlacedWithMAREFamily: false }, initial: true },
									//preferred: _relatedFamilyObj.,//{ type: Types.Select, label: 'preferred phone', options: 'work, home, mobile', dependsOn: { childPlacedWithMAREFamily: false }, initial: true }
								},

								email:  _relatedFamilyObj.placement_email
							},

							disruptionDate: _relatedFamilyObj.placement_disruption_date

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
			}
		})

	},
	preloadChildren : function(){
		var allChildren = []

		csv2arr({
			file: "db_exports/June14th_Expors/child.csv",
			columns: columns_child
		}, function (err, array) {
			if (err) {
				throw "An error occurred!\n" + err;
			} else {
				importArray = array;

				for (var i=0,_count=importArray.length; i <_count; i++) {
					allChildren.push(importArray[i]);
				}

				return allChildren;
			}
		})

	},
	preloadFamilies: function() {
		var allFamilies = [];
		csv2arr({
			file: "db_exports/June14th_Expors/family.csv",
			columns: columns_family
		}, function (err, array) {
			if (err) {
				throw "An error occurred!\n" + err;
			} else {
				importArray = array;

				for (var i=0,_count=importArray.length; i <_count; i++) {
					allFamilies.push(importArray[i]);
				}

				return allFamilies;
			}
		});
	},
	fetchChild : function(id, haystack){

		for (var i=0,_count=haystack.length; i <_count; i++) {
			var _child = importArray[i];

			if (_child.chd_id == id) {
				return _child[i];
			}
		}

	},
	fetchFamily: function(id, haystack){

		for (var i=0,_count=haystack.length; i <_count; i++) {
			var _family = importArray[i];

			if (_family.fam_id == id) {
				return _family;
			}

		}
	}
}
