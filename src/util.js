
module.exports = util = {

    pluralForm: function (str) {
        if (str.charAt(str.length - 1) === 's') return str;
        return str + 's';
    },

    toCamelcase: function () {
        var args = Array.prototype.slice.call(arguments),
            result;
        args.forEach(function (items) {
            if (typeof items === 'string' || items instanceof String) items = items.split(' ');
            else items = [].concat(items);
            items.forEach(function (item) {
                if (!result) result = '' + item;
                else result += item.charAt(0).toUpperCase() + item.substr(1);
            });
        });
        return result;
    },

    autocompleteLink: function (from, to, relation) {
        if (from.__createdby__) from = { class: from };
        if (to.__createdby__) to = { class: to };

        from = Object.assign({}, from);
        to = Object.assign({}, to);

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

        return { from: from, to: to };
    },

    trueFunc: function () {
        return true;
    },

    falseFunc: function () {
        return false;
    },

};
