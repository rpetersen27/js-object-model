
module.exports = {
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
};
