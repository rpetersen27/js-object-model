var EventEmitter = require('events').EventEmitter;

function Library() {
    this.store = {};
    this.events = new EventEmitter();
}

Library.prototype._attachListener = function (clazz) {
    var self = this;
    clazz.on('init', function (obj) {
        self.events.emit('all', 'createClass', clazz.__name__, obj);
        self.events.emit('createClass', clazz.__name__, obj);

        obj.on('change', function (name, val, old, obj) {
            self.events.emit('all', 'change', name, val, old, obj);
            self.events.emit('change', name, val, old, obj);
        });

        obj.on('addto', function (name, item, index, obj) {
            self.events.emit('all', 'addto', name, item, index, obj);
            self.events.emit('addto', name, item, index, obj);
        });
    });
};

Library.prototype.createClass = function (name) {
    if (this.store[name]) throw new Error('Cannot create same class twice: ' + name);
    this.store[name] = require('./create')(name);
    this._attachListener(this.store[name]);
    return this.store[name];
};

Library.prototype.getClass = function (name) {
    if (this.store[name]) return this.store[name];
    this.store[name] = require('./create')(name);
    this._attachListener(this.store[name]);
    return this.store[name];
};

Library.prototype.inherit = function (Superclass, name) {
    if (this.store[name]) throw new Error('Cannot create same class twice: ' + name);
    this.store[name] = require('./inherit')(Superclass, name);
    this._attachListener(this.store[name]);
    return this.store[name];
};

Library.prototype.on = function () {
    this.events.on.apply(this.events, arguments);
};

Library.prototype.off = function () {
    this.events.off.apply(this.events, arguments);
};

Library.prototype.attribute = require('./attribute');
Library.prototype.link = require('./link');
Library.prototype.extend = require('./extend');


module.exports = Library;
