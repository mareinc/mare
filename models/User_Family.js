require( './Tracking_FamilyHistory' );

const keystone					= require( 'keystone' ),
	  async 					= require( 'async' ),
	  Types						= keystone.Field.Types,
	  User						= require( './User' ),
	  ChangeHistoryMiddleware	= require( '../routes/middleware/models_change-history' ),
	  SocialWorkerService		= require( '../routes/middleware/service_social-worker' ),
	  AgencyService				= require( '../routes/middleware/service_agency' ),
	  UserService				= require( '../routes/middleware/service_user' ),
	  FamilyService				= require( '../routes/middleware/service_family' ),
	  ListService				= require( '../routes/middleware/service_lists' ),
	  Validators  				= require( '../routes/middleware/validators' );

// configure the s3 storage adapters
var fileStorage = new keystone.Storage({
	adapter: require( 'keystone-storage-adapter-s3' ),
	s3: {
		key: process.env.S3_KEY, // required; defaults to process.env.S3_KEY
		secret: process.env.S3_SECRET, // required; defaults to process.env.S3_SECRET
		bucket: process.env.S3_BUCKET_NAME, // required; defaults to process.env.S3_BUCKET
		region: process.env.S3_REGION, // optional; defaults to process.env.S3_REGION, or if that's not specified, us-east-1
		path: '/Families/Files',
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

var imageStorage = new keystone.Storage({
	adapter: require( 'keystone-storage-adapter-s3' ),
	s3: {
		key: process.env.S3_KEY, // required; defaults to process.env.S3_KEY
		secret: process.env.S3_SECRET, // required; defaults to process.env.S3_SECRET
		bucket: process.env.S3_BUCKET_NAME, // required; defaults to process.env.S3_BUCKET
		region: process.env.S3_REGION, // optional; defaults to process.env.S3_REGION, or if that's not specified, us-east-1
		path: '/Families/Images',
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

// Export to make it available using require.  The keystone.list import throws a ReferenceError when importing a list that comes later when sorting alphabetically
const ContactGroup = require( './ContactGroup' );

// Create model
var Family = new keystone.List( 'Family', {
	inherits	: User,
	track		: true, // needed for change history updated by assignment
	autokey		: { path: 'key', from: 'registrationNumber', unique: true },
	map			: { name: 'displayNameAndRegistration' },
	defaultSort	: 'displayName',
	searchFields: 'displayNameAndRegistration, contact1.name.full, contact2.name.full',
	hidden		: false
});

// Create fields
Family.add( 'Permissions', {

	isActive: { type: Boolean, label: 'is active' },

	permissions: {
		isVerified: { type: Boolean, label: 'has a verified email address', default: false, noedit: true },
		isHomestudyVerified: { type: Boolean, label: 'homestudy verified', default: false, initial: true },
		homestudyVerifiedDate: { type: Types.Date, label: 'homestudy verified on', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, dependsOn: { 'permissions.isHomestudyVerified': true }, noedit: true },
		canViewAllChildrenOverride: { type: Boolean, label: 'allow family to see all children', note: 'this will allow the family to see at risk children regardless of their homestudy or place of residence', default: false, initial: true },
		canViewAllChildren: { type: Boolean, default: false, hidden: true, noedit: true }
	}

},  'General Information', {

	avatar: {
		type: Types.CloudinaryImage,
		label: 'avatar',
		folder: `${ process.env.CLOUDINARY_DIRECTORY }/users/families`,
		select: true,
		selectPrefix: `${ process.env.CLOUDINARY_DIRECTORY }/users/families`,
		autoCleanup: true,
		whenExists: 'overwrite',
		filenameAsPublicID: true
	},

	registrationNumber: { type: Number, label: 'registration number', format: false, noedit: true },
	initialContact: { type: Types.Date, label: 'initial contact', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, initial: true }, // was required: data migration change ( undo if possible )
	flagCalls: { type: Types.Boolean, label: 'flag calls', default: false, initial: true },
	familyConstellation: { type: Types.Relationship, label: 'family constellation', ref: 'Family Constellation', initial: true },
	language: { type: Types.Relationship, label: 'language', ref: 'Language', initial: true },
	otherLanguages: { type: Types.Relationship, label: 'other languages', ref: 'Language', many: true, initial: true },

	contactGroups: { type: Types.Relationship, label: 'contact groups', ref: 'Contact Group', many: true, initial: true },

	displayName: { type: Types.Text, label: 'name', hidden: true, noedit: true },
    displayNameAndRegistration: { type: Types.Text, label: 'name and registration number', default: 'new family', hidden: true, noedit: true }

}, 'Contact 1', {

	contact1: {

		name: {
			first: { type: Types.Text, label: 'first name', initial: true }, // was required: data migration change ( undo if possible )
			last: { type: Types.Text, label: 'last name', initial: true }, // was required: data migration change ( undo if possible )
			full: { type: Types.Text, label: 'name', hidden: true, noedit: true, initial: false }
		},

		phone: {
			mobile: { type: Types.Text, label: 'mobile phone number', initial: true, validate: Validators.phoneValidator },
			work: { type: Types.Text, label: 'work phone number', initial: true, validate: Validators.phoneValidator }
		},

		email: { type: Types.Email, label: 'email address', initial: true },
		preferredCommunicationMethod: { type: Types.Select, label: 'preferred communication method', options: 'email, home phone, mobile phone, work phone, unknown', initial: true }, // was required: data migration change ( undo if possible )
		gender: { type: Types.Relationship, label: 'gender', ref: 'Gender', initial: true }, // was required: data migration change ( undo if possible )
		race: { type: Types.Relationship, label: 'race', ref: 'Race', many: true, required: true, initial: true }, // was required: data migration change ( undo if possible )
		occupation: { type: Types.Text, label: 'occupation', initial: true },
		birthDate: { type: Types.Date, label: 'date of birth', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', todayButton: false, utc: true, initial: true } // was required: data migration change ( undo if possible )
	}

}, 'Contact 2', {

	contact2: {
		name: {
			first: { type: Types.Text, label: 'first name', initial: true },
			last: { type: Types.Text, label: 'last name', initial: true },
			full: { type: Types.Text, label: 'name', hidden: true, noedit: true }
		},

		phone: {
			mobile: { type: Types.Text, label: 'mobile phone number', initial: true, validate: Validators.phoneValidator },
			work: { type: Types.Text, label: 'work phone number', initial: true, validate: Validators.phoneValidator }
		},

		email: { type: Types.Email, label: 'email address', initial: true },
		preferredCommunicationMethod: { type: Types.Select, label: 'preferred communication method', options: 'email, home phone, mobile phone, work phone, unknown', initial: true },
		gender: { type: Types.Relationship, label: 'gender', ref: 'Gender', initial: true },
		race: { type: Types.Relationship, label: 'race', ref: 'Race', many: true, initial: true },
		occupation: { type: Types.Text, label: 'occupation', initial: true },
		birthDate: { type: Types.Date, label: 'date of birth', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', todayButton: false, default: '', utc: true, initial: true }
	}

}, 'Home Contact Information', {

	address: {
		street1: { type: Types.Text, label: 'street 1', required: true, initial: true },
		street2: { type: Types.Text, label: 'street 2', initial: true },
		isOutsideMassachusetts: { type: Types.Boolean, label: 'is outside Massachusetts', default: false, initial: true },
		city: { type: Types.Relationship, label: 'city', ref: 'City or Town', dependsOn: { 'address.isOutsideMassachusetts': false }, initial: true },
		cityText: { type: Types.Text, label: 'city', dependsOn: { 'address.isOutsideMassachusetts': true }, initial: true },
		displayCity: { type: Types.Text, label: 'city', hidden: true, noedit: true },
		state: { type: Types.Relationship, label: 'state', ref: 'State', initial: true }, // was required: data migration change ( undo if possible )
		zipCode: { type: Types.Text, label: 'zip code', initial: true, validate: Validators.zipValidator }, // was required: data migration change ( undo if possible )
		region: { type: Types.Relationship, label: 'region', ref: 'Region', noedit: true }
	},

	homePhone: { type: Types.Text, label: 'home phone number', initial: true, validate: Validators.phoneValidator }

}, 'Current Children in Family', {

	numberOfChildren: { type: Types.Select, label: 'number of children', options: '0, 1, 2, 3, 4, 5, 6, 7, 8+', initial: true }

}, { heading: 'Child 1', dependsOn: { numberOfChildren: ['1', '2', '3', '4', '5', '6', '7', '8+'] } }, {
	child1: {
		name: { type: Types.Text, label: 'name', dependsOn: { numberOfChildren: ['1', '2', '3', '4', '5', '6', '7', '8+'] }, initial: true },
		birthDate: { type: Types.Date, label: 'date of birth', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', todayButton: false, default: '', utc: true, dependsOn: { numberOfChildren: ['1', '2', '3', '4', '5', '6', '7', '8+'] }, initial: true },
		gender: { type: Types.Relationship, label: 'gender', ref: 'Gender', dependsOn: { numberOfChildren: ['1', '2', '3', '4', '5', '6', '7', '8+'] }, initial: true },
		type: { type: Types.Relationship, label: 'type', ref: 'Child Type', dependsOn: { numberOfChildren: ['1', '2', '3', '4', '5', '6', '7', '8+'] }, initial: true }
	}

}, { heading: 'Child 2', dependsOn: { numberOfChildren: ['2', '3', '4', '5', '6', '7', '8+'] } }, {
	child2: {
		name: { type: Types.Text, label: 'name', dependsOn: { numberOfChildren: ['2', '3', '4', '5', '6', '7', '8+'] }, initial: true },
		birthDate: { type: Types.Date, label: 'date of birth', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', todayButton: false, default: '', utc: true, dependsOn: { numberOfChildren: ['2', '3', '4', '5', '6', '7', '8+'] }, initial: true },
		gender: { type: Types.Relationship, label: 'gender', ref: 'Gender', dependsOn: { numberOfChildren: ['2', '3', '4', '5', '6', '7', '8+'] }, initial: true },
		type: { type: Types.Relationship, label: 'type', ref: 'Child Type', dependsOn: { numberOfChildren: ['2', '3', '4', '5', '6', '7', '8+'] }, initial: true }
	}

}, { heading: 'Child 3', dependsOn: { numberOfChildren: ['3', '4', '5', '6', '7', '8+'] } }, {
	child3: {
		name: { type: Types.Text, label: 'name', dependsOn: { numberOfChildren: ['3', '4', '5', '6', '7', '8+'] }, initial: true },
		birthDate: { type: Types.Date, label: 'date of birth', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', todayButton: false, default: '', utc: true, dependsOn: { numberOfChildren: ['3', '4', '5', '6', '7', '8+'] }, initial: true },
		gender: { type: Types.Relationship, label: 'gender', ref: 'Gender', dependsOn: { numberOfChildren: ['3', '4', '5', '6', '7', '8+'] }, initial: true },
		type: { type: Types.Relationship, label: 'type', ref: 'Child Type', dependsOn: { numberOfChildren: ['3', '4', '5', '6', '7', '8+'] }, initial: true }
	}

}, { heading: 'Child 4', dependsOn: { numberOfChildren: ['4', '5', '6', '7', '8+'] } }, {
	child4: {
		name: { type: Types.Text, label: 'name', dependsOn: { numberOfChildren: ['4', '5', '6', '7', '8+'] }, initial: true },
		birthDate: { type: Types.Date, label: 'date of birth', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', todayButton: false, default: '', utc: true, dependsOn: { numberOfChildren: ['4', '5', '6', '7', '8+'] }, initial: true },
		gender: { type: Types.Relationship, label: 'gender', ref: 'Gender', dependsOn: { numberOfChildren: ['4', '5', '6', '7', '8+'] }, initial: true },
		type: { type: Types.Relationship, label: 'type', ref: 'Child Type', dependsOn: { numberOfChildren: ['4', '5', '6', '7', '8+'] }, initial: true }
	}

}, { heading: 'Child 5', dependsOn: { numberOfChildren: ['5', '6', '7', '8+'] } }, {
	child5: {
		name: { type: Types.Text, label: 'name', dependsOn: { numberOfChildren: ['5', '6', '7', '8+'] }, initial: true },
		birthDate: { type: Types.Date, label: 'date of birth', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', todayButton: false, default: '', utc: true, dependsOn: { numberOfChildren: ['5', '6', '7', '8+'] }, initial: true },
		gender: { type: Types.Relationship, label: 'gender', ref: 'Gender', dependsOn: { numberOfChildren: ['5', '6', '7', '8+'] }, initial: true },
		type: { type: Types.Relationship, label: 'type', ref: 'Child Type', dependsOn: { numberOfChildren: ['5', '6', '7', '8+'] }, initial: true }
	}

}, { heading: 'Child 6', dependsOn: { numberOfChildren: ['6', '7', '8+'] } }, {
	child6: {
		name: { type: Types.Text, label: 'name', dependsOn: { numberOfChildren: ['6', '7', '8+'] }, initial: true },
		birthDate: { type: Types.Date, label: 'date of birth', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', todayButton: false, default: '', utc: true, dependsOn: { numberOfChildren: ['6', '7', '8+'] }, initial: true },
		gender: { type: Types.Relationship, label: 'gender', ref: 'Gender', dependsOn: { numberOfChildren: ['6', '7', '8+'] }, initial: true },
		type: { type: Types.Relationship, label: 'type', ref: 'Child Type', dependsOn: { numberOfChildren: ['6', '7', '8+'] }, initial: true }
	}

}, { heading: 'Child 7', dependsOn: { numberOfChildren: ['7', '8+'] } }, {
	child7: {
		name: { type: Types.Text, label: 'name', dependsOn: { numberOfChildren: ['7', '8+'] }, initial: true },
		birthDate: { type: Types.Date, label: 'date of birth', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', todayButton: false, default: '', utc: true, dependsOn: { numberOfChildren: ['7', '8+'] }, initial: true },
		gender: { type: Types.Relationship, label: 'gender', ref: 'Gender', dependsOn: { numberOfChildren: ['7', '8+'] }, initial: true },
		type: { type: Types.Relationship, label: 'type', ref: 'Child Type', dependsOn: { numberOfChildren: ['7', '8+'] }, initial: true }
	}

}, { heading: 'Child 8', dependsOn: { numberOfChildren: ['8+'] } }, {
	child8: {
		name: { type: Types.Text, label: 'name', dependsOn: { numberOfChildren: ['8+'] }, initial: true },
		birthDate: { type: Types.Date, label: 'date of birth', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', todayButton: false, default: '', utc: true, dependsOn: { numberOfChildren: ['8+'] }, initial: true },
		gender: { type: Types.Relationship, label: 'gender', ref: 'Gender', dependsOn: { numberOfChildren: ['8+'] }, initial: true },
		type: { type: Types.Relationship, label: 'type', ref: 'Child Type', dependsOn: { numberOfChildren: ['8+'] }, initial: true }
	}

}, 'Other Considerations', {

	otherAdultsInHome: {
		number: { type: Types.Number, label: 'number of other adults living in the home', initial: true },
		relationships: { type: Types.Text, label: 'relationship of other adults living in the home', initial: true }
	}

}, 'Stages', {

	stages: {
		gatheringInformation: {
			started: { type: Types.Boolean, label: 'gathering information', default: false, initial: true },
			date: { type: Types.Date, label: 'date gathering information started', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, dependsOn: { 'stages.gatheringInformation.started': true }, initial: true }
		},
		lookingForAgency: {
			started: { type: Types.Boolean, label: 'looking for agency', default: false, initial: true },
			date: { type: Types.Date, label: 'date looking for agency started', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, dependsOn: { 'stages.lookingForAgency.started': true }, initial: true }
		},
		workingWithAgency: {
			started: { type: Types.Boolean, label: 'working with agency', default: false, initial: true },
			date: { type: Types.Date, label: 'date working with agency started', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, dependsOn: { 'stages.workingWithAgency.started': true }, initial: true }
		},
		MAPPTrainingCompleted: {
			completed: { type: Types.Boolean, label: 'MAPP training completed', default: false, initial: true },
			date: { type: Types.Date, label: 'date MAPP training completed', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, dependsOn: { 'stages.MAPPTrainingCompleted.completed': true }, initial: true }
		}
	},

	homestudy: {
		completed: { type: Types.Boolean, label: 'homestudy completed', default: false, initial: true },
		initialDate: { type: Types.Date, label: 'initial date homestudy completed', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, dependsOn: { 'homestudy.completed': true }, initial: true },
		mostRecentDate: { type: Types.Date, label: 'most recent update completed', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, dependsOn: { 'homestudy.completed': true }, initial: true },
		summary: { type: Types.Textarea, label: 'homestudy summary', dependsOn: { 'homestudy.completed': true }, initial: true },

		homestudyFile_upload: {
			label: 'homestudy file',
			dependsOn: { 'homestudy.completed': true },
			type: Types.File,
			storage: fileStorage
		}
	},

	onlineMatching: {
		started: { type: Types.Boolean, label: 'online matching', default: false, initial: true },
		date: { type: Types.Date, label: 'date online matching started', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, dependsOn: { 'onlineMatching.started': true }, initial: true }
	},

	registeredWithMARE: {
		registered: { type: Types.Boolean, label: 'registered with MARE', default: false, initial: true },
		date: { type: Types.Date, label: 'date registered with MARE', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, dependsOn: { 'registeredWithMARE.registered': true }, initial: true },
		status: { type: Types.Relationship, label: 'status', ref: 'Child Status', dependsOn: { 'registeredWithMARE.registered': true }, initial: true }
	},

	familyProfile: {
		created: { type: Types.Boolean, label: 'family profile created', default: false, initial: true },
		date: { type: Types.Date, label: 'date family profile created', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, dependsOn: { 'familyProfile.created': true }, initial: true }
	},

	closed: {
		isClosed: { type: Types.Boolean, label: 'closed', default: false, initial: true },
		date: { type: Types.Date, label: 'date closed', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, dependsOn: { 'closed.isClosed': true }, initial: true },
		reason: { type: Types.Relationship, label: 'reason', ref: 'Closed Reason', dependsOn: { 'closed.isClosed': true }, initial: true }
	}

}, 'Social Worker Information', {

	socialWorker: { type: Types.Relationship, label: 'social worker', ref: 'Social Worker', initial: true },
	socialWorkerNotListed: { type: Types.Boolean, label: 'social worker isn\'t listed', default: false, initial: true },
	socialWorkerText: { type: Types.Text, label: 'social worker', dependsOn: { socialWorkerNotListed: true }, initial: true },
	socialWorkerAgency: { type: Types.Relationship, label: `social worker's agency`, dependsOn: { socialWorkerNotListed: false }, ref: 'Agency', noedit: true },
	socialWorkerAgencyRegion: { type: Types.Relationship, label: `social worker's region`, dependsOn: { socialWorkerNotListed: false }, ref: 'Region', noedit: true }

}, 'Family Services', {

	familyServices: {
		mentee: { type: Types.Boolean, label: 'mentee', default: false, initial: true },
		mentor: { type: Types.Boolean, label: 'mentor', default: false, initial: true },
		mediaSpokesperson: { type: Types.Boolean, label: 'media spokesperson', default: false, initial: true },
		eventPresenterOrSpokesperson: { type: Types.Boolean, label: 'event presenter/spokesperson', default: false, initial: true },
		communityOutreach: { type: Types.Boolean, label: 'community outreach', default: false, initial: true },
		fundraising: { type: Types.Boolean, label: 'fundraising', default: false, initial: true },
		MARESupportGroupLeader: { type: Types.Boolean, label: 'MARE support group leader', default: false, initial: true },
		MARESupportGroupParticipant: { type: Types.Boolean, label: 'MARE support group participant', default: false, initial: true },
		receivesConsultationServices: { type: Types.Boolean, label: 'receives consultation services', default: false, initial: true }
	}

}, 'Info Preferences', {

	infoPacket: {
		packet: { type: Types.Select, options: 'English, Spanish, none', label: 'Packet', initial: true },
		date: { type: Types.Date, label: 'date info packet sent', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, initial: true },
		notes: { type: Types.Textarea, label: 'notes', initial: true }
	}

}, 'Matching Preferences', {

	matchingPreferences: {
		gender: { type: Types.Relationship, label: 'gender', ref: 'Gender', many: true, initial: true },
		legalStatus: { type: Types.Relationship, label: 'legal status', ref: 'Legal Status', many: true, initial: true },

		adoptionAges: {
			from: { type: Types.Number, label: 'from age', initial: true },
			to: { type: Types.Number, label: 'to age', initial: true }
		},

		minNumberOfChildrenToAdopt: { type: Types.Number, label: 'minimum number of children to adopt', initial: true },
		maxNumberOfChildrenToAdopt: { type: Types.Number, label: 'maximum number of children to adopt', initial: true },
		siblingContact: { type: Types.Boolean, label: 'contact with siblings', default: false, initial: true },
		birthFamilyContact: { type: Types.Boolean, label: 'contact with birth parents', default: false, initial: true },

		havePetsInHome: { type: Types.Boolean, label: 'have pets in the home', default: false, initial: true },

		race: { type: Types.Relationship, label: 'race', ref: 'Race', many: true, initial: true },

		maxNeeds: {
			physical: { type: Types.Select, options: 'none, mild, moderate, severe', label: 'maximum physical needs', initial: true },
			intellectual: { type: Types.Select, options: 'none, mild, moderate, severe', label: 'maximum intellectual needs', initial: true },
			emotional: { type: Types.Select, options: 'none, mild, moderate, severe', label: 'maximum emotional needs', initial: true }
		},

		disabilities: { type: Types.Relationship, label: 'disabilities', ref: 'Disability', many: true, initial: true },
		otherConsiderations: { type: Types.Relationship, label: 'other considerations', ref: 'Other Consideration', many: true, initial: true }
	}

}, 'Heard About MARE From', {

	heardAboutMAREFrom: { type: Types.Relationship, label: 'how did you hear about MARE?', ref: 'Way To Hear About MARE', many: true, initial: true },
	heardAboutMAREOther: { type: Types.Text, label: 'other', note: 'only fill out if "other" is selected in the field above', initial: true }

}, 'Registration Details', {

	registeredViaWebsite: { type: Types.Boolean, label: 'registered through the website', default: false, noedit: true }

}, 'User Selections', {

	bookmarkedChildren: { type: Types.Relationship, label: 'bookmarked children', ref: 'Child', many: true, noedit: true },
	bookmarkedSiblings: { type: Types.Relationship, label: 'bookmarked sibling group children', ref: 'Child', many: true, noedit: true }

}, 'File Attachments', {

	fileAttachment1: { type: Types.File, storage: fileStorage, label: 'file attachment 1' },
	fileAttachment2: { type: Types.File, storage: fileStorage, label: 'file attachment 2' },
	fileAttachment3: { type: Types.File, storage: fileStorage, label: 'file attachment 3' },
	fileAttachment4: { type: Types.File, storage: fileStorage, label: 'file attachment 4' },
	fileAttachment5: { type: Types.File, storage: fileStorage, label: 'file attachment 5' }

}, 'Image Attachments', {

	imageAttachment1: { type: Types.File, storage: imageStorage, label: 'image attachment' }

/* Container for data migration fields ( these should be kept until after phase 2 and the old system is phased out completely ) */
}, {
	// system field to store an appropriate file prefix
	oldId: { type: Types.Text, hidden: true }

});

// Set up relationship values to show up at the bottom of the model if any exist
Family.relationship( { ref: 'Inquiry', refPath: 'family', path: 'inquiries', label: 'inquiries' } );
Family.relationship( { ref: 'Match', refPath: 'family', path: 'matches', label: 'matches' } );
Family.relationship( { ref: 'Placement', refPath: 'family', path: 'placements', label: 'placements' } );
Family.relationship( { ref: 'Legalization', refPath: 'family', path: 'legalizations', label: 'legalizations' } );
Family.relationship( { ref: 'Disruption', refPath: 'family', path: 'disruptions', label: 'disruptions' } );
Family.relationship( { ref: 'Event', refPath: 'familyAttendees', path: 'events', label: 'events' } );
Family.relationship( { ref: 'Donation', refPath: 'family', path: 'donations', label: 'donations' } );
Family.relationship( { ref: 'Internal Note', refPath: 'family', path: 'internal-notes', label: 'internal notes' } );
Family.relationship( { ref: 'Family History', refPath: 'family', path: 'family-histories', label: 'change history' } );

// Post Init - used to store all the values before anything is changed
// Family.schema.post( 'init', function() {
// 	'use strict';

// 	this._original = this.toObject();
// });

// // Pre Save
// Family.schema.pre( 'save', function( next ) {
// 	'use strict';
// 	// trim whitespace characters from any type.Text fields
// 	this.trimTextFields();
	// // update the homestudy verified date
	// this.setHomestudyVerifiedDate();
	// // create a full name for each contact based on their first, middle, and last names
	// this.setFullNames();
	// // set the display - a readable combination of contact 1's and contact 2's full name
	// this.setDisplayName();
	// // create an identifying name for file uploads
	// this.setFileName();
	// // all user types that can log in derive from the User model, this allows us to identify users better
	// this.setUserType();

	// // there are two fields containing the city, depending on whether the family is in MA or not.  Save the value to a common field for display
	// const displayCityUpdated = this.setDisplayCity();
	// // attempt to update the no-edit region field
	// const regionUpdated = this.updateRegion();
	// set the noedit fields associated with the social worker's agency

// 	const socialWorkerAgencyFieldsSet = this.setSocialWorkerAgencyFields();
// 	// determine whether the family can view all children or just the publicly visible ones
// 	const galleryViewingPermissionsSet = this.setGalleryViewingPermissions();
// 	// set the registration number for the family
// 	const registrationNumberSet = this.setRegistrationNumber();

// 	Promise.all( [ displayCityUpdated, regionUpdated, socialWorkerAgencyFieldsSet, galleryViewingPermissionsSet, registrationNumberSet ] )
// 		// if there was an error with any of the promises
// 		.catch( err => {
// 			// log it for debugging purposes
// 			console.error( `family ${ this.displayName } ( registration number: ${ this.registrationNumber } ) saved with errors` );
// 		})
// 		// execute the following regardless of whether the promises were resolved or rejected
// 		// TODO: this should be replaced with ES6 Promise.prototype.finally() once it's finalized, assuming we can update to the latest version of Node if we upgrade Keystone
// 		.then( () => {
// 			// create a unique label for each family based on their display names and their registration number
// 			this.setDisplayNameAndRegistrationLabel();

// 			next();
// 		});
// });

// Family.schema.post( 'save', function() {

// 	// we need this id in case the family was created via the website and updatedBy is empty
// 	const websiteBotFetched = UserService.getUserByFullName( 'Website Bot', 'admin' );

// 	// if the bot user was fetched successfully
// 	websiteBotFetched
// 		.then( bot => {
// 			// set the updatedBy field to the bot's _id if the field isn't already set
// 			this.updatedBy = this.updatedBy || bot.get( '_id' );
// 		})
// 		// if there was an error fetching the bot user
// 		.catch( err => {
// 			// log it for debugging purposes
// 			console.error( `Website Bot could not be fetched for family ${ this.displayName } ( registration number: ${ this.registrationNumber } )`, err );
// 		})
// 		// execute the following regardless of whether the promises were resolved or rejected
// 		// TODO: this should be replaced with ES6 Promise.prototype.finally() once it's finalized, assuming we can update to the latest version of Node if we upgrade Keystone
// 		.then( () => {
// 			// process change history
// 			this.setChangeHistory();
// 		});
// });

/* TODO: VERY IMPORTANT:  Need to fix this to provide the link to access the keystone admin panel again */
/* 						  Changing names or reworking this file changed the check in node_modules/keystone/templates/views/signin.jade
/*						  for user.isAdmin on line 14 */
// Provide access to Keystone
Family.schema.virtual( 'canAccessKeystone' ).get( function() {
	'use strict';

	return false;
});

Family.schema.methods.setDisplayName = function() {
	'use strict';
	// if contact 2 has a first name filled out, we can assume they exist
	const contact2Exists = this.contact2.name.first && this.contact2.name.first.length > 0;
	// check to see if both contacts share a last name
	const sameLastName = this.contact1.name.last === this.contact2.name.last;

	// if there's a second contact and they both contacts share a last name
	if( contact2Exists && sameLastName ) {
		// set the name to both first names, then the last name: John Smith + Jane Smith = John and Jane Smith
		this.displayName = `${ this.contact1.name.first } and ${ this.contact2.name.first } ${ this.contact1.name.last }`;
	// if there's a second contact, but the contacts have different last names
	} else if( contact2Exists && !sameLastName ) {
		// set the name to the two names appended: John Smith + Jane Doe = John Smith and Jane Doe
		this.displayName = `${ this.contact1.name.first } ${ this.contact1.name.last } and ${ this.contact2.name.first } ${ this.contact2.name.last }`;
	// if there's no second contact
	} else {
		// set the name to contact 1's full name
		this.displayName = `${ this.contact1.name.first } ${ this.contact1.name.last }`;
	}
};

Family.schema.methods.setDisplayNameAndRegistrationLabel = function() {
	'use strict';

	// if a registration number exists, add it to the displayNameAndRegistration label
	let registrationNumberString = this.registrationNumber ? ` - ${ this.registrationNumber }` : '';

	// combine the display name and registration number  to create a unique label for all Family models
	this.displayNameAndRegistration = `${ this.displayName }${ registrationNumberString }`;
};

/* text fields don't automatically trim(), this is to ensure no leading or trailing whitespace gets saved into url, text, or text area fields */
Family.schema.methods.trimTextFields = function() {

	if( this.get( 'displayName' ) ) {
		this.set( 'displayName', this.get( 'displayName' ).trim() );
	}

	if( this.get( 'displayNameAndRegistration' ) ) {
		this.set( 'displayNameAndRegistration', this.get( 'displayNameAndRegistration' ).trim() );
	}

	if( this.get( 'contact1.name.first' ) ) {
		this.set( 'contact1.name.first', this.get( 'contact1.name.first' ).trim() );
	}

	if( this.get( 'contact1.name.last' ) ) {
		this.set( 'contact1.name.last', this.get( 'contact1.name.last' ).trim() );
	}

	if( this.get( 'contact1.name.full' ) ) {
		this.set( 'contact1.name.full', this.get( 'contact1.name.full' ).trim() );
	}

	if( this.get( 'contact1.phone.mobile' ) ) {
		this.set( 'contact1.phone.mobile', this.get( 'contact1.phone.mobile' ).trim() );
	}

	if( this.get( 'contact1.phone.work' ) ) {
		this.set( 'contact1.phone.work', this.get( 'contact1.phone.work' ).trim() );
	}

	if( this.get( 'contact1.email' ) ) {
		this.set( 'contact1.email', this.get( 'contact1.email' ).trim() );
	}

	if( this.get( 'contact1.occupation' ) ) {
		this.set( 'contact1.occupation', this.get( 'contact1.occupation' ).trim() );
	}

	if( this.get( 'contact2.name.first' ) ) {
		this.set( 'contact2.name.first', this.get( 'contact2.name.first' ).trim() );
	}

	if( this.get( 'contact2.name.last' ) ) {
		this.set( 'contact2.name.last', this.get( 'contact2.name.last' ).trim() );
	}

	if( this.get( 'contact2.name.full' ) ) {
		this.set( 'contact2.name.full', this.get( 'contact2.name.full' ).trim() );
	}

	if( this.get( 'contact2.phone.mobile' ) ) {
		this.set( 'contact2.phone.mobile', this.get( 'contact2.phone.mobile' ).trim() );
	}

	if( this.get( 'contact2.phone.work' ) ) {
		this.set( 'contact2.phone.work', this.get( 'contact2.phone.work' ).trim() );
	}

	if( this.get( 'contact2.email' ) ) {
		this.set( 'contact2.email', this.get( 'contact2.email' ).trim() );
	}

	if( this.get( 'contact2.occupation' ) ) {
		this.set( 'contact2.occupation', this.get( 'contact2.occupation' ).trim() );
	}

	if( this.get( 'address.street1' ) ) {
		this.set( 'address.street1', this.get( 'address.street1' ).trim() );
	}

	if( this.get( 'address.street2' ) ) {
		this.set( 'address.street2', this.get( 'address.street2' ).trim() );
	}

	if( this.get( 'address.cityText' ) ) {
		this.set( 'address.cityText', this.get( 'address.cityText' ).trim() );
	}

	if( this.get( 'address.displayCity' ) ) {
		this.set( 'address.displayCity', this.get( 'address.displayCity' ).trim() );
	}

	if( this.get( 'address.zipCode' ) ) {
		this.set( 'address.zipCode', this.get( 'address.zipCode' ).trim() );
	}

	if( this.get( 'homePhone' ) ) {
		this.set( 'homePhone', this.get( 'homePhone' ).trim() );
	}

	if( this.get( 'child1.name' ) ) {
		this.set( 'child1.name', this.get( 'child1.name' ).trim() );
	}

	if( this.get( 'child2.name' ) ) {
		this.set( 'child2.name', this.get( 'child2.name' ).trim() );
	}

	if( this.get( 'child3.name' ) ) {
		this.set( 'child3.name', this.get( 'child3.name' ).trim() );
	}

	if( this.get( 'child4.name' ) ) {
		this.set( 'child4.name', this.get( 'child4.name' ).trim() );
	}

	if( this.get( 'child5.name' ) ) {
		this.set( 'child5.name', this.get( 'child5.name' ).trim() );
	}

	if( this.get( 'child6.name' ) ) {
		this.set( 'child6.name', this.get( 'child6.name' ).trim() );
	}

	if( this.get( 'child7.name' ) ) {
		this.set( 'child7.name', this.get( 'child7.name' ).trim() );
	}

	if( this.get( 'child8.name' ) ) {
		this.set( 'child8.name', this.get( 'child8.name' ).trim() );
	}

	if( this.get( 'otherAdultsInHome.relationships' ) ) {
		this.set( 'otherAdultsInHome.relationships', this.get( 'otherAdultsInHome.relationships' ).trim() );
	}

	if( this.get( 'homestudy.summary' ) ) {
		this.set( 'homestudy.summary', this.get( 'homestudy.summary' ).trim() );
	}

	if( this.get( 'socialWorkerText' ) ) {
		this.set( 'socialWorkerText', this.get( 'socialWorkerText' ).trim() );
	}

	if( this.get( 'infoPacket.notes' ) ) {
		this.set( 'infoPacket.notes', this.get( 'infoPacket.notes' ).trim() );
	}

	if( this.get( 'heardAboutMAREOther' ) ) {
		this.set( 'heardAboutMAREOther', this.get( 'heardAboutMAREOther' ).trim() );
	}
};

Family.schema.methods.setHomestudyVerifiedDate = function() {
	'use strict';

	// if the isHomestudyVerified checkbox isn't checked
	if( !this.permissions.isHomestudyVerified ) {
		// clear the date
		this.permissions.homestudyVerifiedDate = undefined;
	// if the isHomestudyVerified checkbox wasn't checked, but is now
	} else if( ( this._original && !this._original.permissions.isHomestudyVerified ) && this.permissions.isHomestudyVerified ) {
		// update the date
		this.permissions.homestudyVerifiedDate = new Date();
	}
};

/* TODO: a lot of the checks in the else if don't need ot be there, clean this up
		 the whole thing could probably be `${ this.contact2.name.first } ${ this.contact2.name.last }`*/
// TODO: better handled with a virtual ( unless we can't key off it in Relationship dropdowns in other models )
Family.schema.methods.setFullNames = function() {
	'use strict';

	this.contact1.name.full = `${ this.contact1.name.first } ${ this.contact1.name.last }`;

	// if both the first and last names are set for the second contact, set the full name to 'first last'
	if( this.contact2.name.first && this.contact2.name.first.length > 0 && this.contact2.name.last && this.contact2.name.last.length > 0 ) {
		this.contact2.name.full = `${ this.contact2.name.first } ${ this.contact2.name.last }`;
	// if only the first name is set, set the full name to the first name
	} else if( this.contact2.name.first && this.contact2.name.first.length > 0 && ( !this.contact2.name.last || !this.contact2.name.last.length > 0 ) ) {
		this.contact2.name.full = this.contact2.name.first;
	// if only the last name is set, set the full name to the last name
	} else if(( !this.contact2.name.first || !this.contact2.name.first.length > 0 ) && this.contact2.name.last && this.contact2.name.last.length > 0 ) {
		this.contact2.name.full = this.contact2.name.last;
	// if neither the first nor the last name have been entered, set the full name to an empty string
	} else {
		this.contact2.name.full = '';
	}
};
// TODO: better handled with a virtual
Family.schema.methods.setDisplayCity = function() {
	'use strict';

	return new Promise( ( resolve, reject ) => {
		// if the family lives outside Massachusetts
		if( this.address.isOutsideMassachusetts ) {
			// set the display city text to the free text field cityText
			this.address.displayCity = this.address.cityText;
			// resolve the promise
			resolve();
		// if the family lives in Massachusetts
		} else {
			// the city is a Relationship field, fetch it and return the name
			const fetchCityOrTown = ListService.getCityOrTownById( this.address.city );
			// if the city or town was fetched without error
			fetchCityOrTown
				.then( cityOrTown => {
					// set the display city text to the value returned
					this.address.displayCity = cityOrTown.cityOrTown;
					// resolve the promise
					resolve();
				})
				// if there was an error fetching the city or town
				.catch( err => {
					// log the error for debugging purposes
					console.error( `display city could not be updated for family ${ this.displayName } ( registration number: ${ this.registrationNumber } )`, err );
					// resolve the promise so that the Promise.all() in the pre-save hook does not fail
					resolve();
				});
		}
	});
}
// TODO: better handled with a virtual
Family.schema.methods.setFileName = function() {
	'use strict';

	// Create an identifying name for file uploads
	this.fileName = this.contact1.name.first ?
					`${ this.registrationNumber }_${ this.contact1.name.first.toLowerCase() }` :
					`${ this.registrationNumber }_`;
};
// TODO: better handled with a virtual
Family.schema.methods.setUserType = function() {
	'use strict'

	// set the userType for role based page rendering
	this.userType = 'family';
};

Family.schema.methods.updateRegion = function() {
	'use strict';

	return new Promise( ( resolve, reject ) => {
		// if the agency is outside MA
		if( this.address.isOutsideMassachusetts ) {
			// fetch the region model with the name 'out of state'
			const fetchRegion = ListService.getRegionByName( 'Out of state' );
			// if the region was fetched without error
			fetchRegion
				.then( region => {
					// update the region field for the agency
					this.address.region = region;
					// resolve the promise
					resolve();
				})
				// if there was an error fetching the region
				.catch( err => {
					// log the error for debugging purposes
					console.error( `region could not be updated for family ${ this.displayName } ( registration number: ${ this.registrationNumber } )`, err );
					// resolve the promise so that the Promise.all() in the pre-save hook does not fail
					resolve();
				});
		// otherwise, if the agency is in MA
		} else {
			// fetch the city or town model saved for the agency
			const fetchCityOrTown = ListService.getCityOrTownById( this.address.city );
			// if the city or town was fetched without error
			fetchCityOrTown
				.then( cityOrTown => {
					// update the region field for the agency
					this.address.region = cityOrTown.region;
					// resolve the promise
					resolve();
				})
				// if there was an error fetching the city or town
				.catch( err => {
					// log the error for debugging purposes
					console.error( `region could not be updated for family ${ this.displayName } ( registration number: ${ this.registrationNumber } )`, err );
					// resolve the promise so that the Promise.all() in the pre-save hook does not fail
					resolve();
				});
		}
	});
};

Family.schema.methods.setSocialWorkerAgencyFields = function() {

	return new Promise( ( resolve, reject ) => {

		if( !this.socialWorker ) {
			return resolve();
		}

		const fetchSocialwWorker = SocialWorkerService.getSocialWorkerById( this.socialWorker );

		// if the social worker was fetched successfully
		fetchSocialwWorker
			.then( socialWorker => {
				// attempt to find the social worker's agency
				return AgencyService.getAgencyById( socialWorker.agency );
			})
			// if the social worker's agency was found successfully
			.then( agency => {
				// set the social worker agency for the child
				this.socialWorkerAgency = agency.get( '_id' );
				// set the social worker agency region for the child
				this.socialWorkerAgencyRegion = agency.address.region;
				// resolve the promise
				resolve();
			})
			// if any of the promises were rejected
			.catch( err => {
				// log the error for debugging purposes
				console.error( `error saving the family's social worker agency fields`, err );
				// clear out the social worker agency fields
				this.socialWorkerAgency = undefined;
				this.socialWorkerAgencyRegion = undefined;
				// resolve the promise so that the Promise.all() in the pre-save hook does not fail
				resolve();
			});
	});
};

Family.schema.methods.setGalleryViewingPermissions = function() {
	'use strict';

	return new Promise( ( resolve, reject ) => {
		// if the user can view all children override checkbox is checked
		if( this.permissions.canViewAllChildrenOverride ) {
			// disregard all other checks and all the user to view all children in the gallery
			this.permissions.canViewAllChildren = true;
			// resolve the promise and prevent further execution in this function
			return resolve();
		}
		// fetch the state model saved for the agency
		const fetchState = ListService.getStateById( this.address.state );
		// if the state was fetched without error
		fetchState
			.then( state => {
				// if the family has a verified homestudy and lives in a New England state
				if( state && this.permissions.isHomestudyVerified && [ 'MA', 'NH', 'CT', 'ME', 'VT', 'RI', 'NY' ].includes( state.abbreviation ) ) {
					// allow them to view all children in the gallery
					this.permissions.canViewAllChildren = true;
				// otherwise
				} else {
					// allow them to view only unrestricted children in the gallery
					this.permissions.canViewAllChildren = false;
				}
				// resolve the promise
				resolve();
			})
			// if there was an error fetching the state
			.catch( err => {
				// allow them to view only unrestricted children in the gallery
				this.permissions.canViewAllChildren = false;
				// log the error for debugging purposes
				console.error( `gallery viewing permissions restricted by default for family ${ this.displayName } ( registration number: ${ this.registrationNumber } )`, err );
				// resolve the promise so that the Promise.all() in the pre-save hook does not fail
				resolve();
			});
	});
};

Family.schema.methods.setRegistrationNumber = function() {

	return new Promise( ( resolve, reject ) => {
		// If the registration number is already set ( which will happen during the data migration as well as saving existing families )
		if( this.registrationNumber ) {
			// ignore setting it and resolve the promise
			resolve();
		// if the registration number has not been set before
		} else {
			// get the maximum registration number across all families
			// TODO: combine this with Child service getMaxRegistrationNumber
			const fetchMaxRegistrationNumber = FamilyService.getMaxRegistrationNumber();
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
					console.error( `registration number could not be updated for family ${ this.displayName } ( registration number: ${ this.registrationNumber } )`, err );
					// resolve the promise so that the Promise.all() in the pre-save hook does not fail
					resolve();
				});
		}
	});
};

Family.schema.methods.setChangeHistory = function setChangeHistory() {
	'use strict';

	return new Promise( ( resolve, reject ) => {
		// TODO: terrible use and reuse of variables below, check this and other models with change history
		const modelBefore	= this._original,
			  model			= this;

		const FamilyHistory = keystone.list( 'Family History' );

		const changeHistory = new FamilyHistory.model({
			family		: this,
			date		: Date.now(),
			summary		: '',
			changes		: '',
			modifiedBy	: this.updatedBy
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
				console.error( `initial change history record could not be saved for family ${ this.displayName } ( registration number: ${ this.registrationNumber } )`, err );
				// reject the promise
				reject();
			});
		// if the model isn't being saved for the first time
		} else {
			// Any time a new field is added, it MUST be added to this list in order to be considered for display in change history
			// Computed fields and fields internal to the object SHOULD NOT be added to this list
			async.parallel([
				// TODO: check avatar field
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'email',
												label: 'email address',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'isActive',
												label: 'is active',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'permissions',
												name: 'isVerified',
												label: 'is verified',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'permissions',
												name: 'isHomestudyVerified',
												label: 'is homestudy verified',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'permissions',
												name: 'homestudyVerifiedDate',
												label: 'homestudy verified date',
												type: 'date' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'permissions',
												name: 'canViewAllChildren',
												label: 'can view all children',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'avatar',
												name: 'secure_url',
												label: 'avatar',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'registrationNumber',
												label: 'registration number',
												type: 'number' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'initialContact',
												label: 'initial contact',
												type: 'date' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'flagCalls',
												label: 'flag calls',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'familyConstellation',
												targetField: 'familyConstellation',
												label: 'family constellation',
												type: 'relationship',
												model: 'Family Constellation' }, model, modelBefore, changeHistory, done);
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
												name: 'otherLanguages',
												targetField: 'language',
												label: 'other languages',
												type: 'relationship',
												model: 'Language' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'contactGroups',
												targetField: 'name',
												label: 'contact groups',
												type: 'relationship',
												model: 'Contact Group' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												grandparent: 'contact1',
												parent: 'name',
												name: 'first',
												label: 'contact 1 - first name',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												grandparent: 'contact1',
												parent: 'name',
												name: 'last',
												label: 'contact 1 - last name',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												grandparent: 'contact1',
												parent: 'phone',
												name: 'work',
												label: 'contact 1 - work phone number',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												grandparent: 'contact1',
												parent: 'phone',
												name: 'mobile',
												label: 'contact 1 - mobile phone number',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'contact1',
												name: 'email',
												label: 'contact 1 - email address',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'contact1',
												name: 'preferredCommunicationMethod',
												label: 'contact 1 - preferred communication method',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'contact1',
												name: 'gender',
												targetField: 'gender',
												label: 'contact 1 - gender',
												type: 'relationship',
												model: 'Gender' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'contact1',
												name: 'race',
												targetField: 'race',
												label: 'contact 1 - race',
												type: 'relationship',
												model: 'Race' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'contact1',
												name: 'occupation',
												label: 'contact 1 - occupation',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'contact1',
												name: 'birthDate',
												label: 'contact 1 - date of birth',
												type: 'date' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												grandparent: 'contact2',
												parent: 'name',
												name: 'first',
												label: 'contact 2 - first name',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												grandparent: 'contact2',
												parent: 'name',
												name: 'last',
												label: 'contact 2 - last name',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												grandparent: 'contact2',
												parent: 'phone',
												name: 'work',
												label: 'contact 2 - work phone number',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												grandparent: 'contact2',
												parent: 'phone',
												name: 'mobile',
												label: 'contact 2 - mobile phone number',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'contact2',
												name: 'email',
												label: 'contact 2 - email address',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'contact2',
												name: 'preferredCommunicationMethod',
												label: 'contact 2 - preferred communication method',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'contact2',
												name: 'gender',
												targetField: 'gender',
												label: 'contact 2 - gender',
												type: 'relationship',
												model: 'Gender' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'contact2',
												name: 'race',
												targetField: 'race',
												label: 'contact 2 - race',
												type: 'relationship',
												model: 'Race' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'contact2',
												name: 'occupation',
												label: 'contact 2 - occupation',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'contact2',
												name: 'birthDate',
												label: 'contact 2 - date of birth',
												type: 'date' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'address',
												name: 'street1',
												label: 'street 1',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'address',
												name: 'street2',
												label: 'street 2',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'address',
												name: 'city',
												targetField: 'cityOrTown',
												label: 'city',
												type: 'relationship',
												model: 'City or Town' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'address',
												name: 'isOutsideMassachusetts',
												label: 'is outside Massachusetts',
												type: 'boolean' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'address',
												name: 'cityText',
												label: 'city (text field)',
												type: 'string' }, model, modelBefore, changeHistory, done );
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'address',
												name: 'state',
												targetField: 'state',
												label: 'state',
												type: 'relationship',
												model: 'State' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'address',
												name: 'zipCode',
												label: 'zip code',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'address',
												name: 'region',
												targetField: 'region',
												label: 'region',
												type: 'relationship',
												model: 'Region' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'homePhone',
												label: 'home phone number',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'numberOfChildren',
												label: 'number of children',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child1',
												name: 'name',
												label: 'child 1 - name',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child1',
												name: 'birthDate',
												label: 'child 1 - date of birth',
												type: 'date' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child1',
												name: 'gender',
												targetField: 'gender',
												label: 'child 1 - gender',
												type: 'relationship',
												model: 'Gender' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child1',
												name: 'type',
												targetField: 'childType',
												label: 'child 1 - type',
												type: 'relationship',
												model: 'Child Type' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child2',
												name: 'name',
												label: 'child 2 - name',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child2',
												name: 'birthDate',
												label: 'child 2 - date of birth',
												type: 'date' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child2',
												name: 'gender',
												targetField: 'gender',
												label: 'child 2 - gender',
												type: 'relationship',
												model: 'Gender' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child2',
												name: 'type',
												targetField: 'childType',
												label: 'child 2 - type',
												type: 'relationship',
												model: 'Child Type' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child3',
												name: 'name',
												label: 'child 3 - name',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child3',
												name: 'birthDate',
												label: 'child 3 - date of birth',
												type: 'date' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child3',
												name: 'gender',
												targetField: 'gender',
												label: 'child 3 - gender',
												type: 'relationship',
												model: 'Gender' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child3',
												name: 'type',
												targetField: 'childType',
												label: 'child 3 - type',
												type: 'relationship',
												model: 'Child Type' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child4',
												name: 'name',
												label: 'child 4 - name',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child4',
												name: 'birthDate',
												label: 'child 4 - date of birth',
												type: 'date' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child4',
												name: 'gender',
												targetField: 'gender',
												label: 'child 4 - gender',
												type: 'relationship',
												model: 'Gender' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child4',
												name: 'type',
												targetField: 'childType',
												label: 'child 4 - type',
												type: 'relationship',
												model: 'Child Type' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child5',
												name: 'name',
												label: 'child 5 - name',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child5',
												name: 'birthDate',
												label: 'child 5 - date of birth',
												type: 'date' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child5',
												name: 'gender',
												targetField: 'gender',
												label: 'child 5 - gender',
												type: 'relationship',
												model: 'Gender' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child5',
												name: 'type',
												targetField: 'childType',
												label: 'child 5 - type',
												type: 'relationship',
												model: 'Child Type' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child6',
												name: 'name',
												label: 'child 6 - name',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child6',
												name: 'birthDate',
												label: 'child 6 - date of birth',
												type: 'date' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child6',
												name: 'gender',
												targetField: 'gender',
												label: 'child 6 - gender',
												type: 'relationship',
												model: 'Gender' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child6',
												name: 'type',
												targetField: 'childType',
												label: 'child 6 - type',
												type: 'relationship',
												model: 'Child Type' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child7',
												name: 'name',
												label: 'child 7 - name',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child7',
												name: 'birthDate',
												label: 'child 7 - date of birth',
												type: 'date' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child7',
												name: 'gender',
												targetField: 'gender',
												label: 'child 7 - gender',
												type: 'relationship',
												model: 'Gender' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child7',
												name: 'type',
												targetField: 'childType',
												label: 'child 7 - type',
												type: 'relationship',
												model: 'Child Type' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child8',
												name: 'name',
												label: 'child 8 - name',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child8',
												name: 'birthDate',
												label: 'child 8 - date of birth',
												type: 'date' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child8',
												name: 'gender',
												targetField: 'gender',
												label: 'child 8 - gender',
												type: 'relationship',
												model: 'Gender' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'child8',
												name: 'type',
												targetField: 'childType',
												label: 'child 8 - type',
												type: 'relationship',
												model: 'Child Type' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'otherAdultsInHome',
												name: 'number',
												label: 'number of other adults living in the home',
												type: 'number' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'otherAdultsInHome',
												name: 'relationships',
												label: 'relationships of other adults living in the home',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'matchingPreferences',
												name: 'havePetsInHome',
												label: 'have pets in the home',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												grandparent: 'stages',
												parent: 'gatheringInformation',
												name: 'started',
												label: 'gathering information',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												grandparent: 'stages',
												parent: 'gatheringInformation',
												name: 'date',
												label: 'date gathering information started',
												type: 'date' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												grandparent: 'stages',
												parent: 'lookingForAgency',
												name: 'started',
												label: 'looking for agency',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												grandparent: 'stages',
												parent: 'lookingForAgency',
												name: 'date',
												label: 'date looking for agency started',
												type: 'date' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												grandparent: 'stages',
												parent: 'workingWithAgency',
												name: 'started',
												label: 'working with agency',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												grandparent: 'stages',
												parent: 'workingWithAgency',
												name: 'date',
												label: 'date working with agency started',
												type: 'date' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												grandparent: 'stages',
												parent: 'MAPPTrainingCompleted',
												name: 'completed',
												label: 'MAPP training completed',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												grandparent: 'stages',
												parent: 'MAPPTrainingCompleted',
												name: 'date',
												label: 'date MAPP training completed',
												type: 'date' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'homestudy',
												name: 'completed',
												label: 'homestudy completed',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'homestudy',
												name: 'initialDate',
												label: 'initial date homestudy completed',
												type: 'date' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'homestudy',
												name: 'mostRecentDate',
												label: 'most recent homestudy update completed',
												type: 'date' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'homestudy',
												name: 'summary',
												label: 'homestudy summary',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
					// TODO: NEED TO ADD TRACKING FOR THE FILE PATH CHANGING.
					// TODO: FIX WHEN FILE UPLOAD IS FIXED.
					// homestudyFile_upload: {
					// 	label: 'homestudy file',
					// 	dependsOn: { 'homestudy.completed': true },
					// 	type: Types.File,
					//  storage: storage,
					// 	path: '/family/homestudy',
					// 	filename: function(item, filename){
					// 		// prefix file name with registration number and name for easier identification
					// 		return item.fileName;
					// 	}
					// }

				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'onlineMatching',
												name: 'started',
												label: 'online matching',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'onlineMatching',
												name: 'date',
												label: 'date online matching started',
												type: 'date' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'registeredWithMARE',
												name: 'registered',
												label: 'registered with MARE',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'registeredWithMARE',
												name: 'date',
												label: 'date registered with MARE',
												type: 'date' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'registeredWithMARE',
												name: 'status',
												targetField: 'childStatus',
												label: 'status',
												type: 'relationship',
												model: 'Child Status' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'familyProfile',
												name: 'created',
												label: 'family profile created',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'familyProfile',
												name: 'date',
												label: 'date family profile created',
												type: 'date' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'closed',
												name: 'isClosed',
												label: 'closed',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'closed',
												name: 'date',
												label: 'date closed',
												type: 'date' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'closed',
												name: 'reason',
												targetField: 'reason',
												label: 'closed reason',
												type: 'relationship',
												model: 'Closed Reason' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'socialWorker',
												targetParent: 'name',
												targetField: 'full',
												label: 'social worker',
												type: 'relationship',
												model: 'Social Worker' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'socialWorkerNotListed',
												label: 'social worker isnt listed',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'socialWorkerText',
												label: 'social worker (text field)',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'familyServices',
												name: 'mentee',
												label: 'mentee',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'familyServices',
												name: 'mentor',
												label: 'mentor',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'familyServices',
												name: 'mediaSpokesperson',
												label: 'media spokesperson',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'familyServices',
												name: 'eventPresenterOrSpokesperson',
												label: 'event presenter/spokesperson',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'familyServices',
												name: 'communityOutreach',
												label: 'community outreach',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'familyServices',
												name: 'fundraising',
												label: 'fundraising',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'familyServices',
												name: 'MARESupportGroupLeader',
												label: 'MARE support group leader',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'familyServices',
												name: 'MARESupportGroupParticipant',
												label: 'MARE support group participant',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'familyServices',
												name: 'receivesConsultationServices',
												label: 'receives consultation services',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'infoPacket',
												name: 'packet',
												label: 'info packet language',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'infoPacket',
												name: 'date',
												label: 'date info packet sent',
												type: 'date' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'infoPacket',
												name: 'notes',
												label: 'info packet notes',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'matchingPreferences',
												name: 'gender',
												targetField: 'gender',
												label: 'matching preference - gender',
												type: 'relationship',
												model: 'Gender' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'matchingPreferences',
												name: 'legalStatus',
												targetField: 'legalStatus',
												label: 'matching preference - legal status',
												type: 'relationship',
												model: 'Legal Status' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												grandparent: 'matchingPreferences',
												parent: 'adoptionAges',
												name: 'from',
												label: 'matching preference - adoption age from',
												type: 'number' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												grandparent: 'matchingPreferences',
												parent: 'adoptionAges',
												name: 'to',
												label: 'matching preference - adoption age to',
												type: 'number' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'matchingPreferences',
												name: 'minNumberOfChildrenToAdopt',
												label: 'matching preference - minimum number of children to adopt',
												type: 'number' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'matchingPreferences',
												name: 'maxNumberOfChildrenToAdopt',
												label: 'matching preference - maximum number of children to adopt',
												type: 'number' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'matchingPreferences',
												name: 'siblingContact',
												label: 'matching preference - contact with siblings',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'matchingPreferences',
												name: 'birthFamilyContact',
												label: 'matching preference - contact with birth parents',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'matchingPreferences',
												name: 'race',
												targetField: 'race',
												label: 'matching preference - race',
												type: 'relationship',
												model: 'Race' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												grandparent: 'matchingPreferences',
												parent: 'maxNeeds',
												name: 'physical',
												label: 'matching preference - maximum physical needs',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												grandparent: 'matchingPreferences',
												parent: 'maxNeeds',
												name: 'intellectual',
												label: 'matching preference - maximum intellectual needs',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												grandparent: 'matchingPreferences',
												parent: 'maxNeeds',
												name: 'emotional',
												label: 'matching preference - maximum emotional needs',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'matchingPreferences',
												name: 'disabilities',
												targetField: 'disability',
												label: 'matching preference - disabilities',
												type: 'relationship',
												model: 'Disability' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												parent: 'matchingPreferences',
												name: 'otherConsiderations',
												targetField: 'otherConsideration',
												label: 'matching preference - other considerations',
												type: 'relationship',
												model: 'Other Consideration' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'heardAboutMAREFrom',
												targetField: 'wayToHearAboutMARE',
												label: 'how did you hear about MARE',
												type: 'relationship',
												model: 'Way To Hear About MARE' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'heardAboutMAREOther',
												label: 'heard about mare from (other)',
												type: 'string' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'registeredViaWebsite',
												label: 'registered through the website',
												type: 'boolean' }, model, modelBefore, changeHistory, done);
				},
				// fileName: { type: Types.Text, hidden: true }
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'bookmarkedChildren',
												targetParent: 'name',
												targetField: 'full',
												label: 'bookmarked children',
												type: 'relationship',
												model: 'Child' }, model, modelBefore, changeHistory, done);
				},
				done => {
					ChangeHistoryMiddleware.checkFieldForChanges({
												name: 'bookmarkedSiblings',
												targetParent: 'name',
												targetField: 'full',
												label: 'bookmarked sibling group children',
												type: 'relationship',
												model: 'Child' }, model, modelBefore, changeHistory, done);
				}
			], () => {
				// if there were no updates to the family record
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
						console.error( `change history record could not be saved for family ${ this.displayName } ( registration number: ${ this.registrationNumber } )`, err );
						// reject the promise
						reject();
					});
				}
			});
		}
	});
};

// Define default columns in the admin interface and register the model
Family.defaultColumns = 'displayNameAndRegistration, address.displayCity, address.state, isActive';
Family.register();

// Export to make it available using require.  The keystone.list import throws a ReferenceError when importing a list
// that comes later when sorting alphabetically
exports = module.exports = Family;
