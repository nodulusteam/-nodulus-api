// tests/config.js
var chai = require('chai');
var expect = chai.expect; // we are using the "expect" style of Chai


describe('api-init', function () {
  it('api-init should start the api', function () {
    var express = require('express');
    var app = express();
    var api = require('../api.js');
    api.start(app);
    expect(api).to.not.equal(undefined);
  });
});