var util = require('./util');

function simpleAttribute(Clazz, name) {
    var getAttribute = util.toCamelcase('get', name),
        setAttribute = util.toCamelcase('set', name);
    Clazz.prototype[getAttribute] = function () {
        return this[name];
    };
    Clazz.prototype[setAttribute] = function (value) {
        var oldValue = this[name];
        this[name] = value;
        if (oldValue !== value) {
            this.emit('change:' + name, this[name], oldValue, this);
            this.emit('change', name, this[name], oldValue, this);
        }
        return this;
    };
}

function arrayAttribute(Clazz, name) {
    var getAttributes = util.pluralForm(util.toCamelcase('get', name)),
        setAttributes = util.pluralForm(util.toCamelcase('set', name)),
        addAttribute = util.toCamelcase('add', name),
        removeAttribute = util.toCamelcase('remove', name),
        hasAttribute = util.toCamelcase('has', name);

    Clazz.on('init', function (obj) {
        obj[name] = [];
    });

    Clazz.prototype[getAttributes] = function () {
        return this[name];
    };
    Clazz.prototype[setAttributes] = function (value) {
        var oldValue = this[name];
        this[name] = value;
        if (oldValue !== value) {
            this.emit('change:' + name, this[name], oldValue, this);
            this.emit('change', name, this[name], oldValue, this);
        }
        return this;
    };
    Clazz.prototype[addAttribute] = function (value) {
        if (!value) return;
        var oldValue = this[name];
        this[name] = [].concat(this[name]);
        this[name].push(value);
        this.emit('add:' + name, value, this);
        this.emit('change:' + name, this[name], oldValue, this);
        this.emit('change', name, this[name], oldValue, this);
        return this;
    };
    Clazz.prototype[removeAttribute] = function (value) {
        var index = this[name].indexOf(value);
        if (index >= 0) {
            var oldValue = this[name];
            this[name] = [].concat(this[name]);
            this[name].splice(index, 1);
            this.emit('remove:' + name, value, this);
            this.emit('change:' + name, this[name], oldValue, this);
            this.emit('change', name, this[name], oldValue, this);
        }
        return this;
    };
    Clazz.prototype[hasAttribute] = function (value) {
        return this[name].indexOf(value) >= 0;
    };
}

module.exports = function (Clazz, name, type) {
    type = type.toLowerCase();
    if (type === 'array') arrayAttribute(Clazz, name);
    else simpleAttribute(Clazz, name);
};