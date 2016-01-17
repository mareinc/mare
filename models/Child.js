var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model
var Child = new keystone.List('Child', {
	track: true,
	autokey: { path: 'key', from: 'registrationNumber', unique: true },
	map: { name: 'name.full' },
	defaultSort: 'name.full'
});

// Create fields
Child.add({ heading: 'Child Information' }, {
	registrationNumber: { type: Number, label: 'Registration Number', format: false, required: true, index: true, initial: true },
	registrationDate: { type: Types.Text, label: 'Registration Date', note: 'mm/dd/yyyy', required: true, initial: true },

	video: { type: Types.Url, label: 'Video', initial: true },

	name: {
		first: { type: Types.Text, label: 'First Name', required: true, index: true, initial: true },
		middle: { type: Types.Text, label: 'Middle Name', initial: true },
		last: { type: Types.Text, label: 'Last Name', required: true, index: true, initial: true },
		alias: { type: Types.Text, label: 'Alias', initial: true },
		nickName: { type: Types.Text, label: 'Nickname', initial: true },
		full: { type: Types.Text, label: 'Name', hidden: true, noedit: true },
		identifying: { type: Types.Text, label: 'Name', hidden: true }
	},

	birthDate: { type: Types.Text, label: 'Date of Birth', note: 'mm/dd/yyyy', required: true, initial: true },
	language: { type: Types.Relationship, label: 'Language', ref: 'Language', many: true, required: true, initial: true },
	statusChangeDate: { type: Types.Text, label: 'Status Change Date', note: 'mm/dd/yyyy', initial: true }, // TODO: Logic needed, see line 14 of https://docs.google.com/spreadsheets/d/1Opb9qziX2enTehJx5K1J9KAT7v-j2yAdqwyQUMSsFwc/edit#gid=1235141373
	status: { type: Types.Relationship, label: 'Status', ref: 'Child Status', required: true, index: true, initial: true },
	gender: { type: Types.Relationship, label: 'Gender', ref: 'Gender', required: true, index: true, initial: true },
	race: { type: Types.Relationship, label: 'Race', ref: 'Race', many: true, required: true, index: true, initial: true },
	legalStatus: { type: Types.Relationship, label: 'Legal Status', ref: 'Legal Status', required: true, index: true, initial: true },

	hasContactWithSiblings: { type: Types.Boolean, label: 'Has contact with siblings?', index: true, initial: true },
	siblingTypeOfContact: { type: Types.Text, label: 'Type of contact', initial: true },
	siblingContacts: { type: Types.Relationship, label: 'Siblings to be placed together (comma separated)', ref: 'Child', many: true, initial: true },
	hasContactWithBirthFamily: { type: Types.Boolean, label: 'Has contact with birth family?', initial: true },
	birthFamilyTypeOfContact: { type: Types.Text, label: 'Type of contact', initial: true },

	residence: { type: Types.Relationship, label: 'Where does the child presently live?', ref: 'Residence', initial: true },
	city: { type: Types.Relationship, label: 'City/town of child\'s current location', ref: 'City or Town', initial: true },
	careFacilityName: { type: Types.Text, label: 'Name of Residential/Group care facility', initial: true },
	dateMovedToResidence: { type: Types.Text, label: 'Date of Birth', note: 'mm/dd/yyyy', required: true, initial: true }

}, { heading: 'Special Needs' }, {

	physicalNeeds: { type: Types.Select, label: 'Physical needs', options: 'None, Mild, Moderate, Severe', required: true, initial: true },
	// physicalNeedsDescription: { type: Types.Textarea, label: 'Description of physical needs', dependsOn: { physicalNeeds: ['Mild', 'Moderate', 'Severe'] }, initial: true },
	physicalNeedsDescription: { type: Types.Textarea, label: 'Description of physical needs', initial: true },
	emotionalNeeds: { type: Types.Select, label: 'Emotional needs', options: 'None, Mild, Moderate, Severe', required: true, initial: true },
	// emotionalNeedsDescription: { type: Types.Textarea, label: 'Description of emotional needs', dependsOn: { emotionalNeeds: ['Mild', 'Moderate', 'Severe'] }, initial: true },
	emotionalNeedsDescription: { type: Types.Textarea, label: 'Description of emotional needs', initial: true },
	intellectualNeeds: { type: Types.Select, label: 'Intellectual needs', options: 'None, Mild, Moderate, Severe', required: true, initial: true },
	// intellectualNeedsDescription: { type: Types.Textarea, label: 'Description of intellectual needs', dependsOn: { intellectualNeeds: ['Mild', 'Moderate', 'Severe'] }, initial: true }
	intellectualNeedsDescription: { type: Types.Textarea, label: 'Description of intellectual needs', initial: true },

	disabilities: { type: Types.Relationship, label: 'Disabilities', ref: 'Disability', many: true, initial: true },

	// specialNeedsNotes: { type: Types.Textarea, label: 'Notes', dependsOn: { physicalNeeds: ['Mild', 'Moderate', 'Severe'], emotionalNeeds: ['Mild', 'Moderate', 'Severe'], intellectualNeeds: ['Mild', 'Moderate', 'Severe'] }, initial: true },
	specialNeedsNotes: { type: Types.Textarea, label: 'Notes', initial: true }

}, { heading: 'Placement Considerations' }, {

	recommendedFamilyConstellation: { type: Types.Relationship, label: 'Recommended Family Constellations', ref: 'Family Constellation', many: true, required: true, index: true, initial: true },
	childPlacementConsiderations: { type: Types.Relationship, label: 'Child Placement Considerations', ref: 'Child Placement Consideration', many: true, index: true }

}, { heading: 'Agency Information' }, {

	registeredBy: { type: Types.Select, label: 'Registered By', options: 'Unknown, Adoption Worker, Recruitment Worker', required: true, index: true, initial: true },
	adoptionWorker: { type: Types.Relationship, label: 'Adoption Worker', ref: 'Social Worker', filters: { position: 'adoption worker' }, initial: true },
	recruitmentWorker: { type: Types.Relationship, label: 'Recruitment Worker', ref: 'Social Worker', filters: { position: 'recruitment worker' }, initial: true }

}, { heading: 'Photolisting Information' }, {

	profile: {
		part1: { type: Types.Textarea, label: 'Let me tell you more about myself...', required: true, initial: true },
		part2: { type: Types.Textarea, label: 'And here\'s what others say...', required: true, initial: true },
		part3: { type: Types.Textarea, label: 'If I could have my own special wish...', required: true, initial: true }
	},

	hasPhotolistingWriteup: { type: Types.Boolean, label: 'Photolisting Writeup', index: true, initial: true },
	// photolistingWriteupDate: { type: Types.Text, label: 'Date of Photolisting Writeup', note: 'mm/dd/yyyy', dependsOn: { hasPhotolistingWriteup: true }, initial: true },
	photolistingWriteupDate: { type: Types.Text, label: 'Date of Photolisting Writeup', note: 'mm/dd/yyyy', initial: true },
	hasPhotolistingPhoto: { type: Types.Boolean, label: 'Photolisting Photo', index: true, initial: true },
	// photolistingPhotoDate: { type: Types.Text, label: 'Date of Photolisting Photo', note: 'mm/dd/yyyy', dependsOn: { hasPhotolistingPhoto: true }, initial: true },
	photolistingPhotoDate: { type: Types.Text, label: 'Date of Photolisting Photo', note: 'mm/dd/yyyy', initial: true },
	photolistingPageNumber: { type: Number, label: 'Photolisting Page', format: false, index: true, initial: true },
	previousPhotolistingPageNumber: { type: Number, label: 'Previous Photolisting Page', format: false, index: true, initial: true },

	image: { type: Types.CloudinaryImage, folder: 'children/', select: true, selectPrefix: 'children/', publicID: 'slug', autoCleanup: true },
	galleryImage: {type: Types.Url, hidden: true },
	detailImage: {type: Types.Url, hidden: true },
	extranetUrl: { type: Types.Url, label: 'Extranet and Related Profile URL', initial: true } // Since this is redudant as this just points the the url where the photo exists (the child's page), we may hide this field.  This must be kept in as it will help us track down the child information in the old system in the event of an issue.

}, { heading: 'Recruitment Options' }, {

	hasVideoSnapshot: { type: Types.Boolean, label: 'Video Snapshot', index: true, initial: true },
	// videoSnapshotDate: { type: Types.Text, label: 'Date of Video Snapshot', note: 'mm/dd/yyyy', dependsOn: { hasVideoSnapshot: true }, initial: true },
	videoSnapshotDate: { type: Types.Text, label: 'Date of Video Snapshot', note: 'mm/dd/yyyy', initial: true },

	onMAREWebsite: { type: Types.Boolean, label: 'MARE Website', index: true, initial: true },
	// onMAREWebsiteDate: { type: Types.Text, label: 'Date on MARE Website', note: 'mm/dd/yyyy', dependsOn: { onMAREWebsite: true }, initial: true },
	onMAREWebsiteDate: { type: Types.Text, label: 'Date on MARE Website', note: 'mm/dd/yyyy', initial: true },

	onAdoptuskids: { type: Types.Boolean, label: 'Adoptuskids Website', index: true, initial: true },
	// onAdoptuskidsDate: { type: Types.Text, label: 'Date on Adoptuskids', note: 'mm/dd/yyyy', dependsOn: { onAdoptuskids: true }, initial: true },
	onAdoptuskidsDate: { type: Types.Text, label: 'Date on Adoptuskids', note: 'mm/dd/yyyy', initial: true },

	onOnlineMatching: { type: Types.Boolean, label: 'Online Matching Website', index: true, initial: true },
	// onOnlineMatchingDate: { type: Types.Text, label: 'Date on Online Matching', note: 'mm/dd/yyyy', dependsOn: { onOnlineMatching: true }, initial: true },
	onOnlineMatchingDate: { type: Types.Text, label: 'Date on Online Matching', note: 'mm/dd/yyyy', initial: true },

	wednesdaysChild: { type: Types.Boolean, label: 'Wednesday\'s Child?', initial: true },
	// wednesdaysChildDate: { type: Types.Text, label: 'Date of Wednesday\'s Child', note: 'mm/dd/yyyy', dependsOn: { wednesdaysChild: true }, initial: true },
	wednesdaysChildDate: { type: Types.Text, label: 'Date of Wednesday\'s Child', note: 'mm/dd/yyyy', initial: true },

	coalitionMeeting: { type: Types.Boolean, label: 'Coalition Meeting', index: true, initial: true },
	// coalitionMeetingDate: { type: Types.Text, label: 'Date of Coalition Meeting', note: 'mm/dd/yyyy', dependsOn: { coalitionMeeting: true }, initial: true },
	coalitionMeetingDate: { type: Types.Text, label: 'Date of Coalition Meeting', note: 'mm/dd/yyyy', initial: true },

	matchingEvent: { type: Types.Boolean, label: 'Matching Event', index: true, initial: true },
	// matchingEventDate: { type: Types.Text, label: 'Date of Matching Event', note: 'mm/dd/yyyy', dependsOn: { matchingEvent: true }, initial: true },
	matchingEventDate: { type: Types.Text, label: 'Date of Matching Event', note: 'mm/dd/yyyy', initial: true },

	adoptionParties: { type: Types.Relationship, label: 'Adoption Parties', ref: 'Event', filters: { type: 'adoption party' }, many: true, initial: true },

	mediaEligibility: { type: Types.Relationship, label: 'Media Eligibility', ref: 'Media Eligibility', many: true, initial: true },
	// otherMediaDescription: { type: Types.Textarea, label: 'Description', dependsOn: { mediaEligibility: 'Other' }, initial: true } // THIS DOESN'T WORK, MAKE IT WORK!
	otherMediaDescription: { type: Types.Textarea, label: 'Description', initial: true }

}, { heading: 'Attachments' }, {

	photolistingPage: {
		type: Types.S3File,
		s3path: '/child/photolisting-pages',
		filename: function(item, filename){
			// prefix file name with registration number and add the user's name for easier identification
			return item.registrationNumber + '_' + item.firstName.toLowerCase();
		}
	},

	otherAttachement: {
		type: Types.S3File,
		s3path: '/child/other',
		filename: function(item, filename){
			// prefix file name with registration number and add the user's name for easier identification
			return item.registrationNumber + '_' + item.firstName.toLowerCase();
		}
	}

});

// Displaly associations via the Relationship field type
Child.relationship({ path: 'children', ref: 'Child', refPath: 'siblingContacts' });
Child.relationship({ path: 'placements', ref: 'Placement', refPath: 'child' });

// Pre Save
Child.schema.pre('save', function(next) {
	'use strict';

	// TODO: Play with lowering quality to 0 and doubling the image size as an optimization technique
	this.galleryImage = this._.image.thumbnail(430,430,{ quality: 60 });
	this.detailImage = this._.image.thumbnail(200,200,{ quality: 60 });

	// Build the name string for better identification when linking through Relationship field types
	var firstName	= this.name.first,
		alias		= (this.name.alias && this.name.alias.length > 0) ? ' "' + this.name.alias + '"' : '',
		middleName	= (this.name.middle && this.name.middle.length > 0) ? ' ' + this.name.middle : '',
		lastName	= (this.name.last && this.name.last.length > 0) ? ' ' + this.name.last : '',
		nickName	= (this.name.nickName && this.name.nickName.length > 0) ? ' (' + this.name.nickName + ')' : '';


	this.name.full = firstName + middleName + lastName;
	this.name.identifying = firstName + alias + middleName + lastName + nickName;

	// TODO: Assign a registration number if one isn't assigned
	next();
});

// // Define default columns in the admin interface and register the model
Child.defaultColumns = 'registrationNumber, name.full, ethnicity, legalStatus, gender';
Child.register();
