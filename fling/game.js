let game;
let gameOptions = {
    gravity: 1,             // game gravity
    terrainObjects: 20,     // amount of terrain objects
    heroSize: 20,           // hero size
    constraintSpeed: 2,     // constraint shrinkage speed
    minBoxSize: 50,         // minimum box size
    maxBoxSize: 200,        // maximum box size
    hookSpeed: 20,          // speed use to fire the hook
    ropeTolerance: 6        // rope tolerance. Used to avoid body trespassing
}
const WALL = 0;
const BALL = 1;
const HOOK = 2;
window.onload = function() {

    // game configuration
    let gameConfig = {
        type: Phaser.AUTO,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            parent: "thegame",
            width: 1334,
            height: 750
        },
        scene: playGame,
        physics: {
            default: "matter",
            matter: {
                gravity: {
                    y: gameOptions.gravity
                },
                debug: true
            }
        }
    }
    game = new Phaser.Game(gameConfig);
    window.focus();
}
class playGame extends Phaser.Scene{
    constructor(){
        super("PlayGame");
    }
    create(){

        // I want physics world to be updated 30 times per second
        this.matter.world.update30Hz();

        // adding world bounds. Basically four walls
        this.matter.world.setBounds(10, 10, game.config.width - 20, game.config.height - 20);

        // placing some random static boxes labeled as WALL
        for (let i = 0; i < gameOptions.terrainObjects; i++){
            let posX = Phaser.Math.Between(0, game.config.width);
            let posY = Phaser.Math.Between(0, game.config.height);
            let width = Phaser.Math.Between(gameOptions.minBoxSize, gameOptions.maxBoxSize);
            let height = Phaser.Math.Between(gameOptions.minBoxSize, gameOptions.maxBoxSize);
            let poly = this.matter.add.rectangle(posX, posY, width, height, {
                isStatic: true
            });
            poly.label = WALL;
        }

        // adding a bouncing ball labeled as BALL
        this.hero = this.matter.add.rectangle(game.config.width / 2, game.config.height / 2, gameOptions.heroSize, gameOptions.heroSize, {
            restitution: 0.5
        });
        this.hero.label = BALL;

        // the hook
        this.hook = null;

        // event listeners
        this.input.on("pointerdown", this.fireHook, this);

        // no ropes at the beginning
        this.rope = null;

        // collision listener
        this.matter.world.on("collisionstart", function(e, b1, b2){

            // when the hook collides with something, let's make it static and create the joint
            if((b1.label == HOOK || b2.label == HOOK) && !this.rope){

                // make the hook static
                Phaser.Physics.Matter.Matter.Body.setStatic(this.hook, true);

                // calculate the distance between the ball and the hook
                let distance = Phaser.Math.Distance.Between(this.hero.position.x, this.hero.position.y, this.hook.position.x, this.hook.position.y);

                // is the distance fairly greater than hero size?
                if(distance > gameOptions.heroSize * 2){

                    // add the constraint
                    this.rope = this.matter.add.constraint(this.hero, this.hook, distance, 0.1);
                }
            }
        }, this)
    }

    // method to fire the hook
    fireHook(e){

        // do we have a constraint?
        if(this.hook){

            // destroy current constraint
            this.releaseHook();
        }

        // don't we have a constraint?
        else{
            // calculate the angle between the pointer and the ball
            let angle = Phaser.Math.Angle.Between(this.hero.position.x, this.hero.position.y, e.position.x, e.position.y);

            this.hook = this.matter.add.rectangle(this.hero.position.x + (gameOptions.heroSize * 2) * Math.cos(angle), this.hero.position.y + (gameOptions.heroSize * 2) * Math.sin(angle), 10, 10);
            this.hook.label = HOOK;

            // give the hook the proper velocity
            Phaser.Physics.Matter.Matter.Body.setVelocity(this.hook, {
                x: gameOptions.hookSpeed * Math.cos(angle),
                y:gameOptions.hookSpeed * Math.sin(angle)
            });
        }
    }

    // method to remove the hook
    releaseHook(){

        // is there a constraint? Remove it
        if(this.rope){
            this.matter.world.removeConstraint(this.rope);
            this.rope = null;
        }

        // is there a hook? Remove it
        if(this.hook){
            this.matter.world.remove(this.hook);
            this.hook = null;
        }
    }

    // method to be executed at every frame
    update(){

        // is there a constraint? Shrink it
        if(this.rope){
            this.rope.length -= gameOptions.constraintSpeed;
            let hookPosition = this.hook.position;
            let heroPosition = this.hero.position;
            let distance = Phaser.Math.Distance.Between(hookPosition.x, hookPosition.y, heroPosition.x, heroPosition.y);
            if(distance - this.rope.length > gameOptions.ropeTolerance){
                this.rope.length = distance;
            }
            this.rope.length = Math.max(this.rope.length, gameOptions.heroSize * 2);
        }
    }
};
