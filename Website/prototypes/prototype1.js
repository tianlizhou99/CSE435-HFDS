const screenHeight = 1080;
const screenWidth = 1920;
const screenCenterY = screenHeight/2;
const screenCenterX = screenWidth/2;

const stateInitial = 1;
const stateOn = 2;
const stateOverride = 3;
const stateFault = 4;

var state = stateInitial;

class mainScene extends Phaser.Scene
{
    constructor()
    {
        super({key: 'mainScene'});
    }
    preload()
    {
        this.load.image('background', '../images/road.gif');
    }
    create()
    {
        this.sprBack = this.add.image(screenCenterX, screenCenterY, 'background');
    }
    update(time, delta)
    {

    }
}

var config = {
    type: Phaser.AUTO,
    height: screenHeight,
    width: screenWidth,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [mainScene]
};

var demo = new Phaser.Game(config);