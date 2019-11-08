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
        var result = Array.prototype.push.apply(this, args);
        args.forEach(function (item) {
            item[nameInv] = obj;
        }.bind(this));
        args.forEach(function (item) {
            obj.emit('addto:' + name, item, obj);
            obj.emit('change:' + name, arr, arr, obj);
            obj.emit('change', name, arr, arr, obj);
        })
        return result;
    };

    arr.remove = function (item) {
        var index = this.indexOf(item);
        if (index < 0) return;
        Array.prototype.splice.call(this, index, 1);
        item[nameInv] = undefined;
        obj.emit('removefrom:' + name, item, obj);
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
        var result = Array.prototype.push.apply(this, args);
        args.forEach(function (item) {
            item[nameInv].push(obj);
        }.bind(this));
        args.forEach(function (item) {
            obj.emit('addto:' + name, item, obj);
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
        obj.emit('removefrom:' + name, item, obj);
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

    // var Origin = from.class.prototype,
    //     Target = to.class.prototype,
    //     targets = to.name,
    //     getTargets = util.toCamelcase('get', to.name),
    //     setTargets = util.toCamelcase('set', to.name),
    //     addTarget = util.toCamelcase('addTo', to.name),
    //     removeTarget = util.toCamelcase('removeFrom', to.name),
    //     origins = from.name,
    //     getOrigins = util.toCamelcase('get', from.name),
    //     setOrigins = util.toCamelcase('set', from.name),
    //     addOrigin = util.toCamelcase('addTo', from.name),
    //     removeOrigin = util.toCamelcase('removeFrom', from.name);

    // // add init listeners
    // from.class.on('init', function (obj) {
    //     obj[targets] = [];
    // });

    // // Getter and setter of origin
    // Origin[getTargets] = function () {
    //     return this[targets];
    // };
    // Origin[setTargets] = function (targs) {
    //     var self = this,
    //         oldTargets = this[targets];
    //     this[targets] = [].concat(targs);
    //     this.emit('change:' + to.name, this[targets], oldTargets, this);
    //     this.emit('change', to.name, this[targets], oldTargets, this);
    //     // remove origin from old targets
    //     if (oldTargets) {
    //         oldTargets.forEach(function (target, index) {
    //             target[removeOrigin]();
    //         });
    //     }
    //     // add origin to new targets
    //     if (targs) {
    //         targs.forEach(function (target) {
    //             target[addOrigin](self);
    //         });
    //     }
    //     return this;
    // };

    // // add and remove of origin
    // Origin[addTarget] = function (target) {
    //     if (!target || this[targets].indexOf(target) >= 0) return this;
    //     var oldTargets = this[targets];
    //     this[targets] = [].concat(this[targets]);
    //     this[targets].push(target);
    //     this.emit('addto:' + to.name, target, this);
    //     this.emit('change:' + to.name, this[targets], oldTargets, this);
    //     this.emit('change', to.name, this[targets], oldTargets, this);
    //     target[addOrigin](this);
    //     return this;
    // };
    // Origin[removeTarget] = function (target) {
    //     var index = this[targets].indexOf(target);
    //     if (index >= 0) {
    //         var oldTargets = this[targets];
    //         this[targets] = [].concat(this[targets]);
    //         this[targets].splice(index, 1);
    //         this.emit('removefrom:' + to.name, target, this);
    //         this.emit('change:' + to.name, this[targets], oldTargets, this);
    //         this.emit('change', to.name, this[targets], oldTargets, this);
    //         target[removeOrigin](this);
    //     }
    //     return this;
    // };

    // // add init listeners
    // to.class.on('init', function (obj) {
    //     obj[origins] = [];
    // });

    // // Getter and setter of target
    // Target[getOrigins] = function () {
    //     return this[origins];
    // };
    // Target[setOrigins] = function (origs) {
    //     var self = this,
    //         oldOrigins = this[origins];
    //     this[origins] = [].concat(origs);
    //     this.emit('change:' + to.name, this[origins], oldOrigins, this);
    //     this.emit('change', to.name, this[origins], oldOrigins, this);
    //     // remove targets from old origins
    //     if (oldOrigins) {
    //         oldOrigins.forEach(function (origin, index) {
    //             origin[removeTarget](self);
    //         });
    //     }
    //     // add origin to new targets
    //     if (this[origins]) {
    //         this[origins].forEach(function (origin) {
    //             origin[addTarget](self);
    //         });
    //     }
    //     return this;
    // };

    // // add and remove of origin
    // Target[addOrigin] = function (origin) {
    //     if (!origin || this[origins].indexOf(origin) >= 0) return this;
    //     var oldOrigins = this[origins];
    //     this[origins] = [].concat(this[origins]);
    //     this[origins].push(origin);
    //     this.emit('addto:' + from.name, origin, this);
    //     this.emit('change:' + from.name, this[origins], oldOrigins, this);
    //     this.emit('change', from.name, this[origins], oldOrigins, this);
    //     origin[addTarget](this);
    //     return this;
    // };
    // Target[removeOrigin] = function (origin) {
    //     var index = this[origins].indexOf(origin);
    //     if (index >= 0) {
    //         var oldOrigins = this[origins];
    //         this[origins] = [].concat(this[origins]);
    //         this[origins].splice(index, 1);
    //         this.emit('removefrom:' + from.name, origin, this);
    //         this.emit('change:' + from.name, this[origins], oldOrigins, this);
    //         this.emit('change', from.name, this[origins], oldOrigins, this);
    //         origin[removeTarget](this);
    //     }
    //     return this;
    // };
}

module.exports = function (from, to) {
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