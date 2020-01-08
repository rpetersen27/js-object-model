
module.exports = function (Clazz, extension) {
    // TODO extensions need to be reactive if simple variables
    for (var attribute in extension) {
        Clazz.prototype[attribute] = extension[attribute];
    }
};
