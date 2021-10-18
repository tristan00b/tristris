import autoprefix  from 'gulp-autoprefixer'
import browserify  from 'browserify'
import browserSync from 'browser-sync'
import buffer      from 'vinyl-buffer'
import dartSass    from 'sass'
import del         from 'del'
import ejs         from 'gulp-ejs'
import fiber       from 'fibers'
import git         from 'gulp-git'
import gulp        from 'gulp'
import gulpif      from 'gulp-if'
import gulpsass    from 'gulp-sass'
import log         from 'gulplog'
import rename      from 'gulp-rename'
import sourcemaps  from 'gulp-sourcemaps'
import srcstream   from 'vinyl-source-stream'
import uglify      from 'gulp-uglify'

const { series:ser, parallel:par, src, dest:dst } = gulp
const sass  = gulpsass(dartSass)
const bsync = browserSync.create()


/* ------------------------------------------------------------------------------------------------------------------ *\
  Config Options
\* ------------------------------------------------------------------------------------------------------------------ */

const isDebuggingEnabled = process.env.NODE_ENV === 'debug'

const opts = {
  babelify: {
    sourceMaps: isDebuggingEnabled
  },
  browserify: {
    debug: isDebuggingEnabled
  },
  bsync: {
    listen: 'localhost',
    open: false,
    port: 4040,
    ui: false,
    server: {
      baseDir: 'build',
      index: 'index.html'
    }
  },
  sass: {
    fiber: fiber,
    outputStyle: 'compressed',
  },
  sourcemaps: {
    sourcemaps: isDebuggingEnabled,
    loadMaps: isDebuggingEnabled
  },
  uglify: {
    keep_fnames: isDebuggingEnabled,
    output: {
      beautify: isDebuggingEnabled,
    }
  }
}


/* ------------------------------------------------------------------------------------------------------------------ *\
  Task Definitions
\* ------------------------------------------------------------------------------------------------------------------ */

const assets = async _ => {
  return src('app/assets/**/*.*').pipe(dst('build/assets'))
}

const markup = async _ => {
  return src('app/**/*.@(ejs|html)')
    .pipe(ejs())
    .pipe(rename({ extname: '.html' }))
    .pipe(dst('build'))
}

const scripts = async _ => {
  return browserify({
    entries: 'app/main.js',
    debug: isDebuggingEnabled,
  })
  .transform('babelify', opts.babelify)
  .bundle()
  .pipe(srcstream('main.js'))
  .pipe(buffer())
  .pipe(gulpif(isDebuggingEnabled, sourcemaps.init(opts.sourcemaps)))
  .pipe(uglify(opts.uglify))
  .pipe(gulpif(isDebuggingEnabled, sourcemaps.write('.')))
  .pipe(dst('build'))
  .on('error', log.error)
}

const styles = async _ => {
  return src('app/main.sass', opts.sourcemaps)
    .pipe(sass(opts.sass)).on('error', sass.logError)
    .pipe(autoprefix())
    .pipe(dst('build', opts.sourcemaps))
}

const reloadBrowser = _ => {
  bsync.reload()
}

const setenv = async _ => {
  return git.revParse({args: '--short HEAD'}, (err, hash) => {
    if (err) throw err
    process.env.REVISION = `${hash}`
  })
}

gulp.task('watch:assets', async _ => {
  gulp.watch('app/assets/**/*', assets).on('change', reloadBrowser)
})

gulp.task('watch:markup', async _ => {
  gulp.watch('app/**/*.@(ejs|html)', markup).on('change', reloadBrowser)
})

gulp.task('watch:scripts', async _ => {
  gulp.watch('app/**/*.js', scripts).on('change', reloadBrowser)
})

gulp.task('watch:styles', async _ => {
  gulp.watch('app/main.scss', styles)
})

gulp.task('server:start', async _ => {
  bsync.init(opts.bsync)
})

const clean = _ => del('build/*')
const build = ser(clean, setenv, par(markup, assets, styles, scripts))//ser(clean, setenv, par(assets, markup, styles, scripts))
const watch = par('watch:assets', 'watch:markup', 'watch:styles', 'watch:scripts')
const serve = ser(build, par(watch, 'server:start'))


/* ------------------------------------------------------------------------------------------------------------------ *\
  Exports
\* ------------------------------------------------------------------------------------------------------------------ */

export {
  clean,
  build,
  serve,
  serve as default
}
