var util = require('./util');

function oneToOne(from, to) {

}

function oneToMultiple(from, to) {
    var Origin = from.class.prototype,
        Target = to.class.prototype,
        targets = to.name + 's',
        getTargets = util.toCamelcase('get', to.name + 's'),
        setTargets = util.toCamelcase('set', to.name + 's'),
        addTarget = util.toCamelcase('add', to.name),
        removeTarget = util.toCamelcase('remove', to.name),
        origin = from.name,
        getOrigin = util.toCamelcase('get', from.name),
        setOrigin = util.toCamelcase('set', from.name);

    // add init listeners
    from.class.on('init', function (obj) {
        obj[targets] = [];
    });

    // Getter and setter of origin
    Origin[getTargets] = function () {
        return this[targets];
    };
    Origin[setTargets] = function (targs) {
        var self = this,
            oldTargets = this[targets];
        this[targets] = [].concat(targs);
        this.emit('change:' + to.name, this[targets], oldTargets, this);
        this.emit('change', to.name, this[targets], oldTargets, this);
        // remove origin from old targets
        if (oldTargets) {
            oldTargets.forEach(function (target, index) {
                target[setOrigin]();
            });
        }
        // add origin to new targets
        if (targs) {
            targs.forEach(function (target) {
                target[setOrigin](self);
            });
        }
        return this;
    };

    // add and remove of origin
    Origin[addTarget] = function (target) {
        if (!target || this[targets].indexOf(target) >= 0) return this;
        var oldTargets = this[targets];
        this[targets] = [].concat(this[targets]);
        this[targets].push(target);
        this.emit('add:' + to.name, target, this);
        this.emit('change:' + to.name, this[targets], oldTargets, this);
        this.emit('change', to.name, this[targets], oldTargets, this);
        target[setOrigin](this);
        return this;
    };
    Origin[removeTarget] = function (target) {
        var index = this[targets].indexOf(target);
        if (index >= 0) {
            var oldTargets = this[targets];
            this[targets] = [].concat(this[targets]);
            this[targets].splice(index, 1);
            this.emit('remove:' + to.name, target, this);
            this.emit('change:' + to.name, this[targets], oldTargets, this);
            this.emit('change', to.name, this[targets], oldTargets, this);
            target[setOrigin]();
        }
        return this;
    };

    // Getter and setter of target
    Target[getOrigin] = function () {
        return this[origin];
    };
    Target[setOrigin] = function (orig) {
        if (orig === this[origin]) return this;
        var oldOrigin = this[origin];
        if (this[origin]) {
            delete this[origin];
            oldOrigin[removeTarget](this);
        }
        this[origin] = orig;
        this.emit('change:' + from.name, this[origin], oldOrigin, this);
        this.emit('change', from.name, this[origin], oldOrigin, this);
        if (orig) {
            orig[addTarget](this);
        }
        return this;
    };
}

function multipleToMultiple(from, to) {

}

module.exports = function (from, to) {
    if (!from.name) from.name = from.class.prototype.constructor.name.toLowerCase();
    if (!to.name) to.name = to.class.prototype.constructor.name.toLowerCase();

    if (from.arity === '1' && to.arity === '1') return oneToOne(from, to);
    else if (from.arity === '1' && to.arity === '*') return oneToMultiple(from, to);
    else if (from.arity === '*' && to.arity === '1') return oneToMultiple(to, from);
    else if (from.arity === '*' && to.arity === '*') return multipleToMultiple(from, to);
};