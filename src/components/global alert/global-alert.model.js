const keystone = require('keystone'),
	Types = keystone.Field.Types;

const GlobalAlert = new keystone.List( 'Global Alert', {
    map: { name: 'title' },
    nocreate: true
});

// Create fields
GlobalAlert.add({
    title:      { type: Types.Text, label: 'alert title', required: true, initial: true },
    message:    { type: Types.Html, label: 'alert message', wysiwyg: true, required: true, initial: true, 
                    note: 'Relative path links will not work, the full URL needs to specified.  E.g. "https://www.mareinc.org/page/test" instead of "/page/test".' },
    isActive:   { type: Types.Boolean, label: 'display alert', default: false, initial: true, 
                    note: 'When checked, the alert will display at the top of every page on the website.' }
});

// Define default columns in the admin interface and register the model
GlobalAlert.defaultColumns = 'title';
GlobalAlert.register();