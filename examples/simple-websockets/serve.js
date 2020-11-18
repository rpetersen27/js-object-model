const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const webmake = require('webmake');
const JOM = require('../../index');
const path = require('path')

//
// Class model
//

const lib = new JOM.Library();
const Game = lib.createClass('Game');
const Map = lib.createClass('Map');

const Cell = lib.createClass('Cell');
Cell.attribute('x', 'Number');
Cell.attribute('y', 'Number');

const Player = lib.createClass('Player');
Player.attribute('name', 'String');
Player.attribute('money', 'Number');

lib.link(Game, Map, '1-1');
lib.link(Map, Cell, '1-*');
lib.link(Player, Cell, '1-1');
lib.link(Game, Player, '1-*');

//
// Object model
//

const game = new Game();
const map = new Map();
game.map = map;

for (let x = 0; x < 50; x++) {
    for (let y = 0; y < 50; y++) {
        let cell = new Cell();
        cell.x = x;
        cell.y = y;
        cell.map = map;
    }
}

//
// Server stuff
//

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.get('/jom.js', function (req, res) {
    webmake(path.resolve(__dirname, '../../index.js'), { sourceMap: false, cache: false, name: 'JOM' }, function (err, content) {
        if (err) return res.status(400).send(err);
        res.send(content);
    });
});

io.on('connection', function(socket){
    let player;
    console.log('a user connected');
    socket.on('login', function (name) {
        const other = game.players.find(p => p.name === name);
        if (other) return socket.emit('alert', `User ${name} is already there`);

        console.log('a user with name', name, 'logged in');

        player = new Player();
        player.name = name;
        player.game = game;

        lib.toStream(function () {
            const args = Array.from(arguments);
            args.unshift('jom');
            socket.emit.apply(socket, args);
        }, { name: name });
    });

    socket.on('disconnect', function(){
        console.log('user disconnected');
        if (player) game.players.remove(player);
    });
});

http.listen(8080, function(){
    console.log('listening on *:8080');
});
