var keystone = require('keystone'),
	Types = keystone.Field.Types;

// Create model
var User = new keystone.List('User');

// Create fields
User.add('Permissions', {
	userType: { type: Types.Select, options: 'Site User, Prospective Parent, Social Worker, Administrator', label: 'User Type', required: true, index: true, initial: true }
}, { heading: 'User Information' }, {
	name: {
		first: { type: Types.Text, label: 'First Name', required: true, index: true, initial: true },
		last: { type: Types.Text, label: 'Last Name', required: true, index: true, initial: true },
	},
	email: { type: Types.Email, label: 'Email Address', required: true, index: true, initial: true },
	password: { type: Types.Password, label: 'Password', required: true, initial: true },
	siteUserAvatar: { type: Types.CloudinaryImage, label: 'Avatar', folder: 'users/site users', select: true, selectPrefix: 'users/site users', autoCleanup: true, dependsOn: { userType: 'Site User' } },
	prospectiveParentAvatar: { type: Types.CloudinaryImage, label: 'Avatar', folder: 'users/prospective parents', select: true, selectPrefix: 'users/prospective parents', autoCleanup: true, dependsOn: { userType: 'Prospective Parent' } },
	socialWorkerAvatar: { type: Types.CloudinaryImage, label: 'Avatar', folder: 'users/social workers', select: true, selectPrefix: 'users/social workers', autoCleanup: true, dependsOn: { userType: 'Social Worker' } },
	adminAvatar: { type: Types.CloudinaryImage, label: 'Avatar', folder: 'users/administrators', select: true, selectPrefix: 'users/administrators', autoCleanup: true, dependsOn: { userType: 'Administrator' } }
}, { heading: 'Contact Information' }, {
	phone: { type: Types.Text, label: 'Phone number', initial: true, dependsOn: { userType: ['Social Worker', 'Prospective Parent'] } },
	mobilePhone: { type: Types.Text, label: 'Mobile phone number', initial: true, dependsOn: { userType: ['Site User'] } },
	otherPhone: { type: Types.Text, label: 'Other phone number', initial: true, dependsOn: { userType: ['Site User', 'Prospective Parent'] } },
    address1: { type: Types.Text, label: 'Address 1', initial: true },
	address2: { type: Types.Text, label: 'Address 2', initial: true },
	city: { type: Types.Text, label: 'City', initial: true },
	state: { type: Types.Select, options: 'Alabama, Alaska, Arizona, Arkansas, California, Colorado, Connecticut, Delaware, Florida, Georgia, Hawaii, Idaho, Illinois, Indiana, Iowa, Kansas, Kentucky, Louisiana, Maine, Maryland, Massachusetts, Michigan, Minnesota, Mississippi, Missouri, Montana, Nebraska, Nevada, New Hampshire, New Jersey, New Mexico, New York, North Carolina, North Dakota, Ohio, Oklahoma, Oregon, Pennsylvania, Rhode Island, South Carolina, South Dakota, Tennessee, Texas, Utah, Vermont, Virginia, Washington, West Virginia, Wisconsin, Wyoming', label: 'State', initial: true },
	zipCode: { type: Types.Text, label: 'Zip code', initial: true }
}, { heading: 'Social Worker Information', dependsOn: { userType: 'Social Worker' } }, {
	position: { type: Types.Select, options: 'adoption worker, recruitment worker, supervisor, administrator, family worker, other', label: 'Position', initial: true, dependsOn: { userType: 'Social Worker' } },
	agency: { type: Types.Text, label: 'Agency', index: true, initial: true, dependsOn: { userType: 'Social Worker' } },
	title: { type: Types.Text, label: 'Title', index: true, initial: true, dependsOn: { userType: 'Social Worker' } }
}, { heading: 'Prospective Parent Information', dependsOn: { userType: 'Prospective Parent' } }, {
	gender: { type: Types.Select, label: 'Gender', options: 'Male, Female', initial: true, dependsOn: { userType: 'Prospective Parent' } },
	ethnicity: { type: Types.Select, label: 'Ethnicity', options: 'African American, Asian, Caucasian, Hispanic/Latino, Middle Eastern, Pacific Islander, Native American/Alaskan, Mixed Race, Other', initial: true, dependsOn: { userType: 'Prospective Parent' } },
	occupation: { type: Types.Text, label: 'Occupation', initial: true, dependsOn: { userType: 'Prospective Parent' } },
	dateOfBirth: { type: Types.Date, initial: true, dependsOn: { userType: 'Prospective Parent' } }
}, { heading: 'Homestudy', dependsOn: { userType: 'Prospective Parent' } }, {
	homestudy: {
		complete: { type: Types.Boolean, label: 'Completed homestudy', initial: true, dependsOn: { userType: 'Prospective Parent' } },
		dateComplete: { type: Types.Date, label: 'Date complete', initial: true, dependsOn: { userType: 'Prospective Parent' } },
		socialWorkerName: { type: Types.Text, label: 'Social Worker Name', initial: true, dependsOn: { userType: 'Prospective Parent' } },
		socialWorkerAgency: { type: Types.Text, label: 'Social Worker Agency', initial: true, dependsOn: { userType: 'Prospective Parent' } },
		SocialWorkerPhone: { type: Types.Text, label: 'Social Worker Phone Number', initial: true, dependsOn: { userType: 'Prospective Parent' } },
		SocialWorkerEmail: { type: Types.Text, label: 'Social Worker Email Address', initial: true, dependsOn: { userType: 'Prospective Parent' } }
	}
}, { heading: 'Prospective Parent Details', dependsOn: { userType: 'Prospective Parent' } }, {
	children: {
		total: { type: Types.Number, label: 'Total number of children currently living at home', initial: true, dependsOn: { userType: 'Prospective Parent' } },
		male: {
			total: { type: Types.Number, label: 'Number of male children in home', initial: true, dependsOn: { userType: 'Prospective Parent' } },
			ages: { type: Types.Text, label: 'Ages of male children (separated by commas)', initial: true, dependsOn: { userType: 'Prospective Parent' } },
			biologicalTotal: { type: Types.Number, label: 'Number of biological male children', initial: true, dependsOn: { userType: 'Prospective Parent' } },
			adoptedTotal: { type: Types.Number, label: 'Number of adopted male children', initial: true, dependsOn: { userType: 'Prospective Parent' } }
		},
		female: {
			total: { type: Types.Number, label: 'Number of female children in home', initial: true, dependsOn: { userType: 'Prospective Parent' } },
			ages: { type: Types.Text, label: 'Ages of female children (separated by commas)', initial: true, dependsOn: { userType: 'Prospective Parent' } },
			biologicalTotal: { type: Types.Number, label: 'Number of biological female children', initial: true, dependsOn: { userType: 'Prospective Parent' } },
			adoptedTotal: { type: Types.Number, label: 'Number of adopted female children', initial: true, dependsOn: { userType: 'Prospective Parent' } }
		}
	},
	otherAdultsTotal: { type: Types.Number, label: 'Number of other adults living in home', initial: true, dependsOn: { userType: 'Prospective Parent' } },
	primaryLanguage: { type: Types.Text, label: 'Primary language spoken at home', initial: true, dependsOn: { userType: 'Prospective Parent' } },
	otherLanguages: { type: Types.Text, label: 'Other language(s) spoken at home', initial: true, dependsOn: { userType: 'Prospective Parent' } }
}, { heading: 'Adoption Preferences', dependsOn: { userType: 'Prospective Parent' } }, {
	adoptionPreferences: {
		approvedFor: {
			male: { type: Types.Boolean, label: 'Approved for male children', initial: true, dependsOn: { userType: 'Prospective Parent' } },
			female: { type: Types.Boolean, label: 'Approved for female children', initial: true, dependsOn: { userType: 'Prospective Parent' } }
		},
		legalStatus: {
			free: { type: Types.Boolean, label: 'Free', initial: true, dependsOn: { userType: 'Prospective Parent' } },
			atRisk: { type: Types.Boolean, label: 'At Risk', initial: true, dependsOn: { userType: 'Prospective Parent' } }
		},
		ageRange: {
			from: { type: Types.Number, label: 'Age (from)', initial: true, dependsOn: { userType: 'Prospective Parent' } },
			to: { type: Types.Number, label: 'Age (to)', initial: true, dependsOn: { userType: 'Prospective Parent' } }
		},
		numberOfChildren: { type: Types.Number, label: 'Number of children preferred', initial: true, dependsOn: { userType: 'Prospective Parent' } },
		contactWithBiologicalSiblings: { type: Types.Boolean, label: 'Contact with biological siblings', initial: true, dependsOn: { userType: 'Prospective Parent' } },
		contactWithBiologicalParents: { type: Types.Boolean, label: 'Contact with biological parents', initial: true, dependsOn: { userType: 'Prospective Parent' } },
		ethnicity: {
			africanAmerican: { type: Types.Boolean, label: 'African American', initial: true, dependsOn: { userType: 'Prospective Parent' } },
			asian: { type: Types.Boolean, label: 'Asian', initial: true, dependsOn: { userType: 'Prospective Parent' } },
			caucasian: { type: Types.Boolean, label: 'Caucasian', initial: true, dependsOn: { userType: 'Prospective Parent' } },
			hispanicLatino: { type: Types.Boolean, label: 'Hispanic/Latino', initial: true, dependsOn: { userType: 'Prospective Parent' } },
			nativeAmerican: { type: Types.Boolean, label: 'Native American', initial: true, dependsOn: { userType: 'Prospective Parent' } },
			other: { type: Types.Boolean, label: 'Other', initial: true, dependsOn: { userType: 'Prospective Parent' } }
		},
		needs: {
			physical: { type: Types.Select, label: 'Level of physical needs', options: 'Mild, Moderate, Severe', initial: true, dependsOn: { userType: 'Prospective Parent' } },
			emotional: { type: Types.Select, label: 'Level of emotional needs', options: 'Mild, Moderate, Severe', initial: true, dependsOn: { userType: 'Prospective Parent' } },
			intellectual: { type: Types.Select, label: 'Level of intellectual needs', options: 'Mild, Moderate, Severe', initial: true, dependsOn: { userType: 'Prospective Parent' } }

		}

	}
}, { heading: 'User Preferences', dependsOn: { userType: ['Site User', 'Social Worker', 'Prospective Parent'] } }, {
	userPreferences: {
		heardThrough: {
			wednesdaysChild: { type: Types.Boolean, label: 'Heard about MARE through Wednesday\'s Child', initial: true, dependsOn: { userType: 'Prospective Parent' } },
			friendOrFamily: { type: Types.Boolean, label: 'Heard about MARE through a friend or Prospective Parent member', initial: true, dependsOn: { userType: 'Prospective Parent' } },
			jordansFurniture: { type: Types.Boolean, label: 'Heard about MARE through Jordan\'s Furniture', initial: true, dependsOn: { userType: 'Prospective Parent' } },
			socialWorker: { type: Types.Boolean, label: 'Heard about MARE through a social worker', initial: true, dependsOn: { userType: 'Prospective Parent' } },
			internetSearch: { type: Types.Boolean, label: 'Heard about MARE through an internet search', initial: true, dependsOn: { userType: 'Prospective Parent' } },
			other: { type: Types.Boolean, label: 'Heard about MARE through another source', initial: true, dependsOn: { userType: 'Prospective Parent' } },
			otherDescription: { type: Types.Text, label: 'Description of other source', initial: true, dependsOn: { other: true, userType: 'Prospective Parent' } }
		},
		newsLetter: {
			quarterly: { type: Types.Boolean, label: 'Add to the MARE News quarterly email list', initial: true, dependsOn: { userType: ['Site User', 'Social Worker', 'Prospective Parent'] } },
			adoptionParty: { type: Types.Boolean, label: 'Add to Adoption Party email list', initial: true, dependsOn: { userType: ['Site User', 'Social Worker', 'Prospective Parent'] } }
		}
	}
});

// Pre Save
// User.schema.pre('save', function(next) {
// 	'use strict';

// 	this.isAdmin = this.userType === 'Administrator' ? true : false;

// 	next();
// });

/* TODO: VERY IMPORTANT:  Need to fix this to provide the link to access the keystone admin panel again */
/* Changing names or reworking this file changed the check in node_modules/keystone/templates/views/signin.jade for user.isAdmin on line 14 */
// Provide access to Keystone
User.schema.virtual('canAccessKeystone').get(function() {
	'use strict';
	
	return this.userType === 'Administrator' ? true : false;
});

// Provide the logged in user's type
User.schema.virtual('getUserType').get(function() {
	'use strict';

	return this.userType;
})

// Define default columns in the admin interface and register the model
User.defaultColumns = 'name.first, name.last, email, userType';
User.register();