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
        this.load.image('sky', '../images/sky.jpg')
        this.load.image('car', '../images/car.png');
    }
    create()
    {
        this.sprBack = this.add.image(screenCenterX, screenCenterY, 'sky');

        this.road = new Road(this);
        this.camera = new Camera(this);

        this.camera.init();
        this.road.create();
        this.road.render();

        this.sprBack = this.add.image(screenCenterX, screenCenterY, 'car');
    }
    update(time, delta)
    {
        switch(state)
        {
            case stateInitial:
                console.log("HFDS off");
                this.camera.update();
                break;
            case stateOn:
                console.log("HFDS On");
                this.camera.update();
                break;
            case stateOverride:
                console.log("Driver override");
                this.camera.update();
                break;
            case stateOn:
                console.log("HFDS Faulted");
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
        this.createSection(1000);
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
        var n = this.segments.length;
        this.segments.push({
            index: n,
            point: {
                world: {x:0, y:0, z:n*this.segmentLength},
                screen: {x:0, y:0, w:0},
                scale: -1
            },
            color: {road: '0x888888'}
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
        point.screen.y = Math.round((1 + projectedY) * screenCenterY);
        point.screen.w = Math.round(projectedW * screenCenterX);
    }
    render()
    {
        this.graphics.clear();
        var camera = this.scene.camera;
        var baseSegment = this.getSegment(camera.z);
        var baseIndex = baseSegment.index;
        for (var i=0; i<this.visibleSegments; i++)
        {
            var currentIndex = (baseIndex + i) % this.totalSegments;
            var currentSegment = this.segments[currentIndex];
            this.projection(currentSegment.point, camera.x, camera.y, camera.z, camera.distanceToPlane);
            if (i > 0)
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
            }
        }
    }
    drawSegment(x1, y1, w1, x2, y2, w2, color)
    {
        this.drawPolygon(x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, color.road);
    }
    drawPolygon(x1, y1, x2, y2, x3, y3, x4, y4, color)
    {
        this.graphics.fillStyle(color, 1);
        this.graphics.beginPath();
        this.graphics.moveTo(x1, y1);
        this.graphics.moveTo(x2, y2);
        this.graphics.moveTo(x3, y3);
        this.graphics.moveTo(x4, y4);
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
        this.distanceToPlayer = 100;
        this.distanceToPlane = null;
    }
    init()
    {
        this.distanceToPlane = 1 / (this.y / this.distanceToPlayer);
    }
    update()
    {
        this.z = -this.distanceToPlayer;
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