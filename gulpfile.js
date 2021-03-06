//    ______   __    __  __        _______
//   /      \ /  |  /  |/  |      /       \
//  /$$$$$$  |$$ |  $$ |$$ |      $$$$$$$  |
//  $$ | _$$/ $$ |  $$ |$$ |      $$ |__$$ |
//  $$ |/    |$$ |  $$ |$$ |      $$    $$/
//  $$ |$$$$ |$$ |  $$ |$$ |      $$$$$$$/
//  $$ \__$$ |$$ \__$$ |$$ |_____ $$ |
//  $$    $$/ $$    $$/ $$       |$$ |
//   $$$$$$/   $$$$$$/  $$$$$$$$/ $$/
//

// Gulp and node
var gulp = require('gulp');
var u = require('gulp-util');
var log = u.log;
var c = u.colors;
var del = require('del');
var spawn = require('child_process').spawn;
var sequence = require('run-sequence');
var tasks = require('gulp-task-listing');

// Basic workflow plugins
var prefix = require('gulp-autoprefixer');
var sass = require('gulp-sass');
var globbing = require('gulp-css-globbing');
var bs = require('browser-sync');
var reload = bs.reload;

// Performance workflow plugins
var mincss = require('gulp-minify-css');
var imagemin = require('gulp-imagemin');
var uglify = require('gulp-uglify');

// -----------------------------------------------------------------------------
// Remove old CSS
//
// This task deletes the files generated by the 'sass' and 'css' tasks.
// -----------------------------------------------------------------------------
gulp.task('clean-css', function() {
  return del(['assts/css/{all,main}*'], function (err) {
    if (err) {
      log(c.red('clean-css'), err);
    }
    else {
      log(
        c.green('clean-css'),
        'deleted old stylesheets'
      );
    }
  });
});

// -----------------------------------------------------------------------------
// Sass Task
//
// Compiles Sass and runs the CSS through autoprefixer. A separate task will
// combine the compiled CSS with vendor files and minify the aggregate.
// -----------------------------------------------------------------------------
gulp.task('sass', function() {
  return gulp.src('assets/_scss/**/*.scss')
    .pipe(sass({
      includePaths: require('node-neat').includePaths,
      outputStyle: 'nested',
      onSuccess: function(css) {
        var dest = css.stats.entry.split('/');
        log(c.green('sass'), 'compiled to', dest[dest.length - 1]);
      },
      onError: function(err, res) {
        log(c.red('Sass failed to compile'));
        log(c.red('> ') + err.file.split('/')[err.file.split('/').length - 1] + ' ' + c.underline('line ' + err.line) + ': ' + err.message);
      }
    }))
    .pipe(prefix("last 2 versions", "> 1%"))
    .pipe(gulp.dest('assets/css'));
});

// -----------------------------------------------------------------------------
// Combine and Minify CSS
//
// This task minifies all the CSS found in the css/ directory.
// -----------------------------------------------------------------------------
gulp.task('css', ['clean-css', 'sass'], function() {
  bs.notify('<span style="color: grey">Running:</span> CSS task');

  return gulp.src('assets/css/**/*.css')
    .pipe(mincss())
    .pipe(gulp.dest('assets/css'))
    .pipe(reload({stream: true}));
});

// -----------------------------------------------------------------------------
// Combine and Minify JS
//
// Just like the CSS task, the end result of this task is a minified aggregate
// of JS ready to be served.
// -----------------------------------------------------------------------------
gulp.task('js', function() {
  return gulp.src('assets/_js/**/*.js')
    .pipe(uglify())
    .pipe(gulp.dest('assets/js'))
    .pipe(reload({stream: true}));
});

// -----------------------------------------------------------------------------
// Minify SVGs and compress images
//
// It's good to maintain high-quality, uncompressed assets in your codebase.
// However, it's not always appropriate to serve such high-bandwidth assets to
// users, in order to reduce mobile data plan usage.
// -----------------------------------------------------------------------------
gulp.task('imagemin', function() {
  return gulp.src('assets/_img/**/*')
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [{removeViewBox: false}]
    }))
    .pipe(gulp.dest('assets/img'));
});

// -----------------------------------------------------------------------------
// Browser Sync
//
// Makes web development better by eliminating the need to refresh. Essential
// for CSS development and multi-device testing.
// -----------------------------------------------------------------------------
gulp.task('browser-sync', function() {
  bs({
    proxy: "drupal8.dev"
  });
});

// -----------------------------------------------------------------------------
// Watch tasks
//
// These tasks are run whenever a file is saved. Don't confuse the files being
// watched (gulp.watch blobs in this task) with the files actually operated on
// by the gulp.src blobs in each individual task.
//
// A few of the performance-related tasks are excluded because they can take a
// bit of time to run and don't need to happen on every file change. If you want
// to run those tasks more frequently, set up a new watch task here.
// -----------------------------------------------------------------------------
gulp.task('watch', function() {
  gulp.watch('assets/_scss/**/*.scss', ['css']);
  gulp.watch('assets/_js/**/*.js', ['js']);
  gulp.watch('assets/_img/**/*', ['imagemin']);
  gulp.watch('templates/**/*', [''])
});

// -----------------------------------------------------------------------------
// Convenience task for development.
//
// This is the command you run to warm the site up for development. It will do
// a full build, open BrowserSync, and start listening for changes.
// -----------------------------------------------------------------------------
gulp.task('start', ['css', 'js', 'imagemin', 'browser-sync', 'watch']);

// -----------------------------------------------------------------------------
// Default: load task listing
//
// Instead of launching some unspecified build process when someone innocently
// types `gulp` into the command line, we provide a task listing so they know
// what options they have without digging into the file.
// -----------------------------------------------------------------------------
gulp.task('help', tasks);
gulp.task('default', ['help']);
