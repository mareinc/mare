var keystone = require('keystone'),
    Types = keystone.Field.Types;

// Create model
var Child = new keystone.List('Child', {
    autokey: { path: 'key', from: 'registrationNumber', unique: true },
    //map: { name: 'name' }
    defaultSort: 'name'
});

// Create fields
Child.add({
    name: { type: Types.Name, label: 'Name', required: true, index: true, initial: true },
    age: { type: Number, label: 'Age', required: true, index: true, initial: true },
    registrationNumber: { type: Number, label: 'Registration Number', required: true, index: true, initial: true, noedit: true },
    profile: {
        part1: { type: Types.Textarea, label: 'Hi! My name is...', required: true, initial: true }, // TODO: Try to make this dynamic: 'Hi! My name is Jared...'
        part2: { type: Types.Textarea, label: 'Let me tell you more about myself...', required: true, initial: true },
        part3: { type: Types.Textarea, label: 'And here\'s what others say...', required: true, initial: true },
        part4: { type: Types.Textarea, label: 'If I could have my own special wish...', required: true, initial: true }
    },
    primaryLanguage: { type: Types.Select, label: 'Primary Language', options: 'English, Spanish, Portuguese', default: 'English', required: true, initial: true },
    // video: { type: Types.CloudinaryVideo, folder: 'children/', autoCleanup: true },
    image: { type: Types.CloudinaryImage, folder: 'children/', autoCleanup: true },
    ethnicity: { type: Types.Select, label: 'Ethnicity', options: 'Mixed Race, African American, Hispanic/Latino, Asian, Middle Eastern, Pacific Islander, Native American/Alaskan, Other', required: true, initial: true },
    gender: { type: Types.Select, label: 'Gender', options: 'Male, Female', required: true, initial: true },
    legalStatus: { type: Types.Select, label: 'Legal Status', options: 'Legally Free, Something Else', required: true, initial: true },
    wednesdaysChild: { type: Types.Boolean, label: 'Wednesday\'s Child?' },
//    linked Social Worker
//    linked to interested families at various steps in the process
    contactWithSiblings: { type: Types.Boolean, label: 'Has contact with siblings?' },
//    linkedSiblings: {},
    contactWithParents: { type: Types.Boolean, label: 'Has contact with parents?' },
    physicalNeeds: { type: Types.Select, label: 'Physical needs', options: 'Mild, Moderate, Severe', required: true, initial: true },
    // physicalNeedsDescription: { type: Types.Textarea, label: 'Description of physical needs', dependsOn: { physicalNeeds: true } },
    emotionalNeeds: { type: Types.Select, label: 'Emotional needs', options: 'Mild, Moderate, Severe', required: true, initial: true },
    // emotionalNeedsDescription: { type: Types.Textarea, label: 'Description of emotional needs', dependsOn: { emotionalNeeds: true } },
    intellectualNeeds: { type: Types.Select, label: 'Intellectual needs', options: 'Mild, Moderate, Severe', required: true, initial: true },
    // intellectualNeedsDescription: { type: Types.Textarea, label: 'Description of intellectual needs', dependsOn: { intellectualNeeds: true } }
    disabilities: { type: Types.Select, label: 'Disabilities', options: 'Autism, Other', multiple: true, initial: true }
 });

// Pre Save
Child.schema.pre('save', function(next) {
    // TODO: Assign a registration number if one isn't assigned
    next();
});

// // Define default columns in the admin interface and register the model
Child.defaultColumns = 'name, ethnicity, legalStatus, gender, wednesdaysChild';
Child.register();
