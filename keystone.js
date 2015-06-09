//require('newrelic');
// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').load();

// Require keystone
var keystone = require('keystone'),
  handlebars = require('express-handlebars');

// Initialise Keystone with your project's configuration.
// See http://keystonejs.com/guide/config for available options
// and documentation.

keystone.init({

  'name': 'MARE',
  'brand': 'MARE',

  'sass': 'public',
  'static': 'public',
  'favicon': 'public/favicon.ico',
  'views': 'templates/views',
  'view engine': 'hbs',
  
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
  'user model': 'User',
  // TODO: Check to see if this should remain private, especially if the project is open source
  'cookie secret': 'tq+qW&CaS~{bTSw|nG=]KGW#2X*u}<?$v9S|LaD|K*.q>.a<&rC[A~6%9rEwtl~h',

});

// Load your project's Models
keystone.import('models');

// Setup common locals for your templates. The following are required for the
// bundled templates and layouts. Any runtime locals (that should be set uniquely
// for each request) should be added to ./routes/middleware.js
keystone.set('locals', {
  _: require('underscore'),
  env: keystone.get('env'),
  utils: keystone.utils,
  editable: keystone.content.editable
});

// Load your project's Routes
keystone.set('routes', require('./routes'));

// Setup common locals for your emails. The following are required by Keystone's
// default email templates, you may remove them if you're using your own.
keystone.set('email locals', {
  logo_src: '/images/logo-email.gif',
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
  }
});

// Setup replacement rules for emails, to automate the handling of differences
// between development a production.

// Be sure to update this rule to include your site's actual domain, and add
// other rules your email templates require.

// UNCOMMENT SECTION BELOW TO START WORK ACCOMODATING MORE ENVIRONMENT TYPES

// var path =  switch(keystone.get('env')) {
//               case 'development': 'http://development.adoptions.io/'; break;
//               case 'test'       : 'http://staging.adoptions.io/';     break;
//               case 'production' : 'http://adoptions.io/';             break;
//               default           : 'http://localhost:3000/':
//             }

// keystone.set('email rules', [{
//   find: '/images/',
//   replace: path + 'images/';
// }, {
//   find '/keystone/',
//   replace: path + 'keystone/';
// }]);

keystone.set('email rules', [{
  find: '/images/',
  replace: (keystone.get('env') === 'production') ? 'http://adoptions.io/images/' : 'http://localhost:3000/images/'
}, {
  find: '/keystone/',
  replace: (keystone.get('env') === 'production') ? 'http://adoptions.io/keystone/' : 'http://localhost:3000/keystone/'
}]);

// Load your project's email test routes
keystone.set('email tests', require('./routes/emails'));

// Configure the navigation bar in Keystone's Admin UI
keystone.set('nav', {
  'users': 'users'
});

// Start Keystone to connect to your database and initialise the web server
keystone.start();
