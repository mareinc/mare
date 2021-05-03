const keystone = require( 'keystone' );
const Types = keystone.Field.Types;
const moment = require( 'moment' );

const ProfileSearch = new keystone.List( 'Profile Search', {
    autokey: { path: 'key', from: 'user', unique: true },
    map: { name: 'email' },
    nocreate: true,
    noedit: true
});

ProfileSearch.add( 'Search Details', {
    
    email:                  { type: Types.Text, label: 'searcher\'s email' },
    user:                   { type: Types.Relationship, label: 'search user', ref: 'User' },
    searchDate:             { type: Types.Date, label: 'date of last search', utc: true }

}, 'Child Criteria', {

    genders:                { type: Types.TextArray },
    minChildren:            { type: Types.Number },
    maxChildren:            { type: Types.Number },
    minAge:                 { type: Types.Number },
    maxAge:                 { type: Types.Number },
    races:                  { type: Types.TextArray },
    languages:              { type: Types.TextArray },
    contactWithSiblings:    { type: Types.Boolean },
    contactWithParents:     { type: Types.Boolean }

}, 'Search Limits', {

    mustHaveVideo:          { type: Types.Boolean },
    mustBeLegallyFree:      { type: Types.Boolean },
    lastProfileUpdate:      { type: Types.Text },
    socialWorkerRegions:    { type: Types.TextArray }

}, 'Disability Criteria', {

    maxPhysicalNeeds:       { type: Types.Number },
    maxEmotionalNeeds:      { type: Types.Number },
    maxIntellectualNeeds:   { type: Types.Number },
    developmentalNeeds:     { type: Types.TextArray }
    
}, 'Family Profile Criteria', {

    familyConstellation:    { type: Types.Text },
    numChildrenInHome:      { type: Types.Number },
    youngestChildAge:       { type: Types.Number },
    oldestChildAge:         { type: Types.Number },
    hasPetsInHome:          { type: Types.Boolean }

});

ProfileSearch.schema.pre( 'save', function( next ) {

    this.searchDate = moment.utc();
    next();
});

// Define default columns in the admin interface and register the model
ProfileSearch.defaultColumns = 'email, searchDate';
ProfileSearch.register();
