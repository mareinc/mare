// var keystone = require('keystone'),
//     Types = keystone.Field.Types;

// // Create model
// var Child = new keystone.List('Child', {
//     autokey: { path: 'key', from: 'registrationNumber', unique: true },
//     //map: { name: 'name' }
// });

// // Create fields
// Child.add({
//     name: { type: Types.Name, required: true, index: true, initial: true },
//     age: { type: Number, required: true, index: true, initial: true },
//     registrationNumber: { type: Number, required: true, index: true, initial: true },
//     // profile: { },
//     // Profile (text, 4 parts)
        
//     //     ‘Hi! My name is Destiny.’
//     //     ‘Let me tell you more about myself…’
//     //     ‘And here’s what others say…’
//     //     ‘If I could have my own special wish…’
//     primaryLanguage: { type: Types.Select, options: 'a, b, c', default: 'a' },
//     video: {},
//     image: {},
//     ethnicity: {},
//     gender: {},
//     legalStatus: {},
//     wednesdaysChild: {},
//     linked Social Worker
//     linked to interested families at various steps in the process
//     contactWithSiblings: {},
//     linkedSiblings: {},
//     contactWithParents: {},
//     physicalNeeds: {},
//     physicalNeedsDescription: {},
//     emotionalNeeds: {},
//     emotionalNeedsDescription: {},
//     intellectualNeeds: {},
//     intellectualNeedsDescription: {},
//     disabilities: {}

// // Define default columns in the admin interface and register the model
// Child.defaultColumns = 'name, ethnicity, legalStatus, gender, wednesdaysChild';
// Child.register();
