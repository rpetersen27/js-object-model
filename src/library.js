var EventEmitter = require('events').EventEmitter;

function Library() {
    this.initCounter = 0;
    this.__classes__ = {};
    this.__links__ = [];
    this.__attributes__ = [];
    this.__extensions__ = [];
    this.events = new EventEmitter();
}

Library.clone = function (obj) {
    if (obj === null || obj === undefined) return;

    if (obj.__name__) return obj.__name__;

    if (obj instanceof Array) {
        return obj.map(Library.clone);
    }

    if (typeof obj === 'object') {
        var result = {};
        Object.keys(obj).forEach(function (key) {
            result[key] = Library.clone(obj[key]);
        });
        return result;
    }

    return obj;
}

Library.prototype.toJSON = function () {
    return JSON.stringify({
        classes: Object.keys(this.__classes__),
        attributes: Library.clone(this.__attributes__),
        links: Library.clone(this.__links__),
        extensions: Library.clone(this.__extensions__),
    });
};

Library.prototype._attachToLibrary = function (clazz) {
    var self = this;
    clazz.on('init', function (obj) {
        if (!obj.__id__) obj.__id__ = clazz.__name__ + '@' + self.initCounter++;

        self.events.emit('all', 'init', clazz.__name__, obj);
        self.events.emit('init', clazz.__name__, obj);

        obj.on('change', function (name, val, old, obj) {
            self.events.emit('all', 'change', name, val, old, obj);
            self.events.emit('change', name, val, old, obj);
        });

        obj.on('addto', function (name, item, index, obj) {
            self.events.emit('all', 'addto', name, item, index, obj);
            self.events.emit('addto', name, item, index, obj);
        });

        obj.on('removefrom', function (name, item, index, obj) {
            self.events.emit('all', 'addto', name, item, index, obj);
            self.events.emit('removefrom', name, item, index, obj);
        });
    });

    clazz.link = function (from, to, relation) {
        if (typeof to === 'string') {
            relation = to;
            to = from;
            from = {};
        }
        from.class = this;
        self.link(from, to, relation);
        return this;
    };
    clazz.attribute = function (name, type) {
        self.attribute(this, name, type);
        return this;
    };
    clazz.extend = function (obj) {
        self.extend(this, obj);
        return this;
    };
};

Library.prototype.createClass = function (name) {
    if (this.__classes__[name]) throw new Error('Cannot create same class twice: ' + name);
    this.__classes__[name] = require('./create')(name);
    this._attachToLibrary(this.__classes__[name]);
    return this.__classes__[name];
};

Library.prototype.getClass = function (name) {
    if (this.__classes__[name]) return this.__classes__[name];
    this.__classes__[name] = require('./create')(name);
    this._attachToLibrary(this.__classes__[name]);
    return this.__classes__[name];
};

Library.prototype.inherit = function (Superclass, name) {
    if (this.__classes__[name]) throw new Error('Cannot create same class twice: ' + name);
    this.__classes__[name] = require('./inherit')(Superclass, name);
    this._attachToLibrary(this.__classes__[name]);
    return this.__classes__[name];
};

Library.prototype.on = function () {
    this.events.on.apply(this.events, arguments);
};

Library.prototype.off = function () {
    this.events.off.apply(this.events, arguments);
};

Library.prototype.attribute = function () {
    var args = Array.prototype.slice.call(arguments);
    this.__attributes__.push(args)
    return require('./attribute').apply(null, args);
}
Library.prototype.link = function () {
    var args = Array.prototype.slice.call(arguments);
    this.__links__.push(args);
    return require('./link').apply(null, args);
};
Library.prototype.extend = function () {
    var args = Array.prototype.slice.call(arguments);
    this.__extensions__.push(args);
    return require('./extend').apply(null, args);
};


module.exports = Library;
