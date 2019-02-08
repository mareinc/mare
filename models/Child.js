require( './Tracking_ChildHistory' );

const keystone						= require( 'keystone' ),
	  async 						= require( 'async' ),
	  _ 							= require( 'underscore' ),
	  Types							= keystone.Field.Types,
	  ChangeHistoryMiddleware		= require( '../routes/middleware/models_change-history' ),
	  ChildServiceMiddleware		= require( '../routes/middleware/service_child' ),
	  SocialWorkerServiceMiddleware	= require( '../routes/middleware/service_social-worker' ),
	  UserServiceMiddleware			= require( '../routes/middleware/service_user' ),
	  agencyMiddleware				= require( '../routes/middleware/service_agency' ),
	  ChildMiddleware				= require( '../routes/middleware/models_child' ),
	  FamilyMiddleware				= require( '../routes/middleware/models_family' ),
	  SocialWorkerMiddleware		= require( '../routes/middleware/models_social-worker' ),
	  saveLock						= require( '../routes/middleware/model_save_lock' );

// configure the s3 storage adapters
const fileStorage = new keystone.Storage({
	adapter: require( 'keystone-storage-adapter-s3' ),
	s3: {
		key: process.env.S3_KEY, // required; defaults to process.env.S3_KEY
		secret: process.env.S3_SECRET, // required; defaults to process.env.S3_SECRET
		bucket: process.env.S3_BUCKET_NAME, // required; defaults to process.env.S3_BUCKET
		region: process.env.S3_REGION, // optional; defaults to process.env.S3_REGION, or if that's not specified, us-east-1
		path: '/Children/Files',
		uploadParams: { // optional; add S3 upload params; see below for details
			ACL: 'public-read'
		},
		generateFilename: function( item ) {
			// use the file name with spaces replaced by dashes instead of randomly generating a value.
			// NOTE: this is needed to prevent access errors when trying to view the files
			return item.originalname.replace( /\s/g, '-' );
		}
	},
	schema: {
		bucket: true, // optional; store the bucket the file was uploaded to in your db
		etag: true, // optional; store the etag for the resource
		path: true, // optional; store the path of the file in your db
		url: true, // optional; generate & store a public URL
	}
});

const imageStorage = new keystone.Storage({
	adapter: require( 'keystone-storage-adapter-s3' ),
	s3: {
		key: process.env.S3_KEY, // required; defaults to process.env.S3_KEY
		secret: process.env.S3_SECRET, // required; defaults to process.env.S3_SECRET
		bucket: process.env.S3_BUCKET_NAME, // required; defaults to process.env.S3_BUCKET
		region: process.env.S3_REGION, // optional; defaults to process.env.S3_REGION, or if that's not specified, us-east-1
		path: '/Children/Images',
		uploadParams: { // optional; add S3 upload params; see below for details
			ACL: 'public-read'
		},
		generateFilename: function( item ) {
			// use the file name with spaces replaced by dashes instead of randomly generating a value.
			// NOTE: this is needed to prevent access errors when trying to view the files
			return item.originalname.replace( /\s/g, '-' );
		}
	},
	schema: {
		bucket: true, // optional; store the bucket the file was uploaded to in your db
		etag: true, // optional; store the etag for the resource
		path: true, // optional; store the path of the file in your db
		url: true, // optional; generate & store a public URL
	}
});

// Create model
const Child = new keystone.List( 'Child', {
	track: true, // needed for change history updated by assignment
	autokey: { path: 'key', from: 'registrationNumber', unique: true },
	map: { name: 'displayNameAndRegistration' },
	defaultSort: 'name.full'
});

// Create fields
Child.add( 'Display Options', {

	siteVisibility: { type: Types.Select, label: 'child is visible to', options: 'everyone, only registered social workers and families', required: true, initial: true },
	isVisibleInGallery: { type: Types.Boolean, label: 'activate child profile on website to group selected', note: 'authorized staff only', default: false, initial: true },
	visibleInGalleryDate: { type: Types.Date, label: 'date added to MARE web', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, dependsOn: {isVisibleInGallery: true }, initial: true }

}, 'Child Information', {

	registrationNumber: { type: Number, label: 'registration number', format: false, noedit: true },
	registrationDate: { type: Types.Date, label: 'registration date', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, required: true, initial: true },
	displayNameAndRegistration: { type: Types.Text, label: 'name and registration number', default: 'new child', hidden: true, noedit: true },

	name: {
		first: { type: Types.Text, label: 'first name', required: true, initial: true },
		middle: { type: Types.Text, label: 'middle name', initial: true },
		last: { type: Types.Text, label: 'last name', required: true, initial: true },
		alias: { type: Types.Text, label: 'alias', initial: true },
		nickName: { type: Types.Text, label: 'nickname', initial: true },
		full: { type: Types.Text, label: 'name', hidden: true, noedit: true, initial: false }
	},

	birthDate: { type: Types.Date, label: 'date of birth', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', todayButton: false, utc: true, required: true, initial: true },
	languages: { type: Types.Relationship, label: 'languages', ref: 'Language', many: true, required: true, initial: true },
	statusChangeDate: { type: Types.Date, label: 'status change date', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, initial: true }, // TODO: Logic needed, see line 14 of https://docs.google.com/spreadsheets/d/1Opb9qziX2enTehJx5K1J9KAT7v-j2yAdqwyQUMSsFwc/edit#gid=1235141373
	status: { type: Types.Relationship, label: 'status', ref: 'Child Status', required: true, initial: true },
	gender: { type: Types.Relationship, label: 'gender', ref: 'Gender', required: true, initial: true },
	race: { type: Types.Relationship, label: 'race', ref: 'Race', many: true, required: true, initial: true },
	raceNotes: { type: Types.Text, label: 'race notes', initial: true },
	legalStatus: { type: Types.Relationship, label: 'legal status', ref: 'Legal Status', required: true, initial: true },
	yearEnteredCare: { type: Types.Text, label: 'year entered care', note: 'yyyy - required', initial: true },

	hasContactWithSiblings: { type: Types.Boolean, label: 'has contact with siblings?', default: false, initial: true },
	siblingTypeOfContact: { type: Types.Text, label: 'type of contact', initial: true },
	siblings: { type: Types.Relationship, label: 'siblings', ref: 'Child', many: true, initial: true, note: 'siblings cannot be updated at the same time as siblings to be placed with - save your changes to one, then update the other' },
	mustBePlacedWithSiblings: { type: Types.Boolean, label: 'must be placed with one or more sibling', default: false, initial: true, noedit: true, note: 'this field will update automatically when the child is saved' },
	siblingsToBePlacedWith: { type: Types.Relationship, label: 'siblings to be placed with', ref: 'Child', many: true, initial: true, note: 'siblings to be placed with cannot be updated at the same time as siblings - save your changes to one, then update the other' },
	hasContactWithBirthFamily: { type: Types.Boolean, label: 'has contact with birth family?', default: false, initial: true },
	birthFamilyTypeOfContact: { type: Types.Text, label: 'type of contact', initial: true },

	residence: { type: Types.Relationship, label: 'where does the child presently live?', ref: 'Residence', initial: true },
	isOutsideMassachusetts: { type: Types.Boolean, label: 'is outside Massachusetts', default: false, initial: true },
	city: { type: Types.Relationship, label: 'city/town of child\'s current location', ref: 'City or Town', dependsOn: { isOutsideMassachusetts: false }, initial: true },
	cityText: { type: Types.Text, label: 'city/town of child\'s current location', dependsOn: { isOutsideMassachusetts: true }, initial: true },
	careFacilityName: { type: Types.Text, label: 'name of residential/group care facility', initial: true },
	dateMovedToResidence: { type: Types.Date, label: 'date moved to current residence', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, initial: true }

}, 'Special Needs', {

	physicalNeeds: { type: Types.Select, label: 'physical needs', options: 'none, mild, moderate, severe', required: true, initial: true },
	physicalNeedsDescription: { type: Types.Textarea, label: 'description of physical needs', initial: true },
	emotionalNeeds: { type: Types.Select, label: 'emotional needs', options: 'none, mild, moderate, severe', required: true, initial: true },
	emotionalNeedsDescription: { type: Types.Textarea, label: 'description of emotional needs', initial: true },
	intellectualNeeds: { type: Types.Select, label: 'intellectual needs', options: 'none, mild, moderate, severe', required: true, initial: true },
	intellectualNeedsDescription: { type: Types.Textarea, label: 'description of intellectual needs', initial: true },
	socialNeeds: { type: Types.Select, label: 'social needs', options: 'none, mild, moderate, severe', required: true, initial: true },
	socialNeedsDescription: { type: Types.Textarea, label: 'description of social needs', initial: true },

	aspirations: { type: Types.Textarea, label: 'interests, talents, and aspirations', initial: true },

	schoolLife: { type: Types.Textarea, label: 'school life', initial: true },
	familyLife: { type: Types.Textarea, label: 'family life', initial: true },
	personality: { type: Types.Textarea, label: 'personality', initial: true },
	otherRecruitmentConsiderations: { type: Types.Textarea, label: 'other recruitment considerations', initial: true },

	disabilities: { type: Types.Relationship, label: 'disabilities', ref: 'Disability', many: true, initial: true },

	healthNotesNew: { type: Types.Textarea, label: 'health notes - new', initial: true },
	healthNotesOld: { type: Types.Textarea, label: 'health notes - old', initial: true }

}, 'Placement Considerations', {

	// TODO: NEEDS TO BE PLURAL BEFORE SAVE, FIX ACROSS THE CODEBASE
	recommendedFamilyConstellation: { type: Types.Relationship, label: 'recommended family constellations', ref: 'Family Constellation', many: true, required: true, initial: true },
	// TODO: NEEDS TO BE PLURAL BEFORE SAVE, FIX ACROSS THE CODEBASE
	otherFamilyConstellationConsideration: { type: Types.Relationship, label: 'other family constellation consideration', ref: 'Other Family Constellation Consideration', many: true, initial: true },
	otherConsiderations: { type: Types.Relationship, label: 'other considerations', ref: 'Other Consideration', many: true, initial: true }

}, 'Agency Information', {

	registeredBy: { type: Types.Select, label: 'registered by', options: 'unknown, adoption worker, recruitment worker', required: true, initial: true },
	adoptionWorker: { type: Types.Relationship, label: 'adoption worker', ref: 'Social Worker', initial: true },
	adoptionWorkerAgency: { type: Types.Relationship, label: `adoption worker's agency`, ref: 'Agency', noedit: true },
	adoptionWorkerAgencyRegion: { type: Types.Relationship, label: `adoption worker's region`, ref: 'Region', noedit: true },
	recruitmentWorker: { type: Types.Relationship, label: 'recruitment worker', ref: 'Social Worker', initial: true },
	recruitmentWorkerAgency: { type: Types.Relationship, label: `recruitment worker's agency`, ref: 'Agency', noedit: true },
	recruitmentWorkerAgencyRegion: { type: Types.Relationship, label: `recruitment worker's region`, ref: 'Region', noedit: true },

}, 'Child Profile', {

	profile: {
		quote: { type: Types.Textarea, label: 'personal quote', initial: true },
		part1: { type: Types.Textarea, label: '1st paragraph', note: 'Age, Race, Interests, Hobbies, Strengths', initial: true },
		part2: { type: Types.Textarea, label: '2nd paragraph', note: 'Physical, Social, Emotional and Academic Functioning', initial: true },
		part3: { type: Types.Textarea, label: '3rd paragraph', note: 'Legal Status, Sibling/Family Contact, Family Constellation and Placement requirements', initial: true }
	}

}, 'Sibling Group Profile', {

	groupProfile: {
		quote: { type: Types.Textarea, label: 'group quote', initial: true },
		part1: { type: Types.Textarea, label: '1st paragraph', note: 'Age, Race, Interests, Hobbies, Strengths', initial: true },
		part2: { type: Types.Textarea, label: '2nd paragraph', note: 'Physical, Social, Emotional and Academic Functioning', initial: true },
		part3: { type: Types.Textarea, label: '3rd paragraph', note: 'Legal Status, Sibling/Family Contact, Family Constellation and Placement requirements', initial: true }
	},

}, 'Photolisting Information', {

	hasPhotolistingWriteup: { type: Types.Boolean, label: 'photolisting writeup', default: false, initial: true },
	photolistingWriteupDate: { type: Types.Date, label: 'date of photolisting writeup', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, dependsOn: { hasPhotolistingWriteup: true }, initial: true },
	hasPhotolistingPhoto: { type: Types.Boolean, label: 'photolisting photo', default: false, initial: true },
	photolistingPhotoDate: { type: Types.Date, label: 'date of photolisting photo', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, dependsOn: { hasPhotolistingPhoto: true }, initial: true },
	isCurrentlyInPhotoListing: { type: Types.Boolean, label: 'currently in photolisting', default: false, initial: true },
	dateOfLastPhotoListing: { type: Types.Date, label: 'date of last photolisting', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, dependsOn: {isCurrentlyInPhotoListing: true }, initial: true },
	photolistingPageNumber: { type: Types.Text, label: 'photolisting page', initial: true },
	previousPhotolistingPageNumbers: { type: Types.Text, label: 'previous photolisting pages', initial: true },
	image: {
		type: Types.CloudinaryImage,
		label: 'display image',
		folder: `${ process.env.CLOUDINARY_DIRECTORY }/children/`,
		select: true,
		selectPrefix: `${ process.env.CLOUDINARY_DIRECTORY }/children/`,
		dependsOn: { mustBePlacedWithSiblings: false },
		autoCleanup: false,
		whenExists: 'overwrite',
		filenameAsPublicID: true
	},
	allImages: {
		type: Types.CloudinaryImages,
		label: 'all images',
		folder: `${ process.env.CLOUDINARY_DIRECTORY }/children/`,
		select: true,
		selectPrefix: `${ process.env.CLOUDINARY_DIRECTORY }/children/`,
		hidden: true,
		autoCleanup: true,
		whenExists: 'overwrite',
		filenameAsPublicID: true
	},
	siblingGroupImage: {
		type: Types.CloudinaryImage,
		label: 'sibling group image',
		folder: `${ process.env.CLOUDINARY_DIRECTORY }/sibling-groups/`,
		select: true,
		selectPrefix: `${ process.env.CLOUDINARY_DIRECTORY }/sibling-groups/`,
		dependsOn: { mustBePlacedWithSiblings: true },
		autoCleanup: false,
		whenExists: 'overwrite',
		filenameAsPublicID: true
	},
	extranetUrl: { type: Types.Url, label: 'extranet and related profile url', initial: true } // TODO: Since this is redundant as this just points the the url where the photo exists (the child's page), we may hide this field.  This must be kept in as it will help us track down the child information in the old system in the event of an issue.

}, 'Recruitment Options', {

	hasVideoSnapshot: { type: Types.Boolean, label: 'video snapshot', default: false, initial: true },
	videoSnapshotDate: { type: Types.Date, label: 'date of video snapshot', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, dependsOn: { hasVideoSnapshot: true }, initial: true },
	video: { type: Types.Url, label: 'video', dependsOn: { hasVideoSnapshot: true, mustBePlacedWithSiblings: false } },
	siblingGroupVideo: { type: Types.Url, label: 'sibling group video', dependsOn: { hasVideoSnapshot: true, mustBePlacedWithSiblings: true } },

	onAdoptuskids: { type: Types.Boolean, label: 'Adoptuskids website', default: false, initial: true },
	onAdoptuskidsDate: { type: Types.Date, label: 'date on Adoptuskids', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, dependsOn: { onAdoptuskids: true }, initial: true },

	wednesdaysChild: { type: Types.Boolean, label: 'Wednesday\'s Child', dependsOn: { mustBePlacedWithSiblings: false }, default: false, initial: true },
	wednesdaysChildDate: { type: Types.Date, label: 'date of Wednesday\'s Child', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, dependsOn: { mustBePlacedWithSiblings: false, wednesdaysChild: true }, initial: true },
	wednesdaysChildVideo: { type: Types.Url, label: 'Wednesday\'s Child video', dependsOn: { mustBePlacedWithSiblings: false, wednesdaysChild: true } },

	wednesdaysChildSiblingGroup: { type: Types.Boolean, label: 'Wednesday\'s Child for sibling group?', dependsOn: { mustBePlacedWithSiblings: true }, default: false, initial: true },
	wednesdaysChildSiblingGroupDate: { type: Types.Date, label: 'date of sibling group\'s Wednesday\'s Child', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, dependsOn: { mustBePlacedWithSiblings: true, wednesdaysChildSiblingGroup: true }, initial: true },
	wednesdaysChildSiblingGroupVideo: { type: Types.Url, label: 'Wednesday\'s Child sibling group video', dependsOn: { mustBePlacedWithSiblings: true, wednesdaysChildSiblingGroup: true } },

	coalitionMeeting: { type: Types.Boolean, label: 'coalition meeting', default: false, initial: true },
	coalitionMeetingDate: { type: Types.Date, label: 'date of coalition meeting', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, dependsOn: { coalitionMeeting: true }, initial: true },

	matchingEvent: { type: Types.Boolean, label: 'matching event', default: false, initial: true },
	matchingEventDate: { type: Types.Date, label: 'date of matching event', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, dependsOn: { matchingEvent: true }, initial: true },

	adoptionParties: { type: Types.Relationship, label: 'adoption parties', ref: 'Event', filters: { type: 'adoption party', isActive: true }, many: true, initial: true },

	mediaEligibility: { type: Types.Relationship, label: 'media eligibility', ref: 'Media Eligibility', many: true, initial: true },
	otherMediaDescription: { type: Types.Textarea, label: 'description', note: 'only fill out if \'other\' is selected for media eligibility' , initial: true }, // TODO: THIS DOESN'T WORK BECAUSE IT REFERENCES A RELATIONSHIP FIELD SO ALL WE HAVE IS THE _id, MAKE IT WORK!

	locationAlert: { type: Types.Boolean, label: 'location alert', default: false, initial: true },
	place: { type: Types.Text, label: 'place', initial: true, dependsOn: { locationAlert: true } },

	communicationsCollateral: { type: Types.Boolean, label: 'communications collateral', default: false, initial: true },
	communicationsCollateralDetails: { type: Types.Text, label: 'details', dependsOn: { communicationsCollateral: true }, initial: true },

}, 'File Attachments', {

	fileAttachment1: { type: Types.File, storage: fileStorage, label: 'file attachment 1' },
	fileAttachment2: { type: Types.File, storage: fileStorage, label: 'file attachment 2' },
	fileAttachment3: { type: Types.File, storage: fileStorage, label: 'file attachment 3' },
	fileAttachment4: { type: Types.File, storage: fileStorage, label: 'file attachment 4' },
	fileAttachment5: { type: Types.File, storage: fileStorage, label: 'file attachment 5' }

}, 'Image Attachments', {

	imageAttachment1: { type: Types.File, storage: imageStorage, label: 'image attachment 1' },
	imageAttachment2: { type: Types.File, storage: imageStorage, label: 'image attachment 2' },
	imageAttachment3: { type: Types.File, storage: imageStorage, label: 'image attachment 3' },
	imageAttachment4: { type: Types.File, storage: imageStorage, label: 'image attachment 4' },
	imageAttachment5: { type: Types.File, storage: imageStorage, label: 'image attachment 5' }

/* Container for data migration fields ( these should be kept until after phase 2 and the old system is phased out completely ) */
}, {
	// system field to store an appropriate file prefix
	oldId: { type: Types.Text, hidden: true }

});

// Set up relationship values to show up at the bottom of the model if any exist
Child.relationship( { ref: 'Child', refPath: 'siblings', path: 'children', label: 'siblings' } );
Child.relationship( { ref: 'Match', refPath: 'child', path: 'matches', label: 'matches' } );
Child.relationship( { ref: 'Placement', refPath: 'child', path: 'placements', label: 'placements' } );
Child.relationship( { ref: 'Legalization', refPath: 'child', path: 'legalizations', label: 'legalizations' } );
Child.relationship( { ref: 'Disruption', refPath: 'child', path: 'disruptions', label: 'disruptions' } );
Child.relationship( { ref: 'Inquiry', refPath: 'children', path: 'inquiries', label: 'inquiries' } );
Child.relationship( { ref: 'Family', refPath: 'bookmarkedChildren', path: 'families', label: 'bookmarked by families' } );
Child.relationship( { ref: 'Family', refPath: 'bookmarkedSiblings', path: 'families', label: 'sibling group bookmarked by families' } );
Child.relationship( { ref: 'Social Worker', refPath: 'bookmarkedChildren', path: 'social-workers', label: 'bookmarked by social workers' } );
Child.relationship( { ref: 'Social Worker', refPath: 'bookmarkedSiblings', path: 'social-workers', label: 'sibling group bookmarked by social workers' } );
Child.relationship( { ref: 'Event', refPath: 'childAttendees', path: 'events', label: 'events' } );
Child.relationship( { ref: 'Media Feature', refPath: 'children', path: 'media-features', label: 'media features' } );
Child.relationship( { ref: 'Internal Note', refPath: 'child', path: 'internal-notes', label: 'internal notes' } );
Child.relationship( { ref: 'Child History', refPath: 'child', path: 'child-histories', label: 'change history' } );

Child.schema.virtual( 'hasImage' ).get( function() {
	'use strict';

	return this.image.exists;
});

Child.schema.virtual( 'hasSiblingGroupImage' ).get( function() {
	'use strict';

	return this.siblingGroupImage.exists;
});

// pre init hook - initialize default recommendedFamilyConstellation values for new child records
// Doing it here via pre init because it does not seem to work when setting in the post init hook via field default options or via direct assignment to this.recommendedFamilyConstellation
Child.schema.pre('init', function (next, data) {
	
	// We are using a custom key of the Child const: _mareDefaultFamilyConstellations
	// it will hold default recommendedFamilyConstellation values
	if( typeof Child._mareDefaultFamilyConstellations === 'undefined' ) {
		// load data
		keystone.list( 'Family Constellation' ).model
			.find()
			.exec()
			.then( constellations => {
				Child._mareDefaultFamilyConstellations = [];
				constellations.forEach( (familyConstellation, i ) => {
					// assign all family constellation records as default except for other and unknown
					if( familyConstellation.key !== 'unknown' && familyConstellation.key !== 'other' ) {
						Child._mareDefaultFamilyConstellations.push( familyConstellation._id );
					}
				} );
				// assign as default field values
				Child.fields.recommendedFamilyConstellation.__options.defaultValue = Child._mareDefaultFamilyConstellations;
				next();
				
			}, err => {
				console.error( 'error populating default recommendedFamilyConstellation' );
			});
			
	} else {
		// assign as default field values
		Child.fields.recommendedFamilyConstellation.__options.defaultValue = Child._mareDefaultFamilyConstellations;
		next();
	
	}
});

// Post Init - used to store all the values before anything is changed
// Child.schema.post( 'init', function() {
// 	'use strict';

// 	this._original = this.toObject();

// 	// if there are any siblingsToBePlacedWith, set mustBePlacedWithSiblings to true
// 	if ( this.siblingsToBePlacedWith ) {
// 		this.mustBePlacedWithSiblings = this.siblingsToBePlacedWith.length > 0 ? true : false;
// 	}
// });

// Child.schema.pre( 'save', function( next ) {
// 	'use strict';

// 	// trim whitespace characters from any type.Text fields
// 	this.trimTextFields();
// 	// create a full name for the child based on their first, middle, and last names
// 	this.setFullName();
// 	// if there are no siblings to be placed with, uncheck the box, otherwise check it
// 	this.updateMustBePlacedWithSiblingsCheckbox();
// 	// if there are no siblings to be placed with, clear the group bio
// 	// this.updateSiblingGroupInfo();

// 	// set the registration number for the family
// 	const registrationNumberSet = this.setRegistrationNumber();
// 	// set the noedit fields associated with the adoption worker's agency
// 	const adoptionWorkerAgencyFieldsSet = this.setAdoptionWorkerAgencyFields();
// 	// set the noedit fields associated with the recruitment worker's agency
// 	const recruitmentWorkerAgencyFieldsSet = this.setRecruitmentWorkerAgencyFields();

// 	// check to see if the siblings groups have been changed
// 	let hasSiblingsChanged = this.checkSiblingsForChanges();
// 	let hasSiblingsToBePlacedWithChanged = this.checkSiblingsToBePlacedWithForChanges();
// 	// if both groups have been changed
// 	if ( hasSiblingsChanged && hasSiblingsToBePlacedWithChanged ) {
// 		// revert the changes to the siblingsToBePlacedWith group
// 		this.siblingsToBePlacedWith = this._original ? this._original.siblingsToBePlacedWith : [];
// 		hasSiblingsToBePlacedWithChanged = false;
// 	}

// 	// perform async processing
// 	Promise
// 		.resolve()
// 		// process updates to sibling groups
// 		.then( () => {
// 			// if the siblings group has been updated
// 			if ( hasSiblingsChanged ) {
// 				// batch the siblings group updates
// 				return ChildMiddleware.batchAllSiblingUpdates( this );
// 			// if the siblings to be placed with group has been updated
// 			} else if ( hasSiblingsToBePlacedWithChanged ) {
// 				// batch the siblings to be placed with group updates
// 				return ChildMiddleware.batchAllSiblingsToBePlacedWithUpdates( this );
// 			// if neither group has been updated
// 			} else {
// 				// continue execution
// 				return;
// 			}
// 		})
// 		// catch and log any errors
// 		.catch( error => {
// 			// log any errors
// 			console.error( error );
// 		})
// 		// perform the rest of the pre-save processing
// 		.then( () => {

// 			return Promise.all( [ registrationNumberSet, adoptionWorkerAgencyFieldsSet, recruitmentWorkerAgencyFieldsSet ] );
// 		})
// 		// if there was an error with any of the promises
// 		.catch( err => {
// 			// log it for debugging purposes
// 			console.error( `child ${ this.name.full } ( registration number: ${ this.registrationNumber } ) saved with errors` );
// 		})
// 		// execute the following regardless of whether the promises were resolved or rejected
// 		// TODO: this should be replaced with ES6 Promise.prototype.finally() once it's finalized, assuming we can update to the latest version of Node if we upgrade Keystone
// 		.then( () => {
// 			// create a unique label for each child based on their first & last names and their registration number
// 			this.setFullNameAndRegistrationLabel();
// 			next();
// 		});
// });

// Child.schema.post( 'save', function() {

// 	// if the list of siblings has been changed
// 	if ( this.checkSiblingsForChanges() ) {
// 		// process updates for other siblings
// 		this.updateSiblingGroup();
// 	// if the siblings group has not changed, replicate fields to each sibling to be placed with that should be identical across records
// 	} else {
// 		// process updates for other siblings in the group
// 		this.updateSiblingsToBePlacedWithGroup();
// 	}

// 	// update saved bookmarks for families and social workers in the event of a status change or sibling group change
// 	this.updateBookmarks();

// 	// we need this id in case the family was created via the website and updatedBy is empty
// 	const websiteBotFetched = UserServiceMiddleware.getUserByFullName( 'Website Bot', 'admin' );

// 	// if the bot user was fetched successfully
// 	websiteBotFetched
// 		.then( bot => {
// 			// set the updatedBy field to the bot's _id if the field isn't already set ( meaning it was saved in the admin UI and we know the user based on their session info )
// 			this.updatedBy = this.updatedBy || bot.get( '_id' );
// 		})
// 		// if there was an error fetching the bot user
// 		.catch( err => {
// 			// log it for debugging purposes
// 			console.error( `Website Bot could not be fetched for family ${ this.name.full } ( registration number: ${ this.registrationNumber } ) - ${ err }` );
// 		})
// 		// execute the following regardless of whether the promises were resolved or rejected
// 		// TODO: this should be replaced with ES6 Promise.prototype.finally() once it's finalized, assuming we can update to the latest version of Node if we upgrade Keystone
// 		.then( () => {
// 			// process change history
// 			this.setChangeHistory();
// 		});
// });

/* text fields don't automatically trim(), this is to ensure no leading or trailing whitespace gets saved into url, text, or text area fields */
Child.schema.methods.trimTextFields = function() {

	if( this.get( 'name.first' ) ) {
		this.set( 'name.first', this.get( 'name.first' ).trim() );
	}

	if( this.get( 'name.middle' ) ) {
		this.set( 'name.middle', this.get( 'name.middle' ).trim() );
	}

	if( this.get( 'name.last' ) ) {
		this.set( 'name.last', this.get( 'name.last' ).trim() );
	}

	if( this.get( 'name.alias' ) ) {
		this.set( 'name.alias', this.get( 'name.alias' ).trim() );
	}

	if( this.get( 'name.nickName' ) ) {
		this.set( 'name.nickName', this.get( 'name.nickName' ).trim() );
	}

	if( this.get( 'raceNotes' ) ) {
		this.set( 'raceNotes', this.get( 'raceNotes' ).trim() );
	}

	if( this.get( 'yearEnteredCare' ) ) {
		this.set( 'yearEnteredCare', this.get( 'yearEnteredCare' ).trim() );
	}

	if( this.get( 'siblingTypeOfContact' ) ) {
		this.set( 'siblingTypeOfContact', this.get( 'siblingTypeOfContact' ).trim() );
	}

	if( this.get( 'birthFamilyTypeOfContact' ) ) {
		this.set( 'birthFamilyTypeOfContact', this.get( 'birthFamilyTypeOfContact' ).trim() );
	}

	if( this.get( 'cityText' ) ) {
		this.set( 'cityText', this.get( 'cityText' ).trim() );
	}

	if( this.get( 'careFacilityName' ) ) {
		this.set( 'careFacilityName', this.get( 'careFacilityName' ).trim() );
	}

	if( this.get( 'physicalNeedsDescription' ) ) {
		this.set( 'physicalNeedsDescription', this.get( 'physicalNeedsDescription' ).trim() );
	}

	if( this.get( 'emotionalNeedsDescription' ) ) {
		this.set( 'emotionalNeedsDescription', this.get( 'emotionalNeedsDescription' ).trim() );
	}

	if( this.get( 'intellectualNeedsDescription' ) ) {
		this.set( 'intellectualNeedsDescription', this.get( 'intellectualNeedsDescription' ).trim() );
	}

	if( this.get( 'socialNeedsDescription' ) ) {
		this.set( 'socialNeedsDescription', this.get( 'socialNeedsDescription' ).trim() );
	}

	if( this.get( 'aspirations' ) ) {
		this.set( 'aspirations', this.get( 'aspirations' ).trim() );
	}

	if( this.get( 'schoolLife' ) ) {
		this.set( 'schoolLife', this.get( 'schoolLife' ).trim() );
	}

	if( this.get( 'familyLife' ) ) {
		this.set( 'familyLife', this.get( 'familyLife' ).trim() );
	}

	if( this.get( 'personality' ) ) {
		this.set( 'personality', this.get( 'personality' ).trim() );
	}

	if( this.get( 'otherRecruitmentConsiderations' ) ) {
		this.set( 'otherRecruitmentConsiderations', this.get( 'otherRecruitmentConsiderations' ).trim() );
	}

	if( this.get( 'healthNotesNew' ) ) {
		this.set( 'healthNotesNew', this.get( 'healthNotesNew' ).trim() );
	}

	if( this.get( 'healthNotesOld' ) ) {
		this.set( 'healthNotesOld', this.get( 'healthNotesOld' ).trim() );
	}

	if( this.get( 'profile.quote' ) ) {
		this.set( 'profile.quote', this.get( 'profile.quote' ).trim() );
	}

	if( this.get( 'profile.part1' ) ) {
		this.set( 'profile.part1', this.get( 'profile.part1' ).trim() );
	}

	if( this.get( 'profile.part2' ) ) {
		this.set( 'profile.part2', this.get( 'profile.part2' ).trim() );
	}

	if( this.get( 'profile.part3' ) ) {
		this.set( 'profile.part3', this.get( 'profile.part3' ).trim() );
	}

	if( this.get( 'groupProfile.quote' ) ) {
		this.set( 'groupProfile.quote', this.get( 'groupProfile.quote' ).trim() );
	}

	if( this.get( 'groupProfile.part1' ) ) {
		this.set( 'groupProfile.part1', this.get( 'groupProfile.part1' ).trim() );
	}

	if( this.get( 'groupProfile.part2' ) ) {
		this.set( 'groupProfile.part2', this.get( 'groupProfile.part2' ).trim() );
	}

	if( this.get( 'groupProfile.part3' ) ) {
		this.set( 'groupProfile.part3', this.get( 'groupProfile.part3' ).trim() );
	}

	if( this.get( 'photolistingPageNumber' ) ) {
		this.set( 'photolistingPageNumber', this.get( 'photolistingPageNumber' ).trim() );
	}

	if( this.get( 'previousPhotolistingPageNumbers' ) ) {
		this.set( 'previousPhotolistingPageNumbers', this.get( 'previousPhotolistingPageNumbers' ).trim() );
	}

	if( this.get( 'extranetUrl' ) ) {
		this.set( 'extranetUrl', this.get( 'extranetUrl' ).trim() );
	}

	if( this.get( 'video' ) ) {
		this.set( 'video', this.get( 'video' ).trim() );
	}

	if( this.get( 'siblingGroupVideo' ) ) {
		this.set( 'siblingGroupVideo', this.get( 'siblingGroupVideo' ).trim() );
	}

	if( this.get( 'wednesdaysChildVideo' ) ) {
		this.set( 'wednesdaysChildVideo', this.get( 'wednesdaysChildVideo' ).trim() );
	}

	if( this.get( 'wednesdaysChildSiblingGroupVideo' ) ) {
		this.set( 'wednesdaysChildSiblingGroupVideo', this.get( 'wednesdaysChildSiblingGroupVideo' ).trim() );
	}

	if( this.get( 'otherMediaDescription' ) ) {
		this.set( 'otherMediaDescription', this.get( 'otherMediaDescription' ).trim() );
	}

	if( this.get( 'place' ) ) {
		this.set( 'place', this.get( 'place' ).trim() );
	}

	if( this.get( 'communicationsCollateralDetails' ) ) {
		this.set( 'communicationsCollateralDetails', this.get( 'communicationsCollateralDetails' ).trim() );
	}
};

// TODO: Better handled with a virtual
Child.schema.methods.setFullName = function() {
	'use strict';

	// Build the name string for better identification when linking through Relationship field types
	const firstName   = this.name.first,
		  middleName  = ( this.name.middle && this.name.middle.length > 0 ) ? ' ' + this.name.middle : '',
		  lastName    = ( this.name.last && this.name.last.length > 0 ) ? ' ' + this.name.last : ''

	this.name.full = firstName + middleName + lastName;
};

Child.schema.methods.setRegistrationNumber = function() {

	return new Promise( ( resolve, reject ) => {
		// If the registration number is already set ( which will happen during the data migration as well as saving existing children )
		if( this.registrationNumber ) {
			// ignore setting it and resolve the promise
			resolve();
		// if the registration number has not been set before
		} else {
			// get the maximum registration number across all children
			const fetchMaxRegistrationNumber = ChildServiceMiddleware.getMaxRegistrationNumber();
			// once the value has been fetched
			fetchMaxRegistrationNumber
				.then( registrationNumber => {
					// set the current family's registration number to the max plus 1
					this.registrationNumber = registrationNumber + 1;
					// resolve the promise
					resolve();

				})
				// if there was an error fetching the max registration number
				.catch( err => {
					// log the error for debugging purposes
					console.error( `registration number could not be updated for child ${ this.fullName } ( registration number: ${ this.registrationNumber } ) - ${ err }` );
					// resolve the promise so that the Promise.all() in the pre-save hook does not fail
					resolve();
				});
		}
	});
};

Child.schema.methods.setFullNameAndRegistrationLabel = function() {
	'use strict';

	// if a registration number exists, add it to the full name and registration label
	let registrationNumberString = this.registrationNumber ? ` - ${ this.registrationNumber }` : '';

	// combine the first & last names and registration number to create a unique label for all Child models
	this.displayNameAndRegistration = `${ this.name.first } ${ this.name.last }${ registrationNumberString }`;
};

Child.schema.methods.setAdoptionWorkerAgencyFields = function() {

	return new Promise( ( resolve, reject ) => {

		if( !this.adoptionWorker ) {
			// remove the adoption worker agency and region fields
			this.adoptionWorkerAgency = undefined;
			this.adoptionWorkerAgencyRegion = undefined;
			// resolve the promise and prevent future code from executing
			return resolve();
		}

		const fetchAdoptionWorker = SocialWorkerServiceMiddleware.getSocialWorkerById( this.adoptionWorker );

		// if the adoption worker was fetched successfully
		fetchAdoptionWorker
			.then( adoptionWorker => {
				// attempt to find the adoption worker's agency
				return agencyMiddleware.getAgencyById( adoptionWorker.agency );
			})
			// if the adoption worker's agency was found successfully
			.then( agency => {
				// set the adoption worker agency for the child
				this.adoptionWorkerAgency = agency.get( '_id' );
				// set the adoption worker agency region for the child
				this.adoptionWorkerAgencyRegion = agency.address.region;
				// resolve the promise
				resolve();
			})
			// if any of the promises were rejected
			.catch( err => {
				// log the error for debugging purposes
				console.error( `error saving the child's adoption worker agency fields - ${ err }` );
				// remove the adoption worker agency and region fields
				this.adoptionWorkerAgency = undefined;
				this.adoptionWorkerAgencyRegion = undefined;
				// resolve the promise so that the Promise.all() in the pre-save hook does not fail
				resolve();
			});
	});
};

Child.schema.methods.setRecruitmentWorkerAgencyFields = function() {

	return new Promise( ( resolve, reject ) => {

		if( !this.recruitmentWorker ) {
			// remove the recruitment worker agency and region fields
			this.recruitmentWorkerAgency = undefined;
			this.recruitmentWorkerAgencyRegion = undefined;
			// resolve the promise and prevent future code from executing
			return resolve();
		}

		const fetchRecruitmentWorker = SocialWorkerServiceMiddleware.getSocialWorkerById( this.recruitmentWorker );

		// if the recruitment worker was fetched successfully
		fetchRecruitmentWorker
			.then( recruitmentWorker => {
				// attempt to find the recruitment worker's agency
				return agencyMiddleware.getAgencyById( recruitmentWorker.agency );
			})
			// if the recruitment worker's agency was found successfully
			.then( agency => {
				// set the recruitment worker agency for the child
				this.recruitmentWorkerAgency = agency.get( '_id' );
				// set the recruitment worker agency region for the child
				this.recruitmentWorkerAgencyRegion = agency.address.region;
				// resolve the promise
				resolve();
			})
			// if any of the promises were rejected
			.catch( err => {
				// log the error for debugging purposes
				console.error( `error saving the child's recruitment worker agency fields - ${ err }` );
				// remove the recruitment worker agency and region fields
				this.adoptionWorkerAgency = undefined;
				this.adoptionWorkerAgencyRegion = undefined;
				// resolve the promise so that the Promise.all() in the pre-save hook does not fail
				resolve();
			});
	});
};

Child.schema.methods.updateMustBePlacedWithSiblingsCheckbox = function() {
	'use strict';

	// if there are any siblingsToBePlacedWith, set mustBePlacedWithSiblings to true
	if ( this.siblingsToBePlacedWith ) {
		this.mustBePlacedWithSiblings = this.siblingsToBePlacedWith.length > 0 ? true : false;
	}
}

Child.schema.methods.updateSiblingGroupInfo = function() {
	'use strict';

	if( !this.siblingsToBePlacedWith || this.siblingsToBePlacedWith.length === 0 ) {
		this.groupProfile.quote = '';
		this.groupProfile.part1 = '';
		this.groupProfile.part2 = '';
		this.groupProfile.part3 = '';
		this.wednesdaysChildSiblingGroup = false;
		this.wednesdaysChildSiblingGroupDate = undefined;
		this.wednesdaysChildSiblingGroupVideo = undefined;
		this.siblingGroupImage = undefined;
		this.siblingGroupVideo = undefined;
	}
};

Child.schema.methods.updateSiblingGroup = function() {

	let siblingGroupPromises = [];

	let siblingsArrayBeforeSave = this._original ? this._original.siblings.map( sibling => sibling.toString() ) : [];
	let siblingsBeforeSave = new Set( siblingsArrayBeforeSave );

	let siblingsArrayAfterSave = this.siblings.map( sibling => sibling.toString() );
	let siblingsAfterSave = new Set( siblingsArrayAfterSave );

	// create a set of all siblings added to the original child by the save operation
	let siblingsAddedBySave = Array.from( siblingsBeforeSave.rightOuterJoin( siblingsAfterSave ) );
	// create a set of all siblings removed from the original child by the save operation
	let siblingsRemovedBySave = Array.from( siblingsBeforeSave.leftOuterJoin( siblingsAfterSave ) );

	// create an updated representation of the sibling group based on the post-save state of the siblings array
	let updatedSiblingGroup = siblingsArrayAfterSave;
	// if the updated sibling group is not empty this child has siblings and a valid group to update
	if ( updatedSiblingGroup.length > 0 ) {
		// add the current child to the group ( because a child will not store itself in the siblings array )
		updatedSiblingGroup.push( this._id.toString() );
		// determine which siblings were impacted by the update
		let siblingsImpacted = updatedSiblingGroup.concat( siblingsRemovedBySave ).filter( siblingId => siblingId !== this._id.toString() );

		// for each sibling impacted
		siblingsImpacted.forEach( siblingId => {
			// check to ensure that the sibling is not already in the process of being saved
			if ( !saveLock.isLocked( siblingId ) ) {
				// lock the sibling to ensure that it cannot be updated by any other processes until this update is complete
				saveLock.lock( siblingId );
				// update the sibling with the new sibling group
				let siblingGroupPromise = ChildMiddleware
					.applySiblingGroupToChild( { childToUpdateId: siblingId, siblingGroup: updatedSiblingGroup } )
					.then( updatedChildId => {
						// unlock the sibling after update is complete
						saveLock.unlock( updatedChildId );
					})
					.catch( updatedChildId => {
						// unlock the sibling after update is complete
						saveLock.unlock( updatedChildId );
					});

				siblingGroupPromises.push( siblingGroupPromise );
			}
		});
	// if the updated sibling group is empty this child was removed from a sibling group and should remove itself from any siblings remaining in that group
	} else {
		// for each sibling that this child used to be a in a sibling group with
		siblingsRemovedBySave.forEach( siblingId => {
			// check to ensure that the sibling is not already in the process of being saved
			if ( !saveLock.isLocked( siblingId ) ) {
				// lock the sibling to ensure that it cannot be updated by any other processes until this update is complete
				saveLock.lock( siblingId );
				// remove this child from a sibling
				let siblingGroupPromise = ChildMiddleware
					.removeSiblingFromChild( { childToUpdateId: siblingId, siblingToRemoveId: this._id.toString() } )
					.then( updatedChildId => {
						// unlock the sibling after update is complete
						saveLock.unlock( updatedChildId );
					})
					.catch( updatedChildId => {
						// unlock the sibling after update is complete
						saveLock.unlock( updatedChildId );
					});

				siblingGroupPromises.push( siblingGroupPromise );
			}
		});
	}

	return Promise.all( siblingGroupPromises );
};

Child.schema.methods.updateSiblingsToBePlacedWithGroup = function() {

	let siblingsToBePlacedWithArrayBeforeSave = this._original ? this._original.siblingsToBePlacedWith.map( sibling => sibling.toString() ) : [];
	let siblingsToBePlacedWithBeforeSave = new Set( siblingsToBePlacedWithArrayBeforeSave );

	let siblingsToBePlacedWithArrayAfterSave = this.siblingsToBePlacedWith.map( sibling => sibling.toString() );
	let siblingsToBePlacedWithAfterSave = new Set( siblingsToBePlacedWithArrayAfterSave );

	// create a set of all siblings to be placed with added to the original child by the save operation
	let siblingsToBePlacedWithAddedBySave = Array.from( siblingsToBePlacedWithBeforeSave.rightOuterJoin( siblingsToBePlacedWithAfterSave ) );
	// create a set of all siblings to be placed with removed from the original child by the save operation
	let siblingsToBePlacedWithRemovedBySave = Array.from( siblingsToBePlacedWithBeforeSave.leftOuterJoin( siblingsToBePlacedWithAfterSave ) );

	// create an updated representation of the siblings to be placed with group based on the post-save state of the siblings array
	let updatedSiblingsToBePlacedWithGroup = siblingsToBePlacedWithArrayAfterSave;
	// if the updated siblings to be placed with group is not empty this child has siblings to be placed with and a valid group to update
	if ( updatedSiblingsToBePlacedWithGroup.length > 0 ) {
		// add the current child to the group ( because a child will not store itself in the siblings array )
		updatedSiblingsToBePlacedWithGroup.push( this._id.toString() );
		// determine which siblings to be placed with were impacted by the update
		let siblingsToBePlacedWithImpacted = updatedSiblingsToBePlacedWithGroup.concat( siblingsToBePlacedWithRemovedBySave ).filter( siblingId => siblingId !== this._id.toString() );

		// for each sibling to be placed with impacted
		siblingsToBePlacedWithImpacted.forEach( siblingId => {
			// check to ensure that the sibling to be placed with is not already in the process of being saved
			if ( !saveLock.isLocked( siblingId ) ) {
				// lock the sibling to be placed with to ensure that it cannot be updated by any other processes until this update is complete
				saveLock.lock( siblingId );
				// update the sibling to be placed with with the new siblings to be placed with group
				ChildMiddleware
					.applySiblingsToBePlacedWithGroupToChild({
						childToUpdateId: siblingId,
						recommendedFamilyConstellation: this.get( 'recommendedFamilyConstellation' ),
						adoptionWorker: this.get( 'adoptionWorker' ),
						recruitmentWorker: this.get( 'recruitmentWorker' ),
						isVisibleInGallery: this.get( 'isVisibleInGallery' ),
						siblingsToBePlacedWithGroup: updatedSiblingsToBePlacedWithGroup,
						siblingGroupProfile: this.get( 'groupProfile' ),
						siblingGroupImage: this.get( 'siblingGroupImage' ),
						siblingGroupVideo: this.get( 'siblingGroupVideo' ),
						wednesdaysChildSiblingGroup: this.get( 'wednesdaysChildSiblingGroup' ),
						wednesdaysChildSiblingGroupDate: this.get( 'wednesdaysChildSiblingGroupDate' ),
						wednesdaysChildSiblingGroupVideo: this.get( 'wednesdaysChildSiblingGroupVideo' ) } )
					.then( updatedChildId => {
						// unlock the sibling to be placed with after update is complete
						saveLock.unlock( updatedChildId );
					})
					.catch( updatedChildId => {
						// unlock the sibling to be placed with after update is complete
						saveLock.unlock( updatedChildId );
					});
			}
		});
	// if the updated siblings to be placed with group is empty this child was removed from a siblings to be placed with group and should remove itself from any siblings to be placed with remaining in that group
	} else {
		// for each sibling that this child used to be a in a siblings to be placed with group with
		siblingsToBePlacedWithRemovedBySave.forEach( siblingId => {
			// check to ensure that the sibling to be placed with is not already in the process of being saved
			if ( !saveLock.isLocked( siblingId ) ) {
				// lock the sibling to be placed with to ensure that it cannot be updated by any other processes until this update is complete
				saveLock.lock( siblingId );
				// remove this child from a sibling to be placed with
				ChildMiddleware
					.removeSiblingToBePlacedWithFromChild({
						childToUpdateId: siblingId,
						siblingToBePlacedWithToRemoveId: this._id.toString()
					})
					.then( updatedChildId => {
						// unlock the sibling to be placed with after update is complete
						saveLock.unlock( updatedChildId );
					})
					.catch( updatedChildId => {
						// unlock the sibling to be placed with after update is complete
						saveLock.unlock( updatedChildId );
					});
			}
		});
	}
};

Child.schema.methods.checkSiblingsForChanges = function() {

	let siblingsArrayBeforeSave = this._original ? this._original.siblings.map( sibling => sibling.toString() ) : [];
	let siblingsBeforeSave = new Set( siblingsArrayBeforeSave );

	let siblingsArrayAfterSave = this.siblings.map( sibling => sibling.toString() );
	let siblingsAfterSave = new Set( siblingsArrayAfterSave );

	let addedOrRemovedSiblings = siblingsBeforeSave.difference( siblingsAfterSave );

	return addedOrRemovedSiblings.size > 0;
};

Child.schema.methods.checkSiblingsToBePlacedWithForChanges = function() {

	let siblingsArrayBeforeSave = this._original ? this._original.siblingsToBePlacedWith.map( sibling => sibling.toString() ) : [];
	let siblingsBeforeSave = new Set( siblingsArrayBeforeSave );

	let siblingsArrayAfterSave = this.siblingsToBePlacedWith.map( sibling => sibling.toString() );
	let siblingsAfterSave = new Set( siblingsArrayAfterSave );

	let addedOrRemovedSiblings = siblingsBeforeSave.difference( siblingsAfterSave );

	return addedOrRemovedSiblings.size > 0;
};

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

	// TODO: update this to use native Promises or Async/Await
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
		done => {
			ChildMiddleware.updateMySiblingsToBePlacedWith( siblingsToBePlacedWithAfterSave,
															childId,
															this.get( 'groupProfile' ),
															this.get( 'siblingGroupImage' ),
															this.get( 'siblingGroupVideo' ),
															this.get( 'wednesdaysChildSiblingGroup' ),
															this.get( 'wednesdaysChildSiblingGroupDate' ),
															this.get( 'wednesdaysChildSiblingGroupVideo' ),
															done );
		},
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
			
			// if the child must be removed from bookmarks due to status change:
			if( bookmarkedChildrenToRemove.includes( childId ) ) {
				// mark all current siblings to be placed with for removal as child bookmarks
				bookmarkedChildrenToRemove.push( ...remainingSiblingsToBePlacedWith );
				// mark all removed siblings to be placed with for removal as child bookmarks
				bookmarkedChildrenToRemove.push( ...removedSiblingsToBePlacedWith );
				
				// mark the current child for removal as a sibling bookmark
				bookmarkedSiblingsToRemove.push( childId );
				// mark all current siblings to be placed with for removal as sibling bookmarks
				bookmarkedSiblingsToRemove.push( ...remainingSiblingsToBePlacedWith );
				// mark all removed siblings to be placed with for removal as sibling bookmarks
				bookmarkedSiblingsToRemove.push( ...removedSiblingsToBePlacedWith );
			}

			done();
		}
	], () => {
		// if any child bookmarks need to be removed
		if( bookmarkedChildrenToRemove.length > 0 ) {
			// remove them from families and social workers
			FamilyMiddleware.removeChildBookmarks( bookmarkedChildrenToRemove );
			SocialWorkerMiddleware.removeChildBookmarks( bookmarkedChildrenToRemove );
		}
		// if any sibling bookmarks need to be removed
		if( bookmarkedSiblingsToRemove.length > 0 ) {
			// remove them from families and social workers
			FamilyMiddleware.removeSiblingBookmarks( bookmarkedSiblingsToRemove );
			SocialWorkerMiddleware.removeSiblingBookmarks( bookmarkedSiblingsToRemove );
		}
	});
};

Child.schema.methods.setChangeHistory = function() {
	'use strict';

	return new Promise( ( resolve, reject ) => {

		const modelBefore	= this._original,
			  model 		= this;

		const ChildHistory = keystone.list( 'Child History' );

		const changeHistory = new ChildHistory.model({
			child			: this,
			date			: Date.now(),
			summary			: '',
			changes			: '',
			modifiedBy		: this.updatedBy
		});

		// if the model is being saved for the first time
		if( !model._original ) {
			// set the summary information for the change history record
			changeHistory.summary = 'record created';
			// set the text for the change history record
			changeHistory.changes = '<p>record created</p>';
			// save the change history record
			changeHistory.save( () => {
				// if the record saved successfully, resolve the promise
				resolve();
			// if there was an error saving the record
			}, err => {
				// log the error for debugging purposes
				console.error( `initial change history record could not be saved for child ${ this.name.full } ( registration number: ${ this.registrationNumber } ) - ${ err }` );
				// reject the promise
				reject();
			});

		} else {
			// Any time a new field is added, it MUST be added to this list in order to be considered for display in change history
			// Computed fields and fields internal to the object SHOULD NOT be added to this list
			async.parallel([

				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'siteVisibility',
												label: 'site visibility',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'isVisibleInGallery',
												label: 'child is visible in the gallery',
												type: 'boolean' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'visibleInGalleryDate',
												label: 'visible in gallery date',
												type: 'date' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'registrationNumber',
												label: 'registration number',
												type: 'number' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'registrationDate',
												label: 'registration date',
												type: 'date' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'name',
												name: 'first',
												label: 'first name',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'name',
												name: 'middle',
												label: 'middle name',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'name',
												name: 'last',
												label: 'last name',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'name',
												name: 'alias',
												label: 'alias',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'name',
												name: 'nickName',
												label: 'nick name',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'birthDate',
												label: 'date of birth',
												type: 'date' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'languages',
												targetField: 'language',
												label: 'languages',
												type: 'relationship',
												model: 'Language' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'statusChangeDate',
												label: 'status change date',
												type: 'date' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'status',
												targetField: 'childStatus',
												label: 'status',
												type: 'relationship',
												model: 'Child Status' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'gender',
												targetField: 'gender',
												label: 'gender',
												type: 'relationship',
												model: 'Gender' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'race',
												targetField: 'race',
												label: 'race',
												type: 'relationship',
												model: 'Race' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'raceNotes',
												label: 'race notes',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'legalStatus',
												targetField: 'legalStatus',
												label: 'legal status',
												type: 'relationship',
												model: 'Legal Status' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'yearEnteredCare',
												label: 'year entered care',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'hasContactWithSiblings',
												label: 'has contact with siblings',
												type: 'boolean' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'siblingTypeOfContact',
												label: 'type of contact with siblings',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'siblings',
												targetParent: 'name',
												targetField: 'full',
												label: 'siblings',
												type: 'relationship',
												model: 'Child' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'mustBePlacedWithSiblings',
												label: 'must be placed with siblings',
												type: 'boolean' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'siblingsToBePlacedWith',
												targetParent: 'name',
												targetField: 'full',
												label: 'siblings to be placed with',
												type: 'relationship',
												model: 'Child' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'hasContactWithBirthFamily',
												label: 'has contact with birth family',
												type: 'boolean' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'birthFamilyTypeOfContact',
												label: 'type of contact with birth family',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'residence',
												targetField: 'residence',
												label: 'where does the child presently live?',
												type: 'relationship',
												model: 'Residence' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'city',
												targetField: 'cityOrTown',
												label: 'city or town of childs current location',
												type: 'relationship',
												model: 'City or Town' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'isOutsideMassachusetts',
												label: 'is outside Massachusetts',
												type: 'boolean' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'cityText',
												label: 'city or town of childs current location (text field)',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'careFacilityName',
												label: 'care facility name',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'dateMovedToResidence',
												label: 'date moved to residence',
												type: 'date' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'physicalNeeds',
												label: 'physical needs',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'physicalNeedsDescription',
												label: 'physical needs description',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'emotionalNeeds',
												label: 'emotional needs',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'emotionalNeedsDescription',
												label: 'emotional needs description',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'intellectualNeeds',
												label: 'intellectual needs',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'intellectualNeedsDescription',
												label: 'intellectual needs description',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'socialNeeds',
												label: 'social needs',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'socialNeedsDescription',
												label: 'social needs description',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'aspirations',
												label: 'interests, talents, and aspirations',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'schoolLife',
												label: 'school life',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'family life',
												label: 'family life',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'personality',
												label: 'personality',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'otherRecruitmentConsiderations',
												label: 'other recruitment considerations',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'disabilities',
												targetField: 'disability',
												label: 'disabilities',
												type: 'relationship',
												model: 'Disability' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'healthNotesNew',
												label: 'old health notes',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'healthNotesOld',
												label: 'new health notes',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'recommendedFamilyConstellation',
												targetField: 'familyConstellation',
												label: 'recommended family constellation',
												type: 'relationship',
												model: 'Family Constellation' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'otherFamilyConstellationConsideration',
												targetField: 'otherFamilyConstellationConsideration',
												label: 'other family constellation considerations',
												type: 'relationship',
												model: 'Other Family Constellation Consideration' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'otherConsiderations',
												targetField: 'otherConsideration',
												label: 'other considerations',
												type: 'relationship',
												model: 'Other Consideration' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'registeredBy',
												label: 'registered by',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'adoptionWorker',
												targetParent: 'name',
												targetField: 'full',
												label: 'adoption worker',
												type: 'relationship',
												model: 'Social Worker' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'adoptionWorkerAgency',
												targetField: 'name',
												label: `adoption worker's agency`,
												type: 'relationship',
												model: 'Agency' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'adoptionWorkerAgencyRegion',
												targetField: 'region',
												label: `adoption worker's region`,
												type: 'relationship',
												model: 'Region' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'recruitmentWorker',
												targetParent: 'name',
												targetField: 'full',
												label: 'recruitment worker',
												type: 'relationship',
												model: 'Social Worker' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'recruitmentWorkerAgency',
												targetField: 'name',
												label: `recruitment worker's agency`,
												type: 'relationship',
												model: 'Agency' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'recruitmentWorkerAgencyRegion',
												targetField: 'region',
												label: `recruitment worker's region`,
												type: 'relationship',
												model: 'Region' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'profile',
												name: 'quote',
												label: 'personal quote',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'profile',
												name: 'part1',
												label: 'profile 1st paragraph',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'profile',
												name: 'part2',
												label: 'profile 2nd paragraph',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'profile',
												name: 'part3',
												label: 'profile 3rd paragraph',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'groupProfile',
												name: 'quote',
												label: 'group quote',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'groupProfile',
												name: 'part1',
												label: 'group profile 1st paragraph',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'groupProfile',
												name: 'part2',
												label: 'group profile 2nd paragraph',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'groupProfile',
												name: 'part3',
												label: 'group profile 3rd paragraph',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'hasPhotolistingWriteup',
												label: 'has photolisting writup',
												type: 'boolean' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'photolistingWriteupDate',
												label: 'date of photolisting writeup',
												type: 'date' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'hasPhotolistingPhoto',
												label: 'has photolisting page',
												type: 'boolean' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'photolistingPhotoDate',
												label: 'date of photolisting photo',
												type: 'date' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'isCurrentlyInPhotoListing',
												label: 'is currently in the photo listing',
												type: 'boolean' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'dateOfLastPhotoListing',
												label: 'date of last photolisting',
												type: 'date' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'photolistingPageNumber',
												label: 'photolisting page number',
												type: 'number' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'previousPhotolistingPageNumbers',
												label: 'previous photolisting page number',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'image',
												name: 'secure_url',
												label: 'image',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'siblingGroupImage',
												name: 'secure_url',
												label: 'sibling group image',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'extranetUrl',
												label: 'extranet url',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'hasVideoSnapshot',
												label: 'has video snapshot',
												type: 'boolean' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'videoSnapshotDate',
												label: 'date of video snapshop',
												type: 'date' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'video',
												label: 'video',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'siblingGroupVideo',
												label: 'sibling group video',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'onMAREWebsite',
												label: 'on MARE website',
												type: 'boolean' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'onMAREWebsiteDate',
												label: 'date on MARE website',
												type: 'date' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'onAdoptuskids',
												label: 'on adoptuskids',
												type: 'boolean' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'onAdoptuskidsDate',
												label: 'date on adoptuskids',
												type: 'date' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'wednesdaysChild',
												label: 'wednesdays child?',
												type: 'boolean' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'wednesdaysChildDate',
												label: 'date of wednesdays child',
												type: 'date' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'wednesdaysChildVideo',
												label: 'wednesdays child video',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'wednesdaysChildSiblingGroup',
												label: 'wednesdays child for sibling group?',
												type: 'boolean' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'wednesdaysChildSiblingGroupDate',
												label: 'date of sibling groups wednesdays child',
												type: 'date' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'wednesdaysChildSiblingGroupVideo',
												label: 'wednesdays child sibling group video',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'coalitionMeeting',
												label: 'coalition meeting',
												type: 'boolean' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'coalitionMeetingDate',
												label: 'date of coalition meeting',
												type: 'date' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'matchingEvent',
												label: 'matching event',
												type: 'boolean' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'matchingEventDate',
												label: 'date of matching event',
												type: 'date' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'adoptionParties',
												targetField: 'name',
												label: 'adoption parties',
												type: 'relationship',
												model: 'Event' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'mediaEligibility',
												targetField: 'mediaEligibility',
												label: 'media eligibility',
												type: 'relationship',
												model: 'Media Eligibility' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'otherMediaDescription',
												label: 'other media description',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'locationAlert',
												label: 'locationAlert',
												type: 'boolean' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'place',
												label: 'place',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'communicationsCollateral',
												label: 'communications collateral',
												type: 'boolean' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'communicationsCollateralDetails',
												label: 'communications collateral details',
												type: 'string' }, model, modelBefore, changeHistory, done );
				}
			], () => {
				// if there were no updates to the child record
				if ( changeHistory.changes === '' ) {
					// resolve the promise
					resolve();
				// if there were updates to the family record
				} else {
					// save the change history record
					changeHistory.save( () => {
						// if the record saved successfully, resolve the promise
						resolve();
					// if there was an error saving the record
					}, err => {
						// log the error for debugging purposes
						console.error( `change history record could not be saved for child ${ this.name.full } ( registration number: ${ this.registrationNumber } ) - ${ err }` );
						// reject the promise
						reject();
					});
				}
			});
		}
	});
};

// Define default columns in the admin interface and register the model
Child.defaultColumns = 'displayNameAndRegistration, race, status, legalStatus, gender';
Child.register();
