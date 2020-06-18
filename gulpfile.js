let project_folder = 'dist';
let source_folder = '#src';

let fs = require('fs');

let path = {
  build: {
    html: project_folder + '/',
    css: project_folder + '/css/',
    js: project_folder + '/js/',
    img: project_folder + '/img/',
    fonts: project_folder + '/fonts/',
  },

  src: {
    html: [source_folder + '/*.html', '!' + source_folder + '/_*.html'],
    css: source_folder + '/scss/style.scss',
    js: source_folder + '/js/script.js',
    img: source_folder + '/img/**/*.+(png|jpg|gif|ico|svg|webp)',
    fonts: source_folder + '/fonts/*.ttf',
  },

  watch: {
    html: source_folder + '/**/*.html',
    css: source_folder + '/scss/**/*.scss',
    js: source_folder + '/js/**/*.js',
    img: source_folder + '/img/**/*.+(png|jpg|gif|ico|svg|webp)',
  },

  clean: './' + project_folder + '/'
}

const {src, dest} = require('gulp'),
    gulp = require('gulp'),
    browsersync = require('browser-sync').create();
    filesinclude = require('gulp-file-include');
    delDit = require('del');
    scss = require('gulp-sass');
    autoprefixer = require('gulp-autoprefixer');
    groupMedia = require('gulp-group-css-media-queries');
    cleanCss = require('gulp-clean-css');
    rename = require('gulp-rename');
    uglify = require('gulp-uglify-es').default;
    imagemin = require('gulp-imagemin');
    webp = require('gulp-webp');
    webpHtml = require('gulp-webp-html');
    webCss = require('gulp-webpcss');
    svgSprite = require('gulp-svg-sprite');
    ttf2woff = require('gulp-ttf2woff');
    ttf2woff2 = require('gulp-ttf2woff2');
    fonter = require('gulp-fonter');
    

function browserSync(params) {
  browsersync.init({
    server:{
      baseDir: './' + project_folder + '/'
    },
    port: 3000,
    notify: false
  })
} 

const html = () => {
  return src(path.src.html)
    .pipe(filesinclude())
    .pipe(webpHtml())
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream())
}

const css = () => {
  return src(path.src.css)
    .pipe(
      scss({
        outputStyle: 'expanded'
      })
    )
    .pipe(
      groupMedia()
    )
    .pipe(
      autoprefixer({
        overrideBrowsersList: ['last 5 version'],
        cascade: true
      })
    )
    .pipe(webCss())
    .pipe(dest(path.build.css))
    .pipe(cleanCss())
    .pipe(
      rename({
        extname: '.min.css'
      })
    )
    .pipe(dest(path.build.css))
    .pipe(browsersync.stream())
}

const js = () =>  {
  return src(path.src.js)
    .pipe(filesinclude())
    .pipe(dest(path.build.js))
    .pipe(
      uglify()
    )
    .pipe(
      rename({
        extname: '.min.js'
      })
    )
    .pipe(dest(path.build.js))
    .pipe(browsersync.stream())
}

const images = () =>  {
  return src(path.src.img)
    .pipe(
      webp({
        quality: 70
      })
    )
    .pipe(dest(path.build.img))
    .pipe(src(path.src.img))
    .pipe(
      imagemin({
        interlaced: true,
        progressive: true,
        svgoPlugins: [
          {
            removeViewBox: false
          }
        ],
        optimizationLevel: 3 // 0 - 7
      })
    )
    .pipe(dest(path.build.img))
    .pipe(browsersync.stream())
}

gulp.task('svgSprite', function() {
  return gulp.src([source_folder + '/iconsprite/*.svg'])
  .pipe(svgSprite({
    mode: {
      stack: {
        sprite: '../icons/icons.svg',
        //example: true
      }
    }
  }))
  .pipe(dest(path.build.img))
})

const fonts = (params) => {
  src(path.src.fonts)
    .pipe(ttf2woff())
    .pipe(dest(path.build.fonts))
  return src(path.src.fonts)
    .pipe(ttf2woff2())
    .pipe(dest(path.build.fonts))  
}

gulp.task('otf2ttf', function() {
  return src([source_folder + '/fonts/*.otf'])
    .pipe(fonter({
      formats: ['ttf']
    }))
  .pipe(dest(source_folder + '/fonts/'));  
})

const fontsStyle = (params) => {
  let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss');
  if (file_content == '') {
    fs.writeFile(source_folder + '/scss/fonts.scss', '', cb);
    return fs.readdir(path.build.fonts, function (err, items) {
      if (items) {
        let c_fontname;
        for (var i = 0; i < items.length; i++) {
          let fontname = items[i].split('.');
          fontname = fontname[0];
          if (c_fontname != fontname) {
            fs.appendFile(source_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
          }
          c_fontname = fontname;
        }
      }
    })
  }
}

const cb = () => {}

const watchFiles = (params) => {
  gulp.watch([path.watch.html], html);
  gulp.watch([path.watch.css], css);
  gulp.watch([path.watch.js], js);
  gulp.watch([path.watch.img], images);
}

const clean = (params) => {
  return delDit(path.clean);
}

let build = gulp.series(clean, gulp.parallel(html, css, js, images, fonts), fontsStyle);
let watch = gulp.parallel(build, watchFiles, browserSync);

exports.html = html;
exports.css = css;
exports.js = js;
exports.images = images;
exports.fonts = fonts;
exports.fontsStyle = fontsStyle;
exports.build = build;
exports.watch = watch;
exports.default = watch;  

