var keystone = require('keystone'),
Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var Placement = new keystone.List('Placement');

// Create fields
Placement.add('Placement', {
    placementDate: { type: Types.Date, label: 'placement date', format: 'MM/DD/YYYY', initial: true },
    child: { type: Types.Relationship, label: 'child', ref: 'Child', required: true, initial: true },
    childPlacedWithMAREFamily: { type: Types.Boolean, label: 'child placed with MARE family', initial: true },
    placedWithFamily: { type: Types.Relationship, label: 'family', ref: 'Family', dependsOn: { childPlacedWithMAREFamily: true }, required: true, initial: true },
    familyAgency: { type: Types.Relationship, label: 'family\'s agency', ref: 'Agency', dependsOn: { childPlacedWithMAREFamily: true }, required: true, initial: true },
    constellation: { type: Types.Relationship, label: 'constellation', ref: 'Family Constellation', dependsOn: { childPlacedWithMAREFamily: false }, initial: true },
    race: { type: Types.Relationship, label: 'race', ref: 'Race', dependsOn: { childPlacedWithMAREFamily: false }, many: true, initial: true },
    source: { type: Types.Relationship, label: 'sources', ref: 'Source', initial: true },
    notes: { type: Types.Textarea, label: 'notes', initial: true }

}, 'Family', {

    family: {
        name: { type: Types.Text, label: 'family name', dependsOn: { childPlacedWithMAREFamily: false }, initial: true },

        address: {
            street1: { type: Types.Text, label: 'address Line 1', dependsOn: { childPlacedWithMAREFamily: false }, initial: true },
            street2: { type: Types.Text, label: 'address Line 2', dependsOn: { childPlacedWithMAREFamily: false }, initial: true },
            city: { type: Types.Text, label: 'city', dependsOn: { childPlacedWithMAREFamily: false }, initial: true },
            state: { type: Types.Relationship, label: 'state', ref: 'State', dependsOn: { childPlacedWithMAREFamily: false }, initial: true },
            zipCode: { type: Types.Text, label: 'zip code', dependsOn: { childPlacedWithMAREFamily: false }, initial: true },
            country: { type: Types.Text, label: 'country', dependsOn: { childPlacedWithMAREFamily: false }, initial: true },
            region: { type: Types.Relationship, label: 'region', dependsOn: { childPlacedWithMAREFamily: false }, ref: 'Region', initial: true }
        },

        phone: {
            work: { type: Types.Text, label: 'work phone number', dependsOn: { childPlacedWithMAREFamily: false }, initial: true },
            home: { type: Types.Text, label: 'home phone number', dependsOn: { childPlacedWithMAREFamily: false }, initial: true },
            mobile: { type: Types.Text, label: 'mobile phone number', dependsOn: { childPlacedWithMAREFamily: false }, initial: true },
            preferred: { type: Types.Select, label: 'preferred phone', options: 'work, home, mobile', dependsOn: { childPlacedWithMAREFamily: false }, initial: true }
        },

        email: { type: Types.Email, label: 'email address', dependsOn: { childPlacedWithMAREFamily: false }, initial: true },
    }

}, 'Disruption', {
    disruptionDate: { type: Types.Date, label: 'disruption date', format: 'MM/DD/YYYY', initial: true }
});

// Define default columns in the admin interface and register the model
Placement.defaultColumns = 'placementDate, child, placedWithFamily, family.name, source';
Placement.register();