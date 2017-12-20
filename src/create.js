var EventEmitter = require('events').EventEmitter,
    inherits = require('inherits'),
    globalEmitter = new EventEmitter();

module.exports = function (name) {
    var func, code = [
        'var func = function ' + name + '() { ',
            'EventEmitter.call(this);',
            'globalEmitter.emit("init:' + name + '", this);',
            'if (this.initialize) this.initialize();',
        '}'].join(' ');
    eval(code);
    inherits(func, EventEmitter);
    func.on = function (event) {
        var args = Array.prototype.slice.call(arguments);
        args[0] = event + ':' + name;
        globalEmitter.on.apply(globalEmitter, args);
    };
    return func;
};
