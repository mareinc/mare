require('./Tracking_ChildHistory');
require('./List_Language');
require('./List_ChildStatus');
require('./List_Gender');
require('./List_Race');
require('./List_LegalStatus');
require('./Child');
require('./List_Residence');
require('./List_CityOrTown');
require('./List_Disability');
require('./List_FamilyConstellation');
require('./List_OtherFamilyConstellationConsideration');
require('./List_OtherConsideration');
require('./User_SocialWorker');
require('./List_Region');
require('./Event');
require('./List_MediaEligibility');

const keystone				= require('keystone'),
	async 					= require('async'),
	_ 						= require('underscore'),
	moment					= require('moment'),
	Types					= keystone.Field.Types,
	ChildHistory			= keystone.list('Child History'),
	ChangeHistoryMiddleware = require('../routes/middleware/models_change-history');
	ChildMiddleware			= require('../routes/middleware/models_child');
	FamilyMiddleware		= require('../routes/middleware/models_family');
	SocialWorkerMiddleware	= require('../routes/middleware/models_social-worker');
	UtilitiesMiddleware		= require('../routes/middleware/utilities');

// Create model
const Child = new keystone.List('Child', {
	track: true,
	autokey: { path: 'key', from: 'registrationNumber', unique: true },
	map: { name: 'name.full' },
	defaultSort: 'name.full'
});

// Create fields
Child.add('Display Options', {

	siteVisibility: { type: Types.Select, label: 'child is visible to', options: 'everyone, registered social workers and families', required: true, initial: true },
	isVisibleInGallery: { type: Types.Boolean, label: 'child is visible in the gallery', initial: true }

}, 'Child Information', {

	registrationNumber: { type: Number, label: 'registration number', format: false, required: true, initial: true },
	registrationDate: { type: Types.Date, label: 'registration date', format: 'MM/DD/YYYY', required: true, initial: true },

	name: {
		first: { type: Types.Text, label: 'first name', required: true, initial: true },
		middle: { type: Types.Text, label: 'middle name', initial: true },
		last: { type: Types.Text, label: 'last name', required: true, initial: true },
		alias: { type: Types.Text, label: 'alias', initial: true },
		nickName: { type: Types.Text, label: 'nickname', initial: true },
		full: { type: Types.Text, label: 'name', hidden: true, noedit: true, initial: false }
	},

	birthDate: { type: Types.Date, label: 'date of birth', format: 'MM/DD/YYYY', required: true, initial: true },
	language: { type: Types.Relationship, label: 'language', ref: 'Language', many: true, required: true, initial: true },
	statusChangeDate: { type: Types.Date, label: 'status change date', format: 'MM/DD/YYYY', initial: true }, // TODO: Logic needed, see line 14 of https://docs.google.com/spreadsheets/d/1Opb9qziX2enTehJx5K1J9KAT7v-j2yAdqwyQUMSsFwc/edit#gid=1235141373
	status: { type: Types.Relationship, label: 'status', ref: 'Child Status', required: true, initial: true },
	gender: { type: Types.Relationship, label: 'gender', ref: 'Gender', required: true, initial: true },
	race: { type: Types.Relationship, label: 'race', ref: 'Race', many: true, required: true, initial: true },
	raceNotes: { type: Types.Text, label: 'race notes', initial: true },
	legalStatus: { type: Types.Relationship, label: 'legal status', ref: 'Legal Status', required: true, initial: true },
	yearEnteredCare: { type: Types.Text, label: 'year entered care', note: 'yyyy', initial: true },

	hasContactWithSiblings: { type: Types.Boolean, label: 'has contact with siblings?', initial: true },
	siblingTypeOfContact: { type: Types.Text, label: 'type of contact', initial: true },
	siblings: { type: Types.Relationship, label: 'siblings', ref: 'Child', many: true, initial: true },
	mustBePlacedWithSiblings: { type: Types.Boolean, label: 'must be placed with one or more sibling', initial: true },
	siblingsToBePlacedWith: { type: Types.Relationship, label: 'siblings to be placed with', ref: 'Child', dependsOn: { mustBePlacedWithSiblings: true }, many: true, initial: true },
	hasContactWithBirthFamily: { type: Types.Boolean, label: 'has contact with birth family?', initial: true },
	birthFamilyTypeOfContact: { type: Types.Text, label: 'type of contact', initial: true },

	residence: { type: Types.Relationship, label: 'where does the child presently live?', ref: 'Residence', initial: true },
	city: { type: Types.Relationship, label: 'city/town of child\'s current location', ref: 'City or Town', initial: true },
	careFacilityName: { type: Types.Text, label: 'name of residential/group care facility', initial: true },
	dateMovedToResidence: { type: Types.Date, label: 'date moved to current residence', format: 'MM/DD/YYYY', required: true, initial: true }

}, 'Special Needs', {

	physicalNeeds: { type: Types.Select, label: 'physical needs', options: 'none, mild, moderate, severe', required: true, initial: true },
	physicalNeedsDescription: { type: Types.Textarea, label: 'description of physical needs', dependsOn: { physicalNeeds: ['mild', 'moderate', 'severe'] }, initial: true },
	emotionalNeeds: { type: Types.Select, label: 'emotional needs', options: 'none, mild, moderate, severe', required: true, initial: true },
	emotionalNeedsDescription: { type: Types.Textarea, label: 'description of emotional needs', dependsOn: { emotionalNeeds: ['mild', 'moderate', 'severe'] }, initial: true },
	intellectualNeeds: { type: Types.Select, label: 'intellectual needs', options: 'none, mild, moderate, severe', required: true, initial: true },
	intellectualNeedsDescription: { type: Types.Textarea, label: 'description of intellectual needs', dependsOn: { intellectualNeeds: ['mild', 'moderate', 'severe'] }, initial: true },

	disabilities: { type: Types.Relationship, label: 'disabilities', ref: 'Disability', many: true, initial: true },

	healthNotesNew: { type: Types.Textarea, label: 'health notes - new', initial: true },
	healthNotesOld: { type: Types.Textarea, label: 'health notes - old', initial: true },

	specialNeedsNotes: { type: Types.Textarea, label: 'notes', dependsOn: { physicalNeeds: ['mild', 'moderate', 'severe'], emotionalNeeds: ['mild', 'moderate', 'severe'], intellectualNeeds: ['mild', 'moderate', 'severe'] }, initial: true }

}, 'Placement Considerations', {

	// TODO: NEEDS TO BE PLURAL BEFORE SAVE, FIX ACROSS THE CODEBASE
	recommendedFamilyConstellation: { type: Types.Relationship, label: 'recommended family constellations', ref: 'Family Constellation', many: true, required: true, initial: true },
	// TODO: NEEDS TO BE PLURAL BEFORE SAVE, FIX ACROSS THE CODEBASE
	otherFamilyConstellationConsideration: { type: Types.Relationship, label: 'other family constellation consideration', ref: 'Other Family Constellation Consideration', many: true, initial: true },
	otherConsiderations: { type: Types.Relationship, label: 'other considerations', ref: 'Other Consideration', many: true, initial: true }

}, 'Agency Information', {

	registeredBy: { type: Types.Select, label: 'registered by', options: 'unknown, adoption worker, recruitment worker', required: true, initial: true },
	adoptionWorker: { type: Types.Relationship, label: 'adoption worker', ref: 'Social Worker', filters: { position: 'adoption worker' }, initial: true },
	recruitmentWorker: { type: Types.Relationship, label: 'recruitment worker', ref: 'Social Worker', filters: { position: 'recruitment worker' }, initial: true },
	region: { type: Types.Relationship, label: 'region', ref: 'Region', initial: true }

}, 'Photolisting Information', {

	profile: {
		part1: { type: Types.Textarea, label: 'let me tell you more about myself...', dependsOn: { mustBePlacedWithSiblings: false }, initial: true },
		part2: { type: Types.Textarea, label: 'and here\'s what others say...', dependsOn: { mustBePlacedWithSiblings: false }, initial: true },
		part3: { type: Types.Textarea, label: 'if I could have my own special wish...', dependsOn: { mustBePlacedWithSiblings: false }, initial: true }
	},
	groupProfile: {
		part1: { type: Types.Textarea, label: 'let us tell you more about ourselves...', dependsOn: { mustBePlacedWithSiblings: true }, initial: true },
		part2: { type: Types.Textarea, label: 'and here\'s what others say...', dependsOn: { mustBePlacedWithSiblings: true }, initial: true },
		part3: { type: Types.Textarea, label: 'if we could have our own special wish...', dependsOn: { mustBePlacedWithSiblings: true }, initial: true }
	},

	hasPhotolistingWriteup: { type: Types.Boolean, label: 'photolisting writeup', initial: true },
	photolistingWriteupDate: { type: Types.Date, label: 'date of photolisting writeup', format: 'MM/DD/YYYY', dependsOn: { hasPhotolistingWriteup: true }, initial: true },
	hasPhotolistingPhoto: { type: Types.Boolean, label: 'photolisting photo', initial: true },
	photolistingPhotoDate: { type: Types.Date, label: 'date of photolisting photo', format: 'MM/DD/YYYY', dependsOn: { hasPhotolistingPhoto: true }, initial: true },
	isCurrentlyInPhotoListing: { type: Types.Boolean, label: 'currently in photolisting', initial: true },
	dateOfLastPhotoListing: { type: Types.Date, label: 'date of last photolisting', format: 'MM/DD/YYYY', dependsOn: {isCurrentlyInPhotoListing: true }, initial: true },
	photolistingPageNumber: { type: Number, label: 'photolisting page', format: false, initial: true },
	previousPhotolistingPageNumber: { type: Number, label: 'previous photolisting page', format: false, initial: true },

	image: { type: Types.CloudinaryImage, label: 'image', folder: 'children/', selectPrefix: 'children/', publicID: 'fileName', dependsOn: { mustBePlacedWithSiblings: false }, autoCleanup: true },
	galleryImage: { type: Types.Url, hidden: true },
	detailImage: { type: Types.Url, hidden: true },
	siblingGroupImage: { type: Types.CloudinaryImage, label: 'sibling group image', folder: 'sibling-groups/', selectPrefix: 'sibling-groups/', publicID: 'siblingGroupFileName', dependsOn: { mustBePlacedWithSiblings: true }, autoCleanup: true },
	siblingGroupGalleryImage: { type: Types.Url, hidden: true },
	siblingGroupDetailImage: { type: Types.Url, hidden: true },
	video: { type: Types.Url, label: 'video', dependsOn: { mustBePlacedWithSiblings: false } },
	siblingGroupVideo: { type: Types.Url, label: 'sibling group video', dependsOn: { mustBePlacedWithSiblings: true } },
	extranetUrl: { type: Types.Url, label: 'extranet and related profile url', initial: true } // TODO: Since this is redundant as this just points the the url where the photo exists (the child's page), we may hide this field.  This must be kept in as it will help us track down the child information in the old system in the event of an issue.

}, 'Recruitment Options', {

	hasVideoSnapshot: { type: Types.Boolean, label: 'video snapshot', initial: true },
	videoSnapshotDate: { type: Types.Date, label: 'date of video snapshot', format: 'MM/DD/YYYY', dependsOn: { hasVideoSnapshot: true }, initial: true },

	onMAREWebsite: { type: Types.Boolean, label: 'MARE website', initial: true },
	onMAREWebsiteDate: { type: Types.Date, label: 'date on MARE website', format: 'MM/DD/YYYY', dependsOn: { onMAREWebsite: true }, initial: true },

	onAdoptuskids: { type: Types.Boolean, label: 'Adoptuskids website', initial: true },
	onAdoptuskidsDate: { type: Types.Date, label: 'date on Adoptuskids', format: 'MM/DD/YYYY', dependsOn: { onAdoptuskids: true }, initial: true },

	onOnlineMatching: { type: Types.Boolean, label: 'online matching website', initial: true },
	onOnlineMatchingDate: { type: Types.Date, label: 'date on online matching', format: 'MM/DD/YYYY', dependsOn: { onOnlineMatching: true }, initial: true },

	wednesdaysChild: { type: Types.Boolean, label: 'Wednesday\'s Child?', initial: true },
	wednesdaysChildDate: { type: Types.Date, label: 'date of Wednesday\'s Child', format: 'MM/DD/YYYY', dependsOn: { wednesdaysChild: true }, initial: true },
	wednesdaysChildVideo: { type: Types.Url, label: 'wednesday\'s child video', dependsOn: { wednesdaysChild: true, mustBePlacedWithSiblings: false } },
	wednesdaysChildSiblingGroupVideo: { type: Types.Url, label: 'wednesday\'s child sibling group video', dependsOn: { wednesdaysChild: true, mustBePlacedWithSiblings: true } },

	coalitionMeeting: { type: Types.Boolean, label: 'coalition meeting', initial: true },
	coalitionMeetingDate: { type: Types.Date, label: 'date of coalition meeting', format: 'MM/DD/YYYY', dependsOn: { coalitionMeeting: true }, initial: true },

	matchingEvent: { type: Types.Boolean, label: 'matching event', initial: true },
	matchingEventDate: { type: Types.Date, label: 'date of matching event', format: 'MM/DD/YYYY', dependsOn: { matchingEvent: true }, initial: true },

	adoptionParties: { type: Types.Relationship, label: 'adoption parties', ref: 'Event', filters: { type: 'adoption party' }, many: true, initial: true },

	mediaEligibility: { type: Types.Relationship, label: 'media eligibility', ref: 'Media Eligibility', many: true, initial: true },
	otherMediaDescription: { type: Types.Textarea, label: 'description', note: 'only fill out if \'other\' is selected for media eligibility' , initial: true }, // TODO: THIS DOESN'T WORK BECAUSE IT REFERENCES A RELATIONSHIP FIELD SO ALL WE HAVE IS THE _id, MAKE IT WORK!

	locationAlert: { type: Types.Boolean, label: 'location alert', initial: true },
	place: { type: Types.Text, label: 'place', initial: true, dependsOn: { locationAlert: true } }

}, 'Attachments', {

	photolistingPage: {
		type: Types.S3File,
		s3path: '/child/photolisting-pages',
		filename: function(item, filename){
			// prefix file name with registration number and the user's name for easier identification
			return fileName;
		}
	},

	otherAttachement: {
		type: Types.S3File,
		s3path: '/child/other',
		filename: function( item, filename ){
			// prefix file name with registration number and name for easier identification
			return fileName;
		}
	}
/* Container for all system fields (add a heading if any are meant to be visible through the admin UI) */
}, {

	// system field to store an appropriate file prefix
	fileName: { type: Types.Text, hidden: true },
	siblingGroupFileName: { type: Types.Text, hidden: true }

});

// Set up relationship values to show up at the bottom of the model if any exist
Child.relationship( { ref: 'Child', refPath: 'siblings', path: 'children', label: 'all siblings' } );
Child.relationship( { ref: 'Placement', refPath: 'child', path: 'placements', label: 'placements' } );
Child.relationship( { ref: 'Inquiry', refPath: 'child', path: 'inquiries', label: 'inquiries' } );
Child.relationship( { ref: 'Family', refPath: 'bookmarkedChildren', path: 'families', label: 'bookmarked by families' } );
Child.relationship( { ref: 'Family', refPath: 'bookmarkedSiblingGroups', path: 'families', label: 'sibling group bookmarked by families' } );
Child.relationship( { ref: 'Social Worker', refPath: 'bookmarkedChildren', path: 'social-workers', label: 'bookmarked by social workers' } );
Child.relationship( { ref: 'Social Worker', refPath: 'bookmarkedSiblingGroups', path: 'social-workers', label: 'sibling group bookmarked by social workers' } );
Child.relationship( { ref: 'Event', refPath: 'childAttendees', path: 'events', label: 'events' } );
Child.relationship( { ref: 'Internal Note', refPath: 'child', path: 'internal-notes', label: 'internal notes' } );
Child.relationship( { ref: 'Child History', refPath: 'child', path: 'child-histories', label: 'change history' } );

// Post Init - used to store all the values before anything is changed
Child.schema.post( 'init', function() {
	'use strict';

	this._original = this.toObject();
});

Child.schema.pre('save', function( next ) {
	'use strict';

	async.parallel([
		( done ) => { this.setImages( done ); }, // Create cloudinary URLs for images sized for various uses
		( done ) => { this.setFullName( done ); }, // Create a full name for the child based on their first, middle, and last names
		( done ) => { this.setFileName( done ); }, // Create an identifying name for file uploads
		( done ) => { this.setSiblingGroupFileName( done ); }, // Create an identifying name for sibling group file uploads
		( done ) => { this.updateMustBePlacedWithSiblingsCheckbox( done ); }, // If there are no siblings to be placed with, uncheck the box, otherwise check it
		( done ) => { this.updateGroupBio( done ); },
		( done ) => { this.setChangeHistory( done ); } // Process change history
	], function() {

		console.log( 'child information updated' );

		// TODO: Assign a registration number if one isn't assigned
		// TODO: MAKE RESIGRATION NUMBER NOEDIT.  THIS IS DEPENDENT ON BEING ABLE TO ASSIGN IT ON PRE-SAVE AS IT'S REQUIRED
		next();

	});
});

Child.schema.post( 'save', function() {

	// update all sibling information
	this.updateSiblingFields(),
	// update saved bookmarks for families and social workers in the event of a status change or sibling group change
	this.updateBookmarks()
});

Child.schema.methods.setImages = function( done ) {
	'use strict';

	// TODO: Play with lowering quality to 0 and doubling the image size as an optimization technique
	this.galleryImage = this._.image.thumbnail( 430, 430, { quality: 60 } );
	this.detailImage = this._.image.thumbnail( 200, 200, { quality: 60 } );

	this.siblingGroupGalleryImage = this._.siblingGroupImage.thumbnail( 240, 144, { quality: 60 } );
	this.siblingGroupDetailImage = this._.siblingGroupImage.thumbnail( 120, 72, { quality: 60 } );

	done();
};
// TODO: Better handled with a virtual
Child.schema.methods.setFullName = function( done ) {
	'use strict';

	// Build the name string for better identification when linking through Relationship field types
	const firstName   = this.name.first,
		  middleName  = ( this.name.middle && this.name.middle.length > 0 ) ? ' ' + this.name.middle : '',
		  lastName    = ( this.name.last && this.name.last.length > 0 ) ? ' ' + this.name.last : ''

	this.name.full = firstName + middleName + lastName;

	done();
};
// TODO: Better handled with a virtual
Child.schema.methods.setFileName = function( done ) {
	'use strict';

	this.fileName = this.registrationNumber + '_' + this.name.first.toLowerCase();

	done();
};

Child.schema.methods.setSiblingGroupFileName = function( done ) {
	'use strict';

	let idsArray = [ ...this.get( 'siblingsToBePlacedWith' ) ];
	idsArray.push( this.get( '_id' ) );

	let registrationNumbersArray = [];
	let namesArray = [];

	async.parallel([
		done => { ChildMiddleware.getRegistrationNumbersById( idsArray, registrationNumbersArray, done ); },
		done => { ChildMiddleware.getFirstNamesById( idsArray, namesArray, done ); }
	], () => {

		const idsString = registrationNumbersArray.join( '_' );
		const namesString = namesArray.join( '_' );

		this.siblingGroupFileName = `${ idsString }_${ namesString }`;

		done();
	});
};

Child.schema.methods.updateMustBePlacedWithSiblingsCheckbox = function( done ) {
	'use strict';

	if( this.siblingsToBePlacedWith && this.siblingsToBePlacedWith.length > 0 ) {
    	this.mustBePlacedWithSiblings = true;
	} else {
		this.mustBePlacedWithSiblings = false;
	}

	done();
}

Child.schema.methods.updateGroupBio = function( done ) {
	'use strict';

	if( !this.siblingsToBePlacedWith || this.siblingsToBePlacedWith.length === 0 ) {
		this.groupProfile = this.groupProfile || {};
		this.groupProfile.part1 = '';
		this.groupProfile.part2 = '';
		this.groupProfile.part3 = '';
	}

	done();
}

// Update the siblings field of all siblings listed to include the current child
Child.schema.methods.updateSiblingFields = function() {
	'use strict';

	const siblingsArrayBeforeSave				= this._original ? this._original.siblings.map( sibling => sibling.toString() ) : [], // this handles the model being saved for the first time
		  siblingsArrayAfterSave				= this.siblings.map( sibling => sibling.toString() ),
		  siblingsToBePlacedWithArrayBeforeSave	= this._original ? this._original.siblingsToBePlacedWith.map( sibling => sibling.toString() ) : [],
		  siblingsToBePlacedWithArrayAfterSave	= this.siblingsToBePlacedWith.map( sibling => sibling.toString() ),
		  
		  siblingsBeforeSave					= new Set( siblingsArrayBeforeSave ),
		  siblingsAfterSave						= new Set( siblingsArrayAfterSave ),
		  siblingsToBePlacedWithBeforeSave		= new Set( siblingsToBePlacedWithArrayBeforeSave ),
		  siblingsToBePlacedWithAfterSave		= new Set( siblingsToBePlacedWithArrayAfterSave ),

		  childId								= this._id.toString();

	// get all the siblings who are present before saving but not after (removed siblings)
	const removedSiblings = siblingsBeforeSave.leftOuterJoin( siblingsAfterSave );
	// get all the siblings who still remain if we ignore the removed siblings
	const remainingSiblings = siblingsAfterSave.leftOuterJoin( removedSiblings );
	// get all the aggregate of all siblings before and after saving
	const allSiblings = siblingsBeforeSave.union( siblingsAfterSave );
	// get all the siblings this child must be placed with who are present before saving but not after (removed siblings)
	const removedSiblingsToBePlacedWith = siblingsToBePlacedWithBeforeSave.leftOuterJoin( siblingsToBePlacedWithAfterSave );
	// get all the siblings to be placed with who still remain if we ignore the removed siblings to be placed with
	const remainingSiblingsToBePlacedWith = siblingsToBePlacedWithAfterSave.leftOuterJoin( removedSiblingsToBePlacedWith );
	// get all the aggregate of all siblings to be placed with before and after saving
	const allSiblingsToBePlacedWith = siblingsToBePlacedWithBeforeSave.union( siblingsToBePlacedWithAfterSave );

	// add update children list in the siblings and siblingsToBePlacedWith fields
	async.series([
		done => { ChildMiddleware.updateMySiblings( siblingsAfterSave, childId, done ); },
		done => { ChildMiddleware.updateMyRemainingSiblings( remainingSiblings, removedSiblings, childId, done ); },
		done => {
			// the first check ensures that a removed sibling doesn't remove all siblings from everyone when the starting sibling count is greater than 3
			// the second check ensures that if a child has only a single sibling, they will remove eachother
			if( remainingSiblings.size > 0 || removedSiblings.size === 1 ) {
				ChildMiddleware.updateMyRemovedSiblings( allSiblings, removedSiblings, childId, done );
			} else {
				done();
			}
		},
		done => { ChildMiddleware.updateMySiblingsToBePlacedWith( siblingsToBePlacedWithAfterSave, childId, this.get( 'groupProfile' ), this.get( 'siblingGroupImage' ), this.get( 'siblingGroupVideo' ), done ); },
		done => { ChildMiddleware.updateMyRemainingSiblingsToBePlacedWith( remainingSiblingsToBePlacedWith, removedSiblingsToBePlacedWith, childId, done ); },
		done => {
			// the first check ensures that a removed sibling doesn't remove all siblings from everyone when the starting siblings to be placed with count is greater than 3
			// the second check ensures that if a child has only a single sibling, they will remove eachother
			if( remainingSiblingsToBePlacedWith.size > 0 || removedSiblingsToBePlacedWith.size === 1 ) {
				ChildMiddleware.updateMyRemovedSiblingsToBePlacedWith( allSiblingsToBePlacedWith, removedSiblingsToBePlacedWith, childId, done );
			} else {
				done();
			}
		}
	], function() {

		console.log( 'sibling information updated' );

		done();
	});
};

Child.schema.methods.updateBookmarks = function() {
	'use strict';

	const siblingsArrayBeforeSave				= this._original ? this._original.siblings.map( sibling => sibling.toString() ) : [], // this handles the model being saved for the first time
		  siblingsArrayAfterSave				= this.siblings.map( sibling => sibling.toString() ),
		  siblingsToBePlacedWithArrayBeforeSave	= this._original ? this._original.siblingsToBePlacedWith.map( sibling => sibling.toString() ) : [],
		  siblingsToBePlacedWithArrayAfterSave	= this.siblingsToBePlacedWith.map( sibling => sibling.toString() ),

		  siblingsBeforeSave					= new Set( siblingsArrayBeforeSave ),
		  siblingsAfterSave						= new Set( siblingsArrayAfterSave ),
		  siblingsToBePlacedWithBeforeSave		= new Set( siblingsToBePlacedWithArrayBeforeSave ),
		  siblingsToBePlacedWithAfterSave		= new Set( siblingsToBePlacedWithArrayAfterSave ),

		  childId								= this._id.toString();

	// get all the siblings who are present before saving but not after (removed siblings)
	const removedSiblings = siblingsBeforeSave.leftOuterJoin( siblingsAfterSave );
	// get all the siblings who still remain if we ignore the removed siblings
	const remainingSiblings = siblingsAfterSave.leftOuterJoin( removedSiblings );
	// get all the aggregate of all siblings before and after saving
	const allSiblings = siblingsBeforeSave.union( siblingsAfterSave );
	// get all the siblings this child must be placed with who are present before saving but not after
	const removedSiblingsToBePlacedWith = siblingsToBePlacedWithBeforeSave.leftOuterJoin( siblingsToBePlacedWithAfterSave );
	// get all the siblings to be placed with who still remain if we ignore the removed siblings to be placed with
	const remainingSiblingsToBePlacedWith = siblingsToBePlacedWithAfterSave.leftOuterJoin( removedSiblingsToBePlacedWith );
	// get all the aggregate of all siblings to be placed with before and after saving
	const allSiblingsToBePlacedWith = siblingsToBePlacedWithBeforeSave.union( siblingsToBePlacedWithAfterSave );

	// arrays to store the ids of the children who's bookmarks are invalid and must be removed
	let bookmarkedChildrenToRemove = [],
		bookmarkedSiblingsToRemove = [];

	async.series([
		// mark the current child for removal as a child bookmark if they are no longer active
		done => {
			ChildMiddleware.updateBookmarksToRemoveByStatus( this.get( 'status' ), bookmarkedChildrenToRemove, childId, done );
		},
		done => {
			// if the child needs to be placed with siblings
			if( this.mustBePlacedWithSiblings ) {
				// mark the current child for removal as a child bookmark
				bookmarkedChildrenToRemove.push( childId );
				// mark all siblings to be placed with for removal as child bookmarks
				bookmarkedChildrenToRemove.concat( [ ...remainingSiblingsToBePlacedWith ] );
				// mark all removed siblings to be placed with for removal as sibling bookmarks
				bookmarkedSiblingsToRemove.concat( [ ...removedSiblingsToBePlacedWith ] );
			// if the child doesn't need to be placed with siblings, but did prior to saving
			} else if( this._original.mustBePlacedWithSiblings ) {
				// mark the current child for removal as a sibling bookmark
				bookmarkedSiblingsToRemove.push( childId );
				// mark all removed siblings to be placed with for removal as sibling bookmarks
				bookmarkedSiblingsToRemove.concat( [ ...removedSiblingsToBePlacedWith ] );
			}

			done();
		}
	], () => {
		// remove all marked child bookmarks from families and social workers
		FamilyMiddleware.removeChildBookmarks( bookmarkedChildrenToRemove );
		SocialWorkerMiddleware.removeChildBookmarks( bookmarkedChildrenToRemove );
		// remove all marked sibling bookmarks from families and social workers
		FamilyMiddleware.removeSiblingBookmarks( bookmarkedSiblingsToRemove );
		SocialWorkerMiddleware.removeSiblingBookmarks( bookmarkedSiblingsToRemove );
	});
}

Child.schema.methods.setChangeHistory = function( done ) {
	'use strict';

	const modelBefore	= this._original,
		  model 		= this;

	const changeHistory = new ChildHistory.model({
		  child			: this,
	      date			: Date.now(),
	      changes		: '',
	      modifiedBy	: this.updatedBy
	});

	// if the model is being saved for the first time, mark only that fact in an initial change history record
	if(!model._original) {

		changeHistory.changes = 'record created';

		console.log('changes: ', changeHistory);

		changeHistory.save( () => {
			console.log( 'record created - change history saved successfully' );
			done();
		}, err => {
			console.log( err );
			console.log( 'error saving record created change history' );
			done();
		});

	} else {
		// Any time a new field is added, it MUST be added to this list in order to be considered for display in change history
		// Computed fields and fields internal to the object SHOULD NOT be added to this list
		async.parallel([

			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'registrationNumber',
											label: 'registration number',
											type: 'number' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'siteVisibility',
											label: 'site visibility',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'isVisibleInGallery',
											label: 'child is visible in the gallery',
											type: 'boolean' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'registrationDate',
											label: 'registration date',
											type: 'date' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'video',
											label: 'video',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'siblingGroupVideo',
											label: 'sibling group video',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											parent: 'name',
											name: 'first',
											label: 'first name',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											parent: 'name',
											name: 'middle',
											label: 'middle name',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											parent: 'name',
											name: 'last',
											label: 'last name',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											parent: 'name',
											name: 'alias',
											label: 'alias',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											parent: 'name',
											name: 'nickName',
											label: 'nick name',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'birthDate',
											label: 'date of birth',
											type: 'date' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'language',
											targetField: 'language',
											label: 'language',
											type: 'relationship',
											model: 'Language' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'statusChangeDate',
											label: 'status change date',
											type: 'date' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'status',
											targetField: 'childStatus',
											label: 'status',
											type: 'relationship',
											model: 'Child Status' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'gender',
											targetField: 'gender',
											label: 'gender',
											type: 'relationship',
											model: 'Gender' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'race',
											targetField: 'race',
											label: 'race',
											type: 'relationship',
											model: 'Race' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'raceNotes',
											label: 'race notes',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'legalStatus',
											targetField: 'legalStatus',
											label: 'legal status',
											type: 'relationship',
											model: 'Legal Status' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'yearEnteredCare',
											label: 'year entered care',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'hasContactWithSiblings',
											label: 'has contact with siblings',
											type: 'boolean' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'siblingTypeOfContact',
											label: 'type of contact with siblings',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'siblings',
											targetParent: 'name',
											targetField: 'full',
											label: 'siblings',
											type: 'relationship',
											model: 'Child' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'mustBePlacedWithSiblings',
											label: 'must be placed with siblings',
											type: 'boolean' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'siblingsToBePlacedWith',
											targetParent: 'name',
											targetField: 'full',
											label: 'siblings to be placed with',
											type: 'relationship',
											model: 'Child' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'hasContactWithBirthFamily',
											label: 'has contact with birth family',
											type: 'boolean' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'birthFamilyTypeOfContact',
											label: 'type of contact with birth family',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'residence',
											targetField: 'residence',
											label: 'where does the child presently live?',
											type: 'relationship',
											model: 'Residence' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'city',
											targetField: 'cityOrTown',
											label: 'city/town of child\'s current location',
											type: 'relationship',
											model: 'City or Town' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'careFacilityName',
											label: 'care facility name',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'dateMovedToResidence',
											label: 'date moved to residence',
											type: 'date' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'physicalNeeds',
											label: 'physical needs',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'physicalNeedsDescription',
											label: 'physical needs description',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'emotionalNeeds',
											label: 'emotional needs',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'emotionalNeedsDescription',
											label: 'emotional needs description',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'intellectualNeeds',
											label: 'intellectual needs',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'intellectualNeedsDescription',
											label: 'intellectual needs description',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'disabilities',
											targetField: 'disability',
											label: 'disabilities',
											type: 'relationship',
											model: 'Disability' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'healthNotesNew',
											label: 'old health notes',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'healthNotesOld',
											label: 'new health notes',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'specialNeedsNotes',
											label: 'special needs notes',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'recommendedFamilyConstellation',
											targetField: 'familyConstellation',
											label: 'recommended family constellation',
											type: 'relationship',
											model: 'Family Constellation' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'otherFamilyConstellationConsideration',
											targetField: 'otherFamilyConstellationConsideration',
											label: 'other family constellation considerations',
											type: 'relationship',
											model: 'Other Family Constellation Consideration' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'otherConsiderations',
											targetField: 'otherConsideration',
											label: 'other considerations',
											type: 'relationship',
											model: 'Other Consideration' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'registeredBy',
											label: 'registered by',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'adoptionWorker',
											targetParent: 'name',
											targetField: 'full',
											label: 'adoption worker',
											type: 'relationship',
											model: 'Social Worker' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'recruitmentWorker',
											targetParent: 'name',
											targetField: 'full',
											label: 'recruitment worker',
											type: 'relationship',
											model: 'Social Worker' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'region',
											targetField: 'region',
											label: 'region',
											type: 'relationship',
											model: 'Region' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											parent: 'profile',
											name: 'part1',
											label: 'profile part 1',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											parent: 'profile',
											name: 'part2',
											label: 'profile part 2',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											parent: 'profile',
											name: 'part3',
											label: 'profile part 3',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											parent: 'groupProfile',
											name: 'part1',
											label: 'group profile part 1',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											parent: 'groupProfile',
											name: 'part2',
											label: 'group profile part 2',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											parent: 'groupProfile',
											name: 'part3',
											label: 'group profile part 3',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'hasPhotolistingWriteup',
											label: 'has photolisting writup',
											type: 'boolean' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'photolistingWriteupDate',
											label: 'date of photolisting writeup',
											type: 'date' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'hasPhotolistingPhoto',
											label: 'has photolisting page',
											type: 'boolean' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'photolistingPhotoDate',
											label: 'date of photolisting photo',
											type: 'date' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'isCurrentlyInPhotoListing',
											label: 'is currently in the photo listing',
											type: 'boolean' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'dateOfLastPhotoListing',
											label: 'date of last photolisting',
											type: 'date' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'photolistingPageNumber',
											label: 'photolisting page number',
											type: 'number' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'previousPhotolistingPageNumber',
											label: 'previous photolisting page number',
											type: 'number' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											parent: 'image',
											name: 'secure_url',
											label: 'image',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											parent: 'siblingGroupImage',
											name: 'secure_url',
											label: 'sibling group image',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'extranetUrl',
											label: 'extranet url',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'hasVideoSnapshot',
											label: 'has video snapshot',
											type: 'boolean' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'videoSnapshotDate',
											label: 'date of video snapshop',
											type: 'date' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'onMAREWebsite',
											label: 'on MARE website',
											type: 'boolean' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'onMAREWebsiteDate',
											label: 'date on MARE website',
											type: 'date' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'onAdoptuskids',
											label: 'on adoptuskids',
											type: 'boolean' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'onAdoptuskidsDate',
											label: 'date on adoptuskids',
											type: 'date' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'onOnlineMatching',
											label: 'on online matching',
											type: 'boolean' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'onOnlineMatchingDate',
											label: 'date on online matching',
											type: 'date' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'wednesdaysChild',
											label: 'wednesdays child',
											type: 'boolean' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'wednesdaysChildDate',
											label: 'wednesdays child date',
											type: 'date' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'wednesdaysChildVideo',
											label: 'wednesday\'s child video',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'wednesdaysChildSiblingGroupVideo',
											label: 'wednesday\'s child sibling group video',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'coalitionMeeting',
											label: 'coalition meeting',
											type: 'boolean' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'coalitionMeetingDate',
											label: 'date of coalition meeting',
											type: 'date' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'matchingEvent',
											label: 'matching event',
											type: 'boolean' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'matchingEventDate',
											label: 'date of matching event',
											type: 'date' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'adoptionParties',
											targetField: 'name',
											label: 'adoption parties',
											type: 'relationship',
											model: 'Event' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'mediaEligibility',
											targetField: 'mediaEligibility',
											label: 'media eligibility',
											type: 'relationship',
											model: 'Media Eligibility' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'otherMediaDescription',
											label: 'other media description',
											type: 'string' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'locationAlert',
											label: 'locationAlert',
											type: 'boolean' }, model, modelBefore, changeHistory, done);
			},
			done => {
				ChangeHistoryMiddleware.checkFieldForChanges({
											name: 'place',
											label: 'place',
											type: 'string' }, model, modelBefore, changeHistory, done);
			}

		], () => {

			if (changeHistory.changes === '') {

				done();

			} else {

				changeHistory.save( () => {
					console.log( 'change history saved successfully' );
					done();
				}, err => {
					console.log( err );
					console.log( 'error saving change history' );
					done();
				});
			}
		});
	}
};

// Define default columns in the admin interface and register the model
Child.defaultColumns = 'registrationNumber, name.full, ethnicity, legalStatus, gender';
Child.register();
