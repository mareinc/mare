/**
 * Created by Adrian Suciu.
 */

var async					= require('async'),
	fileSystem				= require('fs'),
	formatDate				= require('dateformat'),
	keystone				= require('keystone'),
	Types 					= keystone.Field.Types,
    Child 					= keystone.list('Child'), // NOTE: this may not work, for keystone to access the database using a model reference, you may need the keystone.list('Agency'); syntax here
    csv2arr					= require('csv-to-array'),
	dataMigrationService	= require('../service_data-migration'),

	//mappings
	childStatusesMap		= require('../data-migration-maps/child-status'),
	gendersMap 				= require('../data-migration-maps/gender'),
	languagesMap 			= require('../data-migration-maps/language'),
	legalStatusesMap		= require('../data-migration-maps/legal-status'),
	racesMap 				= require('../data-migration-maps/race')
	;


//Converter Class 
var Converter = require("csvtojson").Converter;
var converter = new Converter({});

// var columns = ["chd_id","registered_date","sibling_group_id","first_name","middle_name","last_name","alias","nickname","status",
// 	"date_of_birth","gender","rce_id","race_note","legal_status","number_of_siblings","can_place_in_two_parent_home",
// 	"can_place_with_two_females","can_place_with_two_males","can_place_with_single_female","can_place_with_single_male",
// 	"can_place_in_childless_home","can_place_in_multi_child_home","require_older_children","require_younger_children",
// 	"physical_dst_id","emotional_dst_id","intellectual_dst_id","physical_disability_comment","emotional_disability_comment",
// 	"intellectual_disability_comment","in_therapy","health_notes","adoption_agc_id","recruitment_agc_id","notes","listing_date",
// 	"allow_sibling_contact","sibling_contact_note","allow_birth_family_contact","birth_family_contact_note","have_media_documentation",
// 	"on_media_recruitment_hold","media_recruitment_hold_date","have_media_photo","media_photo_date","on_media_location_alert",
// 	"media_location_alert_place","have_photolisting_writeup","photolisting_writeup_date","have_photolisting_photo",
// 	"photolisting_photo_date","in_photolisting","photolisting_date","photolisting_page","previous_photolisting_page",
// 	"have_video_snapshot","video_snapshot_date","referral_packet_request_date","referral_packet_send_date","primary_language",
// 	"registered_by","last_status_change_datetime","profile_url","is_on_mare_web","is_on_adoptuskids","is_on_online_matching",
// 	"placement_placed_date","placement_disruption_date","placement_fam_id","placement_family_name","placement_address_1",
// 	"placement_address_2","placement_city","placement_state","placement_zip","placement_home_phone","placement_country",
// 	"placement_email","placement_agency","placement_constellation","placement_rce_id"];
var importArray;
var childImagesArray = [];

module.exports.importChildren = function importChildren(req, res, done){

	var self = this,
		locals = res.locals;

	converter.fromFile("./migration-data/csv-data/child.csv",function(err,array){

			if (err) {
				throw "An error occurred!\n" + err;
			} else {
				importArray = array;

				async.parallel([
					function(done) { childStatusesMap.getChildStatusesMap(req,res,done) },
					function(done) { gendersMap.getGendersMap(req, res, done) } ,
					function(done) { languagesMap.getLanguagesMap(req,res,done) },
					function(done) { legalStatusesMap.getLegalStatusesMap(req,res,done) },
					function(done) { racesMap.getRacesMap(req,res,done) },
					function loadAllChildImageNames(done) {
						fileSystem.readdir('./migration-data/child_images/', (err, files) => {
							files.forEach(file => {
								console.log(file);
								
								childImagesArray.push(file);
							});
						});

						done();
					}
					
				], function() {

					for (var i=1,_count=importArray.length; i <_count; i++) {
						let _child = importArray[i];
						let newBirthDate = parseDate(_child.date_of_birth);

						// populate instance for Child object
						let newChild = new Child.model({
							registrationNumber: _child.chd_id,
							registrationDate: _child.registered_date,

							name: {
								first: _child.first_name,
								middle: _child.middle_name,
								last: _child.last_name,
								alias: _child.alias,
								nickName: _child.nickname,
								full: _child.first_name + " " + _child.middle_name + " " + _child.last_name
							},

							status: locals.childStatusesMap[_child.status], // << fetch from Mappings

							statusChangeDate: _child.last_status_change_date_time,
							birthDate: newBirthDate,

							gender: locals.gendersMap[_child.gender], // << fetch from Mappings

							race: locals.racesMap[_child.rce_id], // << fetch from Mappings

							legalStatus: locals.legalStatusesMap[_child.legal_status], // << fetch from Mappings

							recommendedFamilyConstellation: _child.can_place_into_two_parent_home,
							otherFamilyConstellationConsideration: _child.can_place_in_childless_home,
							physicalNeeds: _child.physical_dst_id,
							emotionalNeeds: _child.emotional_dst_id,
							intellectualNeeds: _child.intellectual_dst_id,
							physicalNeedsDescription: _child.physical_dissability_comment,
							emotionalNeedsDescription: _child.emotional_dissability_comment,
							intellectualNeedsDescription: _child.intellectual_dissability_comment,
							healthNotesOld: _child.health_notes,

							hasContactWithSiblings: _child.allow_sibling_contact,
							siblingTypeOfContact: _child.simbling_contact_note,
							hasContactWithBirthFamily: _child.allow_birth_family_contact,
							birthFamilyTypeOfContact: _child.birth_family_contact_note,

							hasPhotolistingWriteup: _child.have_photolisting_writeup,
							photolistingWriteupDate: _child.photolisting_writeup_date,
							hasPhotolistingPhoto: _child.have_photolisting_photo,
							photolistingPhotoDate: _child.photolisting_photo_date,
							isCurrentlyInPhotoListing: isInPhotoListings(_child.photolisting_photo_date),

							previousPhotolistingPageNumber: _child.previous_photolisting_page,
							hasVideoSnapshot: _child.have_video_snapshot,
							videoSnapshotDate: _child.video_snapshot_date,
							language: locals.languagesMap[_child.primary_language],
							registeredBy: _child.registered_by,
							extranetUrl: _child.profile_url,
							onMAREWebsite: _child.is_on_mare_web,
							onAdoptuskids: _child.is_on_adoptuskids,
							onOnlineMatching: _child.is_on_online_matching,

							image: fetchImage(_child.chd_id),
							siblingGroupImage: fetchImage(_child.chd_id)

							/*
							Create a function that goes and looks for a childs image in the folder of picture based on the child_id + "-" 
							and from there on populate image: if the length of the image file is the biggest then call the fetchImage function
							and add the local path of the image into simblingGroupImage field (the longer file is a definitely the longest in name) 
							if it's smallest then add the image path to the image field.

							*/

						});

						// call save method on Child object
						newChild.save(function(err) {
							// newChild object has been saved
							if (err) {
								console.log("[ID#" + _child.chd_id +"] an error occured while saving child object.");
								console.log(newChild);
								throw "[ID#" + _child.chd_id +"] an error occured while saving " + newChild + " object."
							}
							else {
								console.log("[ID#" + _child.chd_id + "] child successfully saved!");
							}
						});

					}

				});
			}
		});

	}

function fetchImage(childImgeHash) {
	let fetchedImageName;

	for (var k = 0;k < childImagesArray.length; k++) {
		if (childImagesArray[k].indexOf(childImgeHash) != -1) {
			fetchedImageName = childImagesArray[k];
		}
	}

	return fetchedImageName;
}

function isInPhotoListings(date) {
	return (typeof(date) !== "undefined" && date != "") ? true : false;
}

// parse a date in MM/DD/YYYY from YYYY-MM-DD and DD-MM-YYYY format
function parseDate(input) {
	var splitDate, parts, day, month, year;
	
	if (input.indexOf("T") > -1) {
		splitDate = input.split("T");
	} else if (input.indexOf(" ") > -1) {
		splitDate = input.split(" ");
	}

	let tempDate = splitDate[0];

	if (tempDate.indexOf("-") > -1) {
		parts = tempDate.split("-");
	} else {
		parts = tempDate.split("/");
	}
	
	if (parts[2] >= 1970 && parts[0] <= 12) {
		year = parts[2];
		month = parts[0];
		day = parts[1];
	} else if (parts[0] >= 1970 && parts[1] <= 12) {
		year = parts[0];
		month = parts[1];
		day = parts[2];
	} 
  
	return month + "/" + day + "/" + year;
}