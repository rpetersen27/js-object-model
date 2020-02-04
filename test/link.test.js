var sinon = require('sinon'),
    JOM = require('../index');

describe('Links', function () {

    describe('one to one link', function () {
        var Game, Map;
        before(function () {
            Game = JOM.createClass('Game');
            Map = JOM.createClass('Map');

            JOM.link({ class: Game, arity: '1' }, { class: Map, arity: '1' });
        });

        it('adds target and origin respectively', function () {
            var game1 = new Game(),
                game2 = new Game(),
                map1 = new Map(),
                map2 = new Map();

            game1.map = map1;

            game1.map.should.equal(map1);
            map1.game.should.equal(game1);

            game2.map = map2;

            game2.map.should.equal(map2);
            map2.game.should.equal(game2);

            game1.map = map2;

            game1.map.should.equal(map2);
            expect(map1.game).to.be.undefined;
            expect(game2.map).to.be.undefined;
            map2.game.should.equal(game1);
        });

        it('allows self references', function () {
            var Field = JOM.createClass('Field');
            JOM.link({ class: Field, arity: '1', name: 'prev' }, { class: Field, arity: '1', name: 'next' });

            var field = new Field();
            field.next = field;

            field.next.should.equal(field);
            field.prev.should.equal(field);
        });

        it('has correct events', function () {
            var game = new Game(),
                map = new Map(),
                onGameChange = sinon.spy(),
                onGameChangeMap = sinon.spy(),
                onMapChange = sinon.spy(),
                onMapChangeGame = sinon.spy();

            game.on('change', onGameChange);
            game.on('change:map', onGameChangeMap);
            map.on('change', onMapChange);
            map.on('change:game', onMapChangeGame);

            map.game = game;

            onGameChange.should.have.been.calledWith('map', map, undefined, game);
            onGameChangeMap.should.have.been.calledWith(map, undefined, game);
            onMapChange.should.have.been.calledWith('game', game, undefined, map);
            onMapChangeGame.should.have.been.calledWith(game, undefined, map);

            onGameChange.resetHistory();
            onGameChangeMap.resetHistory();
            onMapChange.resetHistory();
            onMapChangeGame.resetHistory();

            game.map = undefined;

            onGameChange.should.have.been.calledWith('map', undefined, map, game);
            onGameChangeMap.should.have.been.calledWith(undefined, map, game);
            onMapChange.should.have.been.calledWith('game', undefined, game, map);
            onMapChangeGame.should.have.been.calledWith(undefined, game, map);
        });

    });

    describe('one to multiple link', function () {
        var Game, Player;

        before(function () {
            Game = JOM.createClass('Game');
            Player = JOM.createClass('Player');

            JOM.link({ class: Game, arity: '1' }, { class: Player, arity: '*' });
        });

        it('Adds items to origin or target and removes them', function () {
            var game1 = new Game(),
                game2 = new Game(),
                player = new Player();

            game1.players.should.deep.equal([]);
            game2.players.should.deep.equal([]);
            expect(player.game).to.be.undefined;

            game1.players.push(player);

            game1.players.should.deep.equal([ player ]);
            game2.players.should.deep.equal([]);
            player.game.should.equal(game1);

            player.game = game2;

            game1.players.should.deep.equal([]);
            game2.players.should.deep.equal([ player ]);
            player.game.should.deep.equal(game2);

            game2.players.remove(player);

            game1.players.should.deep.equal([]);
            game2.players.should.deep.equal([]);
            expect(player.game).to.be.undefined;
        });

        it('overwrites existing models in origin and links them correctly', function () {
            var game = new Game(),
                prevPlayers = [new Player(), new Player()],
                nextPlayers = [new Player(), new Player(), new Player()];

            game.players.should.deep.equal([]);

            game.players = prevPlayers;

            game.players.should.deep.equal(prevPlayers);
            prevPlayers[0].game.should.equal(game);
            prevPlayers[1].game.should.equal(game);

            game.players = nextPlayers;

            game.players.should.deep.equal(nextPlayers);
            expect(prevPlayers[0].game).to.be.undefined;
            expect(prevPlayers[1].game).to.be.undefined;
            nextPlayers[0].game.should.equal(game);
            nextPlayers[1].game.should.equal(game);
            nextPlayers[2].game.should.equal(game);
        });

        it('listens to events', function () {
            var game = new Game(),
                player = new Player(),
                onGameChange = sinon.spy(),
                onGameChangePlayers = sinon.spy(),
                onAdd = sinon.spy(),
                onGameAddPlayer = sinon.spy(),
                onRemove = sinon.spy(),
                onGameRemovePlayer = sinon.spy(),
                onPlayerChange = sinon.spy(),
                onPlayerChangeGame = sinon.spy();

            game.on('change', onGameChange);
            game.on('addto', onAdd);
            game.on('addto:players', onGameAddPlayer);
            game.on('removefrom', onRemove);
            game.on('removefrom:players', onGameRemovePlayer);
            game.on('change:players', onGameChangePlayers);
            player.on('change', onPlayerChange);
            player.on('change:game', onPlayerChangeGame);

            game.players.push(player);

            onGameChange.should.not.have.been.called;
            onAdd.should.have.been.calledWith('players', player, 0, game);
            onGameAddPlayer.should.have.been.calledWith(player, 0, game);
            onRemove.should.not.be.called;
            onGameRemovePlayer.should.not.be.called;
            onGameChangePlayers.should.not.have.been.called;
            onPlayerChange.should.have.been.calledWith('game', game, undefined, player);
            onPlayerChangeGame.should.have.been.calledWith(game, undefined, player);

            onGameChange.resetHistory();
            onAdd.resetHistory();
            onGameAddPlayer.resetHistory();
            onGameChangePlayers.resetHistory();
            onPlayerChange.resetHistory();
            onPlayerChangeGame.resetHistory();

            player.game = new Game();

            onGameChange.should.not.have.been.called;
            onAdd.should.not.be.called;
            onGameAddPlayer.should.not.be.called;
            onRemove.should.have.been.calledWith('players', player, 0, game);
            onGameRemovePlayer.should.have.been.calledWith(player, 0, game);
            onGameChangePlayers.should.not.have.been.called;
            onPlayerChange.should.have.been.calledWith('game', player.game, game, player);
            onPlayerChangeGame.should.have.been.calledWith(player.game, game, player);
        });

        describe('array functions', function () {

            it('push', function () {
                var game = new Game(),
                    player = new Player();

                var onGameChange = sinon.spy(),
                    onGameChangePlayers = sinon.spy(),
                    onAdd = sinon.spy();
                    onGameAddPlayer = sinon.spy();

                game.on('change', onGameChange);
                game.on('change:players', onGameChangePlayers);
                game.on('addto', onAdd);
                game.on('addto:players', onGameAddPlayer);

                game.players.push(player);

                onGameChange.should.not.have.been.called;
                onGameChangePlayers.should.not.have.been.called;
                onAdd.should.have.been.calledWith('players', player, 0, game);
                onGameAddPlayer.should.have.been.calledWith(player, 0, game);
                game.players.should.deep.equal([player]);
                player.game.should.equal(game);
            });

            it('unshift', function () {
                var game = new Game(),
                    player = new Player();

                var onGameChange = sinon.spy(),
                    onGameChangePlayers = sinon.spy(),
                    onAdd = sinon.spy();
                    onGameAddPlayer = sinon.spy();

                game.on('change', onGameChange);
                game.on('change:players', onGameChangePlayers);
                game.on('addto', onAdd);
                game.on('addto:players', onGameAddPlayer);

                game.players.unshift(player);

                onGameChange.should.not.have.been.called;
                onGameChangePlayers.should.not.have.been.called;
                onAdd.should.have.been.calledWith('players', player, 0, game);
                onGameAddPlayer.should.have.been.calledWith(player, 0, game);
                game.players.should.deep.equal([player]);
                player.game.should.equal(game);
            });

            it('remove', function () {
                var game = new Game(),
                    player = new Player();

                game.players = [player];

                var onGameChange = sinon.spy(),
                    onGameChangePlayers = sinon.spy(),
                    onRemove = sinon.spy(),
                    onRemoveFromPlayers = sinon.spy();

                game.on('change', onGameChange);
                game.on('change:players', onGameChangePlayers);
                game.on('removefrom', onRemove);
                game.on('removefrom:players', onRemoveFromPlayers);

                game.players.remove(player);

                onGameChange.should.not.have.been.called;
                onGameChangePlayers.should.not.have.been.called;
                onRemove.should.have.been.calledWith('players', player, 0);
                onRemoveFromPlayers.should.have.been.calledWith(player, 0);
                game.players.should.deep.equal([]);
                expect(player.game).to.be.undefined;
            });

            it('pop', function () {
                var game = new Game(),
                    player1 = new Player(),
                    player2 = new Player();

                game.players = [player1, player2];

                var onGameChange = sinon.spy(),
                    onGameChangePlayers = sinon.spy(),
                    onRemove = sinon.spy(),
                    onRemoveFromPlayers = sinon.spy();

                game.on('change', onGameChange);
                game.on('change:players', onGameChangePlayers);
                game.on('removefrom', onRemove);
                game.on('removefrom:players', onRemoveFromPlayers);

                game.players.pop();

                onGameChange.should.not.have.been.called;
                onGameChangePlayers.should.not.have.been.called;
                onRemove.should.been.calledWith('players', player2, 1, game);
                onRemoveFromPlayers.should.been.calledWith(player2, 1, game);
                game.players.should.deep.equal([player1]);
                expect(player2.game).to.be.undefined;
                player1.game.should.equal(game);
            });

            it('shift', function () {
                var game = new Game(),
                    player1 = new Player(),
                    player2 = new Player();

                game.players = [player1, player2];

                var onGameChange = sinon.spy(),
                    onGameChangePlayers = sinon.spy(),
                    onRemove = sinon.spy(),
                    onRemoveFromPlayers = sinon.spy();

                game.on('change', onGameChange);
                game.on('change:players', onGameChangePlayers);
                game.on('removefrom', onRemove);
                game.on('removefrom:players', onRemoveFromPlayers);

                game.players.shift();

                onGameChange.should.not.have.been.called;
                onGameChangePlayers.should.not.have.been.called;
                onRemove.should.have.been.calledWith('players', player1, 0, game);
                onRemoveFromPlayers.should.have.been.calledWith(player1, 0, game);
                game.players.should.deep.equal([player2]);
                expect(player1.game).to.be.undefined;
                player2.game.should.equal(game);
            });

            it('splice', function () {
                var game = new Game(),
                    player1 = new Player(),
                    player2 = new Player(),
                    player3 = new Player(),
                    player4 = new Player(),
                    player5 = new Player();

                game.players = [player1, player2, player3];

                var onGameChange = sinon.spy(),
                    onGameChangePlayers = sinon.spy(),
                    onAdd = sinon.spy(),
                    onAddToPlayers = sinon.spy(),
                    onRemove = sinon.spy(),
                    onRemoveFromPlayers = sinon.spy();

                game.on('change', onGameChange);
                game.on('change:players', onGameChangePlayers);
                game.on('addto', onAdd);
                game.on('addto:players', onAddToPlayers);
                game.on('removefrom', onRemove);
                game.on('removefrom:players', onRemoveFromPlayers);

                game.players.splice(1, 1, player4, player5);

                onGameChange.should.not.have.been.called;
                onGameChangePlayers.should.not.have.been.called;
                onAdd.should.be.calledTwice;
                onAdd.should.have.been.calledWith('players', player4, 1, game);
                onAddToPlayers.should.be.calledTwice;
                onAddToPlayers.should.have.been.calledWith(player4, 1, game);
                onRemove.should.have.been.calledWith('players', player2, 1, game);
                onRemoveFromPlayers.should.have.been.calledWith(player2, 1, game);
                game.players.should.deep.equal([player1, player4, player5, player3]);
                player1.game.should.equal(game);
                expect(player2.game).to.be.undefined;
                player3.game.should.equal(game);
                player4.game.should.equal(game);
                player5.game.should.equal(game);

            });

            it('set', function () {

                var game = new Game(),
                    player1 = new Player(),
                    player2 = new Player();

                game.players = [player1];

                var onGameChange = sinon.spy(),
                    onGameChangePlayers = sinon.spy(),
                    onAdd = sinon.spy(),
                    onRemove = sinon.spy(),
                    onAddToPlayers = sinon.spy(),
                    onRemoveFromPlayers = sinon.spy();

                game.on('change', onGameChange);
                game.on('change:players', onGameChangePlayers);
                game.on('addto', onAdd);
                game.on('addto:players', onAddToPlayers);
                game.on('removefrom', onRemove);
                game.on('removefrom:players', onRemoveFromPlayers);

                game.players.set(0, player2);

                onGameChange.should.not.have.been.called;
                onGameChangePlayers.should.not.have.been.called;
                onAdd.should.have.been.calledWith('players', player2, 0, game);
                onAddToPlayers.should.have.been.calledWith(player2, 0, game);
                onRemove.should.have.been.calledWith('players', player1, 0, game);
                onRemoveFromPlayers.should.have.been.calledWith(player1, 0, game);

                game.players.should.deep.equal([player2]);
                player2.game.should.equal(game);
                expect(player1.game).to.be.undefined;

            });

        });

    });

    describe('multiple to multiple link', function () {
        var Cell;

        before(function () {
            Cell = JOM.createClass('Cell');

            JOM.link({ class: Cell, arity: '*', name: 'neighbors' }, { class: Cell, arity: '*', name: 'invNeighbors' });
        });

        it('adds and removes items', function () {
            var cell11 = new Cell(),
                cell12 = new Cell(),
                cell21 = new Cell(),
                cell22 = new Cell();

            cell11.neighbors.push(cell12, cell21);
            cell22.neighbors.push(cell12, cell21);

            cell11.neighbors.should.deep.equal([cell12, cell21]);
            cell22.neighbors.should.deep.equal([cell12, cell21]);
            cell12.invNeighbors.should.deep.equal([cell11, cell22]);
            cell21.invNeighbors.should.deep.equal([cell11, cell22]);
        });

        it('sets items correctly', function () {
            var cell = new Cell(),
                cell11 = new Cell(),
                cell12 = new Cell(),
                cell21 = new Cell();

            cell.neighbors = [cell11, cell12];

            cell.neighbors.should.deep.equal([cell11, cell12]);
            cell11.invNeighbors.should.deep.equal([cell]);
            cell12.invNeighbors.should.deep.equal([cell]);

            cell.neighbors = [cell21];

            cell.neighbors.should.deep.equal([cell21]);
            cell11.invNeighbors.should.deep.equal([]);
            cell12.invNeighbors.should.deep.equal([]);
            cell21.invNeighbors.should.deep.equal([cell]);

            var otherCell = new Cell();
            otherCell.neighbors = [cell21];

            cell21.invNeighbors.should.deep.equal([cell, otherCell]);
        });

        it('fires events', function () {
            var cell1 = new Cell(),
                cell2 = new Cell(),
                onChangeCell1 = sinon.spy(),
                onChangeCell1Neighbor = sinon.spy(),
                onChangeCell2 = sinon.spy(),
                onChangeCell2InvNeighbor = sinon.spy(),
                onAddCell1 = sinon.spy(),
                onAddCell1Neighbor = sinon.spy(),
                onAddCell2 = sinon.spy()
                onAddCell2Neighbor = sinon.spy();

            cell1.on('change', onChangeCell1);
            cell1.on('change:neighbors', onChangeCell1Neighbor);
            cell1.on('addto', onAddCell1);
            cell1.on('addto:neighbors', onAddCell1Neighbor);
            cell2.on('change', onChangeCell2);
            cell2.on('change:invNeighbors', onChangeCell2InvNeighbor);
            cell2.on('addto', onAddCell2);
            cell2.on('addto:invNeighbors', onAddCell2Neighbor);


            cell1.neighbors.push(cell2);

            onChangeCell1.should.not.have.been.called;
            onChangeCell1Neighbor.should.not.have.been.called;
            onChangeCell2.should.not.have.been.called;
            onChangeCell2InvNeighbor.should.not.have.been.called;

            onAddCell1.should.have.been.calledOnce;
            onAddCell1Neighbor.should.have.been.calledOnce;
            onAddCell2.should.have.been.calledOnce;
            onAddCell2Neighbor.should.have.been.calledOnce;

        });

    });

    describe('shortcuts', function () {

        var Clazz1, Clazz2;

        beforeEach(function () {
            Clazz1 = JOM.createClass('Clazz1');
            Clazz2 = JOM.createClass('Clazz2');
        });

        describe('links', function () {
            it('1-1', function () {
                JOM.link(Clazz1, Clazz2, '1-1');
                var instance1 = new Clazz1(),
                    instance2 = new Clazz2();
                instance1.should.have.property('clazz2');
                instance2.should.have.property('clazz1');
            });

            it('1-*', function () {
                JOM.link(Clazz1, Clazz2, '1-*');
                var instance1 = new Clazz1(),
                    instance2 = new Clazz2();
                instance1.clazz2s.should.deep.equal([]);
                instance2.should.have.property('clazz1');
            });

            it('*-1', function () {
                JOM.link(Clazz1, Clazz2, '*-1');
                var instance1 = new Clazz1(),
                    instance2 = new Clazz2();
                instance1.should.have.property('clazz2');
                instance2.clazz1s.should.deep.equal([]);
            });

            it('*-*', function () {
                JOM.link(Clazz1, Clazz2, '*-*');
                var instance1 = new Clazz1(),
                    instance2 = new Clazz2();
                instance1.clazz2s.should.deep.equal([]);
                instance2.clazz1s.should.deep.equal([]);
            });
        });

        describe('named links', function () {
            it('1:prev-1:next', function () {
                JOM.link(Clazz1, Clazz2, '1:prev-1:next');
                var instance1 = new Clazz1(),
                    instance2 = new Clazz2();
                instance1.should.have.property('next');
                instance2.should.have.property('prev');
            });

            it('1:parent-*:children', function () {
                JOM.link(Clazz1, Clazz2, '1:parent-*:children');
                var instance1 = new Clazz1(),
                    instance2 = new Clazz2();
                instance1.children.should.deep.equal([]);
                instance2.should.have.property('parent');
            });

            it('*:children-1:parent', function () {
                JOM.link(Clazz1, Clazz2, '*:children-1:parent');
                var instance1 = new Clazz1(),
                    instance2 = new Clazz2();
                instance1.should.have.property('parent');
                instance2.children.should.deep.equal([]);
            });

            it('*:sibling-*:sibling', function () {
                JOM.link(Clazz1, Clazz2, '*:siblings-*:siblings');
                var instance1 = new Clazz1(),
                    instance2 = new Clazz2();
                instance1.siblings.should.deep.equal([]);
                instance2.siblings.should.deep.equal([]);
            });
        });

        describe('mixed links', function () {
            it('1-1:other', function () {
                JOM.link(Clazz1, Clazz2, '1-1:other');
                var instance1 = new Clazz1(),
                    instance2 = new Clazz2();
                instance1.should.have.property('other');
                instance2.should.have.property('clazz1');
            });

            it('*:children-1', function () {
                JOM.link(Clazz1, Clazz2, '*:children-1');
                var instance1 = new Clazz1(),
                    instance2 = new Clazz2();
                instance1.should.have.property('clazz2');
                instance2.children.should.deep.equal([]);
            });
        });

        it('class link', function () {
            Clazz1.link(Clazz2, '1-1');
            var instance1 = new Clazz1(),
                    instance2 = new Clazz2();
                instance1.should.have.property('clazz2');
                instance2.should.have.property('clazz1');
        });

    });

});