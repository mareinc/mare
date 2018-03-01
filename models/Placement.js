var keystone	= require( 'keystone' ),
Types			= keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var Placement = new keystone.List( 'Placement' );

// Create fields
Placement.add( 'Placement', {

	placementDate: { type: Types.Date, label: 'placement date', format: 'MM/DD/YYYY', utc: true, initial: true },
	legalizationDate: { type: Types.Date, label: 'legalization date', format: 'MM/DD/YYYY', utc: true, initial: true },
	reunificationDate: { type: Types.Date, label: 'reunification date', format: 'MM/DD/YYYY', utc: true, initial: true },
	withdrawnDate: { type: Types.Date, label: 'withdrawn date', format: 'MM/DD/YYYY', utc: true, initial: true },
	disruptionDate: { type: Types.Date, label: 'disruption date', format: 'MM/DD/YYYY', utc: true, initial: true },

	familyAgency: { type: Types.Relationship, label: 'family\'s agency', ref: 'Agency', dependsOn: { isUnregisteredFamily: false }, filters: { isActive: true }, initial: true },
	constellation: { type: Types.Relationship, label: 'constellation', ref: 'Family Constellation', dependsOn: { isUnregisteredFamily: true }, initial: true },
	race: { type: Types.Relationship, label: 'race', ref: 'Race', dependsOn: { isUnregisteredFamily: true }, many: true, initial: true },
	source: { type: Types.Relationship, label: 'source', ref: 'Source', filters: { isActive: true }, initial: true },
	additionalSources: { type: Types.Relationship, label: 'additional sources', ref: 'Source', filters: { isActive: true }, many: true, initial: true },
	notes: { type: Types.Textarea, label: 'notes', initial: true }

}, 'Child', {

	isUnregisteredChild: { type: Types.Boolean, label: 'unregistered child', initial: true },

	child: { type: Types.Relationship, label: 'child', ref: 'Child', dependsOn: { isUnregisteredChild: false }, initial: true },

	childDetails: {
    	firstName: { type: Types.Text, label: 'first name', dependsOn: { isUnregisteredChild: true }, initial: true },
		lastName: { type: Types.Text, label: 'last name', dependsOn: { isUnregisteredChild: true }, initial: true },
		status: { type: Types.Relationship, label: 'status', ref: 'Child Status', dependsOn: { isUnregisteredChild: true }, initial: true }
    }

}, 'Family', {

	isUnregisteredFamily: { type: Types.Boolean, label: 'unregistered family', initial: true },

	family: { type: Types.Relationship, label: 'family', ref: 'Family', dependsOn: { isUnregisteredFamily: false }, initial: true },

	familyDetails: {
		name: { type: Types.Text, label: 'family name', dependsOn: { isUnregisteredFamily: true }, initial: true },

		address: {
			street1: { type: Types.Text, label: 'address Line 1', dependsOn: { isUnregisteredFamily: true }, initial: true },
			street2: { type: Types.Text, label: 'address Line 2', dependsOn: { isUnregisteredFamily: true }, initial: true },
			city: { type: Types.Text, label: 'city', dependsOn: { isUnregisteredFamily: true }, initial: true },
			state: { type: Types.Relationship, label: 'state', ref: 'State', dependsOn: { isUnregisteredFamily: true }, initial: true },
			zipCode: { type: Types.Text, label: 'zip code', dependsOn: { isUnregisteredFamily: true }, initial: true },
			country: { type: Types.Text, label: 'country', dependsOn: { isUnregisteredFamily: true }, initial: true },
			region: { type: Types.Relationship, label: 'region', dependsOn: { isUnregisteredFamily: true }, ref: 'Region', initial: true }
		},

		phone: {
			work: { type: Types.Text, label: 'work phone number', dependsOn: { isUnregisteredFamily: true }, initial: true },
			home: { type: Types.Text, label: 'home phone number', dependsOn: { isUnregisteredFamily: true }, initial: true },
			mobile: { type: Types.Text, label: 'mobile phone number', dependsOn: { isUnregisteredFamily: true }, initial: true },
			preferred: { type: Types.Select, label: 'preferred phone', options: 'work, home, mobile', dependsOn: { isUnregisteredFamily: true }, initial: true }
		},

		email: { type: Types.Email, label: 'email address', dependsOn: { isUnregisteredFamily: true }, initial: true }
	}
});

// Define default columns in the admin interface and register the model
Placement.defaultColumns = 'placementDate, child, family, family.name, source';
Placement.register();