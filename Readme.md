# JS Object Model

JavaScript developers are not know for caring about logic for business models and stuff, but there are use-cases, where this is nice to have. This library helps you to design you own model.

## How to use

1. Create some classes
```
const Game = JOM.createClass('Game');
const Player = JOM.createClass('Player');
```

2. Attach some attributes
```
Game.attribute('running', 'Boolean');
Player.attribute('list', 'Array');
```
3. Create some links
```
Game.link(Player, '1-*');
```
4. Instanciate some objects
```
const game = new Game();
const player1 = new Player();
const player2 = new Player();
```
5. Attach some listeners
```
game.on('addto:players', () => /* e.g. update rendered players */);
game.on('removefrom:players', () => /* e.g. update rendered players */);

game.on('change:running', (value) => /* do stuff */);
```
6. Connect objects
```
game.players.push(player1);
// player1.game will be set automatically
// will trigger addto:players

player2.game = game;
// player2 will be automatically pushed to game.players
// will trigger addto:players

game.players.remove(player2);
// player2.game will be set to undefined automatically
// will trigger removeFrom:players
```
