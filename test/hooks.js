before(function () {
    var chai = require('chai'),
        sinonChai = require('sinon-chai');
    global.expect = chai.expect;
    global.assert = chai.assert;
    chai.should();

    chai.use(sinonChai);
});