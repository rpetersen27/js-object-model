const sinon = require('sinon');
const JOM = require('../index');

describe('Librarys', function () {

    it('has basic support', function () {
        const lib = new JOM.Library();

        lib.should.have.property('createClass');
        lib.should.have.property('getClass');
        lib.should.have.property('link');
        lib.should.have.property('extend');
        lib.should.have.property('inherit');
        lib.should.have.property('attribute');
    });

    it('can create classes', function () {
        const lib = new JOM.Library();
        const Game = lib.createClass('Game');

        Game.should.have.property('on');
        Game.should.have.property('link');
        Game.should.have.property('attribute');
        Game.should.have.property('extend');
    });

    it('cannot create two classes with the same name in one library', function () {
        const lib = new JOM.Library();
        lib.createClass('Game');

        expect(lib.createClass.bind(lib, 'Game')).to.throw();
    });

    it('can create classes with getClass', function () {
        const lib = new JOM.Library();
        const Game = lib.getClass('Game');

        Game.should.have.property('on');
        Game.should.have.property('link');
        Game.should.have.property('attribute');
        Game.should.have.property('extend');
    });

    it('can get existing classes with getClass', function () {
        const lib = new JOM.Library();
        const Game = lib.createClass('Game');
        const Same = lib.getClass('Game');

        Game.should.equal(Same);
    });

    it('can use link', function () {
        const lib = new JOM.Library();
        const Field = lib.createClass('Field');
        lib.link({ class: Field, arity: '1', name: 'prev' }, { class: Field, arity: '1', name: 'next' });

        var field = new Field();
        field.should.have.property('prev');
        field.should.have.property('next');
    });

    it('can use attribute', function () {
        const lib = new JOM.Library();
        const Field = lib.createClass('Field');
        lib.attribute(Field, 'pos', 'Number');

        var field = new Field();
        field.should.have.property('pos');
    });

    it('can can extend properties', function () {
        const lib = new JOM.Library();
        const Game = lib.createClass('Game');
        const start = sinon.spy();
        lib.extend(Game, {
            start: start,
            name: 'test',
        });
        var game = new Game();
        game.should.have.property('start');
        game.name.should.equal('test');
        game.start();
        start.should.have.been.calledOnce;
    });

    it('can inherit', function () {
        const lib = new JOM.Library();
        const Field = lib.createClass('Field');
        Field.prototype.name = 'field';
        const SpecialField = lib.inherit(Field, 'SuperField');
        const specialField = new SpecialField();
        specialField.should.have.property('name');
        specialField.name.should.equal('field');
        SpecialField.prototype.name = 'superfield';
        const anotherField = new SpecialField();
        anotherField.should.have.property('name');
        anotherField.name.should.equal('superfield');
    });

    it('cannot inherit to existing class', function () {
        const lib = new JOM.Library();
        const Game = lib.createClass('Game');

        expect(lib.inherit.bind(lib, Game, 'Game')).to.throw();
    });

});
