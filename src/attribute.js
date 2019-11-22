var util = require('./util');

function simpleAttribute(Clazz, name) {
    Clazz.on('init', function (obj) {
        var value;
        Object.defineProperty(obj, name, {
            get: function () {
                return value;
            },
            set: function (newValue) {
                var oldValue = value;
                value = newValue;
                if (oldValue !== newValue) {
                    this.emit('change:' + name, value, oldValue, this);
                    this.emit('change', name, value, oldValue, this);
                }
                return this;
            },
        });
    });
}

function reactiveArray(obj, name, arr) {
    // TODO arr.shift(), arr.pop(), arr.splice()

    arr.push = function () {
        var args = Array.prototype.slice.call(arguments).filter(function (item) {
            return this.indexOf(item) < 0;
        }.bind(this));
        var result = Array.prototype.push.apply(this, args);
        args.forEach(function (item) {
            obj.emit('addto:' + name, item, obj);
            obj.emit('change:' + name, arr, arr, obj);
            obj.emit('change', name, arr, arr, obj);
        });
        return result;
    };

    arr.unshift = function () {
        var args = Array.prototype.slice.call(arguments).filter(function (item) {
            return this.indexOf(item) < 0;
        }.bind(this));
        var result = Array.prototype.unshift.apply(this, args);
        args.forEach(function (item) {
            obj.emit('addto:' + name, item, obj);
            obj.emit('change:' + name, arr, arr, obj);
            obj.emit('change', name, arr, arr, obj);
        });
        return result;
    };

    arr.remove = function (item) {
        var index = this.indexOf(item);
        if (index < 0) return;
        Array.prototype.splice.call(this, index, 1);
        obj.emit('removefrom:' + name, item, obj);
        obj.emit('change:' + name, arr, arr, obj);
        obj.emit('change', name, arr, arr, obj);
    };

    return arr;
}

function arrayAttribute(Clazz, name) {
    Clazz.on('init', function (obj) {
        var value = reactiveArray(obj, name, []);
        Object.defineProperty(obj, name, {
            get: function () {
                return value;
            },
            set: function (newValue) {
                var oldValue = value;
                if (oldValue !== newValue) {
                    value = reactiveArray(obj, name, newValue);
                    this.emit('change:' + name, value, oldValue, this);
                    this.emit('change', name, value, oldValue, this);
                }
                return this;
            },
        });
    });
}

module.exports = function (Clazz, name, type) {
    type = type.toLowerCase();
    if (type === 'array') arrayAttribute(Clazz, name);
    else simpleAttribute(Clazz, name);
};