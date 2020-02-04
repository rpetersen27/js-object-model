var DataModel = require('./datamodel'),
    util = require('./util');

function makeOptions(options) {
    options = Object.assign({}, options);

    if (options.client === false) options.client = util.falseFunc;
    else if (!options.client || options.client === true) options.client = util.trueFunc;

    return options;
}

function Library() {
    this.__classes__ = {};
    this.__links__ = {};
    this.__attributes__ = {};
    this.__extensions__ = [];
    this.__datamodel__ = new DataModel(this);

    this.fromStream = this.fromStream.bind(this);
}

Library.prototype.toStream = function (cb, clientOptions) {
    var self = this;
    this.on('all', function (event, a1, a2, a3, a4) {
        // check for class restrictions
        if (event === 'init' && !self.__classes__[a1].options.client(clientOptions, a2)) return;
        // check for instance restrictions
        if (a4 && !self.__classes__[a4.__name__].options.client(clientOptions, a4));
        // check for attribute restrictions
        var attr = a4 && self.__attributes__[a4.__name__ + '@@@' + a1];
        if (attr && !attr.options.client(clientOptions)) return;
        // check for link restrictions
        var link = a4 && self.__links__[a4.__name__ + '@@@' + a1];
        if (link && (!link.options.client(clientOptions) || !self.__classes__[link.args[1].class.__name__].options.client(clientOptions))) return;
        // for addto/removefrom events, check if target is for client
        if (!!event.match('^(addto|removefrom)$') && a2.__name__ && !self.__classes__[a2.__name__].options.client(clientOptions, a2)) return;
        // map objects to id
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
    cb('datamodel', this.toJSON(clientOptions));
    cb('initial', this.getDataModel().toJSON(clientOptions));
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

Library.prototype.getUniqueLinks = function () {
    var result = {};
    for (var key in this.__links__) {
        var obj = this.__links__[key],
            args = obj.args,
            from = args[0],
            to = args[1],
            id = from.class.__name__ + '@@@' + to.name + '@@@' + to.class.__name__;
        if (result[id]) continue;
        result[id] = obj;
    }
    return Object.values(result);
};

Library.prototype.toJSON = function (clientOptions) {
    var self = this;
    return JSON.stringify({
        classes: Object.keys(this.__classes__).filter(function (key) {
            return this.__classes__[key].options.client(clientOptions);
        }.bind(this)),
        attributes: Object.values(this.__attributes__).filter(function (attr) {
            return attr.options.client(clientOptions);
        }).map(function (attr) {
            return Library.clone(attr.args);
        }),
        links: this.getUniqueLinks().filter(function (link) {
            return link.options.client(clientOptions) && self.__classes__[link.args[1].class.__name__].options.client(clientOptions);
        }).map(function (link) {
            return Library.clone(link.args);
        }),
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
    clazz.link = function (from, to, relation, options) {
        if (typeof to === 'string') {
            options = relation;
            relation = to;
            to = from;
            from = {};
        }
        from.class = this;
        self.link(from, to, relation, options);
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
    options = makeOptions(options);
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
    options = makeOptions(options);
    this.__attributes__[Clazz.__name__ + '@@@' + name] = {
        args: [Clazz, name, type],
        options: options,
    };
    return require('./attribute')(Clazz, name, type);
}
Library.prototype.link = function (from, to, relation, options) {
    if (!options && typeof relation !== 'string') {
        options = relation;
        relation = undefined;
    }
    options = makeOptions(options);
    var data = util.autocompleteLink(from, to, relation);
    from = data.from;
    to = data.to;
    this.__links__[from.class.__name__ + '@@@' + to.name] = this.__links__[to.class.__name__ + '@@@' + from.name] = {
        args: [from, to],
        options: options,
    };
    // TODO check if both classes are inside this library
    return require('./link')(from, to);
};
Library.prototype.extend = function () {
    var args = Array.prototype.slice.call(arguments);
    this.__extensions__.push(args);
    return require('./extend').apply(null, args);
};


module.exports = Library;
