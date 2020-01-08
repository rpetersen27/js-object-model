var EventEmitter = require('events').EventEmitter;

function DataModel() {
    this.__idCounter__ = 0;
    this.__cache__ = {};
    this.__events__ = new EventEmitter();
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
            self.__events__.emit('all', 'addto', name, item, index, obj);
            self.__events__.emit('removefrom', name, item, index, obj);
        });
    });
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
