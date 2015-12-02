var gulp 			= require('gulp'),
	jshint 			= require('gulp-jshint'),
	jscs 			= require('gulp-jscs'),
	jshintReporter 	= require('jshint-stylish'),
	watch 			= require('gulp-watch'),
	sass 			= require('gulp-sass'),
	concat 			= require('gulp-concat'),
	rename			= require('gulp-rename'),
	uglify			= require('gulp-uglify'),
	minify			= require('gulp-minify-css'),
	sourcemaps 		= require('gulp-sourcemaps'),
	autoprefixer 	= require('gulp-autoprefixer'),
	imagemin		= require('gulp-imagemin'),
	gulpIgnore 		= require('gulp-ignore');
	del 			= require('del');

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
	'standalone-css':[
		'public/styles/font-awesome/*.css'
	],
	'js':[
		'public/modules/**/*.js',
		'public/js/*.js'],
	'standalone-js':[
		'public/js/lib/standalone-scripts/**/*.js'],
	'admin-panel-js':[
		'public/js/lib/**/*.js'],
	'img':[
		'public/images/*',
		'public/modules/**/*.gif'],
	'fonts':[
		'public/fonts/*.eot',
		'public/fonts/*.svg',
		'public/fonts/*.ttf',
		'public/fonts/*.woff',
		'public/fonts/*.woff2'
	]
};

// styles task
gulp.task('styles', function() {
	return gulp.src(paths.css)
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

// TODO: need to figure out why it's not coming in with the Bootstrap styles for the minified output.
// task for styles which are meant to remain separate from the concatenated, minified styles file 
gulp.task('standalone-styles', function() {
	return gulp.src(paths['standalone-css'])
		.pipe(gulp.dest('public/dist'));
});

// task for scripts which are meant to remain separate from the concatenated, minified scripts file
gulp.task('standalone-scripts', function() {
	return gulp.src(paths['standalone-js'])
		.pipe(gulp.dest('public/dist'));
});

gulp.task('fonts', function() {
	return gulp.src(paths.fonts)
		.pipe(gulp.dest('public/dist/fonts'));
})

// scripts task
gulp.task('scripts', function() {
	return gulp.src(paths.js)
		// need to fix this ignore, it's not working
		.pipe(gulpIgnore.exclude(paths['standalone-js']))
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
	return gulp.src(paths.img)
		.pipe(imagemin())
		.pipe(gulp.dest('public/dist/img'));
});

// gulp lint
gulp.task( 'lint', function() {
	gulp.src(paths.src)
		.pipe(jshint())
		.pipe(jshint.reporter(jshintReporter));

});

// Watch Task
gulp.task('watch', function() {
	gulp.watch(paths.css, gulp.series('styles'));
	gulp.watch(paths.js, gulp.series('scripts'));
	gulp.watch(paths.img, gulp.series('images'));
});

// Empty out the dist directory to ensure old files don't hang around
gulp.task('clean', function (cb) {
          del(['public/dist/*'], cb);
});

// gulp watcher for lint
gulp.task('watch:lint', function () {
	gulp.src(paths.src)
		.pipe(watch(paths.src))
		.pipe(jshint())
		.pipe(jshint.reporter(jshintReporter));
});

// gulp build task
gulp.task('build', gulp.parallel('standalone-styles', 'styles', 'standalone-scripts', 'scripts', 'images', 'fonts'));

gulp.task('default', gulp.series('clean', 'build', 'watch'));

// gulp jscs
// TODO: need to adjust src to minified, concatenated js file
// gulp.task('jscs'), function() {
// 	gulp.src('public/dist/mare.js')
// 		.pipe(jscs());
// }
