/*global describe, it, beforeEach*/

'use strict';

const chai = require('chai');
const expect = chai.expect;
const nock = require('nock');
const deptree = require('../deptree');

describe('deptree', function() {

  beforeEach(() => {
    // Make sure we never query npmjs.org
    nock('https://registry.npmjs.org');
  });

  describe('dependency()', function() {

    // Make the cache more forgetful

    nock('https://registry.npmjs.org')
      .get('/express/latest')
      .reply(200, '{ "dependencies" : { "accepts": "~1.3.5", ' +
        '"array-flatten": "1.1.1", "body-parser": "^1.18.3"}}');

    it('Get dependencies of the express package', function() {
      return deptree.dependency('express').then((dependencies) => {
        expect(dependencies).to.eql({
          accepts: '1.3.5',
          'array-flatten': '1.1.1',
          'body-parser': '1.18.3',
        });
      });
    });

    nock('https://registry.npmjs.org')
      .get('/express2/latest')
      .reply(200, '{ "dependencies" : { "accepts": "~2.3.5", ' +
        '"array-flatten": "2.1.1", "body-parser": "2.18.3"}}');

    it('Get dependencies of the express2 package', function() {
      return deptree.dependency('express2').then((dependencies) => {
        expect(dependencies).to.eql({
          accepts: '2.3.5',
          'array-flatten': '2.1.1',
          'body-parser': '2.18.3',
        });
      });
    });

    it('Get dependencies of the express package from the cache', function() {
      return deptree.dependency('express').then((dependencies) => {
        expect(dependencies).to.eql({
          accepts: '1.3.5',
          'array-flatten': '1.1.1',
          'body-parser': '1.18.3',
        });
      });
    });
  });

  describe('dependencies()', function() {

    nock('https://registry.npmjs.org')
      .get('/express/latest')
      .reply(200, '{ "dependencies" : { "accepts": "1.3.5", ' +
        '"array-flatten": "1.1.1", "body-parser": "1.18.3"}}');

    nock('https://registry.npmjs.org')
      .get('/accepts/1.3.5')
      .reply(200, '{ "dependencies" : { "body-parser": "1.18.3"}}');

    nock('https://registry.npmjs.org')
      .get('/array-flatten/1.1.1')
      .reply(200, '{ "dependencies" : { "body-parser": "1.18.3", ' +
        '"flat-line" : "1.0.0"}}');

    nock('https://registry.npmjs.org')
      .get('/flat-line/1.0.0')
      .reply(200, '{ "dependencies" : { "body-parser": "1.18.3"}}');

    nock('https://registry.npmjs.org')
      .get('/body-parser/1.18.3')
      .reply(200, '{ "dependencies" : { "accepts": "1.3.5"}}');


    it('Get all dependencies of the express package', function() {
      return deptree.dependencies('express').then((dependencies) => {
        expect(dependencies).to.eql({
          accepts: '1.3.5',
          'array-flatten': '1.1.1',
          'body-parser': '1.18.3',
          'flat-line': '1.0.0',
        });
      });
    });
  });
});
