"use strict";
let gulp = require("gulp");
let sourcemaps = require("gulp-sourcemaps");
let typescript = require("gulp-typescript");
let nodemon = require("gulp-nodemon");
let tslint = require("gulp-tslint");
let runSequence = require("run-sequence");
let rimraf = require("rimraf");
let typedoc = require("gulp-typedoc");
let mocha = require("gulp-mocha");
let istanbul = require("gulp-istanbul");
let plumber = require("gulp-plumber");
let remapIstanbul = require("remap-istanbul/lib/gulpRemapIstanbul");

const CLEAN_BUILD = "clean:build";
const CLEAN_COVERAGE = "clean:coverage";
const CLEAN_DOC = "clean:doc";
const TSLINT = "tslint";
const COMPILE_TYPESCRIPT = "compile:typescript";
const BUILD = "build";
const GENERATE_DOC = "generate:doc";
const PRETEST = "pretest";
const RUN_TESTS = "run:tests";
const LOAD_FIXTURES = "load:fixtures";
const TEST = "test";
const REMAP_COVERAGE = "remap:coverage";

const TS_SRC_GLOB = "./src/**/*.ts";
const TS_TEST_GLOB = "./test/**/*.ts";
const TS_FIXTURES_GLOB = "./fixtures/**/*.ts";
const JS_TEST_GLOB = "./build/test/**/*.js";
const JS_SRC_GLOB = "./build/src/**/*.js";
const TS_GLOB = [TS_SRC_GLOB, TS_TEST_GLOB, TS_FIXTURES_GLOB];

const tsProject = typescript.createProject("tsconfig.json");

// Removes the ./build directory with all its content.
gulp.task(CLEAN_BUILD, function(callback) {
    rimraf("./build", callback);
});

// Removes the ./coverage directory with all its content.
gulp.task(CLEAN_COVERAGE, function(callback) {
    rimraf("./coverage", callback);
});

// Removes the ./docs directory with all its content.
gulp.task(CLEAN_DOC, function(callback) {
    rimraf("./docs", callback);
});

// Checks all *.ts-files if they are conform to the rules specified in tslint.json.
gulp.task(TSLINT, function() {
    return gulp.src(TS_GLOB)
        .pipe(tslint({formatter: "verbose"}))
        .pipe(tslint.report({
            // set this to true, if you want the build process to fail on tslint errors.
            emitError: true
        }));
});

// Compiles all *.ts-files to *.js-files.
gulp.task(COMPILE_TYPESCRIPT, function() {
    return gulp.src(TS_GLOB, {base: "."})
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest("./build"));
});

// Runs all required steps for the build in sequence.
gulp.task(BUILD, function(callback) {
    runSequence(CLEAN_BUILD, TSLINT, COMPILE_TYPESCRIPT, callback);
});

// Generates a documentation based on the code comments in the *.ts files.
gulp.task(GENERATE_DOC, [CLEAN_DOC], function() {
    return gulp.src(TS_SRC_GLOB)
        .pipe(typedoc({
            out: "./docs",
            readme: "readme.md",
            version: true,
            module: "commonjs"
        }))
});

// Sets up the istanbul coverage
gulp.task(PRETEST, function() {
    gulp.src(JS_SRC_GLOB)
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(istanbul({includeUntested: true}))
        .pipe(istanbul.hookRequire())
});

// Run the tests via mocha and generate a istanbul json report.
gulp.task(RUN_TESTS, function(callback) {
    let mochaError;
    gulp.src(JS_TEST_GLOB)
        .pipe(plumber())
        .pipe(mocha({reporter: "spec"}))
        .on("error", function(err) {
            mochaError = err;
        })
        .pipe(istanbul.writeReports({
            reporters: ["json"]
        }))
        .on("end", function() {
            callback(mochaError);
        });
});

// Remap Coverage to *.ts-files and generate html, text and json summary
gulp.task(REMAP_COVERAGE, function() {
    return gulp.src("./coverage/coverage-final.json")
        .pipe(remapIstanbul({
            // basePath: ".",
            fail: true,
            reports: {
                "html": "./coverage",
                "json": "./coverage/coverage-report.json",
                "text-summary": null,
                "lcovonly": "./coverage/lcov.info"
            }
        }))
        .pipe(gulp.dest("coverage"))
        .on("end", function() {
            console.log("--> For a more detailed report, check the ./coverage directory <--")
        });
});

// Runs all required steps for testing in sequence.
gulp.task(TEST, function(callback) {
    runSequence(BUILD, CLEAN_COVERAGE, PRETEST, RUN_TESTS, REMAP_COVERAGE, callback);
});

// Runs the build task and starts the server every time changes are detected.
gulp.task("watch", [BUILD], function() {
    return nodemon({
        ext: "ts js json",
        script: "build/src/server.js",
        watch: ["src/*", "test/*"],
        tasks: [BUILD]
    });
});

gulp.task(LOAD_FIXTURES, [BUILD], function () {
  require(__dirname + '/build/fixtures/load');
});

gulp.task("debug", [BUILD], function () {
  return nodemon({
    ext: "ts js json",
    script: "build/src/server.js",
    watch: ["src/*", "test/*"],
    tasks: [BUILD],
    nodeArgs: ["--debug-brk=9000"]
  });
});
