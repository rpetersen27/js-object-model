var util = require('./util'),
    EventEmitter = require('events').EventEmitter;

function defineProperty(clazz, name, nameInv) {
    clazz.on('init', function (obj) {
        var value;
        Object.defineProperty(obj, name, {
            get: function () {
                return value;
            },
            set: function (newValue) {
                if (newValue === value) return;
                var oldValue = value;
                if (value) {
                    value = undefined;
                    oldValue[nameInv] = undefined;
                }
                value = newValue;
                if (value) {
                    value[nameInv] = this;
                }
                this.emit('change:' + name, value, oldValue, this);
                this.emit('change', name, value, oldValue, this);
            }
        });
    });
}

function oneToOne(from, to) {
    // Getter and setter of origin
    defineProperty(from.class, to.name, from.name);
    // Getter and setter of target
    defineProperty(to.class, from.name, to.name);
}

function reactiveOneArray(obj, name, nameInv, arr) {
    // TODO arr.shift(), arr.unshift(), arr.pop(), arr.splice()

    arr.push = function () {
        var args = Array.prototype.slice.call(arguments).filter(function (item) {
            return this.indexOf(item) < 0;
        }.bind(this));
        var baseIndex = arr.length,
            result = Array.prototype.push.apply(this, args);
        args.forEach(function (item) {
            item[nameInv] = obj;
        }.bind(this));
        args.forEach(function (item, i) {
            obj.emit('addto:' + name, item, baseIndex + i, obj);
            obj.emit('change:' + name, arr, arr, obj);
            obj.emit('change', name, arr, arr, obj);
        });
        return result;
    };

    arr.unshift = function () {
        var args = Array.prototype.slice.call(arguments).filter(function (item) {
            return this.indexOf(item) < 0;
        }.bind(this));
        var baseIndex = arr.length,
            result = Array.prototype.unshift.apply(this, args);
        args.forEach(function (item) {
            item[nameInv] = obj;
        }.bind(this));
        args.forEach(function (item, i) {
            obj.emit('addto:' + name, item, baseIndex + i, obj);
            obj.emit('change:' + name, arr, arr, obj);
            obj.emit('change', name, arr, arr, obj);
        });
        return result;
    };

    arr.remove = function (item) {
        var index = this.indexOf(item);
        if (index < 0) return;
        Array.prototype.splice.call(this, index, 1);
        item[nameInv] = undefined;
        obj.emit('removefrom:' + name, item, index, obj);
        obj.emit('change:' + name, arr, arr, obj);
        obj.emit('change', name, arr, arr, obj);
    };

    return arr;
}

function oneToMultiple(from, to) {
    from.class.on('init', function (obj) {
        var list = reactiveOneArray(obj, to.name, from.name, []);
        Object.defineProperty(obj, to.name, {
            get: function () {
                return list;
            },
            set: function (newList) {
                if (newList === list) return;
                var oldList = list;
                list = undefined;
                (oldList || []).forEach(function (item) {
                    item[from.name] = undefined;
                });
                list = newList ? reactiveOneArray(obj, to.name, from.name, newList) : newList;
                (newList || []).forEach(function (item) {
                    item[from.name] = this;
                }.bind(this));
                this.emit('change:' + to.name, list, oldList, this);
                this.emit('change', to.name, list, oldList, this);
            }
        });
    });

    to.class.on('init', function (obj) {
        var value;
        Object.defineProperty(obj, from.name, {
            get: function () {
                return value;
            },
            set: function (newValue) {
                if (newValue === value) return;
                var oldValue = value;
                if (oldValue && oldValue[to.name]) {
                    value = undefined;
                    oldValue[to.name].remove(this);
                }
                value = newValue;
                if (value) {
                    value[to.name].push(this);
                }
                this.emit('change:' + from.name, value, oldValue, this);
                this.emit('change', from.name, value, oldValue, this);
            }
        });
    });
}

function reactiveMultipleArray(obj, name, nameInv, arr) {
    // TODO arr.shift(), arr.unshift(), arr.pop(), arr.splice()

    arr.push = function () {
        var args = Array.prototype.slice.call(arguments).filter(function (item) {
            return this.indexOf(item) < 0;
        }.bind(this));
        var baseIndex = arr.length,
            result = Array.prototype.push.apply(this, args);
        args.forEach(function (item) {
            item[nameInv].push(obj);
        }.bind(this));
        args.forEach(function (item, i) {
            obj.emit('addto:' + name, item, baseIndex + i, obj);
            obj.emit('change:' + name, arr, arr, obj);
            obj.emit('change', name, arr, arr, obj);
        })
        return result;
    };

    arr.remove = function (item) {
        var index = this.indexOf(item);
        if (index < 0) return;
        Array.prototype.splice.call(this, index, 1);
        item[nameInv].remove(obj);
        obj.emit('removefrom:' + name, item, index, obj);
        obj.emit('change:' + name, arr, arr, obj);
        obj.emit('change', name, arr, arr, obj);
    };

    return arr;
}

var i = 0;
function defineMultipleProperty(clazz, name, nameInv) {
    clazz.on('init', function (obj) {
        obj._id = i++;
        var list = reactiveMultipleArray(obj, name, nameInv, []);
        Object.defineProperty(obj, name, {
            get: function () {
                return list;
            },
            set: function (newList) {
                if (newList === list) return;
                var oldList = list;
                list = reactiveMultipleArray(obj, name, nameInv, []);
                (oldList || []).forEach(function (item) {
                    item[nameInv].remove(this);
                }.bind(this));
                list = newList ? reactiveMultipleArray(obj, name, nameInv, newList) : newList;
                (newList || []).forEach(function (item) {
                    item[nameInv].push(this);
                }.bind(this));
                this.emit('change:' + name, list, oldList, this);
                this.emit('change', name, list, oldList, this);
            }
        })
    });
}

function multipleToMultiple(from, to) {
    defineMultipleProperty(from.class, to.name, from.name);
    defineMultipleProperty(to.class, from.name, to.name);
}

module.exports = function (from, to, relation) {
    if (from.__createdby__) from = { class: from };
    if (to.__createdby__) to = { class: to };

    if (relation) {
        var arities = relation.split('-');
        if (arities.length === 2) {
            var data = arities[0].split(':');
            if (data.length > 0) {
                from.arity = data[0];
                if (data.length === 2) from.name = data[1];
            }
            data = arities[1].split(':');
            if (data.length > 0) {
                to.arity = data[0];
                if (data.length === 2) to.name = data[1];
            }
        }
    }

    if (!from.name) {
        from.name = from.class.prototype.constructor.name.toLowerCase();
        if (from.arity === '*') from.name = util.pluralForm(from.name);
    }
    if (!to.name) {
        to.name = to.class.prototype.constructor.name.toLowerCase();
        if (to.arity === '*') to.name = util.pluralForm(to.name);
    }

    if (from.arity === '1' && to.arity === '1') return oneToOne(from, to);
    else if (from.arity === '1' && to.arity === '*') return oneToMultiple(from, to);
    else if (from.arity === '*' && to.arity === '1') return oneToMultiple(to, from);
    else if (from.arity === '*' && to.arity === '*') return multipleToMultiple(from, to);
};