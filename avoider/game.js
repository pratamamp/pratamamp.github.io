// the game itself
var game

// all game options are defined in this object
var gameOptions = {

     // game width
     gameWidth: 640,
     
     // game height
     gameHeight: 960,
     
     // number of segments which build the tail
     tailSegments: 300,
     
     // lenght of each segment
     segmentLength: 2,
     
     // number of levels. Useful to preload each level PNGs
     levels: 3,
     
     // current level
     currentLevel: 1    
}

// levels information are stored here
var gameLevels = [
     {
          startSpot: {x: 320, y: 120},
          endSpot: {x: 320, y: 840}
     },
     {
          startSpot: {x: 80, y: 80},
          endSpot: {x: 280, y: 80}
     },
     {
          startSpot: {x: 80, y: 830},
          endSpot: {x: 80, y: 130}
     }
]



// when the window loads
window.onload = function() {
    
     // game creation	
	game = new Phaser.Game(gameOptions.gameWidth, gameOptions.gameHeight);
     
     // adding game state
     game.state.add("TheGame", TheGame);
     
     // starting game state
     game.state.start("TheGame");
}

var TheGame = function(){};

TheGame.prototype = {

     // when the state preloads
     preload: function(){
     
          // setting the game on maximum scale mode to cover the entire screen
          game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
          game.scale.pageAlignHorizontally = true;
          game.scale.pageAlignVertically = true;
          
          // preloading all level images, PNG images with transparency
          for(var i = 1; i <= gameLevels.length; i++){
               game.load.image("level" + i, "assets/sprites/level" + i + ".png");
          }
          
          // preloading game icons as spritesheet
          game.load.spritesheet("icons", "assets/sprites/icons.png", 80, 80);
     },
     
     // once the state has been created
     create: function(){
     
          //
          // GRADIENT BACKGROUND
          //
          
          // creation of a bitmap data with the same size as the game
          var background = game.add.bitmapData(game.width, game.height);
          
          // we are going to create a gradient background, that is a series of retangles filled with different colors
          var gradientSteps = game.height / 2;
          
          // determining rectangle height according to game height and gradient steps
          var rectangleHeight = Math.floor(game.height / gradientSteps);
          
          // looping through all gradient steps
          for(var i = 0; i <= gradientSteps; i++){
          
               // interpolateColor method interpolates the two given colours based on "gradientSteps" steps returns the i-th step
               var color = Phaser.Color.interpolateColor(0x0e2be3, 0xa6e1ff, gradientSteps, i);
               
               // drawing a filled rectangle covering the full width of the game and rectangleHeight height
               // the rectangle is filled with a color given by getWebRGB method which returns a CSS friendly string value
               background.rect(0, rectangleHeight * i, game.width, rectangleHeight, Phaser.Color.getWebRGB(color));
          }
          
          // adding the bitmap data as a sprite
          game.add.sprite(0, 0, background);
          
          //
          // LEVEL MAZE
          //
          
          // creation of a bitmap data with the same size as the game
          this.bitmap = game.add.bitmapData(game.width, game.height);
          
          // drawing proper "level" image on the bitmap data
          this.bitmap.draw("level" + gameOptions.currentLevel);
          
          // updating bitmap data to let it have actual image data
          this.bitmap.update();
          
          // adding the bitmap data as a sprite
          game.add.sprite(0, 0, this.bitmap);
          
          //
          // GAME ICONS
          //
          
          // temp variable to access more quicly to level information
          var levelObject = gameLevels[gameOptions.currentLevel - 1];
          
          // adding start icon
          this.startSpot = game.add.sprite(levelObject.startSpot.x, levelObject.startSpot.y, "icons", 0);
          
          // setting start icon registration point to its centre
          this.startSpot.anchor.set(0.5);
          
          // adding end icon
          this.endSpot = game.add.sprite(levelObject.endSpot.x, levelObject.endSpot.y, "icons", 1);
          
          // setting start icon registration point to its centre
          this.endSpot.anchor.set(0.5);
          
          //
          // INPUT MANAGEMENT
          //
          
          // just a flag to inform us if we already had an input, that is if the player already clicked/touched the canvas
          this.firstInput = true;

          // waiting for player input to call startMove method
          game.input.onDown.add(this.startMove, this);
          
          //
          // GAME STUFF
          // 
          
          // we create a graphics instance called "canvas", we'll draw the string on it
          this.canvas = game.add.graphics(0, 0);
          
          // segments is the array which will contain string segments
          this.segments = []; 
     },
     
     // startMove method, will be called each time the player touches/clicks the canvas
     startMove: function(e){
     
          // checking if it's the first input: player clicks/touchs the canvas for the first time
          if(this.firstInput){
          
               // not the first input anymore
               this.firstInput = false;
               
               // making start icon invisible
               this.startSpot.visible = false;
               
               // populating segments array with an amount of "gameOptions.tailSegments" Phaser Point objects
               for(var i = 0; i < gameOptions.tailSegments; i++){
               
                    // I want the string to be a circle at first, so I am using a little trigonometry to place these points accordingly
                    var radians = 12 * Math.PI * i / gameOptions.tailSegments + Math.PI / 4;
                    
                    // creating Points objects and placing them into segments array. "10" is the radius of the circle
                    this.segments[i] = new Phaser.Point(this.startSpot.x + 10 * Math.cos(radians), this.startSpot.y + 10 * Math.sin(radians));
               }  
               
               // calling moveString function. Actually this function moves and renders the string, and the two arguments represent
               // respectively the x and y movement to apply to string's head. We set them to zero because there's no movement
               this.moveString(0, 0);                            
          }
          
          // removing callback
          game.input.onDown.remove(this.startMove, this);
          
          // add a move callback to be fired when the player moves the mouse/finger and call dragString method
          game.input.addMoveCallback(this.dragString, this);   
          
          // add a up callback to be fired when the player releases the finger/mouse button and call endMove method
          game.input.onUp.add(this.endMove, this);
          
          // saving current event position, that is the position where the player is currently touching/clicking
          this.startPosition = e.position;
     },
     
     // endMove method is called when the player released the finger/the mouse button
     endMove: function(){
     
          // waiting for player input to call startMove method
          game.input.onDown.add(this.startMove, this);
          
          // removing other listeners
          game.input.onUp.remove(this.endMove, this);
          game.input.deleteMoveCallback(this.dragString, this);     
     },
     
     // dragString method is called when the player moves the finger or the mouse while keeping mouse button pressed
     dragString: function(e){
     
          // calling moveString function. Actually this function moves and renders the string, and the two arguments represent
          // respectively the x and y movement to apply to string's head.
          // We set them to represent the distance from current input position and previous input position
          this.moveString(e.position.x - this.startPosition.x, e.position.y - this.startPosition.y);
          
          // updating startPosition variable
          this.startPosition = new Phaser.Point(e.position.x, e.position.y);     
     },
     
     // moveString method updates and renders the string
     moveString: function(x, y){
     
          // it's not game over yet
          var gameOver = false;
     
          // clearing the canvas, ready to be redrawn
          this.canvas.clear();
          
          // setting line style to a 4 pixel thick line, black, 100% opaque
          this.canvas.lineStyle(4, 0x000000, 1);
          
          // the head of the string is current input position
          var head = new Phaser.Point(this.segments[0].x + x, this.segments[0].y + y);
          
          // placing the pen on the head
          this.canvas.moveTo(head.x, head.y);
          
          // the first segment is the head itself
          this.segments[0] = new Phaser.Point(head.x, head.y);
          
          // looping through all segments starting from the second one
          for(var i = 1; i < this.segments.length - 1; i++){
          
               // determining the angle between current segment and previous segment
               var nodeAngle = Math.atan2(this.segments[i].y - this.segments[i - 1].y, this.segments[i].x - this.segments[i - 1].x);
               
               // calculating new segment position according to previous segment position and the angle
               this.segments[i] = new Phaser.Point(this.segments[i - 1].x + gameOptions.segmentLength * Math.cos(nodeAngle), this.segments[i - 1].y + gameOptions.segmentLength * Math.sin(nodeAngle));
               
               // getting the color behind the segment
               var color = this.bitmap.getPixelRGB(Math.round(this.segments[i].x), Math.round(this.segments[i].y));
               
               // if the color alpha is different than zero, that is it's not a transparent pixel...
               if(color.a != 0){
               
                    // from now on, draw the string in red
                    this.canvas.lineStyle(4, 0xff0000, 1);
                    
                    // game over...
                    gameOver = true;                    
               } 
               
               // drawing the segment
               this.canvas.lineTo(this.segments[i].x, this.segments[i].y);
               this.canvas.moveTo(this.segments[i].x, this.segments[i].y); 
                  
          }
          
          // if it's game over or the head of the string is fairly inside the end spot...
          if(this.segments[0].distance(this.endSpot.position) < this.endSpot.width / 4 || gameOver){
               
               // removing listeners
               game.input.onUp.remove(this.endMove, this);
               game.input.deleteMoveCallback(this.dragString, this);
               
               // if it's not game over, this means the player solved the level so we move on to next level
               if(!gameOver){
                    gameOptions.currentLevel = (gameOptions.currentLevel % gameLevels.length) + 1;     
               }
               
               // wait 2 seconds before restarting the game.
               game.time.events.add(Phaser.Timer.SECOND * 2, function(){
                    game.state.start("TheGame");
               }, this);                               
          }          
     }
}