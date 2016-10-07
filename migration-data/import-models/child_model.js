/**
 * Created by Adrian Suciu.
 */

var child_model = require('models/Child.js');

var columns = ["chd_id","registered_date","sibling_group_id","first_name","middle_name","last_name","alias","nickname","status",
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
var importArray;

var keystone = require('keystone'),
	Child = keystone.list('Child'),
	csv2arr = require("csv-to-array");

module.exports = {
	importChildren: function(){
		csv2arr({
			file: "./migration-data/csv-data/child.csv",
			columns: columns
		}, function (err, array) {
			if (err) {
				throw "An error occurred!\n" + err;
			} else {
				importArray = array;

				for (var i=0,_count=importArray.length; i <_count; i++) {
					var _child = importArray[i];

					// populate instance for Child object
					var newChild = new Child.model({
						registrationNumber: _child.chd_id,
						registrationDate: _child.registered_date,

						// sibling_group_id > wait for Jared

						name: {
							first: _child.first_name,
							middle: _child.middle_name,
							last: _child.last_name,
							alias: _child.alias,
							nickName: _child.nickname,
							full: _child.first_name + " " + _child.middle_name + " " + _child.last_name
						},
						status: _child.status,
						statusChangeDate: _child.last_status_change_date_time,
						birthDate: _child.date_of_birth,
						gender: _child.gender,
						race: _child.rce_id,

						// race_note >

						legalStatus: _child.legal_status,

						//	number_of_siblings // not used in the new syste, Jared does a count every time

						recommendedFamilyConstellation: _child.can_place_into_two_parent_home,
						otherFamilyConstellationConsideration: _child.can_place_in_childless_home,
						physicalNeeds: _child.physical_dst_id,
						emotionalNeeds: _child.emotional_dst_id,
						intellectualNeeds: _child.intellectual_dst_id,
						physicalNeedsDescription: _child.physical_dissability_comment,
						emotionalNeedsDescription: _child.emotional_dissability_comment,
						intellectualNeedsDescription: _child.intellectual_dissability_comment,
						healthNotesOld: _child.health_notes,
						/*
						 health_notes		 >
						 adoption_agc_id 	 > fetch based on parameter???
						 recruitment_agc_id  > fetch based on parameter???
						 notes 				 >
						 listing_date 		 >
						 */

						hasContactWithSiblings: _child.allow_sibling_contact,
						siblingTypeOfContact: _child.simbling_contact_note,
						hasContactWithBirthFamily: _child.allow_birth_family_contact,
						birthFamilyTypeOfContact: _child.birth_family_contact_note,

						// on_media_recruitment_hold
						// media_recruitment_hold_date
						// have_media_photo
						// media_photo_date

						// on_media_location_alert		>
						// media_location_alert_place	>

						hasPhotolistingWriteup: _child.have_photolisting_writeup,
						photolistingWriteupDate: _child.photolisting_writeup_date,
						hasPhotolistingPhoto: _child.have_photolisting_photo,
						photolistingPhotoDate: _child.photolisting_photo_date,

						// need Jared's input on these ones
						/*
						if there is a value in photolisting_date then set in_photolisting to true


						 in_photolisting	>
						 photolisting_date 	>
						 photolisting_page 	> photolistingPage: {
						 type: Types.S3File,
						 s3path: '/child/photolisting-pages',
						 filename: function(item, filename){
						 // prefix file name with registration number and the user's name for easier identification
						 return fileName;
						 }

						 */

						previousPhotolistingPageNumber: _child.previous_photolisting_page,
						hasVideoSnapshot: _child.have_video_snapshot,
						videoSnapshotDate: _child.video_snapshot_date,
						language: _child.primary_language,
						registeredBy: _child.registered_by,
						extranetUrl: _child.profile_url,
						onMAREWebsite: _child.is_on_mare_web,
						onAdoptuskids: _child.is_on_adoptuskids,
						onOnlineMatching: _child.is_on_online_matching

					});

					if (shouldBePublished) {
						newChild.state = 'published';
					}

					// call save method on Child object
					newChild.save(function(err) {
						// newChild object has been saved
						if (err) {
							throw "[ID#" + _child.chd_id +"] an error occured while saving " + newChild + " object."
						}
						else {
							console.log("[ID#" + _child.chd_id + "] child successfully saved!");
						}
					});

				}
			}
		});

	}
}

