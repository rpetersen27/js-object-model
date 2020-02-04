var util = require('./util');

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
            },
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
    // TODO type verification

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
            obj.emit('addto', name, item, baseIndex + i, obj);
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
            obj.emit('addto', name, item, baseIndex + i, obj);
        });
        return result;
    };

    arr.remove = function (item) {
        var index = this.indexOf(item);
        if (index < 0) return;
        Array.prototype.splice.call(this, index, 1);
        item[nameInv] = undefined;
        obj.emit('removefrom:' + name, item, index, obj);
        obj.emit('removefrom', name, item, index, obj);
        return item;
    };

    arr.insertAt = function (index, item) {
        if (arr.indexOf(item) >= 0) return false;
        Array.prototype.splice.call(this, index, 0, item);
        item[nameInv] = obj;
        obj.emit('addto:' + name, item, index, obj);
        obj.emit('addto', name, item, index, obj);
        return true;
    };

    arr.removeAt = function (index) {
        var item = arr[index];
        if (!item) return;
        Array.prototype.splice.call(this, index, 1);
        item[nameInv] = undefined;
        obj.emit('removefrom:' + name, item, index, obj);
        obj.emit('removefrom', name, item, index, obj);
        return item;
    };

    arr.shift = function () {
        return arr.removeAt(0);
    };

    arr.pop = function () {
        return arr.removeAt(arr.length - 1);
    };

    arr.splice = function () {
        var args = Array.prototype.slice.call(arguments),
            start = args.shift(),
            deleteCount = args.shift(),
            deletedItems = arr.slice(start, start + deleteCount),
            i, changes = false;
        for (i = deleteCount - 1; i >= 0; i--) {
            changes = changes || arr.removeAt(start + i);
        }
        for (i = 0; i < args.length; i++) {
            var res;
            res = arr.insertAt(start + i, args[i]);
            changes = changes || res;
        }
        if (!changes) return;
        return deletedItems;
    };

    arr.set = function (index, value) {
        if (value === this[index]) return;
        var oldValue = this[index];
        if (oldValue) {
            arr.removeAt(index);
        }
        if (value) {
            arr.insertAt(index, value);
        }
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
            obj.emit('addto', name, item, baseIndex + i, obj);
        })
        return result;
    };

    arr.remove = function (item) {
        var index = this.indexOf(item);
        if (index < 0) return;
        Array.prototype.splice.call(this, index, 1);
        item[nameInv].remove(obj);
        obj.emit('removefrom:' + name, item, index, obj);
        obj.emit('removefrom', name, item, index, obj);
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
    const data = util.autocompleteLink(from, to, relation);
    from = data.from;
    to = data.to;

    if (from.arity === '1' && to.arity === '1') return oneToOne(from, to);
    else if (from.arity === '1' && to.arity === '*') return oneToMultiple(from, to);
    else if (from.arity === '*' && to.arity === '1') return oneToMultiple(to, from);
    else if (from.arity === '*' && to.arity === '*') return multipleToMultiple(from, to);
    else throw new Error('Cannot create link from', from, to, relation);
};