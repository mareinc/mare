const gulp 			= require( 'gulp' );
const watch 		= require( 'gulp-watch' );
const sass 			= require( 'gulp-sass' );
const del 			= require( 'del' );
const concat 		= require( 'gulp-concat' );
const rename		= require( 'gulp-rename' );
const uglify		= require( 'gulp-uglify' );
const cleanCSS		= require( 'gulp-clean-css' );
const sourcemaps 	= require( 'gulp-sourcemaps' );
const autoprefixer 	= require( 'gulp-autoprefixer' );
const imagemin		= require( 'gulp-imagemin' );
const gulpIgnore 	= require( 'gulp-ignore' );
const eslint		= require( 'gulp-eslint' );
const mocha			= require( 'gulp-mocha' );

// path variables
const paths = {
	'src':[
		'./src/models/**/*.js',
		'./src/routes/**/*.js',
		'./src/keystone.js',
		'package.json' ],
	'css':[
		'public/modules/**/*.css',
		'public/styles/**/*.scss' ],
	'dashboard-css':[
		'public/dashboard-styles/dashboard.scss' ],
	'standalone-css':[
		'public/styles/font-awesome/*.css' ],
	'js':[
		'public/modules/**/*.js',
		'public/js/mare.js',
		'public/js/models/*.js',
		'public/js/collections/*.js',
		'public/js/views/*.js',
		'public/js/routers/*.js',
		'public/js/main.js' ],
	'standalone-js':[
		'public/js/lib/standalone-scripts/**/*.js' ],
	'lint-js':[
		'public/js/mare.js',
		'public/js/models/*.js',
		'public/js/collections/*.js',
		'public/js/views/*.js',
		'public/js/routers/*.js',
		'public/js/main.js' ],
	'img':[
		'public/images/**/*',
		'public/modules/**/*.gif' ],
	'fonts':[
		'public/fonts/*.eot',
		'public/fonts/*.svg',
		'public/fonts/*.ttf',
		'public/fonts/*.woff',
		'public/fonts/*.woff2' ],
	'tests':[
		'tests/*.js' ]
};

// styles task
gulp.task( 'styles', () => {
	return gulp.src( paths.css )
		.pipe( sourcemaps.init() )
		.pipe( sass() )
		.pipe( autoprefixer() )
		.pipe( concat( 'mare.css' ) )
		.pipe( gulp.dest( 'public/dist' ) )
		.pipe( cleanCSS( { compatibility: 'ie8' } ) )
		.pipe( rename( { suffix: '.min' } ) )
		.pipe( sourcemaps.write( '.' ) )
		.pipe( gulp.dest( 'public/dist' ) );
});
// dashboard styles task
gulp.task( 'dashboard-styles', () => {
	return gulp.src( paths[ 'dashboard-css' ])
		.pipe( sourcemaps.init() )
		.pipe( sass() )
		.pipe( autoprefixer() )
		.pipe( concat( 'dashboard.css' ) )
		.pipe( gulp.dest( 'public/dist' ) )
		.pipe( cleanCSS( { compatibility: 'ie8' } ) )
		.pipe( rename( { suffix: '.min' } ) )
		.pipe( sourcemaps.write( '.' ) )
		.pipe( gulp.dest( 'public/dist' ) );
});


// TODO: need to figure out why it's not coming in with the Bootstrap styles for the minified output.
// task for styles which are meant to remain separate from the concatenated, minified styles file
gulp.task( 'standalone-styles', () => {
	return gulp.src(paths[ 'standalone-css' ])
		.pipe( gulp.dest( 'public/dist' ));
});

// task for scripts which are meant to remain separate from the concatenated, minified scripts file
gulp.task( 'standalone-scripts', () => {
	return gulp.src( paths[ 'standalone-js' ] )
		.pipe( gulp.dest( 'public/dist' ) );
});

gulp.task( 'fonts', () => {
	return gulp.src( paths.fonts )
		.pipe( gulp.dest( 'public/dist/fonts' ));
})

// scripts task
gulp.task( 'scripts', () => {
	return gulp.src( paths.js )
		// TODO: need to fix this ignore, it's not working
		.pipe( gulpIgnore.exclude( paths[ 'standalone-js' ] ) )
		.pipe( sourcemaps.init() )
		.pipe( concat( 'mare.js' ) )
		.pipe( gulp.dest( 'public/dist' ) )
		.pipe( uglify())
		.pipe( rename( { suffix: '.min' } ) )
		.pipe( sourcemaps.write( '.' ) )
		.pipe( gulp.dest( 'public/dist' ) );
});

// images task
gulp.task( 'images', () => {
	return gulp.src( paths.img )
		.pipe( imagemin() )
		.pipe( gulp.dest( 'public/dist/img' ) );
});

// gulp eslint task
gulp.task( 'eslint', () => {
	return gulp.src( paths[ 'lint-js' ] )
		.pipe( eslint() ) // eslint() attaches the lint output to the "eslint" property of the file object so it can be used by other modules.
		.pipe( eslint.format() ) // eslint.format() outputs the lint results to the console.  Alternatively use eslint.formatEach() (see Docs).
		.pipe( eslint.failAfterError() ); // To have the process exit with an error code (1) on lint error, return the stream and pipe to failAfterError last.
});

// gulp eslint task for watching
gulp.task( 'eslint-watch', () => {
	return gulp.src( paths[ 'lint-js' ] )
		.pipe( eslint() ) // eslint() attaches the lint output to the "eslint" property of the file object so it can be used by other modules.
		.pipe( eslint.format() ); // eslint.format() outputs the lint results to the console.  Alternatively use eslint.formatEach() (see Docs).
});

// Watch task
gulp.task( 'watch', () => {
	gulp.watch( paths.css, gulp.series( 'styles' ) );
	gulp.watch( paths['dashboard-css'], { usePolling: true }, gulp.series( 'dashboard-styles' ) );
	gulp.watch( paths.js, gulp.series( 'eslint-watch', 'scripts' ) );
	gulp.watch( paths.img, gulp.series( 'images' ) );
	gulp.watch( paths.tests, gulp.series( 'test' ) );
});

// Empty out the dist directory to ensure old files don't hang around
gulp.task( 'clean', () => {
	return del( [ 'public/dist/*' ] );
});

// Run all the mocha tests
gulp.task( 'test', () => {
	return gulp.src( paths.tests, { read: false } )
		// gulp-mocha needs filepaths so you can't have any plugins before it
		.pipe( mocha( { reporter: 'nyan' } ) );
});

// gulp build task
gulp.task( 'build', gulp.parallel( 'standalone-styles', 'dashboard-styles', 'styles', 'standalone-scripts', 'scripts', 'images', 'fonts' ) );
// custom build for travis CI
gulp.task( 'travis', gulp.series( 'clean', 'test', 'build' ) );
// default tasks to run when 'gulp' is called
gulp.task( 'default', gulp.series( 'clean', 'eslint-watch', 'test', 'build', 'watch' ) );
