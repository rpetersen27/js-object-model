
module.exports = function (Clazz, extension) {
    for (var attribute in extension) {
        Clazz.prototype[attribute] = extension[attribute];
    }
};
