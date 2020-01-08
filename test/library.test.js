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
        lib.should.have.property('toJSON');
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

    describe('clones', function () {

        it('Arrays with objects', function () {
            const origin = [{ test: 123 }];
            const result = JOM.Library.clone(origin);

            result.should.deep.equal([{ test: 123 }]);
            origin.should.not.equal(result);
            origin[0].should.not.equal(result[0]);
        });

        it('classes by names', function () {
            const Game = JOM.createClass('Game');
            const origin = [Game];
            const result = JOM.Library.clone(origin);

            result.should.deep.equal(['Game']);
        });

    });

    describe('can export a datamodel', function () {

        describe('via lib.', function () {

            function stringify(classes = [], attributes = [], links = [], extensions = []) {
                return JSON.stringify({
                    classes,
                    attributes,
                    links,
                    extensions,
                });
            }

            it('should convert classes', function () {
                const lib = new JOM.Library();
                lib.createClass('Game');

                lib.toJSON().should.equal(stringify(['Game']));
            });

            it('should convert simple links', function () {
                const lib = new JOM.Library();
                const Game = lib.createClass('Game');
                const Map = lib.createClass('Map');
                lib.link(Game, Map, '1-1');

                lib.toJSON().should.equal(stringify(['Game', 'Map'], [], [['Game', 'Map', '1-1']]));
            });

            it('should convert complex links', function () {
                const lib = new JOM.Library();
                const Game = lib.createClass('Game');
                const Map = lib.createClass('Map');
                lib.link({ class: Game, arity: '1', name: 'linktomap' }, { class: Map, arity: '1', name: 'linktogame' });

                lib.toJSON().should.equal(stringify(['Game', 'Map'], [], [[{ class: 'Game', arity: '1', name: 'linktomap' }, { class: 'Map', arity: '1', name: 'linktogame' }]]));
            });

            it('should convert attributes', function () {
                const lib = new JOM.Library();
                const Game = lib.createClass('Game');
                lib.attribute(Game, 'running', 'boolean');

                lib.toJSON().should.equal(stringify(['Game'], [['Game', 'running', 'boolean']]));
            });

            it('should convert extensions', function () {
                const lib = new JOM.Library();
                const Game = lib.createClass('Game');
                lib.extend(Game, { running: true });

                lib.toJSON().should.equal(stringify(['Game'], [], [], [['Game', { running: true }]]));
            });

            it('should not convert extended functions', function () {
                const lib = new JOM.Library();
                const Game = lib.createClass('Game');
                lib.extend(Game, { test: function() {} });

                lib.toJSON().should.equal(stringify(['Game'], [], [], [['Game', {}]]));
            });

        });

        describe('via class.', function () {

            function stringify(classes = [], attributes = [], links = [], extensions = []) {
                return JSON.stringify({
                    classes,
                    attributes,
                    links,
                    extensions,
                });
            }

            it('should convert simple links', function () {
                const lib = new JOM.Library();
                const Game = lib.createClass('Game');
                const Map = lib.createClass('Map');
                Game.link(Map, '1-1');

                lib.toJSON().should.equal(stringify(['Game', 'Map'], [], [[{ class: 'Game', arity: '1', name: 'game' }, 'Map', '1-1']]));
            });

            it('should convert complex links', function () {
                const lib = new JOM.Library();
                const Game = lib.createClass('Game');
                const Map = lib.createClass('Map');
                Game.link({ arity: '1', name: 'linktomap' }, { class: Map, arity: '1', name: 'linktogame' });

                lib.toJSON().should.equal(stringify(['Game', 'Map'], [], [[{ arity: '1', name: 'linktomap', class: 'Game' }, { class: 'Map', arity: '1', name: 'linktogame' }, null]]));
            });

            it('should convert attributes', function () {
                const lib = new JOM.Library();
                const Game = lib.createClass('Game');
                Game.attribute('running', 'boolean');

                lib.toJSON().should.equal(stringify(['Game'], [['Game', 'running', 'boolean']]));
            });

            it('should convert extensions', function () {
                const lib = new JOM.Library();
                const Game = lib.createClass('Game');
                Game.extend({ running: true });

                lib.toJSON().should.equal(stringify(['Game'], [], [], [['Game', { running: true }]]));
            });

            it('should not convert extended functions', function () {
                const lib = new JOM.Library();
                const Game = lib.createClass('Game');
                Game.extend({ test: function() {} });

                lib.toJSON().should.equal(stringify(['Game'], [], [], [['Game', {}]]));
            });

        });

    });

});
