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
    arr.push = function () {
        var args = Array.prototype.slice.call(arguments);
        var result = Array.prototype.push.apply(this, args);
        args.forEach(function (item) {
            obj.emit('addto:' + name, item, obj);
            obj.emit('change:' + name, arr, arr, obj);
            obj.emit('change', name, arr, arr, obj);
        });
        return result;
    };

    arr.unshift = function () {
        var args = Array.prototype.slice.call(arguments);
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

    arr.shift = function () {
        var result = Array.prototype.shift.call(this);
        if (result !== undefined) {
            obj.emit('removefrom:' + name, result, obj);
            obj.emit('change:' + name, arr, arr, obj);
            obj.emit('change', name, arr, arr, obj);
        }
        return result;
    };

    arr.pop = function () {
        var result = Array.prototype.pop.call(this);
        if (result !== undefined) {
            obj.emit('removefrom:' + name, result, obj);
            obj.emit('change:' + name, arr, arr, obj);
            obj.emit('change', name, arr, arr, obj);
        }
        return result;
    };

    arr.splice = function () {
        var args = Array.prototype.slice.call(arguments),
            start = args.shift(),
            deleteCount = args.shift(),
            deleteItems = arr.slice(start, start + deleteCount),
            i;
        Array.prototype.splice.apply(this, arguments);
        for (i = 0; i < deleteItems.length; i++) {
            obj.emit('removefrom:' + name, deleteItems[i], obj);
        }
        for (i = 0; i < args.length; i++) {
            obj.emit('addto:' + name, args[i], obj);
        }
        obj.emit('change:' + name, arr, arr, obj);
        obj.emit('change', name, arr, arr, obj);
    };

    arr.set = function (index, value) {
        this[index] = value;
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