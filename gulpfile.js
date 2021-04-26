const del = require( 'del' );
const { task, dest, src, watch, series, parallel } = require( 'gulp' );
const autoprefixer = require( 'gulp-autoprefixer' );
const cleanCSS = require( 'gulp-clean-css' );
const concat = require( 'gulp-concat' );
const eslint = require( 'gulp-eslint' );
const gulpif = require( 'gulp-if' );
const imagemin = require( 'gulp-imagemin' );
const mocha = require( 'gulp-mocha' );
const modernizr = require( 'gulp-modernizr' );
const rename = require( 'gulp-rename' );
const sass = require( 'gulp-sass' );
const uglify = require( 'gulp-uglify' );

// path variables
const paths = {
	'styles': [
		'public/plugins/**/*.css',
		'public/styles/**/*.scss' ],
	'dashboard-styles': [ 'public/dashboard-styles/*.scss' ],
	'font-styles': [ 'public/styles/font-awesome/*.css' ],
	'plugin-styles': [ 'public/plugins/**/*.css' ],
	'scripts': [
		'public/js/mare.js',
		'public/js/models/*.js',
		'public/js/collections/*.js',
		'public/js/views/*.js',
		'public/js/routers/*.js',
		'public/js/main.js'
	],
	'plugins': [ 'public/plugins/**/*.js' ],
	'images': [
		'public/images/**/*',
		'public/plugins/**/*.gif' ],
	'fonts': [ 'public/fonts/**' ],
	'tests': [ 'tests/*.js' ]
};

// build the site stylesheet
task( 'styles', () => {
	return src( paths.styles, { sourcemaps: true } )
		.pipe( gulpif( file => file.sourceMap.file.endsWith( '.scss' ), sass() ) )
		.pipe( autoprefixer() )
		.pipe( concat( 'mare.css' ) )
		.pipe( cleanCSS( { compatibility: 'ie8' } ) )
		.pipe( rename( { suffix: '.min' } ) )
		.pipe( dest( 'public/dist', { sourcemaps: '.' } ) );
});

// build the admin dashboard stylesheet
task( 'dashboard-styles', () => {
	return src( paths[ 'dashboard-styles' ], { sourcemaps: true } )
		.pipe( gulpif( file => file.sourceMap.file.endsWith( '.scss' ), sass() ) )
		.pipe( autoprefixer() )
		.pipe( concat( 'dashboard.css' ) )
		.pipe( cleanCSS( { compatibility: 'ie8' } ) )
		.pipe( rename( { suffix: '.min' } ) )
		.pipe( dest( 'public/dist', { sourcemaps: '.' } ) );
});


// TODO: need to figure out why it's not coming in with the Bootstrap styles for the minified output.
// task for styles which are meant to remain separate from the concatenated, minified styles file
task( 'font-styles', () => {
	return src( paths[ 'font-styles' ] )
		.pipe( dest( 'public/dist' ) )
});

task( 'plugin-styles', () => {
	return src( paths[ 'plugin-styles' ], { sourcemaps: true } )
		.pipe( autoprefixer() )
		.pipe( concat( 'plugins.css' ) )
		.pipe( cleanCSS( { compatibility: 'ie8' } ) )
		.pipe( rename( { suffix: '.min' } ) )
		.pipe( dest( 'public/dist', { sourcemaps: '.' } ) );
});

// move fonts to public/dist/
task( 'fonts', () => {
	return src( paths.fonts )
		.pipe( dest( 'public/dist/fonts' ) )
});

// generate scripts file
task( 'scripts', () => {
	return src( paths.scripts, { sourcemaps: true } )
		.pipe( concat( 'mare.js' ) )
		.pipe( uglify() )
		.pipe( rename( { suffix: '.min' } ) )
		.pipe( dest( 'public/dist', { sourcemaps: '.' } ) );
});

// copy plugins to public/dist/
task( 'plugins', () => {
	return src( paths.plugins, { sourcemaps: true } )
		.pipe( concat( 'plugins.js' ) )
		// .pipe( uglify() )
		// .pipe( rename( { suffix: '.min' } ) )
		// .pipe( dest( 'public/dist', { sourcemaps: '.' } ) );
		.pipe( dest( 'public/dist' ) );
});

// generate a minimal modernizr file based on features detected in public/dist/
task( 'modernizr', () => {
	return src( [ ...paths.scripts, ...paths.plugins, ...paths.styles, ...paths[ 'dashboard-styles'], ...paths[ 'font-styles' ], ...paths[ 'plugin-styles' ] ] )
		.pipe( modernizr( require( './modernizr-config.json' ) ) )
		.pipe( uglify() )
		.pipe( rename( { suffix: '.min' } ) )
		.pipe( dest( 'public/dist/' ) );
})

// optimize and move images to public/dist/img/
task( 'images', () => {
	return src( paths.images )
		.pipe( imagemin() )
		.pipe( dest( 'public/dist/img' ) );
});

// gulp eslint task
task( 'eslint', () => {
	return src( paths[ 'scripts' ] )
		.pipe( eslint() ) // eslint() attaches the lint output to the "eslint" property of the file object so it can be used by other modules.
		.pipe( eslint.format() ) // eslint.format() outputs the lint results to the console.  Alternatively use eslint.formatEach() (see Docs).
		.pipe( eslint.failAfterError() ); // To have the process exit with an error code (1) on lint error, return the stream and pipe to failAfterError last.
});

// gulp eslint task for watching
task( 'eslint-watch', () => {
	return src( paths[ 'scripts' ] )
		.pipe( eslint() ) // eslint() attaches the lint output to the "eslint" property of the file object so it can be used by other modules.
		.pipe( eslint.format() ); // eslint.format() outputs the lint results to the console.  Alternatively use eslint.formatEach() (see Docs).
});

// watch task
task( 'watch', () => {
	watch( paths.styles, series( 'styles' ) );
	watch( paths[ 'dashboard-styles' ], series( 'dashboard-styles' ) );
	watch( paths.scripts, series( 'eslint-watch', 'scripts' ) );
	watch( paths.images, series( 'images' ) );
	watch( paths.tests, series( 'test' ) );
});

// empty out the dist directory to ensure old files don't hang around
task( 'clean', () => del( [ 'public/dist/*' ] ) );

// run unit tests
task( 'test', () => {
	return src( paths.tests, { read: false } )
		// gulp-mocha needs filepaths so you can't have any plugins before it
		.pipe( mocha( { reporter: 'nyan' } ) )
});

// gulp build task
task( 'build', parallel( 'styles', 'font-styles', 'dashboard-styles', 'plugin-styles', 'scripts', 'plugins', 'modernizr', 'images', 'fonts' ) );
// custom build for travis CI
task( 'travis', series( 'clean', 'test', 'build' ) );
// default tasks to run when 'gulp' is called
task( 'default', series( 'clean', 'eslint-watch', 'test', 'build', 'watch' ) );
