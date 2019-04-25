const keystone  = require( 'keystone' ),
      Types     = keystone.Field.Types;

// Create model
const MailchimpList = new keystone.List('Mailchimp List', {
    label:      'Mailchimp List',
	autokey:    { path: 'key', from: 'name', unique: true }
});

// Create fields
MailchimpList.add( 'Mailing List', {
    name:      { type: Types.Text, label: 'mailing list name', required: true, initial: true },
    displayText: { type: Types.Text, label: 'label on website', initial: true }
    }, 'Mailchimp Configuration', {
    mailchimpId:    { type: Types.Text, label: 'mailchimp list id', required: true, initial: true }
});

// Define default columns in the admin interface and register the model
MailchimpList.defaultColumns = 'name, mailchimpId';
MailchimpList.register();
