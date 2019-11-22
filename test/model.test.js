var sinon = require('sinon'),
    JOM = require('../index');

describe('Creates classes which', function () {

    it('should have all functions', function () {
        var Game = JOM.createClass('Game'),
            Player = JOM.createClass('Player');

        JOM.link({ class: Game, arity: '1' }, { class: Player, arity: '*' });

        var game = new Game(),
            player = new Player();

        // properties
        game.should.have.property('players');


        // clazz based stuff
        Game.should.have.property('on');
        Game.should.have.property('link');
        Game.should.have.property('attribute');
        Game.should.have.property('extend');

        // event emitter stuff
        game.should.have.property('on');
        game.should.have.property('emit');
    });

    it('should respond to the init event', function () {
        var Game = JOM.createClass('Game'),
            spy = sinon.spy();
        Game.on('init', spy);
        var game = new Game();
        spy.should.have.been.calledWith(game);
    });

    it('should call the initialize function', function () {
        var Game = JOM.createClass('Game'),
            spy = sinon.spy();
        Game.prototype.initialize = spy;
        new Game();
        spy.should.have.been.calledOnce;
    });

    it('should have attributes via extend', function () {
        var Game = JOM.createClass('Game'),
            start = sinon.spy();
        JOM.extend(Game, {
            start: start,
            name: 'test',
        });
        var game = new Game();
        game.should.have.property('start');
        game.name.should.equal('test');
        game.start();
        start.should.have.been.calledOnce;
    });

    it('should inherit from another JOM class', function () {
        var Field = JOM.createClass('Field');
        Field.prototype.name = 'field';
        var SpecialField = JOM.inherit(Field, 'SuperField'),
            specialField = new SpecialField();
        specialField.should.have.property('name');
        specialField.name.should.equal('field');
        SpecialField.prototype.name = 'superfield';
        var anotherField = new SpecialField();
        anotherField.should.have.property('name');
        anotherField.name.should.equal('superfield');
    });

    it('should chain link, attribute and extend', function () {
        var Field = JOM.createClass('Field');
        Field
            .attribute('pos', 'Number')
            .attribute('list', 'Array')
            .link({ arity: '1', name: 'prev' }, { class: Field, arity: '1', name: 'next' })
            .extend({ start: function () {} });
        var field = new Field();
        field.should.have.property('list');
        field.should.have.property('prev');
        field.should.have.property('next');
        field.should.have.property('pos');
        field.should.have.property('list');
        field.list.should.deep.equal([]);
        field.should.have.property('start');
    });

    describe('attributes', function () {
        var Field;

        beforeEach(function () {
            Field = JOM.createClass('Field');
        });

        it('responds to simple attribute events', function () {
            JOM.attribute(Field, 'pos', 'Number');

            var field = new Field(),
                onChange = sinon.spy(),
                onChangePos = sinon.spy();

            field.on('change', onChange);
            field.on('change:pos', onChangePos);

            field.pos = 2;

            onChange.should.be.calledOnce;
            onChangePos.should.be.calledOnce;
            onChange.reset();
            onChangePos.reset();
        });

        it('responds to array attribute events', function () {
            JOM.attribute(Field, 'positions', 'Array');

            var field = new Field(),
                onChange = sinon.spy(),
                onChangePositions = sinon.spy(),
                onAddPositions = sinon.spy(),
                onRemovePositions = sinon.spy();

            field.on('change', onChange);
            field.on('change:positions', onChangePositions);
            field.on('addto:positions', onAddPositions);
            field.on('removefrom:positions', onRemovePositions);

            field.positions = [1];

            onChange.should.be.calledOnce;
            onChangePositions.should.be.calledOnce;
            onChange.reset();
            onChangePositions.reset();

            field.positions.push(2);

            onChange.should.be.calledOnce;
            onChangePositions.should.be.calledOnce;
            onAddPositions.should.be.calledOnce;
            onChange.reset();
            onChangePositions.reset();
            onAddPositions.reset();

            field.positions.remove(1);

            onChange.should.be.calledOnce;
            onChangePositions.should.be.calledOnce;
            onRemovePositions.should.be.calledOnce;
        });

    });

});