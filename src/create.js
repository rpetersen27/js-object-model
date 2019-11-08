var EventEmitter = require('events').EventEmitter,
    inherits = require('inherits');

module.exports = function (name) {
    var emitter = new EventEmitter(), func, code = [
        'func = function ' + name + '() { ',
            'EventEmitter.call(this);',
            'emitter.emit("init", this);',
            'if (this.initialize) this.initialize();',
        '}'].join(' ');
    eval(code);
    inherits(func, EventEmitter);
    func.on = function () {
        var args = Array.prototype.slice.call(arguments);
        emitter.on.apply(emitter, args);
    };
    func.link = function (from, to) {
        from.class = this;
        require('./link')(from, to);
        return this;
    };
    func.attribute = function (name, type) {
        require('./attribute')(this, name, type);
        return this;
    };
    func.extend = function (obj) {
        require('./extend')(this, obj);
        return this;
    };
    return func;
};
