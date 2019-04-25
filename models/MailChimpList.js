const keystone  = require( 'keystone' ),
      Types     = keystone.Field.Types;

// Create model
const MailChimpList = new keystone.List('MailChimpList', {
    label:      'MailChimp List',
	autokey:    { path: 'key', from: 'name', unique: true }
});

// Create fields
MailChimpList.add( 'Mailing List', {
    name:      { type: Types.Text, label: 'mailing list name', required: true, initial: true },
    displayText: { type: Types.Text, label: 'label on website', initial: true }
    }, 'MailChimp Configuration', {
    mailChimpId:    { type: Types.Text, label: 'mailchimp list id', required: true, initial: true }
});

// Define default columns in the admin interface and register the model
MailChimpList.defaultColumns = 'name, mailChimpId';
MailChimpList.register();
