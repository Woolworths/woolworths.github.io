import * as sprites from '/js/sprites.js';

const jumpHeight = 40;
const damping = 1/150;

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.baseX = x;
        this.baseY = y;

        this.jumpTime = undefined;

        this.runCount = 0;
        this.runTime = undefined;
    }

    get height() {
        return this.sprite.length;
    }

    jump() {
        if (this.jumping === false) {
            console.log('Jumping');

            this.jumpTime = Date.now();
        }
    }

    // Update the x and y values
    tick() {
        if (this.jumping) {
            const newY = this.baseY - this.jumpY;

            if (newY <= this.baseY) {
                this.y = newY;
            } else {
                this.y = this.baseY;
                this.jumpTime = null;
            }
        } else {
            this.y = this.baseY;
            // buggy i think: this.jumpTime = null; could also do a counter like run
        }
    }

    get canRun() {
        return this.baseX === this.x;
    }

    get runStep() {
        if (this.runTime) {
            const interval = 50;
            const states = 4;

            const a = (Date.now() - this.runTime);

            if (a > interval) {
                this.runCount++;
                this.runCount = this.runCount % states;

                this.runTime = Date.now();
            }
        } else {
            this.runTime = Date.now();
        }

        return this.runCount;
    }

    get jumping() {
        if (this.jumpY > 0) {
            return true;
        }

        return false;
    }

    get jumpY() {
        if (this.jumpTime) {
            const a = (Date.now() - this.jumpTime) / 1000;

            const moveBy = -(1/damping) * Math.pow(a - Math.pow(jumpHeight, 1/2) * Math.pow(damping, 1/2), 2) + jumpHeight;

            return Math.floor(moveBy);
        }

        return 0;
    }

    get sprite() {
        if (this.jumping === true) {
            // Calculate up or down
            const a = (Date.now() - this.jumpTime) / 1000;

            const half = Math.pow(jumpHeight, 1/2) * Math.pow(damping, 1/2);

            if (a < half) {
                if (this.jumpY < jumpHeight * 2/3) {
                    return sprites.upSlime;
                }
            } else {
                if (this.jumpY < jumpHeight * 9/10) {
                    return sprites.downSlime;
                }
            }

            return sprites.normalSlime;

        }

        if (this.canRun) {
            if (this.runStep === 0) {
                return sprites.runningSlime;
            } else if (this.runStep === 1) {
                return sprites.runningSlime1;
            } else if (this.runStep === 2) {
                return sprites.runningSlime2;
            } else {
                return sprites.runningSlime3;
            }
        }

        return sprites.normalSlime;
    }
}

class Ground {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.prevTime = undefined;

        this.baseX = x;
        this.baseY = y;

        this.speed = 75;

        const s = Math.random();

        if (s < 0.6) {
            this.height = 1;
        } else if (s < 0.9) {
            this.height = 2;
        } else {
            this.height = 3;
        }
    }

    tick() {
        const now = Date.now();

        if (this.prevTime) {
            const diff = (now - this.prevTime) / 1000 * this.speed;

            this.x = this.baseX - Math.round(diff);
        } else {
            this.prevTime = Date.now();
        }
    }

    get sprite() {
        const sprite = [];

        for (let i = 0; i < this.height; i++) {
            sprite[i] = [];
            sprite[i][0] = '|';
        }

        return sprite;
    }
}

class Tree {
    constructor(x, y) {
        const s = Math.random();

        if (s < 0.1) {
            this.height = 3;
        } else if (s < 0.2) {
            this.height = 4;
        } else if (s < 0.4) {
            this.height = 3;
        } else if (s < 0.55) {
            this.height = 6;
        } else if (s < 0.75){
            this.height = 7;
        } else {
            this.height = 11;
        }

        if (!x || !y) {
            this.x = widthL - 1;
            this.y = heightL - heightFromBottom - this.height;
        } else {
            this.x = x;
            this.y = y;
        }

        this.prevTime = undefined;

        this.baseX = this.x;
        this.baseY = this.y;

        this.speed = 75;
    }

    tick() {
        const now = Date.now();

        if (this.prevTime) {
            const diff = (now - this.prevTime) / 1000 * this.speed;

            this.x = this.baseX - Math.round(diff);
        } else {
            this.prevTime = Date.now();
        }
    }

    get sprite() {
        const sprite = [];

        sprite[0] = [];
        sprite[0][1] = '_';
        sprite[0][2] = '_';
        sprite[0][3] = '_';

        for (let i = 1; i < this.height; i++) {
            sprite[i] = [];
            sprite[i][1] = '|';
        }

        return sprite;
    }
}

// TODO: speed should not be in here..
class Platform {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.prevTime = undefined;

        this.baseX = x;
        this.baseY = y;

        this.speed = 75;

        const s1 = Math.random();
        this.height = Math.round(s1 * 30);

        const s2 = Math.random();
        this.width = Math.round(s2 * 300);
    }

    tick() {
        const now = Date.now();

        if (this.prevTime) {
            const diff = (now - this.prevTime) / 1000 * this.speed;

            this.x = this.baseX - Math.round(diff);
        } else {
            this.prevTime = Date.now();
        }
    }

    get sprite() {
        const sprite = [];

        /*for (let i = 0; i < this.height; i++) {
            sprite[i] = [];
            sprite[i][0] = '|';
        }

        for (let i = 0; i < this.width; i++) {
            sprite[0][i] = '=';
        }*/

        return sprite;
    }
}

// From: https://stackoverflow.com/a/15666143/3223010
const PIXEL_RATIO = (function () {
    var ctx = document.createElement("canvas").getContext("2d"),
        dpr = window.devicePixelRatio || 1,
        bsr = ctx.webkitBackingStorePixelRatio ||
              ctx.mozBackingStorePixelRatio ||
              ctx.msBackingStorePixelRatio ||
              ctx.oBackingStorePixelRatio ||
              ctx.backingStorePixelRatio || 1;

    return dpr / bsr;
})();

const createHiDPICanvas = function(w, h, ratio) {
    if (!ratio) { ratio = PIXEL_RATIO; }
    var c = document.createElement("canvas");
    c.width = w * ratio;
    c.height = h * ratio;
    c.style.width = w + "px";
    c.style.height = h + "px";
    c.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
    return c;
}

var matrix = [];
var colourMatrix = [];

var globalId;
var lastUpdate = Date.now();

var canvasWidth = 700;
var canvasHeight = 500;

const fontSize = 4;
const lineHeight = fontSize + 1.5;

const canvas = createHiDPICanvas(canvasWidth, canvasHeight);
const ctx = canvas.getContext('2d');

ctx.font = `${fontSize}px Menlo`;

const el = document.getElementById('game');
el.appendChild(canvas);

const approx = canvasWidth / ctx.measureText('.').width;

var widthL = Math.floor(approx);
var heightL = Math.round(canvasHeight / lineHeight);

const framesPerSecond = 120;

const heightFromBottom = 20;

var obstacles = []; // [Obstacles()]
var player = new Player(30, 60);

function XYInBounds(x, y) {
    if (y >= 0 && y <= heightL - 1 && x >= 0 && x <= widthL - 1)
        return true;

    return false;
}

function initMatrix() {
    for (let x = 0; x < heightL; x++) {
        matrix[x] = [];
        colourMatrix[x] = [];

        for (let y = 0; y < widthL; y++) {
            matrix[x][y] = '.';
            colourMatrix[x][y] = '#ffffff';
        }
    }
}

function printMatrix() {
    const t0 = performance.now();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cache = new Map();

    var y = 0;
    //const approx = ctx.measureText('M').width;

    for (let i = 0; i < heightL; i++) {
        //var c = '';

        var x = 0;

        for (let j = 0; j < widthL; j++) {
            const c = matrix[i][j];

            var textSize = undefined;

            if (cache.has(c)) {
                textSize = cache.get(c);
            } else {
                textSize = ctx.measureText(c).width;
                cache.set(c, textSize);
            }

            if (c === '.') {
                x += textSize;

                continue;
            }
            
            const colour = colourMatrix[i][j];

            if (colour)
                ctx.fillStyle = colour;

            ctx.fillText(c, x, y);

            x += textSize;
        }

        //y += 2 * approx;
        y = lineHeight * i;
    }

    const t1 = performance.now();

    //console.log(`Time taken: ${t1 - t0}`);
}

function updateMatrix() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        var obstacle = obstacles[i];

        drawSprite(obstacle.sprite, obstacle.x, obstacle.y);

        obstacle.tick();

        if (!XYInBounds(obstacle.x, obstacle.y)) {
            obstacles.splice(i, 1);
        }
    }

    drawSprite(player.sprite, player.x, player.y, '#bfe66a');

    player.tick();
}

function drawSprite(sprite, x, y, colour) {
    for (let i = sprite.length - 1; i >= 0; i--) {
        const line = sprite[i];

        for (let j = line.length - 1; j >= 0; j--) {
            if (XYInBounds(j + x, i + y) && sprite[i][j] && sprite[i][j] !== '.') {
                matrix[i + y][x + j] = sprite[i][j];

                if (colour)
                    colourMatrix[i + y][x + j] = colour;
            }
        }
    }
}

function randomObjectGeneration() {
    var rng = Math.random();

    if (rng < 1/(framesPerSecond * 0.1)) {
        obstacles.push(new Ground(widthL - 1, heightL - heightFromBottom + 2));
    }

    var rng = Math.random();

    if (rng < 1/(framesPerSecond * 1)) {
        obstacles.push(new Tree());
    }

    var rng = Math.random();

    if (rng < 1/(framesPerSecond * 2)) {
        //obstacles.push(new Platform(widthL - 1, heightL - heightFromBottom));
    }
}

function keydown(e) {
    if (e.keyCode === 38 || e.keyCode === 32) {
        e.preventDefault();

        player.jump();
    }
}

function touchstart(e) {
    player.jump();
}

document.addEventListener('keydown', keydown);
document.addEventListener('touchstart', touchstart);

function l() {
    const now = Date.now();

    if (now - lastUpdate > 1000 / framesPerSecond) {
        lastUpdate = now;

        randomObjectGeneration();

        initMatrix();

        updateMatrix();

        printMatrix();
    }

    globalId = requestAnimationFrame(l);
}

globalId = requestAnimationFrame(l);
// cancelAnimationFrame(globalId);
