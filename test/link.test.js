var sinon = require('sinon'),
    JOM = require('../index');

describe('Links', function () {

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

            game1.getPlayers().should.deep.equal([]);
            game2.getPlayers().should.deep.equal([]);
            expect(player.getGame()).to.be.undefined;

            game1.addPlayer(player);

            game1.getPlayers().should.deep.equal([ player ]);
            game2.getPlayers().should.deep.equal([]);
            player.getGame().should.equal(game1);

            player.setGame(game2);

            game1.getPlayers().should.deep.equal([]);
            game2.getPlayers().should.deep.equal([ player ]);
            player.getGame().should.deep.equal(game2);

            game2.removePlayer(player);

            game1.getPlayers().should.deep.equal([]);
            game2.getPlayers().should.deep.equal([]);
            expect(player.getGame()).to.be.undefined;
        });

        it('overwrites existing models in origin and links them correctly', function () {
            var game = new Game(),
                prevPlayers = [new Player(), new Player()],
                nextPlayers = [new Player(), new Player(), new Player()];

            game.getPlayers().should.deep.equal([]);

            game.setPlayers(prevPlayers);

            game.getPlayers().should.deep.equal(prevPlayers);
            prevPlayers[0].getGame().should.equal(game);
            prevPlayers[1].getGame().should.equal(game);

            game.setPlayers(nextPlayers);

            game.getPlayers().should.deep.equal(nextPlayers);
            expect(prevPlayers[0].getGame()).to.be.undefined;
            expect(prevPlayers[1].getGame()).to.be.undefined;
            nextPlayers[0].getGame().should.equal(game);
            nextPlayers[1].getGame().should.equal(game);
            nextPlayers[2].getGame().should.equal(game);
        });

        it('listens to events', function () {
            var game = new Game(),
                player = new Player(),
                onGameChange = sinon.spy(),
                onGameChangePlayers = sinon.spy(),
                onGameAddPlayer = sinon.spy(),
                onGameRemovePlayer = sinon.spy(),
                onPlayerChanged = sinon.spy(),
                onPlayerChangedGame = sinon.spy();

            game.on('change', onGameChange);
            game.on('add:player', onGameAddPlayer);
            game.on('remove:player', onGameRemovePlayer);
            game.on('change:player', onGameChangePlayers);
            player.on('change', onPlayerChanged);
            player.on('change:game', onPlayerChangedGame);

            game.addPlayer(player);

            onGameChange.should.be.calledOnce;
            onGameAddPlayer.should.be.calledOnce;
            onGameRemovePlayer.should.not.be.called;
            onGameChangePlayers.should.be.calledOnce;
            onPlayerChanged.should.be.calledOnce;
            onPlayerChangedGame.should.be.calledOnce;

            onGameChange.reset();
            onGameAddPlayer.reset();
            onGameChangePlayers.reset();
            onPlayerChanged.reset();
            onPlayerChangedGame.reset();

            player.setGame(new Game());

            onGameChange.should.be.calledOnce;
            onGameAddPlayer.should.not.be.called;
            onGameRemovePlayer.should.be.calledOnce;
            onGameChangePlayers.should.be.calledOnce;
            onPlayerChanged.should.be.calledOnce;
            onPlayerChangedGame.should.be.calledOnce;
        });

    });

});