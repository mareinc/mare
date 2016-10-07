/**
 * Created by Adrian Suciu.
 */

var family_model = require('models/User_Family.js');

var columns = ["fam_id","old_family_id","listing_date","family_constellation","primary_language","is_home_studied","home_study_date",
	"is_registered","registered_date","status","last_status_change_date","address_1","address_2","city","state","zip","country",
	"home_phone","fax","info_pack","info_pack_sent_date","info_pack_notes","is_gathering_info","gathering_info_date",
	"is_looking_for_agency","looking_for_agency_date","is_working_with_agency","working_with_agency_date","mapp_training_date",
	"is_closed","closed_date","closed_reason","has_family_profile","family_profile_date","online_matching_date","accept_male",
	"accept_female","accept_legal_risk","accept_sibling_contact","accept_birth_family_contact","number_of_children_to_adopt",
	"adoption_ages_from","adoption_ages_to","max_physical_dst_id","max_intellectual_dst_id","max_emotional_dst_id",
	"social_worker_agc_id","flag_calls","notes"];
var importArray;

var keystone = require('keystone'),
	Family = keystone.list('Family'),
	csv2arr = require("csv-to-array");

module.exports = {
	importFamilies: function(){
		csv2arr({
			file: "db_exports/June14th_Expors/family.csv",
			columns: columns
		}, function (err, array) {
			if (err) {
				throw "An error occurred!\n" + err;
			} else {
				importArray = array;

				for (var i=0,_count=importArray.length; i <_count; i++) {
					var _family = importArray[i];
					var matchingPrefGender = "";

					if (_family.accept_male != "") {
						matchingPrefGender = _family.accept_male;
					} else if (_family.accept_female != "") {
						matchingPrefGender = _family.accept_female;
					}

					// populate instance for Family object
					var newFamily = new Family.model({

						//avatar: _family.,

						registrationNumber: _family.fam_id,

						// old_family_id > Give this table name to Jared

						initialContact: _family.listing_date,

						flagCalls: _family.flag_calls,
						familyConstellation: _family.family_constellation,


						/*
						* primary_language can contain multiple languages in text form, so in this case look for these separator characters: ", / \ space"
						* the first one is the language and the other ones are going into the otherLanguages as relationship matched ids as comma separated values
						*
						* */

						language: _family.primary_language,

						// otherLanguages: _family.,

						homestudy: {
							completed: _family.is_home_studied,
							initialDate: _family.home_study_date
						},

						registeredWithMARE: {
							registered: _family.is_registered,
							date: _family.registered_date,
							status: _family.status
						},

						address: {
							street1: _family.address_1,
							street2: _family.address_2,
							city: _family.city,
							state: _family.state,
							zipCode: _family.zip
						},

						homePhone: _family.home_phone,

						infoPacket: {
							packet: _family.info_pack,
							date: _family.info_pack_sent_date,
							notes: _family.info_pack_notes
						},

						stages: {
							gatheringInformation: {
								started: _family.is_gathering_info,
								date: _family.gathering_info_date
							},
							lookingForAgency: {
								started: _family.is_looking_for_agency,
								date: _family.looking_for_agency_date
							},
							workingWithAgency: {
								started: _family.is_working_with_agency,
								date: _family.working_with_agency_date
							},
							MAPPTrainingCompleted: {
								completed: _family.is_mapp_training_completed,
								date: _family.mapp_training_date
							}
						},

						closed: {
							isClosed: _family.is_closed,
							date: _family.closed_date,
							reason: _family.closed_reason
						},

						familyProfile: {
							created: _family.has_family_profile,
							date: _family.family_profile_date
						},

						onlineMatching: {
							started: _family.Matching,
							date: _family.online_matching_date
						},

						matchingPreferences: {
							gender: matchingPrefGender,
							legalStatus: _family.accept_legal_risk,

							adoptionAges: {
								from: _family.adoption_ages_from,
								to: _family.adoption_ages_to
							},

							numberOfChildrenToAdopt: _family.number_of_children_to_adopt,
							siblingContact: _family.accept_sibling_contact,
							birthFamilyContact: _family.accept_birth_family_contact,
							// race: _family., // go to family_race_preferences and select all rce_id based on the fam_id split and then search for the equivalent hash ids in the new system look at list_race table in the new system

							maxNeeds: {
								physical: _family.max_physical_dst_id,
								intellectual: _family.max_intellectual_dst_id,
								emotional: _family.max_emotional_dst_id
							},

							socialWorker: _family.social_worker_agc_id,

							// disabilities: _family.
							/*
							* so using the fam_id go to family_special_need table and get the list of all the special needs for that family id,
							* get the text for the special need and look it up in the new system,
							* get the hash for it and create an array of hashes if more than one
							*
							* */
							// otherConsiderations: _family. // no mapping

						}

					});

					// populate instance for Placement object
					var newPlacement = new Placement.model({
						placementDate: _child.placement_placed_date,
						disruptionDate: _child.placement_disruption_date,

						// child: _child,
						// childPlacedWithMAREFamily: _child,
						// placedWithFamily: _child,

						familyAgency: _child.placement_agency,
						constellation: _child.placement_constellation,
						race: _child.placement_rce_id,

						// source: _child,
						// notes: _child,

						family: {
							name: _child.placement_family_name,

							address: {
								street1: _child.placement_address_1,
								street2: _child.placement_address_2,
								city: _child.placement_city,
								state: _child.placement_state,
								zipCode: _child.placement_zip,
								country: _child.placement_country,

								// region: _child
							},

							phone: {
								// work: _child,
								home: _child.placement_home_phone,

								/*
								 mobile: _child,
								 preferred: _child
								 */
							},

							email: _child.placement_email
						}
					});

					if (shouldBePublished) {
						newFamily.state = 'published';
					}

					// call save method on Child object
					newFamily.save(function(err) {
						// newChild object has been saved
						if (err) {
							throw "[ID#" + _family.chd_id +"] an error occured while saving " + newFamily + " object."
						}
						else {
							console.log("[ID#" + _family.chd_id + "] child successfully saved!");
						}
					});

					// call save method on Placement object
					newPlacement.save(function(err){
						//newPlacement object has to be saved
						if (err) {
							throw "[ID#" + _family.chd_id +"] an error occured while saving " + newFamily + " object."
						}
						else {
							console.log("[ID#" + _family.chd_id + "] placement successfully saved!");
						}
					})

				}
			}
		});
	}
}
