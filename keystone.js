// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require( 'dotenv' ).config();

// Initialise New Relic if an app name and license key exists
if( process.env.NEW_RELIC_APP_NAME && process.env.NEW_RELIC_LICENSE_KEY ) {
	require( 'newrelic' );
}

// Initialize application
const keystone = require( 'keystone' ),
	  handlebars = require( 'express-handlebars' ),
	  cron = require( './src/bin/cron' ),
	  fs = require( 'fs' ),
	  glob = require( 'glob' );

keystone.init({

	'name': 'MARE',
	'brand': 'MARE',

	'sass': 'public',
	'static': 'public',
	'favicon': './public/dist/img/favicons/favicon.ico',

	'views': 'src/templates/views',
	'view engine': 'hbs',
	'view cache': false,

	'custom engine': handlebars.create({
		layoutsDir: './src/templates/views/layouts',
		partialsDir: './src/templates/views/partials',
		defaultLayout: 'default',
		helpers: new require( './src/templates/views/helpers' )(),
		extname: '.hbs'
	}).engine,

	'emails': 'src/templates/emails',

	'auto update': true,
	'session': true,
	'session store': 'mongo',
	'auth': true,
	'signin url': '/',
	'signout url': '/',
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

	'wysiwyg additional options': {

		extended_valid_elements : '+div[class]',
		content_css: '/keystone/styles/content/editor.min.css',
		templates: [
    		{ title: '30/70 Content', description: 'Columns (30% Left, 70% Right)', content: '<div class="row"><div class="col-sm-8">Left Content</div><div class="col-sm-16">Right Content</div></div><p>Stuff after...</p>' },
    		{ title: '70/30 Content', description: 'Columns (70% Left, 30% Right)', content: '<div class="row"><div class="col-sm-16">Left Content</div><div class="col-sm-8">Right Content</div></div><p>Stuff after...</p>' },
    		{ title: '50/50 Content', description: 'Columns (50% Left, 50% Right)', content: '<div class="row"><div class="col-sm-12">Left Content</div><div class="col-sm-12">Right Content</div></div><p>Stuff after...</p>' }
  		]
  	},

	'cookie secret': process.env.COOKIE_SECRET || '-eRWCqW&S~{bTw-|nG=]av*#2X*u}<?$v44|LV^|K*.q>.a<&rC[A~6%9rVcgh~)'
});

// Mandrill configuration
keystone.set( 'mandrill api key', process.env.MANDRILL_APIKEY );
keystone.set( 'mandrill username', process.env.MANDRILL_USERNAME );

// Load project's Models
const modelPaths = glob.sync(`*.model.js`, { matchBase: true });

for( let modelPath of modelPaths ) {
	keystone.importFile( modelPath );
}

// Load project Routes
keystone.set( 'routes', require('./src' ) );

// Setup common locals for your templates. The following are required for the
// bundled templates and layouts. Any runtime locals (that should be set uniquely
// for each request) should be added to utility middleware
keystone.set( 'locals', {
	_: require( 'underscore' ),
	moment: require( 'moment' ),
	env: keystone.get( 'env' ),
	utils: keystone.utils,
	editable: keystone.content.editable
});

// TODO: clean this up and add in any reusable email content
// Setup common locals for your emails. The following are required by Keystone's
// default email templates, you may remove them if you're using your own.
keystone.set( 'email locals', {
	logo_src: './public/dist/img/mare-logo.png',
	logo_width: 194,
	logo_height: 76,
	logo: `data:image/png;base64,${ Buffer.from( fs.readFileSync( './public/dist/img/mare-logo.png' ) ).toString( 'base64' ) }`,
	theme: {
		email_bg: '#f9f9f9',
		link_color: '#2697de',
		buttons: {
			color: '#fff',
			background_color: '#2697de',
			border_color: '#1a7cb7'
		}
	},
	host: ( function() {
		'use strict';

		if ( keystone.get( 'env' ) === 'development' ) { return 'http://development.adoptions.io'; }
		if ( keystone.get( 'env' ) === 'staging' ) { return 'http://staging.adoptions.io'; }
		if ( keystone.get( 'env' ) === 'production' ) { return 'https://www.mareinc.org'; }

		return ( keystone.get( 'host' ) || 'http://localhost:' ) + (keystone.get( 'port' ) || '3000' );
	})()
});

// Configure the navigation bar in Keystone's Admin UI
keystone.set( 'nav', {
	'people'			: [ 'admins', 'site-visitors', 'families', 'social-workers', 'children', 'outside-contacts',
						   'contact-groups' ],
	'other'				: [ 'account-verification-codes', 'agencies', 'inquiries', 'internal-notes', 'mare-in-the-news' ],
	'events'			: [ 'events' ],
	'mailing lists'		: [ 'mailchimp-lists' ],
	'placements'		: [ 'matches', 'placements', 'legalizations', 'disruptions', 'weekend-family-connections', 'mentorships' ],
	'relationships'		: [ 'csc-region-contacts', 'staff-email-contacts', 'media-features' ],
	'matching histories': [ 'child-matching-histories', 'family-matching-histories' ],
	'change tracking'	: [ 'child-histories', 'family-histories', 'social-worker-histories' ],
	'donations'			: [ 'donations' ],
	'images'			: [ 'featured-items', 'slideshows', 'slideshow-items' ],
	'content pages'		: [ 'pages' ],
	'content snippets'	: [ 'success-stories', 'global-alerts' ],
	'lists'				: [ 'child-statuses', 'child-types', 'city-or-towns', 'closed-reasons', 'communication-methods', 'disabilities',
						    'email-targets', 'event-types', 'family-constellations', 'family-statuses', 'genders', 'inquiry-methods',
						    'inquiry-types', 'languages', 'legal-statuses', 'match-determinations', 'media-eligibilities',
							'media-types', 'other-considerations', 'other-family-constellation-considerations', 'races', 'regions',
							'residences', 'social-worker-positions', 'sources', 'states', 'way-to-hear-about-mares' ]
});

// Start Keystone to connect to the database and initialise the web server
keystone.start( () => {
	// set up an hourly task to deactivate events in the past
	cron.scheduleEventDeactivator();
	// set up a nightly task to save models meant to keep siblings in sync and data propagating through models
	cron.scheduleModelSaver();
});
