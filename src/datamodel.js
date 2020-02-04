var EventEmitter = require('events').EventEmitter;

function DataModel(library) {
    this.__idCounter__ = 0;
    this.__cache__ = {};
    this.__events__ = new EventEmitter();
    this.__library__ = library;
}

DataModel.prototype.registerClass = function (clazz) {
    var self = this;
    clazz.on('init', function (obj) {
        if (!obj.__id__) obj.__id__ = clazz.__name__ + '@' + self.__idCounter__++;

        self.registerModel(obj);

        self.__events__.emit('all', 'init', clazz.__name__, obj);
        self.__events__.emit('init', clazz.__name__, obj);

        obj.on('change', function (name, val, old, obj) {
            self.__events__.emit('all', 'change', name, val, old, obj);
            self.__events__.emit('change', name, val, old, obj);
        });

        obj.on('addto', function (name, item, index, obj) {
            self.__events__.emit('all', 'addto', name, item, index, obj);
            self.__events__.emit('addto', name, item, index, obj);
        });

        obj.on('removefrom', function (name, item, index, obj) {
            self.__events__.emit('all', 'removefrom', name, item, index, obj);
            self.__events__.emit('removefrom', name, item, index, obj);
        });
    });
};

DataModel.prototype.clone = (function () {
    function clone(obj) {
        if (obj === null || obj === undefined) return;

        if (obj.__id__) return obj.__id__;

        if (obj instanceof Array) {
            return obj.map(clone);
        }

        if (typeof obj === 'object') {
            var copy = {};
            Object.keys(obj).forEach(function (key) {
                if (key.indexOf('_') === 0) return;
                copy[key] = clone(obj[key]);
            });
            return copy;
        }

        return obj;
    };
    return function (obj) {
        // is a class
        if (obj && obj.__id__) {
            var copy = {};

            Object.getOwnPropertyNames(obj).forEach(function (key) {
                if (key.indexOf('_') === 0) return;
                copy[key] = clone(obj[key]);
            });

            return copy;
        }

        return clone(obj);
    };
}());

DataModel.prototype.toJSON = function (clientOptions) {
    var json = {}, self = this,
        classes = self.__library__.__classes__;
    Object.keys(this.__cache__).forEach(function (key) {
        var className = self.__cache__[key].__name__;
        if (!classes[className].options.client(clientOptions)) return;
        json[key] = self.clone(self.__cache__[key]);
        for (var attrName in json[key]) {
            var linkId = className + '@@@' + attrName,
                attr = self.__library__.__attributes__[linkId];
            if (attr && !attr.options.client(clientOptions)) delete json[key][attrName];
            var link = self.__library__.__links__[linkId];
            if (link && (!link.options.client(clientOptions) || !classes[link.args[1].class.__name__].options.client(clientOptions))) delete json[key][attrName];
        }
    });
    return JSON.stringify(json);
};

DataModel.prototype.fromJSON = (function () {
    function getOrCreate(datamodel, id) {
        if (datamodel.__cache__[id]) return datamodel.__cache__[id];

        var name = id.split('@')[0],
            Clazz = datamodel.__library__.getClass(name);
        return new Clazz(id);
    }
    return function (str) {
        var data = JSON.parse(str), self = this;
        // create all classes at first
        Object.keys(data).forEach(function (objID) {
            getOrCreate(self, objID);
        });
        // create all connections
        Object.keys(data).forEach(function (objID) {
            Object.keys(data[objID]).forEach(function (attr) {
                var value = data[objID][attr];
                if (value instanceof Array) {
                    value = value.map(function (val) {
                        return self.get(val) || val;
                    });
                } else {
                    value = self.get(value) || value;
                }
                self.get(objID)[attr] = value;
            });
        });
    };
}());

DataModel.prototype.get = function (id) {
    return this.__cache__[id];
};

DataModel.prototype.update = function (event, a1, a2, a3, a4) {
    var self = this;
    switch(event) {
        case 'initial':
            this.fromJSON(a1);
            break;
        case 'init':
            var Clazz = this.__library__.getClass(a1);
            new Clazz(a2);
            break;
        case 'addto':
            var obj = this.get(a4), target = this.get(a2);
            obj[a1].push(target);
            break;
        case 'removefrom':
            var obj = this.get(a4), target = this.get(a2);
            obj[a1].remove(target);
            break;
        case 'change':
            var obj = this.get(a4), value;
            if (a2 instanceof Array) {
                value = a2.map(function (a) {
                    return self.get(a) || a;
                })
            } else {
                value = this.get(a2) || a2;
            }
            if (obj) obj[a1] = value;
            break;
    }
};

DataModel.prototype.registerModel = function (model) {
    this.__cache__[model.__id__] = model;
};

DataModel.prototype.on = function () {
    this.__events__.on.apply(this.__events__, arguments);
};

DataModel.prototype.off = function () {
    this.__events__.off.apply(this.__events__, arguments);
};

DataModel.prototype.getByID = function (id) {
    return this.__cache__[id];
};

module.exports = DataModel;
