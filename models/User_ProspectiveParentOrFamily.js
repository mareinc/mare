var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model
var ProspectiveParentOrFamily = new keystone.List('Prospective Parent or Family', {
	track: true,
	autokey: { path: 'key', from: 'registrationNumber', unique: true },
	map: { name: 'contact1.name.full' },
	defaultSort: 'contact1.name.full'
});


// Create fields
ProspectiveParentOrFamily.add('Permissions', {

	permissions: {
		isVerified: { type: Boolean, label: 'Has a verified email address', default: false, noedit: true },
		isActive: { type: Boolean, label: 'Is active', default: true, noedit: true }
	}

}, 'General Information', {

	registrationNumber: { type: Number, label: 'Registration Number', format: false, required: true, index: true, initial: true },
	initialContact: { type: Types.Date, label: 'Initial Contact', default: Date.now(), required: true, initial: true },
	flagCalls: { type: Types.Boolean, label: 'Flag Calls', initial: true },
	// familyConstellation: { type: Types.Relationship, label: 'Family Constellation', ref: 'Recommended Family Constellations', required: true, index: true, initial: true },
	familyConstellation: { type: Types.Select, options: 'Single Male, Single Gay Male, Single Straight Male, Single Female, Single Gay Female, Single Straight Female, Female/Female Couple, Male/Male Couple', required: true, index: true, initial: true },
	// language: { type: Types.Select, label: 'Language', options: 'English, Spanish, Portuguese, Chinese, Other', default: 'English', required: true, initial: true },
	language: { type: Types.Text, label: 'Language', required: true, initial: true },
	
	password: { type: Types.Password, label: 'Password', required: true, initial: true },
	avatar: { type: Types.CloudinaryImage, label: 'Avatar', folder: 'users/prospective parents\\/families', autoCleanup: true }

}, 'Contacts', {

	contact1: {

		name: {
			first: { type: Types.Text, label: 'First Name', required: true, index: true, initial: true },
			last: { type: Types.Text, label: 'Last Name', required: true, index: true, initial: true },
			full: { type: Types.Text, label: 'Name', hidden: true }
		},

		phone: {
			work: { type: Types.Text, label: 'Work Phone Number', initial: true },
			cell: { type: Types.Text, label: 'Cell Phone Number', initial: true },
		},

		email: { type: Types.Email, label: 'Email Address', index: true, initial: true },
		preferredMethod: { type: Types.Select, label: 'Preferred Method', options: 'E-mail, Home Phone, Cell Phone, Work Phone, Unknown', required: true, index: true, initial: true },
		gender: { type: Types.Select, label: 'Gender', options: 'Male, Female, Other', required: true, index: true, initial: true },
		race: { type: Types.Select, label: 'Race', options: 'African American, African American/Asian, African American/Caucasian, African American/Hispanic, African American/Native American, Asian, Asian/Caucasian, Asian/Hispanic, Asian/Native American, Caucasian, Caucasian/Hispanic, Caucasian/Native American, Hispanic, Hispanic/Native American, Native American, Other', required: true, index: true, initial: true },
		occupation: { type: Types.Text, label: 'Occupation', initial: true },
		birthDate: { type: Types.Date, label: 'Date of Birth', required: true, initial: true }
	},

	contact2: {
		name: {
			firstName: { type: Types.Text, label: 'First Name', required: true, index: true, initial: true },
			lastName: { type: Types.Text, label: 'Last Name', required: true, index: true, initial: true },
			full: { type: Types.Text, label: 'Name', hidden: true }
		},

		phone: {
			work: { type: Types.Text, label: 'Work Phone Number', initial: true },
			cell: { type: Types.Text, label: 'Cell Phone Number', initial: true },
		},

		email: { type: Types.Email, label: 'Email Address', index: true, initial: true },
		preferredMethod: { type: Types.Select, label: 'Preferred Method', options: 'E-mail, Home Phone, Cell Phone, Work Phone, Unknown', required: true, index: true, initial: true },
		gender: { type: Types.Select, label: 'Gender', options: 'Male, Female, Other', required: true, index: true, initial: true },
		race: { type: Types.Select, label: 'Race', options: 'African American, African American/Asian, African American/Caucasian, African American/Hispanic, African American/Native American, Asian, Asian/Caucasian, Asian/Hispanic, Asian/Native American, Caucasian, Caucasian/Hispanic, Caucasian/Native American, Hispanic, Hispanic/Native American, Native American, Other', required: true, index: true, initial: true },
		occupation: { type: Types.Text, label: 'Occupation', required: true, initial: true },
		birthDate: { type: Types.Date, label: 'Date of Birth', required: true, initial: true }
	}

}, 'Home Contact Information', {
	
	homePhone: { type: Types.Text, label: 'Home Phone Number', required: true, initial: true },

	address: {
		street1: { type: Types.Text, label: 'Street', required: true, initial: true },
		street2: { type: Types.Text, label: '', required: true, initial: true },
		city: { type: Types.Text, label: 'City', required: true, initial: true },
		state: { type: Types.Select, options: 'Alabama, Alaska, Arizona, Arkansas, California, Colorado, Connecticut, Delaware, Florida, Georgia, Hawaii, Idaho, Illinois, Indiana, Iowa, Kansas, Kentucky, Louisiana, Maine, Maryland, Massachusetts, Michigan, Minnesota, Mississippi, Missouri, Montana, Nebraska, Nevada, New Hampshire, New Jersey, New Mexico, New York, North Carolina, North Dakota, Ohio, Oklahoma, Oregon, Pennsylvania, Rhode Island, South Carolina, South Dakota, Tennessee, Texas, Utah, Vermont, Virginia, Washington, West Virginia, Wisconsin, Wyoming', label: 'State', required: true, index: true, initial: true },
		zipCode: { type: Types.Text, label: 'Zip code', required: true, index: true, initial: true },
		country: { type: Types.Text, label: 'Country', initial: true }
	}

}, 'Current Children in Family', {

	numberOfChildren: { type: Types.Select, options: '1, 2, 3, 4, 5, 6+', label: 'Number of children', required: true, initial: true },

	currentChild1: {
		name: { type: Types.Text, label: 'Child 1 name:', initial: true, dependsOn: { numberOfChildren: ['1', '2', '3', '4', '5+'] } },
		birthDate: { type: Types.Date, label: 'Child 1 date of birth', initial: true, dependsOn: { numberOfChildren: ['1', '2', '3', '4', '5+'] } },
		type: { type: Types.Select, options: 'biological, adopted - domestic, adopted - international, adopted - foster care, other, unknown', label: 'Type', initial: true, dependsOn: { numberOfChildren: ['1', '2', '3', '4', '5+'] } }
	},				

	currentChild2: {
		name: { type: Types.Text, label: 'Child 2 name:', initial: true, dependsOn: { numberOfChildren: ['2', '3', '4', '5+'] } },
		birthDate: { type: Types.Date, label: 'Child 2 date of birth', initial: true, dependsOn: { numberOfChildren: ['2', '3', '4', '5+'] } },
		type: { type: Types.Select, options: 'biological, adopted - domestic, adopted - international, adopted - foster care, other, unknown', label: 'Type', initial: true, dependsOn: { numberOfChildren: ['2', '3', '4', '5+'] } }
	},

	currentChild3: {
		name: { type: Types.Text, label: 'Child 3 name:', initial: true, dependsOn: { numberOfChildren: ['3', '4', '5+'] } },
		birthDate: { type: Types.Date, label: 'Child 3 date of birth', initial: true, dependsOn: { numberOfChildren: ['3', '4', '5+'] } },
		type: { type: Types.Select, options: 'biological, adopted - domestic, adopted - international, adopted - foster care, other, unknown', label: 'Type', initial: true, dependsOn: { numberOfChildren: ['3', '4', '5+'] } }
	},

	currentChild4: {
		name: { type: Types.Text, label: 'Child 4 name:', initial: true, dependsOn: { numberOfChildren: ['4', '5+'] } },
		birthDate: { type: Types.Date, label: 'Child 4 date of birth', initial: true, dependsOn: { numberOfChildren: ['4', '5+'] } },
		type: { type: Types.Select, options: 'biological, adopted - domestic, adopted - international, adopted - foster care, other, unknown', label: 'Type', initial: true, dependsOn: { numberOfChildren: ['4', '5+'] } }
	},

	currentChild5: {
		name: { type: Types.Text, label: 'Child 5 name:', initial: true, dependsOn: { numberOfChildren: ['5'] } },
		birthDate: { type: Types.Date, label: 'Child 5 date of birth', initial: true, dependsOn: { numberOfChildren: ['5'] } },
		type: { type: Types.Select, options: 'biological, adopted - domestic, adopted - international, adopted - foster care, other, unknown', label: 'Type', initial: true, dependsOn: { numberOfChildren: ['5+'] } }
	},

	currentChild6: {
		name: { type: Types.Text, label: 'Child 6 name:', initial: true, dependsOn: { numberOfChildren: ['6+'] } },
		birthDate: { type: Types.Date, label: 'Child 6 date of birth', initial: true, dependsOn: { numberOfChildren: ['6+'] } },
		type: { type: Types.Select, options: 'biological, adopted - domestic, adopted - international, adopted - foster care, other, unknown', label: 'Type', initial: true, dependsOn: { numberOfChildren: ['5+'] } }
	}

}, 'Stages', {

	stages: {
		gatheringInformation: {
			started: { type: Types.Boolean, label: 'Gathering information', index: true, initial: true },
			date: { type: Types.Date, label: 'Date gathering information started', dependsOn: { started: true }, initial: true }
		},
		lookingForAgency: {
			started: { type: Types.Boolean, label: 'Looking for agency', index: true, initial: true },
			date: { type: Types.Date, label: 'Date looking for agency started', dependsOn: { started: true }, initial: true }
		},
		workingWithAgency: {
			started: { type: Types.Boolean, label: 'Working with agency', index: true, initial: true },
			date: { type: Types.Date, label: 'Date working with agency started', dependsOn: { started: true }, initial: true }
		},
		MAPPTrainingCompleted: {
			completed: { type: Types.Boolean, label: 'MAPP training completed', index: true, initial: true },
			date: { type: Types.Date, label: 'Date MAPP training completed', dependsOn: { completed: true }, initial: true }
		}
	},
	// add dependency for date on the line above each for the entries below
	homestudy: {
		completed: { type: Types.Boolean, label: 'Homestudy completed', index: true, initial: true },
		date: { type: Types.Date, label: 'Date homestudy completed', dependsOn: { completed: true }, initial: true }
	},

	onlineMatching: {
		started: { type: Types.Boolean, label: 'Online matching', index: true, initial: true },
		date: { type: Types.Date, label: 'Date online matching started', dependsOn: { started: true }, initial: true }
	},

	registeredWithMARE: {
		registered: { type: Types.Boolean, label: 'Registered with MARE', index: true, initial: true },
		date: { type: Types.Date, label: 'Date registered with MARE', dependsOn: { registered: true }, initial: true },
		status: { type: Types.Select, options: 'active, on hold, withdrawn, placed', dependsOn: { registered: true }, initial: true }
	},

	familyProfile: {
		created: { type: Types.Boolean, label: 'Family profile created', index: true, initial: true },
		date: { type: Types.Date, label: 'Date family profile created', dependsOn: { created: true }, initial: true }
	},

	closed: {
		closed: { type: Types.Boolean, label: 'Closed', index: true, initial: true },
		date: { type: Types.Date, label: 'Date closed', dependsOn: { closed: true }, initial: true },
		reason: { type: Types.Select, options: 'no longer pursuing adoption, no contact, family request, unregistered family placed', dependsOn: { closed: true }, initial: true }
	}

}, 'Social Worker Information', {

	socialWorker: { type: Types.Relationship, label: 'Social Worker', ref: 'Social Worker', initial: true }
					
}, 'Matching and Placement', {

}, 'Family Services', {

	familyServices: {
		mentee: { type: Types.Boolean, label: 'Mentee', index: true, initial: true },
		mentor: { type: Types.Boolean, label: 'Mentor', index: true, initial: true },
		mediaSpokesperson: { type: Types.Boolean, label: 'Media spokesperson', index: true, initial: true },
		eventPresenterOrSpokesperson: { type: Types.Boolean, label: 'Event presenter/spokesperson', index: true, initial: true },
		communityOutreach: { type: Types.Boolean, label: 'Community outreach', index: true, initial: true },
		fundraising: { type: Types.Boolean, label: 'Fundraising', index: true, initial: true },
		MARESupportGroupLeader: { type: Types.Boolean, label: 'MARE support group leader', index: true, initial: true },
		MARESupportGroupParticipant: { type: Types.Boolean, label: 'MARE support group participant', index: true, initial: true },
		receivesConsultationServices: { type: Types.Boolean, label: 'Receives consultation services', index: true, initial: true }
	}

}, 'Info Preferences', {

	infoPacket: {
		packet: { type: Types.Select, options: 'english, spanish, none', label: 'Packet', index: true, initial: true },
		date: { type: Types.Date, label: 'Date info packet sent', initial: true },
		notes: { type: Types.Textarea, label: 'Notes', initial: true },
		mailingList: { type: Types.Select, options: 'Adoption Parties, Board of Directors, Contracted Adoption Sups, Contracted Adoption Workers, Contracted Exec. Directors, DCF Adoption Supervisors, DCF Adoption Workers, DCF Area/Reg. Dir. & APMs, Newsletters, Fundraising, Heart Gallery Photographers, Latino Families, African American Families, Photolisting pages, Statewide Recruitment', label: 'Mailing list', index: true, initial: true }
	}

}, 'Matching Preferences', {

	matchingPreferences: {
		male: { type: Types.Boolean, label: 'Male', index: true, initial: true },
		female: { type: Types.Boolean, label: 'Physically challenged', index: true, initial: true },
		physicallyChallenged: { type: Types.Boolean, label: 'Physically challenged', index: true, initial: true },
		autismSpectrum: { type: Types.Boolean, label: 'Autism spectrum', index: true, initial: true },
		developmentallyChallenged: { type: Types.Boolean, label: 'Developmentally challenged', index: true, initial: true },
		legalRisk: { type: Types.Boolean, label: 'Physically challenged', index: true, initial: true },
		siblingContact: { type: Types.Boolean, label: 'Physically challenged', index: true, initial: true },
		birthFamilyContact: { type: Types.Boolean, label: 'Physically challenged', index: true, initial: true },
		numberOfChildToAdopt: { type: Types.Boolean, label: 'Physically challenged', index: true, initial: true },
		adoptionAges: {
			from: { type: Types.Boolean, label: 'Physically challenged', index: true, initial: true },
			to: { type: Types.Boolean, label: 'Physically challenged', index: true, initial: true },
		},
		maxNeeds: {
			physical: { type: Types.Select, options: 'None, Mild, Moderate, Severe', label: 'Maximum physical needs', index: true, initial: true },
			intellectual: { type: Types.Select, options: 'None, Mild, Moderate, Severe', label: 'Maximum intellectual needs', index: true, initial: true },
			emotional: { type: Types.Select, options: 'None, Mild, Moderate, Severe', label: 'Maximum emotional needs', index: true, initial: true },
		}
	}

});

// Displaly associations via the Relationship field type
// ProspectiveParentOrFamily.relationship({ path: 'children', ref: 'Child', refPath: 'siblingContacts' });
// TODO: link inquiries.

// Pre Save
ProspectiveParentOrFamily.schema.pre('save', function(next) {
	'use strict';
	
	this.contact1.name.full = this.contact1.name.first + ' ' + this.contact1.name.last;
	this.contact2.name.full = this.contact2.name.first + ' ' + this.contact2.name.last;

	// TODO: Assign a registration number if one isn't assigned
	next();
});

// // Define default columns in the admin interface and register the model
ProspectiveParentOrFamily.defaultColumns = 'registrationNumber, contact1.name.full, contact2.name.full';
ProspectiveParentOrFamily.register();
