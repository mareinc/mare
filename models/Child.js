var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model
var Child = new keystone.List('Child', {
	//map: { name: 'name' }
	defaultSort: 'name'
});

// Create fields
Child.add({
	image: { type: Types.CloudinaryImage, folder: 'children/', select: true, publicID: 'slug', autoCleanup: true }, //select: true, selectPrefix: 'children/' isn't working
	thumbnailImage: {type: Types.Url, hidden: true},
	detailImage: {type: Types.Url, hidden: true},
	//video: { type: Types.CloudinaryVideo, folder: 'children/', autoCleanup: true },
	name: { type: Types.Name, label: 'Name', required: true, index: true, initial: true },
	age: { type: Number, label: 'Age', required: true, index: true, initial: true },
	registrationNumber: { type: Number, label: 'Registration Number', required: true, index: true, initial: true },
	profile: {
		part1: { type: Types.Textarea, label: 'Hi! My name is...', required: true, initial: true }, // TODO: Try to make this dynamic: 'Hi! My name is Jared...'
		part2: { type: Types.Textarea, label: 'Let me tell you more about myself...', required: true, initial: true },
		part3: { type: Types.Textarea, label: 'And here\'s what others say...', required: true, initial: true },
		part4: { type: Types.Textarea, label: 'If I could have my own special wish...', required: true, initial: true }
	},
	primaryLanguage: { type: Types.Select, label: 'Primary Language', options: 'English, Spanish, Portuguese', default: 'English', required: true, initial: true },
	ethnicity: { type: Types.Select, label: 'Ethnicity', options: 'African American, Asian, Caucasian, Hispanic/Latino, Middle Eastern, Pacific Islander, Native American/Alaskan, Mixed Race, Other', required: true, initial: true },
	gender: { type: Types.Select, label: 'Gender', options: 'Male, Female', required: true, initial: true },
	legalStatus: { type: Types.Select, label: 'Legal Status', options: 'Legally Free, Something Else', required: true, initial: true },
	wednesdaysChild: { type: Types.Boolean, label: 'Wednesday\'s Child?', initial: true },
	contactWithSiblings: { type: Types.Boolean, label: 'Has contact with siblings?', initial: true },
	// linkedSiblings: { },
	contactWithParents: { type: Types.Boolean, label: 'Has contact with parents?', initial: true },
	physicalNeeds: { type: Types.Select, label: 'Physical needs', options: 'None, Mild, Moderate, Severe', required: true, initial: true },
	physicalNeedsDescription: { type: Types.Textarea, label: 'Description of physical needs', dependsOn: { physicalNeeds: ['Mild', 'Moderate', 'Severe'] }, initial: true },
	emotionalNeeds: { type: Types.Select, label: 'Emotional needs', options: 'None, Mild, Moderate, Severe', required: true, initial: true },
	emotionalNeedsDescription: { type: Types.Textarea, label: 'Description of emotional needs', dependsOn: { emotionalNeeds: ['Mild', 'Moderate', 'Severe'] }, initial: true },
	intellectualNeeds: { type: Types.Select, label: 'Intellectual needs', options: 'None, Mild, Moderate, Severe', required: true, initial: true },
	intellectualNeedsDescription: { type: Types.Textarea, label: 'Description of intellectual needs', dependsOn: { intellectualNeeds: ['Mild', 'Moderate', 'Severe'] }, initial: true },
	disabilities: { type: Types.Select, label: 'Disabilities', options: 'None, Autism, Other', initial: true } // To get a multi-select working, see https://github.com/keystonejs/keystone/issues/12
 });

/* References which should show */
//	linked Social Worker
//	linked to interested families at various steps in the process
//	linked siblings

// Pre Save
Child.schema.pre('save', function(next) {
	'use strict';

	this.thumbnailImage = this._.image.thumbnail(640,300,{ quality: 60 });
	this.detailImage = this._.image.thumbnail(640,640,{ quality: 60 });

	console.log(this.thumbnailImage);
	console.log(this.detailImage);
	
	// TODO: Assign a registration number if one isn't assigned
	next();
});

// // Define default columns in the admin interface and register the model
Child.defaultColumns = 'name, ethnicity, legalStatus, gender, wednesdaysChild';
Child.register();
