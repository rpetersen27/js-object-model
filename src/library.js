var DataModel = require('./datamodel');

function Library() {
    this.__classes__ = {};
    this.__links__ = [];
    this.__attributes__ = [];
    this.__extensions__ = [];
    this.__datamodel__ = new DataModel();
}

Library.prototype.getDataModel = function () {
    return this.__datamodel__;
};

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

Library.prototype.fromJSON = function (str) {
    var self = this,
        model = JSON.parse(str);
    model.classes.forEach(function (name) {
        self.createClass(name);
    });
    // attributes
    model.attributes.forEach(function (args) {
        args[0] = self.getClass(args[0]);
        self.attribute.apply(self, args);
    });
    // links
    model.links.forEach(function (args) {
        if (typeof args[0] === 'string') args[0] = self.getClass(args[0]);
        else if (args[0].class) args[0].class = self.getClass(args[0].class);

        if (typeof args[1] === 'string') args[1] = self.getClass(args[1]);
        else if (args[1].class) args[1].class = self.getClass(args[1].class);

        self.link.apply(self, args);
    });
    // extensions
    model.extensions.forEach(function (args) {
        args[0] = self.getClass(args[0]);
        self.extend.apply(self, args);
    });
};

Library.prototype.__attachToLibrary__ = function (clazz) {
    var self = this;
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
    this.__datamodel__.registerClass(clazz);
};

Library.prototype.createClass = function (name) {
    if (this.__classes__[name]) throw new Error('Cannot create same class twice: ' + name);
    this.__classes__[name] = require('./create')(name);
    this.__attachToLibrary__(this.__classes__[name]);
    return this.__classes__[name];
};

Library.prototype.getClass = function (name) {
    if (this.__classes__[name]) return this.__classes__[name];
    this.__classes__[name] = require('./create')(name);
    this.__attachToLibrary__(this.__classes__[name]);
    return this.__classes__[name];
};

Library.prototype.inherit = function (Superclass, name) {
    if (this.__classes__[name]) throw new Error('Cannot create same class twice: ' + name);
    this.__classes__[name] = require('./inherit')(Superclass, name);
    this.__attachToLibrary__(this.__classes__[name]);
    return this.__classes__[name];
};

Library.prototype.on = function () {
    this.__datamodel__.on.apply(this.__datamodel__, arguments);
};

Library.prototype.off = function () {
    this.__datamodel__.off.apply(this.__datamodel__, arguments);
};

Library.prototype.attribute = function () {
    var args = Array.prototype.slice.call(arguments);
    this.__attributes__.push(args)
    return require('./attribute').apply(null, args);
}
Library.prototype.link = function () {
    // TODO check if both classes are inside this library
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
