const gulp = require('gulp')

gulp.task('bootstrap', () => {
    return gulp
        .src([
            'node_modules/bootstrap/dist/css/bootstrap.min.css',
            'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
        ])
        .pipe(gulp.dest('src/dist/bootstrap'))
})

gulp.task('emoji-picker-element', () => {
    return gulp
        .src([
            'node_modules/emoji-picker-element/database.js',
            'node_modules/emoji-picker-element/index.js',
            'node_modules/emoji-picker-element/picker.js',
        ])
        .pipe(gulp.dest('src/dist/emoji-picker-element'))
})

gulp.task('fontawesome', () => {
    return gulp
        .src(
            [
                'node_modules/@fortawesome/fontawesome-free/css/all.min.css',
                'node_modules/@fortawesome/fontawesome-free/webfonts/fa-regular-*',
                'node_modules/@fortawesome/fontawesome-free/webfonts/fa-solid-*',
            ],
            { base: 'node_modules/@fortawesome/fontawesome-free' }
        )
        .pipe(gulp.dest('src/dist/fontawesome'))
})

gulp.task('jquery', () => {
    return gulp
        .src('node_modules/jquery/dist/jquery.min.js')
        .pipe(gulp.dest('src/dist/jquery'))
})

gulp.task(
    'default',
    gulp.parallel('bootstrap', 'emoji-picker-element', 'fontawesome', 'jquery')
)
