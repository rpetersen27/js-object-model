var DataModel = require('./datamodel');

function Library() {
    this.__classes__ = {};
    this.__links__ = [];
    this.__attributes__ = {};
    this.__extensions__ = [];
    this.__datamodel__ = new DataModel(this);

    this.fromStream = this.fromStream.bind(this);
}

Library.prototype.toStream = function (cb) {
    var self = this;
    this.on('all', function (event, a1, a2, a3, a4) {
        if (event === 'init' && self.__classes__[a1].options.client === false) return;
        var attr = self.__attributes__[a4.__name__ + '@@@' + a1]
        if (attr && attr.options.client === false) return;
        var args = Array.prototype.slice.call(arguments).map(function (arg) {
            if (arg && arg.__id__) return arg.__id__;
            if (arg && arg instanceof Array) return arg.map(function (a) {
                if (a && a.__id__) return a.__id__;
                return a;
            });
            return arg;
        });
        cb.apply(self, args);
    });
    cb('datamodel', this.toJSON());
    cb('initial', this.getDataModel().toJSON());
};

Library.prototype.fromStream = function (event, src) {
    switch (event) {
        case 'datamodel':
            this.fromJSON(src);
            break;
        default:
            //forward to datamodel
            this.__datamodel__.update.apply(this.__datamodel__, arguments);
            break;
    }
};

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
        classes: Object.keys(this.__classes__).filter(function (key) {
            return this.__classes__[key].options.client !== false;
        }.bind(this)),
        attributes: Object.values(this.__attributes__).filter(function (attr) {
            return attr.options.client !== false;
        }).map(function (attr) {
            return Library.clone(attr.args);
        }),
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
    clazz.attribute = function (name, type, options) {
        self.attribute(this, name, type, options);
        return this;
    };
    clazz.extend = function (obj) {
        self.extend(this, obj);
        return this;
    };
    this.__datamodel__.registerClass(clazz);
};

Library.prototype.createClass = function (name, options) {
    options = options || {};
    if (this.__classes__[name]) throw new Error('Cannot create same class twice: ' + name);
    this.__classes__[name] = {
        clazz: require('./create')(name),
        options: options,
    };
    this.__attachToLibrary__(this.__classes__[name].clazz);
    return this.__classes__[name].clazz;
};

Library.prototype.getClass = function (name, options) {
    if (this.__classes__[name]) return this.__classes__[name].clazz;
    return this.createClass(name, options);
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

Library.prototype.attribute = function (Clazz, name, type, options) {
    options = options || {};
    this.__attributes__[Clazz.__name__ + '@@@' + name] = {
        args: [Clazz, name, type],
        options: options,
    };
    return require('./attribute')(Clazz, name, type);
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
