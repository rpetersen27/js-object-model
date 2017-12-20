var inherits = require('inherits');

module.exports = function (SuperClass, name) {
    var JOM = require('../index'),
        Clazz = JOM.createClass(name);
    inherits(Clazz, SuperClass);
    return Clazz;
};
