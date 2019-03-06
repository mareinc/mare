const keystone  = require( 'keystone' ),
      Types     = keystone.Field.Types;

// Create model
const MailChimpList = new keystone.List('MailChimpList', {
    label:      'MailChimp List',
	autokey:    { path: 'key', from: 'name', unique: true }
});

// Create fields
MailChimpList.add({
    name:      { type: Types.Text, required: true, initial: true },
    listId:    { type: Types.Text, required: true, initial: true }
});

// Define default columns in the admin interface and register the model
MailChimpList.defaultColumns = 'name, listId';
MailChimpList.register();
