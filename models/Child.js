var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model
var Child = new keystone.List('Child', {
	track: true,
	autokey: { path: 'slug', from: 'registrationNumber', unique: true },
	map: { name: 'name.first' },
	defaultSort: 'name.last'
});

// Create fields
Child.add({
	registrationNumber: { type: Number, label: 'Registration Number', format: false, required: true, index: true, initial: true },
	registrationDate: { type: Types.Date, label: 'Registration Date', default: Date.now(), required: true, initial: true },
	image: { type: Types.CloudinaryImage, folder: 'children/', select: true, selectPrefix: 'children/', publicID: 'slug', autoCleanup: true },
	thumbnailImage: {type: Types.Url, hidden: true},
	detailImage: {type: Types.Url, hidden: true},
	video: { type: Types.Url, label: 'Video', initial: true },
	name: {
		first: { type: Types.Text, label: 'First Name', required: true, index: true, initial: true },
		middle: { type: Types.Text, label: 'Middle Name', initial: true },
		last: { type: Types.Text, label: 'Last Name', required: true, index: true, initial: true },
		alias: { type: Types.Text, label: 'Alias', initial: true },
		nickname: { type: Types.Text, label: 'Nickname', initial: true }
	},
	birthDate: { type: Types.Date, label: 'Date of Birth', required: true, initial: true },
	language: { type: Types.Select, label: 'Language', options: 'English, Spanish, Portuguese, Chinese, Other', default: 'English', required: true, initial: true },
	statusChangeDate: { type: Types.Date, label: 'Status Change Date', initial: true }, // TODO: Logic needed, see line 14 of https://docs.google.com/spreadsheets/d/1Opb9qziX2enTehJx5K1J9KAT7v-j2yAdqwyQUMSsFwc/edit#gid=1235141373
	status: { type: Types.Select, label: 'Status', options: 'Active, On Hold, Withdrawn, Placed, Disrupted, Reunification', required: true, index: true, initial: true },
	gender: { type: Types.Select, label: 'Gender', options: 'Male, Female', required: true, index: true, initial: true },
	race: { type: Types.Select, label: 'Race', options: 'African American, African American/Asian, African American/Caucasian, African American/Hispanic, African American/Native American, Asian, Asian/Caucasian, Asian/Hispanic, Asian/Native American, Caucasian, Caucasian/Hispanic, Caucasian/Native American, Hispanic, Hispanic/Native American, Native American, Other', required: true, index: true, initial: true },
	legalStatus: { type: Types.Select, label: 'Legal Status', options: 'Free, Legal Risk', required: true, index: true, initial: true },
	hasContactWithSiblings: { type: Types.Boolean, label: 'Has contact with siblings?', index: true, initial: true },
	siblingContactsString: { type: Types.Text, label: 'Siblings (comma separated)', initial: true },
	siblingContacts: { type: Types.Relationship, label: 'Siblings', ref: 'Child', many: true, initial: true },
	hasContactWithBirthFamily: { type: Types.Boolean, label: 'Has contact with birth family?', initial: true },
	birthFamilyContactsString: { type: Types.Text, label: 'Birth Family (comma separated)', initial: true },
	profile: {
		part1: { type: Types.Textarea, label: 'Hi! My name is...', required: true, initial: true }, // TODO: Check to see if we need a field for this, or if it will always autofill with: 'Hi! My name is [first name]...'
		part2: { type: Types.Textarea, label: 'Let me tell you more about myself...', required: true, initial: true },
		part3: { type: Types.Textarea, label: 'And here\'s what others say...', required: true, initial: true },
		part4: { type: Types.Textarea, label: 'If I could have my own special wish...', required: true, initial: true }
	},
	wednesdaysChild: { type: Types.Boolean, label: 'Wednesday\'s Child?', initial: true },
	// physicalNeeds: { type: Types.Select, label: 'Physical needs', options: 'None, Mild, Moderate, Severe', required: true, initial: true },
	// physicalNeedsDescription: { type: Types.Textarea, label: 'Description of physical needs', dependsOn: { physicalNeeds: ['Mild', 'Moderate', 'Severe'] }, initial: true },
	// emotionalNeeds: { type: Types.Select, label: 'Emotional needs', options: 'None, Mild, Moderate, Severe', required: true, initial: true },
	// emotionalNeedsDescription: { type: Types.Textarea, label: 'Description of emotional needs', dependsOn: { emotionalNeeds: ['Mild', 'Moderate', 'Severe'] }, initial: true },
	// intellectualNeeds: { type: Types.Select, label: 'Intellectual needs', options: 'None, Mild, Moderate, Severe', required: true, initial: true },
	// intellectualNeedsDescription: { type: Types.Textarea, label: 'Description of intellectual needs', dependsOn: { intellectualNeeds: ['Mild', 'Moderate', 'Severe'] }, initial: true },
	// disabilities: { type: Types.Select, label: 'Disabilities', options: 'None, Autism, Other', initial: true } // To get a multi-select working, see https://github.com/keystonejs/keystone/issues/12
 });

/* TODO: References which should show */
//	linked Social Worker
//	linked to interested families at various steps in the process
//	linked siblings

// Pre Save
Child.schema.pre('save', function(next) {
	'use strict';
	// TODO: Fix the sizing of these images
	this.thumbnailImage = this._.image.thumbnail(640,300,{ quality: 60 });
	this.detailImage = this._.image.thumbnail(640,640,{ quality: 60 });

	console.log(this.thumbnailImage);
	console.log(this.detailImage);
	
	// TODO: Assign a registration number if one isn't assigned
	next();
});

// // Define default columns in the admin interface and register the model
Child.defaultColumns = 'registrationNumber, name.first, name.last, ethnicity, legalStatus, gender';
Child.register();
