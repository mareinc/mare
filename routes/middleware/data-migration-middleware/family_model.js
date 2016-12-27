/**
 * Created by Adrian Suciu.
 */

var async					= require('async'),
	keystone				= require('keystone'),
	Types 					= keystone.Field.Types,
    Family 					= keystone.list('Family'),
    csv2arr					= require('csv-to-array'),
	dataMigrationService	= require('../service_data-migration'),

	// mappings
	childStatusesMap		= require('../data-migration-maps/child-status'),
	closedStatusesMap		= require('../data-migration-maps/closed-reason'),
	familyConstellationMap  = require('../data-migration-maps/family-constellation'),
	gendersMap 				= require('../data-migration-maps/gender'),
	languagesMap			= require('../data-migration-maps/language'),
	legalStatusesMap 		= require('../data-migration-maps/legal-status'),
	racesMap 				= require('../data-migration-maps/race'),
	statesMap				= require('../data-migration-maps/state')
	;


//Converter Class 
var Converter = require("csvtojson").Converter;
var converter = new Converter({});

// var columns = ["fam_id","old_family_id","listing_date","family_constellation","primary_language","is_home_studied","home_study_date",
// 	"is_registered","registered_date","status","last_status_change_date","address_1","address_2","city","state","zip","country",
// 	"home_phone","fax","info_pack","info_pack_sent_date","info_pack_notes","is_gathering_info","gathering_info_date",
// 	"is_looking_for_agency","looking_for_agency_date","is_working_with_agency","working_with_agency_date","mapp_training_date",
// 	"is_closed","closed_date","closed_reason","has_family_profile","family_profile_date","online_matching_date","accept_male",
// 	"accept_female","accept_legal_risk","accept_sibling_contact","accept_birth_family_contact","number_of_children_to_adopt",
// 	"adoption_ages_from","adoption_ages_to","max_physical_dst_id","max_intellectual_dst_id","max_emotional_dst_id",
// 	"social_worker_agc_id","flag_calls","notes"];

// var columns_family_race_preference = ["frp_id","fam_id","rce_id"];

// var columns_family_special_need = ["fsn_id","fam_id","spn_id"];

var importArray;
var importArrayFamRacePref;
var importArrayFamSpecNeed;

module.exports.importFamilies = function importFamilies(req, res, done) {
	var self = this,
		locals = res.locals;

	converter.fromFile("./migration-data/csv-data/family.csv",function(err,array){

			if (err) {
				throw "An error occurred!\n" + err;
			} else {

				importArray = array;

				async.parallel([

					function(done) { childStatusesMap.getChildStatusesMap(req,res,done) },
					function(done) { closedStatusesMap.getClosedReasonsMap(req,res,done) },					
					function(done) { familyConstellationMap.getFamilyConstellationsMap(req, res, done) },
					function(done) { gendersMap.getGendersMap(req, res, done) } ,
					function(done) { languagesMap.getLanguagesMap(req, res, done) },
					function(done) { legalStatusesMap.getLegalStatusesMap(req, res, done) },
					function(done) { racesMap.getRacesMap(req,res,done) },
					function(done) { statesMap.getStatesMap(req, res, done) },
					function(done) {
						converter.fromFile("./migration-data/csv-data/family_race_preference.csv",function(err,array){
							if (err) {
								throw "An error occurred!\n" + err;
							} else {

								importArrayFamRacePref = array;
							}
						});

						done();
					},
					function(done) {
						converter.fromFile("./migration-data/csv-data/family_special_need.csv",function(err,array){
							if (err) {
								throw "An error occurred!\n" + err;
							} else {

								importArrayFamSpecNeed = array;
							}
						});

						done();
					}
		

				], function() {

					console.log("Family model reached!");

					for (var i=1,_count=importArray.length; i <_count; i++) {

						let _family = importArray[i];

						console.log("Family object: ", _family);

						let matchingPrefGender = "";
						let primaryLanguage = "";
						let otherLanguages = "";
						let splitLanguages = [];
						let familySelectedLanguages = [];
						let familySelectedRaces = [];
						let familySpecialNeeds = [];


						if (_family.accept_male != "") {
							matchingPrefGender = _family.accept_male;
						} else if (_family.accept_female != "") {
							matchingPrefGender = _family.accept_female;
						}

						splitLanguages = SplitLanguages(_family.primary_language);

						primaryLanguage = locals.languagesMap[splitLanguages["primary"]];

						otherLanguages = splitLanguages["others"] ? splitLanguages["others"].split(",") : "";

						for (var j=0; j < otherLanguages.length; j++) {
							familySelectedLanguages.push(locals.racesMap[otherLanguages[j]]);
						}
						
						familySelectedRaces = selectAllRacePrefsByFamID(_family.fam_id);
						familySpecialNeeds = selectAllSpecialNeedsByFamID(_family.fam_id);

						console.log(locals.familyConstellationsMap[_family.family_constellation]);
						console.log(locals.childStatusesMap[_family.status]);
						console.log(locals.statesMap[_family.state]);
						console.log(locals.closedReasonsMap[_family.closed_reason]);
						console.log(locals.gendersMap[matchingPrefGender]);
						console.log(locals.legalStatusesMap[_family.accept_legal_risk]);
						console.log(familySelectedRaces);
						console.log(familySpecialNeeds);

						// populate instance for Family object
						let newFamily = new Family.model({

							registrationNumber: _family.fam_id,

							// old_family_id > Give this table name to Jared

							initialContact: _family.listing_date,

							flagCalls: _family.flag_calls,
							familyConstellation: locals.familyConstellationsMap[_family.family_constellation],

							/*
							* primary_language can contain multiple languages in text form, so in this case look for these separator characters: ", / \ space"
							* the first one is the language and the other ones are going into the otherLanguages as relationship matched ids 
							* and as comma separated values
							*/

							language: primaryLanguage,
							otherLanguages: familySelectedLanguages, // < needs thorough testing

							homestudy: {
								completed: _family.is_home_studied,
								initialDate: _family.home_study_date
							},

							registeredWithMARE: {
								registered: _family.is_registered,
								date: _family.registered_date,
								status: locals.childStatusesMap[_family.status]
							},

							address: {
								street1: _family.address_1,
								street2: _family.address_2,
								city: _family.city,
								state: locals.statesMap[_family.state],
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
								reason: locals.closedReasonsMap[_family.closed_reason]
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
								gender: locals.gendersMap[matchingPrefGender],
								legalStatus: locals.legalStatusesMap[_family.accept_legal_risk],

								adoptionAges: {
									from: _family.adoption_ages_from,
									to: _family.adoption_ages_to
								},

								numberOfChildrenToAdopt: _family.number_of_children_to_adopt,
								siblingContact: _family.accept_sibling_contact,
								birthFamilyContact: _family.accept_birth_family_contact,
								
								// go to family_race_preferences and select all rce_id based on the fam_id split and then search for thene equivalent 
								// hash ids in the new system look at list_race table in the new system
								race: familySelectedRaces, 
								
								maxNeeds: {
									physical: _family.max_physical_dst_id,
									intellectual: _family.max_intellectual_dst_id,
									emotional: _family.max_emotional_dst_id
								},

								socialWorker: _family.social_worker_agc_id,

								disabilities: familySpecialNeeds
								/*
								* so using the fam_id go to family_special_need table and get the list of all the special needs for that family id,
								* get the text for the special need and look it up in the new system,
								* get the hash for it and create an array of hashes if more than one
								*
								* */
								// otherConsiderations: _family. // no mapping

							}

						});

						console.log("Family object", newFamily);

						// call save method on Child object
						newFamily.save(function(err) {
							// newChild object has been saved
							if (err) {
								console.log(err);
								console.log("[ID#" + _family.chd_id +"] an error occured while saving Family object.");
								console.log(newFamily);
								throw "[ID#" + _family.chd_id +"] an error occured while saving " + newFamily + " object."
							}
							else {
								console.log("[ID#" + _family.chd_id + "] child successfully saved!");
							}
						});

					}

				});
			}

		});
	}

function SplitLanguages(languages) {
	var arrayOfLanguages;

	if (languages && languages.length > 0) {
		arrayOfLanguages = languages.replace(/,/g, " ").replace(/\\/g, " ").replace(/\//g, " ").split(" ");
	}

	return arrayOfLanguages ? { "primary" : arrayOfLanguages[0].toString(), "others": arrayOfLanguages.splice(1, arrayOfLanguages.length-1).join(",") } : languages;
}

function SplitRaceIDs(raceids) {
	return raceids ? raceids.replace(/ /g, "").split(",") : "";
}

function selectAllRacePrefsByFamID(famid) {
	var racePrefs = [];

	for (var i=0; i < importArrayFamRacePref; i++) {
		if (importArrayFamRacePref[i][1] == famid) {
			racePrefs.push(oldRaceCodes(importArrayFamRacePref[i][2]));	
		}
	}

	return racePrefs;
}

function selectAllSpecialNeedsByFamID(famid) {
	var specNeeds = [];

	for (var i=0; i < importArrayFamSpecNeed; i++) {
		if (importArrayFamSpecNeed[i][1] == famid) {
			specNeeds.push(oldSpecialNeedCodes(importArrayFamSpecNeed[i][2]));	
		}
	}

	return specNeeds;
}

function oldRaceCodes(raceCode) {
	var foundRace = "";
	var oldRaceRecords = [
							["1","AA","African American"],
							["2","AS","Asian"],
							["3","CA","Caucasian"],
							["4","HI","Hispanic"],
							["5","NA","Native American"],
							["6","AA/AS","African American/Asian"],
							["7","AA/CA","African American/Cauc."],
							["8","AA/HI","African American/Hispanic"],
							["9","AA/NA","African American/Nat.Amer"],
							["10","AS/CA","Asian/Cauc."],
							["11","AS/HI","Asian/Hispanic"],
							["12","AS/NA","Asian/Nati.Amer."],
							["13","CA/HI","Caucasian/Hispanic"],
							["14","CA/NA","Caucasian/Nat.Amer."],
							["15","HI/NA","Hispanic/Nat.Amer."],
							["16","OTHER","Other- DO NOT USE"]
	];

	for (var i=0; i < oldRaceRecords; i++) {
		if (oldRaceRecords[i][0] == raceCode) {
			foundRace = oldRaceRecords[i][2];
			break;
		}
	}

	return foundRace;
}

function oldSpecialNeedCodes(needCode) {
	var foundNeed = "";
	var oldNeedCode = [
		["70","Autism"],
		["20","Cerebral Palsy"],
		["10","Down Syndrome"],
		["60","Fetal Alcohol Syndrome"],
		["40","Hearing Impairment"],
		["30","HIV/AIDS"],
		["50","Visual Impairment"]
	];

	for (var i=0; i < oldNeedCode; i++) {
		if (oldNeedCode[i][0] == needCode) {
			foundNeed = oldNeedCode[i][1];
			break;
		}
	}

	return foundNeed;
}

// function LoadAllRacePreferences() {
// 	converter.fromFile("./migration-data/csv-data/family_race_preference.csv",function(err,array){
// 			if (err) {
// 				throw "An error occurred!\n" + err;
// 			} else {

// 				importArrayFamRacePref = array;
// 			}
// 		});
// }

// function LoadAllSpecialNeeds() {
// 	converter.fromFile("./migration-data/csv-data/family_special_need.csv",function(err,array){
// 			if (err) {
// 				throw "An error occurred!\n" + err;
// 			} else {

// 				importArrayFamSpecNeed = array;
// 			}
// 		});
// }