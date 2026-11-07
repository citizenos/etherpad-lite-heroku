'use strict';

module.exports = (grunt) => {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    eslint: {
      dev: {
        src: ['**/*.js', '!node_modules/**'],
      },
    },
    watch: {
      eslint: {
        files: ['**/*.js', '!node_modules/**'],
        tasks: ['eslint'],
      },
    },
  });

  // Load the plugins
  grunt.loadNpmTasks('grunt-eslint');
};
