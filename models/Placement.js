var keystone = require('keystone'),
Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var Placement = new keystone.List('Placement', {
    track: true,
    autokey: { path: 'key', from: 'slug', unique: true },
    map: { name: 'slug' }
}); 

// Create fields
Placement.add('Date', {
    date: {
        placementDate: { type: Types.Text, label: 'placement date', note: 'mm/dd/yyyy', initial: true },
        disruptionDate: { type: Types.Text, label: 'disruption date', note: 'mm/dd/yyyy', initial: true }
    }

}, 'Placement', {
    child: { type: Types.Relationship, label: 'child', ref: 'Child', required: true, index: true, initial: true },
    prospectiveParentOrFamily: { type: Types.Relationship, label: 'prospective parent or family', ref: 'Prospective Parent or Family', required: true, index: true, initial: true },
    agency: { type: Types.Relationship, label: 'agency', ref: 'Agency', required: true, initial: true },
    nonMAREPlacement: { type: Types.Boolean, label: 'non-MARE placement', index: true, initial: true },
    constellation: { type: Types.Relationship, label: 'constellation', ref: 'Family Constellation', index: true, initial: true },
    race: { type: Types.Relationship, label: 'race', ref: 'Race', index: true, initial: true },
    source: { type: Types.Relationship, label: 'sources', ref: 'Source', index: true, initial: true },
    notes: { type: Types.Textarea, label: 'notes', initial: true }

}, 'Family', {

    family: {
        name: { type: Types.Text, label: 'family name', initial: true },

        address: {
            street1: { type: Types.Text, label: 'address Line 1', required: true, initial: true },
            street2: { type: Types.Text, label: 'address Line 2', initial: true },
            city: { type: Types.Text, label: 'city', required: true, initial: true },
            state: { type: Types.Relationship, label: 'state', ref: 'State', required: true, index: true, initial: true },
            zipCode: { type: Types.Text, label: 'zip code', required: true, index: true, initial: true },
            country: { type: Types.Text, label: 'country', initial: true },
            region: { type: Types.Relationship, label: 'region', ref: 'Region', initial: true }
        },

        phone: {
            work: { type: Types.Text, label: 'work phone number', initial: true },
            home: { type: Types.Text, label: 'home phone number', initial: true },
            cell: { type: Types.Text, label: 'cell phone number', initial: true },
            preferred: { type: Types.Select, label: 'preferred phone', options: 'work, home, cell', initial: true }
        },

        email: { type: Types.Email, label: 'email address', index: true, initial: true },
    }

});

// Define default columns in the admin interface and register the model
Placement.defaultColumns = 'child, family, constellation';
Placement.register();