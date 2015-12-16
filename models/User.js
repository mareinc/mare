// var keystone = require('keystone'),
// 	Types = keystone.Field.Types;

// // Create model
// var User = new keystone.List('User', {
// 	track: true,
// 	map: { name: 'name.fullName' },
// 	defaultSort: 'name.fullName'
// });

// // Create fields
// User.add('Permissions', {

// 	userType: { type: Types.Select, options: 'Site User, Prospective Parent/Family, Social Worker, Administrator', label: 'User Type', required: true, index: true, initial: true }

// }, { heading: 'User Information' }, {
	
// 	firstName: { type: Types.Text, label: 'First Name', required: true, index: true, initial: true },
// 	lastName: { type: Types.Text, label: 'Last Name', required: true, index: true, initial: true },
// 	fullName: { type: Types.Text, label: 'Name', hidden: true }
// 	email: { type: Types.Email, label: 'Email Address', unique: true, required: true, index: true, initial: true },
// 	password: { type: Types.Password, label: 'Password', required: true, initial: true },
// 	siteUserAvatar: { type: Types.CloudinaryImage, label: 'Avatar', folder: 'users/site users', select: true, selectPrefix: 'users/site users', autoCleanup: true, dependsOn: { userType: 'Site User' } },
// 	prospectiveParentAvatar: { type: Types.CloudinaryImage, label: 'Avatar', folder: 'users/prospective parents', select: true, selectPrefix: 'users/prospective parents', autoCleanup: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 	socialWorkerAvatar: { type: Types.CloudinaryImage, label: 'Avatar', folder: 'users/social workers', select: true, selectPrefix: 'users/social workers', autoCleanup: true, dependsOn: { userType: 'Social Worker' } },
// 	adminAvatar: { type: Types.CloudinaryImage, label: 'Avatar', folder: 'users/administrators', select: true, selectPrefix: 'users/administrators', autoCleanup: true, dependsOn: { userType: 'Administrator' } }

// }, { heading: 'Contact Information' }, {
	
// 	phone: { type: Types.Text, label: 'Phone number', initial: true, dependsOn: { userType: ['Social Worker', 'Prospective Parent/Family'] } },
// 	mobilePhone: { type: Types.Text, label: 'Mobile phone number', initial: true, dependsOn: { userType: ['Site User'] } },
// 	otherPhone: { type: Types.Text, label: 'Other phone number', initial: true, dependsOn: { userType: ['Site User', 'Prospective Parent/Family'] } },
//     address1: { type: Types.Text, label: 'Address 1', initial: true },
// 	address2: { type: Types.Text, label: 'Address 2', initial: true },
// 	city: { type: Types.Text, label: 'City', initial: true },
// 	state: { type: Types.Select, options: 'Alabama, Alaska, Arizona, Arkansas, California, Colorado, Connecticut, Delaware, Florida, Georgia, Hawaii, Idaho, Illinois, Indiana, Iowa, Kansas, Kentucky, Louisiana, Maine, Maryland, Massachusetts, Michigan, Minnesota, Mississippi, Missouri, Montana, Nebraska, Nevada, New Hampshire, New Jersey, New Mexico, New York, North Carolina, North Dakota, Ohio, Oklahoma, Oregon, Pennsylvania, Rhode Island, South Carolina, South Dakota, Tennessee, Texas, Utah, Vermont, Virginia, Washington, West Virginia, Wisconsin, Wyoming', label: 'State', index: true, initial: true },
// 	zipCode: { type: Types.Text, label: 'Zip code', index: true, initial: true }

// }, { heading: 'Social Worker Information', dependsOn: { userType: 'Social Worker' } }, {

// 	position: { type: Types.Select, options: 'adoption worker, recruitment worker, supervisor, administrator, family worker, other', label: 'Position', initial: true, dependsOn: { userType: 'Social Worker' } },
// 	agency: { type: Types.Text, label: 'Agency', index: true, initial: true, dependsOn: { userType: 'Social Worker' } },
// 	title: { type: Types.Text, label: 'Title', index: true, initial: true, dependsOn: { userType: 'Social Worker' } }

// }, { heading: 'Prospective Parent/Family Information', dependsOn: { userType: 'Prospective Parent/Family' } }, {

// 	registrationNumber: { type: Number, label: 'Registration Number', format: false, required: true, index: true, initial: true, dependsOn: { userType: ['Prospective Parent/Family'] } },
// 	initialContact: { type: Types.Date, label: 'Initial Contact', default: Date.now(), required: true, initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 	flagCalls: { type: Types.Boolean, label: 'Flag Calls', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 	// familyConstellation: { type: Types.Relationship, label: 'Family Constellation', ref: 'Recommended Family Constellations', required: true, index: true, initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 	familyConstellation: { type: Types.Select, options: 'Single Male, Single Gay Male, Single Straight Male, Single Female, Single Gay Female, Single Straight Female, Female/Female Couple, Male/Male Couple', required: true, index: true, initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 	// language: { type: Types.Select, label: 'Language', options: 'English, Spanish, Portuguese, Chinese, Other', default: 'English', required: true, initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 	language: { type: Types.Text, label: 'Language', required: true, initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },

// }, { heading: 'Contact 1' }, {

// 	contact1FirstName: { type: Types.Text, label: 'First Name', required: true, index: true, initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 	contact1LastName: { type: Types.Text, label: 'Last Name', required: true, index: true, initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 	contact1WorkPhone: { type: Types.Text, label: 'Work Phone Number', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 	contact1CellPhone: { type: Types.Text, label: 'Cell Phone Number', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 	contact1Email: { type: Types.Email, label: 'Email Address', index: true, initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 	contact1PreferredMethod: { type: Types.Select, label: 'Preferred Method', options: 'E-mail, Home Phone, Cell Phone, Work Phone, Unknown', required: true, index: true, initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 	contact1Gender: { type: Types.Select, label: 'Gender', options: 'Male, Female, Other', required: true, index: true, initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 	contact1Race: { type: Types.Select, label: 'Race', options: 'African American, African American/Asian, African American/Caucasian, African American/Hispanic, African American/Native American, Asian, Asian/Caucasian, Asian/Hispanic, Asian/Native American, Caucasian, Caucasian/Hispanic, Caucasian/Native American, Hispanic, Hispanic/Native American, Native American, Other', required: true, index: true, initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 	contact1Occupation: { type: Types.Text, label: 'Occupation', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 	contact1BirthDate: { type: Types.Date, label: 'Date of Birth', required: true, initial: true, dependsOn: { userType: 'Prospective Parent/Family' } }

// }, { heading: 'Contact 2', dependsOn: { userType: 'Prospective Parent/Family' } }, {

// 	contact2FirstName: { type: Types.Text, label: 'First Name', required: true, index: true, initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 	contact2LastName: { type: Types.Text, label: 'Last Name', required: true, index: true, initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 	contact2WorkPhone: { type: Types.Text, label: 'Work Phone Number', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 	contact2CellPhone: { type: Types.Text, label: 'Cell Phone Number', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 	contact2Email: { type: Types.Email, label: 'Email Address', index: true, initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 	contact2PreferredMethod: { type: Types.Select, label: 'Preferred Method', options: 'E-mail, Home Phone, Cell Phone, Work Phone, Unknown', required: true, index: true, initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 	contact2Gender: { type: Types.Select, label: 'Gender', options: 'Male, Female, Other', required: true, index: true, initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 	contact2Race: { type: Types.Select, label: 'Race', options: 'African American, African American/Asian, African American/Caucasian, African American/Hispanic, African American/Native American, Asian, Asian/Caucasian, Asian/Hispanic, Asian/Native American, Caucasian, Caucasian/Hispanic, Caucasian/Native American, Hispanic, Hispanic/Native American, Native American, Other', required: true, index: true, initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 	contact2Occupation: { type: Types.Text, label: 'Occupation', required: true, initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 	contact2BirthDate: { type: Types.Date, label: 'Date of Birth', required: true, initial: true, dependsOn: { userType: 'Prospective Parent/Family' } }

// }, { heading: 'Homestudy', dependsOn: { userType: 'Prospective Parent/Family' } }, {

// 	homestudy: {
// 		complete: { type: Types.Boolean, label: 'Completed homestudy', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 		dateComplete: { type: Types.Date, label: 'Date complete', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 		socialWorkerName: { type: Types.Text, label: 'Social Worker Name', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 		socialWorkerAgency: { type: Types.Text, label: 'Social Worker Agency', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 		SocialWorkerPhone: { type: Types.Text, label: 'Social Worker Phone Number', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 		SocialWorkerEmail: { type: Types.Text, label: 'Social Worker Email Address', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } }
// 	}

// }, { heading: 'Prospective Parent/Family Details', dependsOn: { userType: 'Prospective Parent/Family' } }, {

// 	children: {
// 		total: { type: Types.Number, label: 'Total number of children currently living at home', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 		male: {
// 			total: { type: Types.Number, label: 'Number of male children in home', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 			ages: { type: Types.Text, label: 'Ages of male children (separated by commas)', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 			biologicalTotal: { type: Types.Number, label: 'Number of biological male children', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 			adoptedTotal: { type: Types.Number, label: 'Number of adopted male children', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } }
// 		},
// 		female: {
// 			total: { type: Types.Number, label: 'Number of female children in home', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 			ages: { type: Types.Text, label: 'Ages of female children (separated by commas)', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 			biologicalTotal: { type: Types.Number, label: 'Number of biological female children', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 			adoptedTotal: { type: Types.Number, label: 'Number of adopted female children', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } }
// 		}
// 	},
// 	otherAdultsTotal: { type: Types.Number, label: 'Number of other adults living in home', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 	primaryLanguage: { type: Types.Text, label: 'Primary language spoken at home', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 	otherLanguages: { type: Types.Text, label: 'Other language(s) spoken at home', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } }

// }, { heading: 'Adoption Preferences', dependsOn: { userType: 'Prospective Parent/Family' } }, {

// 	adoptionPreferences: {
// 		approvedFor: {
// 			male: { type: Types.Boolean, label: 'Approved for male children', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 			female: { type: Types.Boolean, label: 'Approved for female children', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } }
// 		},
// 		legalStatus: {
// 			free: { type: Types.Boolean, label: 'Free', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 			atRisk: { type: Types.Boolean, label: 'At Risk', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } }
// 		},
// 		ageRange: {
// 			from: { type: Types.Number, label: 'Age (from)', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 			to: { type: Types.Number, label: 'Age (to)', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } }
// 		},
// 		numberOfChildren: { type: Types.Number, label: 'Number of children preferred', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 		contactWithBiologicalSiblings: { type: Types.Boolean, label: 'Contact with biological siblings', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 		contactWithBiologicalParents: { type: Types.Boolean, label: 'Contact with biological parents', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 		ethnicity: {
// 			africanAmerican: { type: Types.Boolean, label: 'African American', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 			asian: { type: Types.Boolean, label: 'Asian', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 			caucasian: { type: Types.Boolean, label: 'Caucasian', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 			hispanicLatino: { type: Types.Boolean, label: 'Hispanic/Latino', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 			nativeAmerican: { type: Types.Boolean, label: 'Native American', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 			other: { type: Types.Boolean, label: 'Other', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } }
// 		},
// 		needs: {
// 			physical: { type: Types.Select, label: 'Level of physical needs', options: 'Mild, Moderate, Severe', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 			emotional: { type: Types.Select, label: 'Level of emotional needs', options: 'Mild, Moderate, Severe', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } },
// 			intellectual: { type: Types.Select, label: 'Level of intellectual needs', options: 'Mild, Moderate, Severe', initial: true, dependsOn: { userType: 'Prospective Parent/Family' } }
// 		}
// 	}

// }, { heading: 'User Preferences', dependsOn: { userType: ['Site User', 'Social Worker', 'Prospective Parent/Family'] } }, {

// 	userPreferences: {
// 		heardThrough: {
// 			wednesdaysChild: { type: Types.Boolean, label: 'Heard about MARE through Wednesday\'s Child', initial: true, dependsOn: { userType: 'Prospective Parent' } },
// 			friendOrFamily: { type: Types.Boolean, label: 'Heard about MARE through a friend or family member', initial: true, dependsOn: { userType: 'Prospective Parent' } },
// 			jordansFurniture: { type: Types.Boolean, label: 'Heard about MARE through Jordan\'s Furniture', initial: true, dependsOn: { userType: 'Prospective Parent' } },
// 			socialWorker: { type: Types.Boolean, label: 'Heard about MARE through a social worker', initial: true, dependsOn: { userType: 'Prospective Parent' } },
// 			internetSearch: { type: Types.Boolean, label: 'Heard about MARE through an internet search', initial: true, dependsOn: { userType: 'Prospective Parent' } },
// 			other: { type: Types.Boolean, label: 'Heard about MARE through another source', initial: true, dependsOn: { userType: 'Prospective Parent' } },
// 			otherDescription: { type: Types.Text, label: 'Description of other source', initial: true, dependsOn: { other: true, userType: 'Prospective Parent' } }
// 		},
// 		newsLetter: {
// 			quarterly: { type: Types.Boolean, label: 'Add to the MARE News quarterly email list', initial: true, dependsOn: { userType: ['Site User', 'Social Worker', 'Prospective Parent'] } },
// 			adoptionParty: { type: Types.Boolean, label: 'Add to Adoption Party email list', initial: true, dependsOn: { userType: ['Site User', 'Social Worker', 'Prospective Parent'] } }
// 		}
// 	}
// });

// User.relationship({ path: 'children', ref: 'Child', refPath: 'adoptionWorker' });

// // Pre Save
// User.schema.pre('save', function(next) {
// 	'use strict';

// 	// Build the name string for better identification when linking through Relationship field types
// 	var firstName	= this.name.first,
// 		lastName	= this.name.last.length > 0 ? ' ' + this.name.last : '';
	
// 	this.name.fullName = firstName + lastName;

// 	next();
// });

// /* TODO: VERY IMPORTANT:  Need to fix this to provide the link to access the keystone admin panel again */
// /* Changing names or reworking this file changed the check in node_modules/keystone/templates/views/signin.jade for user.isAdmin on line 14 */
// // Provide access to Keystone
// User.schema.virtual('canAccessKeystone').get(function() {
// 	'use strict';
	
// 	return this.userType === 'Administrator' ? true : false;
// });

// // Provide the logged in user's type
// User.schema.virtual('getUserType').get(function() {
// 	'use strict';

// 	return this.userType;
// })

// // Define default columns in the admin interface and register the model
// User.defaultColumns = 'name.fullName, email, userType';
// User.register();