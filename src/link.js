var util = require('./util');

function oneToOne(from, to) {
    var Origin = from.class.prototype,
        Target = to.class.prototype,
        target = to.name,
        getTarget = util.toCamelcase('get', to.name),
        setTarget = util.toCamelcase('set', to.name),
        origin = from.name,
        getOrigin = util.toCamelcase('get', from.name),
        setOrigin = util.toCamelcase('set', from.name);

    // Getter and setter of origin
    Origin[getTarget] = function () {
        return this[target];
    };
    Origin[setTarget] = function (targ) {
        if (targ === this[target]) return this;
        var oldTarget = this[target];
        if (this[target]) {
            delete this[target];
            oldTarget[setOrigin]();
        }
        this[target] = targ;
        this.emit('change:' + to.name, this[target], oldTarget, this);
        this.emit('change', to.name, this[target], oldTarget, this);
        if (this[target]) {
            this[target][setOrigin](this);
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
            oldOrigin[setTarget]();
        }
        this[origin] = orig;
        this.emit('change:' + from.name, this[origin], oldOrigin, this);
        this.emit('change', from.name, this[origin], oldOrigin, this);
        if (this[origin]) {
            this[origin][setTarget](this);
        }
        return this;
    };
}

function oneToMultiple(from, to) {
    var Origin = from.class.prototype,
        Target = to.class.prototype,
        targets = util.pluralForm(to.name),
        getTargets = util.toCamelcase('get', util.pluralForm(to.name)),
        setTargets = util.toCamelcase('set', util.pluralForm(to.name)),
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
        if (this[origin]) {
            this[origin][addTarget](this);
        }
        return this;
    };
}

function multipleToMultiple(from, to) {
    var Origin = from.class.prototype,
        Target = to.class.prototype,
        targets = util.pluralForm(to.name),
        getTargets = util.toCamelcase('get', util.pluralForm(to.name)),
        setTargets = util.toCamelcase('set', util.pluralForm(to.name)),
        addTarget = util.toCamelcase('add', to.name),
        removeTarget = util.toCamelcase('remove', to.name),
        origins = util.pluralForm(from.name),
        getOrigins = util.toCamelcase('get', util.pluralForm(from.name)),
        setOrigins = util.toCamelcase('set', util.pluralForm(from.name)),
        addOrigin = util.toCamelcase('add', from.name),
        removeOrigin = util.toCamelcase('remove', from.name);

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
                target[removeOrigin]();
            });
        }
        // add origin to new targets
        if (targs) {
            targs.forEach(function (target) {
                target[addOrigin](self);
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
        target[addOrigin](this);
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
            target[removeOrigin](this);
        }
        return this;
    };

    // add init listeners
    to.class.on('init', function (obj) {
        obj[origins] = [];
    });

    // Getter and setter of target
    Target[getOrigins] = function () {
        return this[origins];
    };
    Target[setOrigins] = function (origs) {
        var self = this,
            oldOrigins = this[origins];
        this[origins] = [].concat(origs);
        this.emit('change:' + to.name, this[origins], oldOrigins, this);
        this.emit('change', to.name, this[origins], oldOrigins, this);
        // remove targets from old origins
        if (oldOrigins) {
            oldOrigins.forEach(function (origin, index) {
                origin[removeTarget](self);
            });
        }
        // add origin to new targets
        if (this[origins]) {
            this[origins].forEach(function (origin) {
                origin[addTarget](self);
            });
        }
        return this;
    };

    // add and remove of origin
    Target[addOrigin] = function (origin) {
        if (!origin || this[origins].indexOf(origin) >= 0) return this;
        var oldOrigins = this[origins];
        this[origins] = [].concat(this[origins]);
        this[origins].push(origin);
        this.emit('add:' + from.name, origin, this);
        this.emit('change:' + from.name, this[origins], oldOrigins, this);
        this.emit('change', from.name, this[origins], oldOrigins, this);
        origin[addTarget](this);
        return this;
    };
    Target[removeOrigin] = function (origin) {
        var index = this[origins].indexOf(origin);
        if (index >= 0) {
            var oldOrigins = this[origins];
            this[origins] = [].concat(this[origins]);
            this[origins].splice(index, 1);
            this.emit('remove:' + from.name, origin, this);
            this.emit('change:' + from.name, this[origins], oldOrigins, this);
            this.emit('change', from.name, this[origins], oldOrigins, this);
            origin[removeTarget](this);
        }
        return this;
    };
}

module.exports = function (from, to) {
    if (!from.name) from.name = from.class.prototype.constructor.name.toLowerCase();
    if (!to.name) to.name = to.class.prototype.constructor.name.toLowerCase();

    if (from.arity === '1' && to.arity === '1') return oneToOne(from, to);
    else if (from.arity === '1' && to.arity === '*') return oneToMultiple(from, to);
    else if (from.arity === '*' && to.arity === '1') return oneToMultiple(to, from);
    else if (from.arity === '*' && to.arity === '*') return multipleToMultiple(from, to);
};