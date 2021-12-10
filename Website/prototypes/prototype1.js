//Made by Tianli Zhou
//Adapted from Jake S. Gordon's code: https://github.com/jakesgordon/javascript-racer.

const screenWidth = window.innerWidth;
const screenHeight = (screenWidth * 9)/16;
const screenCenterY = screenHeight/2;
const screenCenterX = screenWidth/2;

const stateStopHFDSOff = 1;
const stateGoHFDSOff = 2;
const stateGoHFDSOn = 3;
const stateHFDSFault = 4;
const stateRestart = 5;

var state = stateStopHFDSOff;

class mainScene extends Phaser.Scene
{
    constructor()
    {
        super({key: 'mainScene'});
    }
    preload()
    {
        this.load.image('sky', '../images/sky.jpg')
        this.load.image('car', '../images/car.png');
    }
    create()
    {
        this.images = this.add.image(screenCenterX, screenCenterY, 'sky');

        this.road = new Road(this);
        this.camera = new Camera(this);
        this.user = new User(this);
        this.textDisplay = new TextDisplay(this);
        this.textDisplay.text.text = "HDFS Off";

        this.camera.init();
        this.road.create();
        this.road.render();

        this.images = this.add.image(screenCenterX, screenCenterY, 'car');
        this.images.setScale(screenWidth/1920);

        this.input.keyboard.on('keydown-D', function(){
			state = stateGoHFDSOff;
            console.log('Drive', state);
		}, this);
        this.input.keyboard.on('keydown-B', function(){
			state = stateStopHFDSOff;
            this.textDisplay.text.text = "HDFS Off";
            console.log('Brake', state);
		}, this);
        this.input.keyboard.on('keydown-H', function(){
			switch(state)
            {
                case stateGoHFDSOff:
                    state = stateGoHFDSOn;
                    this.textDisplay.text.text = "HDFS On";
                    break;
                case stateGoHFDSOn:
                    this.textDisplay.text.text = "HDFS Off";
                    state = stateGoHFDSOff;
                    break;
                case stateStopHFDSOff:
                    this.textDisplay.text.text = "Speed Up";
                    setTimeout(() => {this.textDisplay.text.text = "HDFS Off";}, 2000);
            }
            console.log('HFDS', state);
		}, this);
        this.input.keyboard.on('keydown-R', function(){
			state = stateRestart;
            console.log('Restart', state);
		}, this);
        this.input.keyboard.on('keydown-F', function(){
            if(state == stateGoHFDSOn){
                state = stateHFDSFault;
                this.textDisplay.text.text = "HDFS Faulted";
                setTimeout(() => {this.textDisplay.text.text = "Checking\nDriver";}, 2000);
                setTimeout(() => {this.textDisplay.text.text = "No Input\nDetected";}, 5000);
                setTimeout(() => {this.textDisplay.text.text = "Halting...";}, 7000);
                setTimeout(() => {state = stateStopHFDSOff;}, 8000);
                setTimeout(() => {this.textDisplay.text.text = "HDFS Off";}, 8000);
                console.log('Fault', state);
            }
		}, this);
    }
    update(time, delta)
    {
        var dt = Math.min(1, delta / 1000);
        switch(state)
        {
            case stateStopHFDSOff:
                break;
            case stateGoHFDSOff:
                this.user.update(dt);
                this.camera.update();
                this.road.render();
                break;
            case stateGoHFDSOn:
                this.user.update(dt);
                this.camera.update();
                this.road.render();
                break;
            case stateHFDSFault:
                this.user.update(dt);
                this.camera.update();
                this.road.render();
                break;
            case stateRestart:
                this.road.create();
                this.user.restart();
                state = stateStopHFDSOff;
                break;
        }
    }
}

class Road
{
    constructor(scene)
    {
        this.scene = scene;
        this.graphics = scene.add.graphics(0, 0);
        this.segments = [];
        this.segmentLength = 100;
        this.roadWidth = 1000;
        this.roadLength = null;
        this.totalSegments = null;
        this.visibleSegments = 200;
        this.rumbleSegments = 5;
        this.lanes = 2;
    }
    create()
    {
        this.segments = []
        this.createRoad()
        this.totalSegments = this.segments.length;
        this.roadLength = this.totalSegments * this.segmentLength;
    }
    createRoad()
    {
        this.createSection(200);
    }
    createSection(num)
    {
        for (var i=0; i<num; i++)
        {
            this.createSegment();
        }
    }
    createSegment()
    {
        const colors = {
            light: {road: '0x404040', grass: '0x3aa333', rumble: '0xcc0500'},
            dark: {road: '0x212121', grass: '0x3aa333', rumble: '0xdddddd', lane: '0xffffff'}
        };
        var n = this.segments.length;
        this.segments.push({
            index: n,
            point: {
                world: {x:0, y:0, z:n*this.segmentLength},
                screen: {x:0, y:0, w:0},
                scale: -1
            },
            color: Math.floor(n / this.rumbleSegments) % 2 ? colors.dark : colors.light
        });
    }
    getSegment(z)
    {
        if(z < 0)
        {
            z += this.roadLength;
        }
        var index = Math.floor(z / this.segmentLength) % this.totalSegments;
        return this.segments[index];
    }
    projection(point, cameraX, cameraY, cameraZ, cameraDepth)
    {
        var translationX = point.world.x - cameraX;
        var translationY = point.world.y - cameraY;
        var translationZ = point.world.z - cameraZ;

        point.scale = cameraDepth/translationZ;

        var projectedX = point.scale * translationX;
        var projectedY = point.scale * translationY;
        var projectedW = point.scale * this.roadWidth;

        point.screen.x = Math.round((1 + projectedX) * screenCenterX);
        point.screen.y = Math.round((1 - projectedY) * (screenCenterY / 4));
        point.screen.w = Math.round(projectedW * screenCenterX);
    }
    render()
    {
        this.graphics.clear();
        var clipThreshold = screenHeight / 2;
        var camera = this.scene.camera;
        var baseSegment = this.getSegment(camera.z);
        var baseIndex = baseSegment.index;
        for (var i=0; i<this.visibleSegments; i++)
        {
            var currentIndex = (baseIndex + i) % this.totalSegments;
            var currentSegment = this.segments[currentIndex];
            var offsetZ = (currentIndex < baseIndex) ? this.roadLength : 0;
            this.projection(currentSegment.point, camera.x, camera.y, camera.z - offsetZ, camera.distanceToPlane);
            if (i > 0 && currentSegment.point.screen.y < clipThreshold)
            {
                var previousIndex = (currentIndex > 0)? currentIndex - 1: this.totalSegments - 1;
                var previousSegment = this.segments[previousIndex]; 
                var p1 = previousSegment.point.screen;
                var p2 = currentSegment.point.screen;
                
                this.drawSegment(
                    p1.x, p1.y, p1.w,
                    p2.x, p2.y, p2.w,
                    currentSegment.color
                );
                clipThreshold = currentSegment.point.screen.y;
            }
        }
        var scaledDiff = 150 * screenWidth/1920;
        console.log(scaledDiff);
        this.drawPolygon(screenCenterX - scaledDiff, screenCenterY - scaledDiff, screenCenterX - scaledDiff, screenCenterY + scaledDiff, screenCenterX + scaledDiff, screenCenterY + scaledDiff, screenCenterX + scaledDiff, screenCenterY - scaledDiff, '0x0000FF')
    }
    drawSegment(x1, y1, w1, x2, y2, w2, color)
    {
        this.graphics.fillStyle(color.grass, 1);
        this.graphics.fillRect(0, y2, screenWidth, y1 - y2);
        this.drawPolygon(x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, color.road);

        var rumble1 = w1/5;
        var rumble2 = w2/5;
        this.drawPolygon(x1 - w1 - rumble1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - rumble2, y2, color.rumble);
        this.drawPolygon(x1 + w1 + rumble1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + rumble2, y2, color.rumble);
        if (color.lane)
        {
			var line1 = (w1 / 20) / 2;
			var line2 = (w2 / 20) / 2;
			var lane1 = (w1 * 2) / this.lanes;
			var lane2 = (w2 * 2) / this.lanes;
			var lane3 = x1 - w1;
			var lane4 = x2 - w2;
			
			for(var i=1; i<this.lanes; i++){
				lane3 += lane1;
				lane4 += lane2;
				this.drawPolygon(
					lane3-line1, y1, 
					lane3+line1, y1, 
					lane4+line2, y2, 
					lane4-line2, y2, 
					color.lane
				);
			}
		}
    }
    drawPolygon(x1, y1, x2, y2, x3, y3, x4, y4, color)
    {
        this.graphics.fillStyle(color, 1);
        this.graphics.beginPath();
        this.graphics.moveTo(x1, y1);
        this.graphics.lineTo(x2, y2);
        this.graphics.lineTo(x3, y3);
        this.graphics.lineTo(x4, y4);
        this.graphics.closePath();
        this.graphics.fill();
    }
}

class Camera
{
    constructor(scene)
    {
        this.scene = scene;
        this.x = 0;
        this.y = 1000;
        this.z = 0;
        this.distanceToUser = 500;
        this.distanceToPlane = null;
    }
    init()
    {
        this.distanceToPlane = 1 / (this.y / this.distanceToUser);
    }
    update()
    {
        var user = this.scene.user;
        var road = this.scene.road;
        this.x = user.x * road.roadWidth;
        this.z = user.z - this.distanceToUser;
        if (this.z < 0)
        {
            this.z += this.scene.road.roadLength;
        }
    }
}

class User
{
    constructor(scene)
    {
        this.scene = scene;
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.maxSpeed = (scene.road.segmentLength) / (1 / 60);
        this.speed = this.maxSpeed;
    }
    restart()
    {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.speed = this.maxSpeed;
    }
    update(delta)
    {
        this.z += this.speed * delta;
        if (this.z >= this.scene.road.roadLength)
        {
            this.z -= this.scene.road.roadLength;
        }
    }
}

class TextDisplay
{
    constructor(scene)
    {
        this.scene = scene;
        var scaledText = screenWidth/1920 * 24;
        var font = {font: scaledText.toString() + 'px Verdana', fill: '#FFFFFF'};
        this.text = scene.add.text(screenCenterX - (screenWidth/1920 * 70), screenCenterY - (screenWidth/1920 * 110), '', font);
    }
}

var config = {
    type: Phaser.AUTO,
    mode: Phaser.Scale.FIT,
    parent: 'demoCanvas',
    autoCenter: Phaser.Scale.CENTER_BOTH,
    height: screenHeight,
    width: screenWidth,
    maxWidth: 1920,
    maxHeight: 1080,
    canvasStyle: 'display: block; width: 99%; height: 99%;',
    scene: [mainScene],
};

var demo = new Phaser.Game(config);