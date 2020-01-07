function Library() {
    this.store = {};
}

Library.prototype.createClass = function (name) {
    if (this.store[name]) throw new Error('Cannot create same class twice: ' + name);
    this.store[name] = require('./create')(name);
    return this.store[name];
};

Library.prototype.getClass = function (name) {
    if (this.store[name]) return this.store[name];
    this.store[name] = require('./create')(name);
    return this.store[name];
};

Library.prototype.inherit = function (Superclass, name) {
    if (this.store[name]) throw new Error('Cannot create same class twice: ' + name);
    this.store[name] = require('./inherit')(Superclass, name);
    return this.store[name];
};

Library.prototype.attribute = require('./attribute');
Library.prototype.link = require('./link');
Library.prototype.extend = require('./extend');


module.exports = Library;
