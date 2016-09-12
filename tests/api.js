// tests/config.js
var chai = require('chai');
var expect = chai.expect; // we are using the "expect" style of Chai


describe('api-init', function () {
  it('api-init should start the api', function () {     
    var api = require('../api.js');
    api.start();
    expect(api).to.not.equal(undefined);
  });
});