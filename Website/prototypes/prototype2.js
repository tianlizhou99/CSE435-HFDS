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
const stateCrash = 6;
const stateRainHFDSOn = 7;

const Time = new Date();

var state = stateStopHFDSOff;
var driverAttention = 0;
var raining = 0;
var oCar = 0;
var timer = 0;

class mainScene extends Phaser.Scene
{
    constructor()
    {
        super({key: 'mainScene'});
    }
    preload()
    {
        this.load.image('filter', '../images/empty.png');
        this.load.image('sky', '../images/sky.jpg');
        this.load.image('car', '../images/car2.png');
        this.load.image('oCar', '../images/othercar.png');
        this.load.audio('warning', '../assets/warning.mp3');
        this.load.audio('rainSound', '../assets/rain.mp3');
        this.load.spritesheet('rain', '../images/rain.png', {frameWidth: screenWidth, frameHeight: screenHeight});
    }
    create()
    {
        this.images = this.add.image(screenCenterX, screenCenterY, 'sky');

        this.road = new Road(this);
        this.user = new User(this);

        this.sprites = [
            this.add.image(0, 0, 'oCar').setVisible(false)
        ]
        this.oCar = new Sprite(this);
        this.oCar.setZ(6000);
        this.oCarSprite = this.add.sprite(screenCenterX, screenCenterY - this.user.y, 'oCar');
        this.oCarSprite.setDisplaySize(this.oCar.sprite.width * (screenWidth/1920*1.5), this.oCar.sprite.height * (screenWidth/1920/2));

        this.camera = new Camera(this);
        this.cache = new Phaser.Cache.CacheManager(this);

        this.anims.create({
            key: 'raining',
            frames: this.anims.generateFrameNumbers('rain', {start: 0, end: 8, first: 0}),
            frameRate: 15,
            repeat: -1
        });
        this.anims.create({
            key: 'raining2',
            frames: this.anims.generateFrameNumbers('rain', {start: 0, end: 8, first: 4}),
            frameRate: 15,
            repeat: -1
        });
        this.rain = this.add.sprite(screenCenterX, screenCenterY, 'rain').play('raining').setAlpha(0);
        this.rainHeavy = this.add.sprite(screenCenterX, screenCenterY, 'rain').play('raining2').setAlpha(0);

        this.warningSound = this.sound.add('warning');
        var rainSound = this.sound.add('rainSound');
        rainSound.loop = true;

        this.camera.init();
        this.road.create();
        this.road.render();

        this.graphics = this.add.graphics(0,0);
        this.graphics.fillStyle('0x0000FF');
        this.graphics.beginPath();
        this.graphics.moveTo(screenCenterX - (150 * screenWidth/1920), screenCenterY  - (150 * screenWidth/1920) / 10);
        this.graphics.lineTo(screenCenterX - (150 * screenWidth/1920), screenCenterY + 3 * (150 * screenWidth/1920));
        this.graphics.lineTo(screenCenterX + (150 * screenWidth/1920), screenCenterY + 3 * (150 * screenWidth/1920));
        this.graphics.lineTo(screenCenterX + (150 * screenWidth/1920), screenCenterY - (150 * screenWidth/1920) / 10);
        this.graphics.closePath();
        this.graphics.fill();

        this.textDisplay = new TextDisplay(this);
        this.textDisplay.driverText.text = 'Driver status: Not Attentive';
        this.textDisplay.HFDSText.text = 'HFDS Off';
        this.textDisplay.speedText.text = '0 MPH';

        this.images = this.add.image(screenCenterX, screenCenterY, 'car');
        this.images.setScale(screenWidth/1920);
        this.filter = this.add.image(screenCenterX, screenCenterY, 'filter');
        this.filter.setScale(screenWidth/1920);
        this.filter.setAlpha(0);

        this.input.keyboard.on('keydown-W', function(){
			switch(state)
            {
                case stateStopHFDSOff:
                    state = stateGoHFDSOff;
                    this.user.speed = 250;
                    break;
                case stateGoHFDSOn:
                case stateRainHFDSOn:
                    state = stateGoHFDSOff;
                    this.textDisplay.HFDSText.text = "HFDS Off";
                case stateGoHFDSOff:
                    if(this.user.speed + 250 >= this.user.maxSpeed)
                    {
                        this.user.speed = this.user.maxSpeed;
                    }
                    else
                    {
                        this.user.speed += 250;
                    }
                    break;
            }
            driverAttention = 1;
		}, this);
        this.input.keyboard.on('keydown-S', function(){
			switch(state)
            {
                case stateGoHFDSOn:
                case stateRainHFDSOn:
                    state = stateGoHFDSOff;
                    this.textDisplay.HFDSText.text = "HFDS Off";
                case stateGoHFDSOff:
                    if(this.user.speed - 250 <= 0)
                    {
                        state = stateStopHFDSOff;
                        this.user.speed = 0;
                    }
                    else
                    {
                        this.user.speed -= 250;
                    }
                    break;
            }
            driverAttention = 1;
		}, this);
        this.input.keyboard.on('keydown-A', function(){
			switch(state)
            {
                case stateGoHFDSOn:
                case stateRainHFDSOn:
                    state = stateGoHFDSOff;
                    this.textDisplay.HFDSText.text = "HFDS Off";
                case stateGoHFDSOff:
                    this.user.x -= 0.02;
                    break;
            }
            driverAttention = 1;
		}, this);
        this.input.keyboard.on('keydown-D', function(){
			switch(state)
            {
                case stateGoHFDSOn:
                case stateRainHFDSOn:
                    state = stateGoHFDSOff;
                    this.textDisplay.HFDSText.text = "HFDS Off";
                case stateGoHFDSOff:
                    this.user.x += 0.02;
                    break;
            }
            driverAttention = 1;
		}, this);
        this.input.keyboard.on('keydown-B', function(){
            if(state != stateCrash)
            {
                state = stateStopHFDSOff;
                this.textDisplay.HFDSText.text = "HFDS Off";
                setTimeout(() => {this.user.speed = this.user.speed * 0.75;}, 333);
                setTimeout(() => {this.textDisplay.speedText.text = (Math.floor(this.user.speed * 0.75 / 50)).toString() + ' MPH';}, 334);
                setTimeout(() => {this.user.speed = this.user.speed * 0.25;}, 666);
                setTimeout(() => {this.textDisplay.speedText.text = (Math.floor(this.user.speed * 0.75 * 0.25 / 50)).toString() + ' MPH';}, 667);
                setTimeout(() => {this.user.speed = 0;}, 1000);
                setTimeout(() => {this.textDisplay.HFDSText.text = "HFDS Off";}, 1000);
            }
            driverAttention = 1;
		}, this);
        this.input.keyboard.on('keydown-H', function(){
			if(driverAttention == 1)
            {
                switch(state)
                {
                    case stateGoHFDSOff:
                        if(this.user.speed < 1000)
                        {
                            this.textDisplay.HFDSText.text = "Car must be\ngoing at least\n20MPH for HFDS\nto activate";
                            setTimeout(() => {this.textDisplay.HFDSText.text = "HFDS Off";}, 2000);
                        }
                        else{
                            if(Math.abs(this.user.x) > 1)
                            {
                                this.textDisplay.HFDSText.text = "Blue Path\nNot Detected";
                                setTimeout(() => {this.textDisplay.HFDSText.text = "HFDS Off";}, 2000);
                            }
                            else
                            {
                                state = stateGoHFDSOn;
                                this.textDisplay.HFDSText.text = "HFDS On";   
                                if(raining > 0)
                                {
                                    this.rainDetect();
                                }
                            }
                        }
                        break;
                    case stateRainHFDSOn:
                    case stateGoHFDSOn:
                        this.textDisplay.HFDSText.text = "HFDS Off";
                        state = stateGoHFDSOff;
                        break;
                    case stateStopHFDSOff:
                        this.textDisplay.HFDSText.text = "Car must be\ngoing at least\n20MPH for HFDS\nto activate";
                        setTimeout(() => {this.textDisplay.HFDSText.text = "HFDS Off";}, 2000);
                        break;
                }
            }
            else
            {
                this.textDisplay.HFDSText.text = "Pay Attention";
                setTimeout(() => {this.textDisplay.HFDSText.text = "HFDS Off";}, 2000);
            }
		}, this);
        this.input.keyboard.on('keydown-T', function(){
			if(raining == 0)
            {
                this.rain.setAlpha(1);
                raining = 1;
                rainSound.play();
                if(state == stateGoHFDSOn || state == stateRainHFDSOn) this.rainDetect();
            }
            else if(raining == 1)
            {
                this.rain.setAlpha(0);
                raining = 0;
                rainSound.stop();
            }
            else if(raining == 2)
            {
                this.rainHeavy.setAlpha(0);
                raining = 1;
                if(state == stateGoHFDSOn || state == stateRainHFDSOn) this.rainDetect();
            }
		}, this);
        this.input.keyboard.on('keydown-Y', function(){
			if(raining == 0)
            {
                this.rain.setAlpha(1);
                this.rainHeavy.setAlpha(1);
                raining = 2;
                rainSound.play();
                if(state == stateGoHFDSOn || state == stateRainHFDSOn) this.rainDetect();
            }
            else if(raining == 1)
            {
                this.rainHeavy.setAlpha(1);
                raining = 2;
                if(state == stateGoHFDSOn || state == stateRainHFDSOn) this.rainDetect();
            }
            else
            {
                this.rain.setAlpha(0);
                this.rainHeavy.setAlpha(0);
                raining = 0;
                rainSound.stop();
            }
		}, this);
        this.input.keyboard.on('keydown-U', function(){
			oCar = !oCar;
            if(oCar)
            {
                this.oCar.setZ(6000);
            }
		}, this);
        this.input.keyboard.on('keydown-P', function(){
			driverAttention = !(driverAttention);
            if(driverAttention == 0 && (state == stateGoHFDSOn || state == stateRainHFDSOn) && timer == 0)
            {
                timer = new Date().getTime();
            }
		}, this);
        this.input.keyboard.on('keydown-R', function(){
			state = stateRestart;
            rainSound.pause();
            raining = 0;
            this.rain.setAlpha(0);
            this.rainHeavy.setAlpha(0);
		}, this);
        this.input.keyboard.on('keydown-F', function(){
            if(state == stateGoHFDSOn){
                state = stateHFDSFault;
                this.textDisplay.HFDSText.text = "HFDS Faulted";
                this.warning();
            }
		}, this);
    }
    update(time, delta)
    {
        this.textDisplay.speedText.text = (this.user.speed / 50).toString() + ' MPH';
        var dt = Math.min(1, delta / 1000);
        switch(state)
        {
            case stateStopHFDSOff:
            case stateGoHFDSOff:
            case stateHFDSFault:
                this.user.update(dt);
                this.camera.update();
                this.road.render();
                break;
            case stateRainHFDSOn:
            case stateGoHFDSOn:
                if((this.user.x >= 0 && this.user.x < 0.5) || (this.user.x > -1.25 && this.user.x < -0.5))
                {
                    this.user.x += 0.001;
                }
                else if((this.user.x < 1.25 && this.user.x > 0.5) || (this.user.x < 0 && this.user.x > -0.5))
                {
                    this.user.x -= 0.001;
                }
                if(oCar)
                {
                    if(Math.abs(this.user.z - this.oCar.z)%17000 < 3000)
                    {
                        if(this.user.speed > 1000)
                        {
                            this.user.speed = 1000;
                        }
                    }
                }
                this.user.update(dt);
                this.camera.update();
                this.road.render();
                break;
            case stateRestart:
                this.road.create();
                this.user.restart();
                oCar = 0;
                state = stateStopHFDSOff;
                this.textDisplay.HFDSText.text = 'HFDS Off';
                break;
            case stateCrash:
                this.textDisplay.HFDSText.text = 'Crash Detected!';
                break;
        }
        if(Math.abs(this.user.x) >= 1.5)
        {
            state = stateCrash;
        }
        if(driverAttention == 1)
        {
            this.textDisplay.driverText.text = 'Driver Status: Attentive';
        }
        else
        {
            this.textDisplay.driverText.text = 'Driver Status: Not Attentive';
        }
        console.log(this.oCar.z);
        if(oCar)
        {
            if(!(Math.abs(this.oCar.z - this.user.z)%19500 < 100))
            {
                this.oCar.update(dt);
            }
            if(Math.abs(this.user.z - this.oCar.z)%19800 < 100)
            {
                state = stateCrash;
            }
            else if(Math.abs(this.user.z - this.oCar.z)%15000 < 5000)
            {
                this.oCarSprite.setScale(1/(Math.abs(this.oCar.z - this.user.z)/ (100*screenWidth/1920)));
                if(1/((this.oCar.z - this.user.z) / (10000*screenWidth/1920)) < (275*screenWidth/1920))
                {
                    this.oCarSprite.setY(275*screenWidth/1920);
                }
                else
                {
                    this.oCarSprite.setY(1/((this.oCar.z - this.user.z) / (10000*screenWidth/1920)));
                }
            }
            else
            {
                this.oCarSprite.setScale(0);
            }
        }
        else
        {
            this.oCarSprite.setScale(0);
            this.oCar.setZ(-1);
        }
        if(timer > 0)
        {
            var currTime = new Date().getTime();
            console.log(currTime);
            if(currTime - timer > 5000)
            {
                this.warning();
                timer = 0;
            }
        }
    }
    rainDetect()
    {
        if(state == stateGoHFDSOn || state == stateRainHFDSOn)
        {
            switch(raining)
            {
                case 1:
                    this.textDisplay.HFDSText.text = 'Rain Detected!';
                    if(this.user.speed > 3000)
                    {
                        setTimeout(() => {this.textDisplay.HFDSText.text = 'Slowing Down';}, 2000);
                        setTimeout(() => {this.user.speed -= ((this.user.speed - 3000) * 0.333);}, 2333);
                        setTimeout(() => {this.textDisplay.speedText.text = (Math.floor(this.user.speed * 0.75 / 50)).toString() + ' MPH';}, 2334);
                        setTimeout(() => {this.user.speed -= ((this.user.speed - 3000) * 0.666);}, 2666);
                        setTimeout(() => {this.textDisplay.speedText.text = (Math.floor(this.user.speed * 0.75 * 0.25 / 50)).toString() + ' MPH';}, 2667);
                        setTimeout(() => {this.user.speed = 3000;}, 3000);
                        setTimeout(() => {this.textDisplay.HFDSText.text = 'HFDS On';}, 3000);
                        setTimeout(() => {state = stateRainHFDSOn;}, 3000);
                    }
                    else
                    {
                        setTimeout(() => {this.textDisplay.HFDSText.text = 'HFDS On';}, 2000);
                        setTimeout(() => {state = stateRainHFDSOn;}, 2000);
                    }
                    break;
                case 2:
                    this.textDisplay.HFDSText.text = 'Heavy Rain\nDetected!';
                    setTimeout(() => {this.textDisplay.HFDSText.text = "HFDS Off";}, 2000);
                    setTimeout(() => {state = stateGoHFDSOff;}, 2000);
                    break;
                case 0:
                    state = stateGoHFDSOn;
                    break;
            }
        }
    }
    warning()
    {
        var flashOn = setInterval(() => {this.filter.setAlpha(0.5);}, 500);
        var flashOff = setInterval(() => {this.filter.setAlpha(0);}, 1000);
        var warningS = setInterval(() => {this.warningSound.play();}, 5000);
        setTimeout(() => {this.textDisplay.HFDSText.text = "Checking\nDriver\nAttentiveness";}, 5000);
        setTimeout(() => {
            this.input.keyboard.enabled = false;
            if (driverAttention == 1)
            {
                setTimeout(() => {this.textDisplay.HFDSText.text = "Driver is\nAttentive";}, 5000);
                setTimeout(() => {this.textDisplay.HFDSText.text = "Switching to\nManual Controls";}, 7000);
                setTimeout(() => {state = stateGoHFDSOff;}, 8000);
                setTimeout(() => {this.textDisplay.HFDSText.text = "HFDS Off";}, 8000);
                setTimeout(() => {this.filter.setAlpha(0);}, 8000);
            }
            else
            {
                setTimeout(() => {this.textDisplay.HFDSText.text = "Driver is not\nAttentive";}, 5000);
                setTimeout(() => {this.textDisplay.HFDSText.text = "Pulling Over...";}, 7000);
                setTimeout(() => {state = stateStopHFDSOff;}, 8000);
                setTimeout(() => {this.textDisplay.HFDSText.text = "HFDS Off";}, 8000);
                if(this.user.x >= 0)
                {
                    var remain = (1.24 - this.user.x)/1000;
                    for(var i=7000; i<8000; i++)
                    {
                        setTimeout(() => {this.user.x += remain;}, i);
                    }
                }
                else
                {
                    var remain = (-1.24 - this.user.x)/1000;
                    for(var i=7000; i<8000; i++)
                    {
                        setTimeout(() => {this.user.x += remain;}, i);
                    }
                }
                setTimeout(() => {this.user.speed = 0;}, 8000);
            }
            setTimeout(() => {this.input.keyboard.enabled = true;}, 7000);
            setTimeout(() => {clearInterval(flashOff);}, 7000);
            setTimeout(() => {clearInterval(flashOn);}, 7000);
            setTimeout(() => {clearInterval(warningS);}, 7000);
        }, 10000);
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
        point.screen.y = Math.round((1 - projectedY) * (screenCenterY * 0.5));
        point.screen.w = Math.round(projectedW * screenCenterX);
    }
    render()
    {
        this.graphics.clear();
        var clipThreshold = screenHeight;
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
        this.graphics.fillStyle(color);
        this.graphics.beginPath();
        this.graphics.moveTo(x1, y1);
        this.graphics.lineTo(x2, y2);
        this.graphics.lineTo(x3, y3);
        this.graphics.lineTo(x4, y4);
        this.graphics.closePath();
        this.graphics.fill();
    }
    drawSprite(x, y, z, sprite)
    {
        this.graphics.draw;
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
        this.scene = scene
        this.x = 0.5;
        this.y = 0;
        this.z = 0;
        this.maxSpeed = (this.scene.road.segmentLength) / (1 / 60);
        this.speed = 0;
    }
    restart()
    {
        this.x = 0.5;
        this.y = 0;
        this.z = 0;
        this.speed = 0;
    }
    update(delta)
    {
        this.z += this.speed * delta;
        if(this.z >= this.scene.road.roadLength)
        {
            this.z -= this.scene.road.roadLength;
        }
    }
}

class Sprite
{
    constructor(scene)
    {
        this.scene = scene
        this.sprite = this.scene.sprites[0];
        this.sprite.width /= 2;
        this.x = -0.5;
        this.y = 0;
        this.z = 0;
        this.w = (this.sprite.width / 1000) * 2;
        this.maxSpeed = (this.scene.road.segmentLength) / (1 / 60);
        this.speed = 1000;
    }
    setZ(z)
    {
        this.z = z;
    }
    restart()
    {
        this.x = -0.5;
        this.y = 0;
        this.z = 0;
        this.speed = 0;
    }
    update(delta)
    {
        this.z += this.speed * delta;
        if(this.z >= this.scene.road.roadLength)
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
        this.scaledText = screenWidth/1920 * 32;
        this.font = {font: this.scaledText.toString() + 'px Verdana', fill: '#FFFFFF'};
        this.HFDSText = this.scene.add.text(screenCenterX - (screenWidth/1920 * 130), screenCenterY + (screenWidth/1920 * 90), '', this.font);
        this.speedText = this.scene.add.text(screenCenterX - (screenWidth/1920 * 130), screenCenterY + (screenWidth/1920), '', this.font);
        this.driverText = this.scene.add.text(10, 10, '', this.font);
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