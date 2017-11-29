// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').load();

// Initialise New Relic if an app name and license key exists
if (process.env.NEW_RELIC_APP_NAME && process.env.NEW_RELIC_LICENSE_KEY) {
	require('newrelic');
}

// Initialize application
var keystone = require('keystone'),
	handlebars = require('express-handlebars');

keystone.init({

	'name': 'MARE',
	'brand': 'MARE',

	'sass': 'public',
	'static': 'public',
	'favicon': 'public/favicon.ico',

	'views': 'templates/views',
	'view engine': 'hbs',
	'view cache': false,

	'custom engine': handlebars.create({
		layoutsDir: 'templates/views/layouts',
		partialsDir: 'templates/views/partials',
		defaultLayout: 'default',
		helpers: new require('./templates/views/helpers')(),
		extname: '.hbs'
	}).engine,

	'emails': 'templates/emails',

	'auto update': true,
	'session': true,
	'auth': true,
	'signin url': '/',
	'user model': 'User',

	'wysiwyg override toolbar': false,
	'wysiwyg menubar': true,
	'wysiwyg skin': 'lightgray',
	'wysiwyg additional buttons': 'searchreplace visualchars,' +
	 	' charmap ltr rtl pagebreak paste,' +
	 	' emoticons media image, preview print',
	'wysiwyg additional plugins': 'advlist, anchor,' +
		' autolink, autosave, charmap, contextmenu,' +
		' directionality, emoticons, hr, media, pagebreak,' +
		' paste, preview, print, searchreplace, table, template' +
		' visualblocks, visualchars, wordcount',
	'wysiwyg cloudinary images': true,

	'wysiwyg additional options': {

		extended_valid_elements : '+div[class]',
		content_css: '/keystone/styles/content/editor.min.css',
		templates: [
    		{title: '30/70 Content', description: 'Columns (30% Left, 70% Right)', content: '<div class="row"><div class="col-sm-8">Left Content</div><div class="col-sm-16">Right Content</div></div><p>Stuff after...</p>'},
    		{title: '70/30 Content', description: 'Columns (70% Left, 30% Right)', content: '<div class="row"><div class="col-sm-16">Left Content</div><div class="col-sm-8">Right Content</div></div><p>Stuff after...</p>'},
    		{title: '50/50 Content', description: 'Columns (50% Left, 50% Right)', content: '<div class="row"><div class="col-sm-12">Left Content</div><div class="col-sm-12">Right Content</div></div><p>Stuff after...</p>'}
  		]
  	},

	'cookie secret': process.env.COOKIE_SECRET || '-eRWCqW&S~{bTw-|nG=]av*#2X*u}<?$v44|LV^|K*.q>.a<&rC[A~6%9rVcgh~)'
});

// Cloudinary configuration
// optional, will prefix each image public_id with [{prefix}]/{list.path}/{field.path}/
keystone.set('cloudinary folders', true);
// optional, will force cloudinary to serve images over https
keystone.set('cloudinary secure', true);

// Mandrill configuration
keystone.set('mandrill api key', process.env.MANDRILL_APIKEY);
keystone.set('mandrill username', process.env.MANDRILL_USERNAME);

// S3 configuration for hosted file storage
keystone.set('s3 config', { bucket: process.env.S3_BUCKET_NAME, key: process.env.S3_KEY, secret: process.env.S3_SECRET });

// Load project's Models
keystone.import('models');

// Load project Routes
keystone.set('routes', require('./routes'));

// Setup common locals for your templates. The following are required for the
// bundled templates and layouts. Any runtime locals (that should be set uniquely
// for each request) should be added to ./routes/middleware/middleware.js
keystone.set('locals', {
	_: require('underscore'),
	moment: require('moment'),
	env: keystone.get('env'),
	utils: keystone.utils,
	editable: keystone.content.editable
});

// Setup common locals for your emails. The following are required by Keystone's
// default email templates, you may remove them if you're using your own.
keystone.set('email locals', {
	logo_src: '/public/dist/img/mare-logo.png',
	logo_width: 194,
	logo_height: 76,
	theme: {
		email_bg: '#f9f9f9',
		link_color: '#2697de',
		buttons: {
			color: '#fff',
			background_color: '#2697de',
			border_color: '#1a7cb7'
		}
	},
	host: (function() {
		'use strict';

		if (keystone.get('env') === 'development') { return 'http://development.adoptions.io'; }
		if (keystone.get('env') === 'staging') { return 'http://staging.adoptions.io'; }
		if (keystone.get('env') === 'production') { return 'http://adoptions.io'; }
		return (keystone.get('host') || 'http://localhost:') + (keystone.get('port') || '3000');
	})()
});

keystone.set('email rules', [{
	find: '/templates/emails/',
	replace: (function() {
		'use strict';

		if (keystone.get('env') === 'development') { return 'http://development.adoptions.io/templates/emails/'; }
		if (keystone.get('env') === 'staging') { return 'http://staging.adoptions.io/templates/emails/'; }
		if (keystone.get('env') === 'production') { return 'http://adoptions.io/templates/emails/'; }
		return (keystone.get('host') || 'http://localhost:') + (keystone.get('port') || '3000') + '/templates/emails/';
	})()
}, {
	find: '/keystone/',
	replace: (function() {
		'use strict';

		if (keystone.get('env') === 'development') { return 'http://development.adoptions.io/keystone'; }
		if (keystone.get('env') === 'staging') { return 'http://staging.adoptions.io/keystone'; }
		if (keystone.get('env') === 'production') { return 'http://adoptions.io/keystone'; }
		return (keystone.get('host') || 'http://localhost:') + (keystone.get('port') || '3000/keystone');
	})()
}]);

// Load your project's email test routes
keystone.set('email tests', require('./routes/emails'));

// Configure the navigation bar in Keystone's Admin UI
keystone.set('nav', {
	'people'			: [ 'admins', 'site-visitors', 'families', 'social-workers', 'children', 'outside-contacts',
						   'contact-groups' ],
	'other'				: [ 'account-verification-codes', 'agencies', 'inquiries', 'internal-notes', 'media-types',
							'mare-in-the-news' ],
	'events'			: [ 'events' ],
	'mailing lists'		: [ 'mailing-lists' ],
	'relationships'		: [ 'csc-region-contacts', 'staff-email-contacts', 'matches', 'media-features', 'placements' ],
	'change tracking'	: [ 'child-histories', 'family-histories', 'social-worker-histories' ],
	'lists'				: [ 'child-statuses', 'child-types', 'city-or-towns', 'closed-reasons', 'communication-methods',
						    'disabilities', 'event-types', 'family-constellations', 'family-statuses', 'genders', 'inquiry-methods',
						    'inquiry-types', 'languages', 'legal-statuses', 'match-determinations', 'media-eligibilities',
						    'other-considerations', 'other-family-constellation-considerations', 'races', 'regions', 'residences',
							'social-worker-positions', 'sources', 'staff-email-targets', 'states', 'way-to-hear-about-mares' ],
	'donations'			: [ 'donations' ],
	'images'			: [ 'featured-items', 'slideshows', 'slideshow-items' ],
	'content pages'		: [ 'pages' ],
	'content snippets'	: [ 'success-stories' ]
});

// Start Keystone to connect to your database and initialise the web server
keystone.start();
