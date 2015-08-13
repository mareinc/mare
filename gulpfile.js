var gulp 			= require('gulp'),
	jshint 			= require('gulp-jshint'),
	jscs 			= require('gulp-jscs'),
	jshintReporter 	= require('jshint-stylish'),
	watch 			= require('gulp-watch'),
	browserify 		= require('browserify'),
	sass 			= require('gulp-sass'),
	concat 			= require('gulp-concat'),
	rename			= require('gulp-rename'),
	uglify			= require('gulp-uglify'),
	minify			= require('gulp-minify-css'),
	sourcemaps 		= require('gulp-sourcemaps'),
	autoprefixer 	= require('gulp-autoprefixer'),
	imagemin		= require('gulp-imagemin');

// path variables
var paths = {
	'src':[
		'./models/**/*.js',
		'./routes/**/*.js', 
		'keystone.js', 
		'package.json'],
	'css':[
		'public/modules/**/*.css',
		'public/styles/**/*.scss'],
	'js':[
		'public/modules/**/*.js',
		'public/js/*.js'],
	'img':[
		'public/images/*',
		'public/modules/**/*.gif']
};

// styles task
gulp.task('styles', function() {
	gulp.src(paths.css)
		.pipe(sourcemaps.init())
		.pipe(sass())
		.pipe(autoprefixer())
		.pipe(concat('mare.css'))
		.pipe(gulp.dest('public/dist'))
		.pipe(minify({compatibility: 'ie8'}))
		.pipe(rename({suffix: '.min'}))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('public/dist'));
});

// scripts task
gulp.task('scripts', function() {
	gulp.src(paths.js)
		.pipe(sourcemaps.init())
		.pipe(concat('mare.js'))
		.pipe(gulp.dest('public/dist'))
		.pipe(uglify())
		.pipe(rename({suffix: '.min'}))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('public/dist'));
});

// images task
gulp.task('images', function() {
	gulp.src(paths.img)
		.pipe(imagemin())
		.pipe(gulp.dest('public/dist/img'));
});

// gulp lint
gulp.task( 'lint', function() {
	gulp.src(paths.src)
		.pipe(jshint())
		.pipe(jshint.reporter(jshintReporter));

});

// gulp jscs
// TODO: need to adjust src to minified, concatenated js file
// gulp.task('jscs'), function() {
// 	gulp.src('public/dist/mare.js')
// 		.pipe(jscs());
// }

// gulp watcher for lint
gulp.task('watch:lint', function () {
	gulp.src(paths.src)
		.pipe(watch(paths.src))
		.pipe(jshint())
		.pipe(jshint.reporter(jshintReporter));
});

gulp.task('default', gulp.parallel('styles', 'scripts', 'images'));
