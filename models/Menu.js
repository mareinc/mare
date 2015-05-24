var keystone = require('keystone')

// Create model. Additional options allow menu name to be used as a reference in dropdown menus
var Menu = new keystone.List('Menu', {
    autokey: { path: 'key', from: 'title', unique: true },
    map: { name: 'title' }
});

// Create fields
Menu.add({
    title: { type: String, required: true, initial: true, index: true },
});

// Bind to the page relationship to show all pages added to the menu
Menu.relationship({ path: 'pages', ref: 'Page', refPath: 'menu' });

// Define default columns in the admin interface and register the model
Menu.defaultColumns = 'title';
Menu.register();