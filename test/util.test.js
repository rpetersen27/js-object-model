var util = require('../src/util');

describe('util', function () {

    it('to camelcase', function () {
        util.toCamelcase('this is a test').should.equal('thisIsATest');
        util.toCamelcase('this', 'is', 'a', 'test').should.equal('thisIsATest');
        util.toCamelcase(['this', 'is', 'a', 'test']).should.equal('thisIsATest');
    });

});