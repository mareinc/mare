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
	registrationDate: { type: Types.Date, label: 'Registration Date', default: Date.now(), required: true, initial: true },
	
	image: { type: Types.CloudinaryImage, folder: 'children/', select: true, selectPrefix: 'children/', publicID: 'slug', autoCleanup: true },
	galleryImage: {type: Types.Url, hidden: true },
	detailImage: {type: Types.Url, hidden: true },
	
	video: { type: Types.Url, label: 'Video', initial: true },
	
	name: {
		first: { type: Types.Text, label: 'First Name', required: true, index: true, initial: true },
		middle: { type: Types.Text, label: 'Middle Name', initial: true },
		last: { type: Types.Text, label: 'Last Name', required: true, index: true, initial: true },
		alias: { type: Types.Text, label: 'Alias', initial: true },
		nickName: { type: Types.Text, label: 'Nickname', initial: true },
		full: { type: Types.Text, label: 'Name', hidden: true, noedit: true, initial: false },
		identifying: { type: Types.Text, label: 'Name', hidden: true }
	},
	
	birthDate: { type: Types.Date, label: 'Date of Birth', required: true, initial: true },	
	language: { type: Types.Relationship, label: 'Language', ref: 'Language', many: true, required: true, initial: true },
	statusChangeDate: { type: Types.Date, label: 'Status Change Date', initial: true }, // TODO: Logic needed, see line 14 of https://docs.google.com/spreadsheets/d/1Opb9qziX2enTehJx5K1J9KAT7v-j2yAdqwyQUMSsFwc/edit#gid=1235141373
	status: { type: Types.Relationship, label: 'Status', ref: 'Child Status', many: false, required: true, index: true, initial: true },
	gender: { type: Types.Relationship, label: 'Gender', ref: 'Gender', many: false, required: true, index: true, initial: true },	
	race: { type: Types.Relationship, label: 'Race', ref: 'Race', many: false, required: true, index: true, initial: true },
	legalStatus: { type: Types.Select, label: 'Legal Status', options: 'Free, Legal Risk', required: true, index: true, initial: true },
	hasContactWithSiblings: { type: Types.Boolean, label: 'Has contact with siblings?', index: true, initial: true },
	siblingContactsString: { type: Types.Text, label: 'Siblings (comma separated)', initial: true },
	siblingContacts: { type: Types.Relationship, label: 'Siblings', ref: 'Child', many: true, initial: true },
	hasContactWithBirthFamily: { type: Types.Boolean, label: 'Has contact with birth family?', initial: true },
	birthFamilyContactsString: { type: Types.Text, label: 'Birth Family (comma separated)', initial: true }

}, { heading: 'Special Needs' }, {	

	physicalNeeds: { type: Types.Select, label: 'Physical needs', options: 'None, Mild, Moderate, Severe', required: true, initial: true },
	// physicalNeedsDescription: { type: Types.Textarea, label: 'Description of physical needs', dependsOn: { physicalNeeds: ['Mild', 'Moderate', 'Severe'] }, initial: true },
	physicalNeedsDescription: { type: Types.Textarea, label: 'Description of physical needs', initial: true },
	emotionalNeeds: { type: Types.Select, label: 'Emotional needs', options: 'None, Mild, Moderate, Severe', required: true, initial: true },
	// emotionalNeedsDescription: { type: Types.Textarea, label: 'Description of emotional needs', dependsOn: { emotionalNeeds: ['Mild', 'Moderate', 'Severe'] }, initial: true },
	emotionalNeedsDescription: { type: Types.Textarea, label: 'Description of emotional needs', initial: true },
	intellectualNeeds: { type: Types.Select, label: 'Intellectual needs', options: 'None, Mild, Moderate, Severe', required: true, initial: true },
	// intellectualNeedsDescription: { type: Types.Textarea, label: 'Description of intellectual needs', dependsOn: { intellectualNeeds: ['Mild', 'Moderate', 'Severe'] }, initial: true }
	intellectualNeedsDescription: { type: Types.Textarea, label: 'Description of intellectual needs', initial: true }

}, { heading: 'Placement Considerations' }, {	

	recommendedFamilyConstellation: { type: Types.Relationship, label: 'Recommended Family Constellations', ref: 'Recommended Family Constellation', many: true, required: true, index: true, initial: true },
	childPlacementConsiderations: { type: Types.Relationship, label: 'Child Placement Considerations', ref: 'Child Placement Consideration', many: true, index: true }
	
}, { heading: 'Agency Information' }, {

	registeredBy: { type: Types.Select, label: 'Registered By', options: 'Unknown, Adoption Worker, Recruitment Worker', required: true, index: true, initial: true },
	adoptionWorker: { type: Types.Relationship, label: 'Adoption Worker', ref: 'Social Worker', initial: true }

}, { heading: 'Photolisting Information' }, {

	profile: {
		part1: { type: Types.Textarea, label: 'Let me tell you more about myself...', required: true, initial: true },
		part2: { type: Types.Textarea, label: 'And here\'s what others say...', required: true, initial: true },
		part3: { type: Types.Textarea, label: 'If I could have my own special wish...', required: true, initial: true }
	},

	hasPhotolistingWriteup: { type: Types.Boolean, label: 'Photolisting Writeup', index: true, initial: true },
	// photolistingWriteupDate: { type: Types.Date, label: 'Date of Photolisting Writeup', dependsOn: { hasPhotolistingWriteup: true }, initial: true },
	photolistingWriteupDate: { type: Types.Date, label: 'Date of Photolisting Writeup', initial: true },
	hasPhotolistingPhoto: { type: Types.Boolean, label: 'Photolisting Photo', index: true, initial: true },
	// photolistingPhotoDate: { type: Types.Date, label: 'Date of Photolisting Photo', dependsOn: { hasPhotolistingPhoto: true }, initial: true },
	photolistingPhotoDate: { type: Types.Date, label: 'Date of Photolisting Photo', initial: true },
	photolistingPageNumber: { type: Number, label: 'Photolisting Page', format: false, index: true, initial: true },
	previousPhotolistingPageNumber: { type: Number, label: 'Previous Photolisting Page', format: false, index: true, initial: true }
	
}, { heading: 'Recruitment Options' }, {

	hasVideoSnapshot: { type: Types.Boolean, label: 'Video Snapshot', index: true, initial: true },
	// videoSnapshotDate: { type: Types.Date, label: 'Date of Video Snapshot', dependsOn: { hasVideoSnapshot: true }, initial: true },
	videoSnapshotDate: { type: Types.Date, label: 'Date of Video Snapshot', initial: true },
	
	onMAREWebsite: { type: Types.Boolean, label: 'MARE Website', index: true, initial: true },
	// onMAREWebsiteDate: { type: Types.Date, label: 'Date on MARE Website', dependsOn: { onMAREWebsite: true }, initial: true },
	onMAREWebsiteDate: { type: Types.Date, label: 'Date on MARE Website', initial: true },
	
	onAdoptuskids: { type: Types.Boolean, label: 'Adoptuskids Website', index: true, initial: true },
	// onAdoptuskidsDate: { type: Types.Date, label: 'Date on Adoptuskids', dependsOn: { onAdoptuskids: true }, initial: true },
	onAdoptuskidsDate: { type: Types.Date, label: 'Date on Adoptuskids', initial: true },
	
	onOnlineMatching: { type: Types.Boolean, label: 'Online Matching Website', index: true, initial: true },
	// onOnlineMatchingDate: { type: Types.Date, label: 'Date on Online Matching', dependsOn: { onOnlineMatching: true }, initial: true },
	onOnlineMatchingDate: { type: Types.Date, label: 'Date on Online Matching', initial: true },

	wednesdaysChild: { type: Types.Boolean, label: 'Wednesday\'s Child?', initial: true },
	// wednesdaysChildDate: { type: Types.Date, label: 'Date of Wednesday\'s Child', dependsOn: { wednesdaysChild: true }, initial: true },
	wednesdaysChildDate: { type: Types.Date, label: 'Date of Wednesday\'s Child', initial: true },

	coalitionMeeting: { type: Types.Boolean, label: 'Coalition Meeting', index: true, initial: true },
	// coalitionMeetingDate: { type: Types.Date, label: 'Date of Coalition Meeting', dependsOn: { coalitionMeeting: true }, initial: true },
	coalitionMeetingDate: { type: Types.Date, label: 'Date of Coalition Meeting', initial: true },
	
	matchingEvent: { type: Types.Boolean, label: 'Matching Event', index: true, initial: true },
	// matchingEventDate: { type: Types.Date, label: 'Date of Matching Event', dependsOn: { matchingEvent: true }, initial: true },
	matchingEventDate: { type: Types.Date, label: 'Date of Matching Event', initial: true },
	
	mediaEligibility: { type: Types.Relationship, label: 'Media Eligibility', ref: 'Media Eligibility', many: true, initial: true },
	// otherMediaDescription: { type: Types.Textarea, label: 'Description', dependsOn: { mediaEligibility: 'Other' }, initial: true } // THIS DOESN'T WORK, MAKE IT WORK!
	otherMediaDescription: { type: Types.Textarea, label: 'Description', initial: true }

}, { heading: 'REMOVED FIELDS' }, {
	
	// requiresOlderChildren: { type: Types.Boolean, label: 'Requires Older Children', dependsOn: { recommendedFamilyConstellation: 'Multi Child Home' }, initial: true },
	// requiresYoungerChildren: { type: Types.Boolean, label: 'Requires Younger Children', dependsOn: { recommendedFamilyConstellation: 'Multi Child Home' }, initial: true },
	requiresOlderChildren: { type: Types.Boolean, label: 'Requires Older Children', initial: true },
	requiresYoungerChildren: { type: Types.Boolean, label: 'Requires Younger Children', initial: true },
	extranetUrl: { type: Types.Url, label: 'Extranet and Related Profile URL', initial: true },
	
	// specialNeedsNotes: { type: Types.Textarea, label: 'Notes', dependsOn: { physicalNeeds: ['Mild', 'Moderate', 'Severe'], emotionalNeeds: ['Mild', 'Moderate', 'Severe'], intellectualNeeds: ['Mild', 'Moderate', 'Severe'] }, initial: true },
	specialNeedsNotes: { type: Types.Textarea, label: 'Notes', initial: true },
	disabilities: { type: Types.Relationship, label: 'Disabilities', ref: 'Disability', many: true, initial: true }

}, { heading: 'Adoption Parties - REMOVED FIELDS' }, {

	adoptionParties: { type: Types.Relationship, label: 'Adoption Parties', ref: 'Adoption Party', many: true, initial: true }

}, { heading: 'Internal Notes - REMOVED FIELDS' }, {

	internalNotes: { type: Types.Textarea, label: 'Internal Notes', initial: true }

}, { heading: 'Attachments - REMOVED FIELDS' }, {

	photolistingPage: {
		type: Types.S3File,
		s3path: '/child/photolisting-pages',
		filename: function(item, filename){
			// prefix file name with registration number and add the user's name for easier identification
			return item.registrationNumber + '_' + item.firstName.toLowerCase() + '-' + item.lastName.toLowerCase() + '_photo-listing-page';
		}
	},

	otherAttachement: {
		type: Types.S3File,
		s3path: '/child/other',
		filename: function(item, filename){
			// prefix file name with registration number and add the user's name for easier identification
			return item.registrationNumber + '_' + item.firstName.toLowerCase() + '-' + item.lastName.toLowerCase() + '_other-attachment';
		}
	}

});

// Displaly associations via the Relationship field type
Child.relationship({ path: 'children', ref: 'Child', refPath: 'siblingContacts' });

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
