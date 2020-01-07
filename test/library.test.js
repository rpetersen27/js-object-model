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
        lib.should.have.property('on');
        lib.should.have.property('off');
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

    describe('throws events', function () {

        it('when a model is created', function () {
            const lib = new JOM.Library();
            const Game = lib.createClass('Game');
            const createClassListener = sinon.spy();
            const allListener = sinon.spy();
            lib.on('init', createClassListener);
            lib.on('all', allListener);

            const game = new Game();

            createClassListener.should.have.been.calledWith('Game', game);
            allListener.should.have.been.calledWith('init', 'Game', game);
        });

        it('when a model value changes', function () {
            const lib = new JOM.Library();
            const Game = lib.createClass('Game');
            Game.attribute('pos', 'Number');
            const changeListener = sinon.spy();
            const allListener = sinon.spy();
            const game = new Game();
            lib.on('change', changeListener);
            lib.on('all', allListener);

            game.pos = 2;

            changeListener.should.have.been.calledWith('pos', 2, undefined, game);
            allListener.should.have.been.calledWith('change', 'pos', 2, undefined, game);
        });

        it('when a model is added to a list', function () {
            const lib = new JOM.Library();
            const Game = lib.createClass('Game');
            const Player = lib.createClass('Player');
            Game.link(Player, '1-*');
            const addListener = sinon.spy();
            const allListener = sinon.spy();
            const game = new Game();
            const player = new Player();
            lib.on('addto', addListener);
            lib.on('all', allListener);

            game.players.push(player);

            addListener.should.have.been.calledWith('players', player, 0, game);
            allListener.should.have.been.calledThrice;
        });

        it('when a model is removed from a list', function () {
            const lib = new JOM.Library();
            const Game = lib.createClass('Game');
            const Player = lib.createClass('Player');
            Game.link(Player, '1-*');
            const removeListener = sinon.spy();
            const allListener = sinon.spy();
            const game = new Game();
            const player = new Player();
            game.players.push(player);
            lib.on('removefrom', removeListener);
            lib.on('all', allListener);

            game.players.remove(player);

            removeListener.should.have.been.calledWith('players', player, 0, game);
            allListener.should.have.been.calledThrice;
        });

    });

});
