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
            const interval = 75;
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

class Tree {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.prevTime = undefined;

        this.baseX = x;
        this.baseY = y;

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

        drawTree(obstacle.x, obstacle.y);

        obstacle.tick();

        if (!XYInBounds(obstacle.x, obstacle.y)) {
            obstacles.splice(i, 1);
        }
    }

    //console.log([...obstacles]);

    drawPlayer();

    player.tick();
}

function drawPlayer() {
    const x = player.x;
    const y = player.y;

    const playerSprite = player.sprite;

    for (let i = playerSprite.length - 1; i >= 0; i--) {
        const line = playerSprite[i];

        for (let j = line.length - 1; j >= 0; j--) {
            if (XYInBounds(j + x, i + y) && playerSprite[i][j] !== '.') {
                matrix[i + y][j + x] = playerSprite[i][j];
                colourMatrix[i + y][j + x] = '#bfe66a';
            }
        }
    }
}

function drawTree(x, y) {
    if (XYInBounds(x, y)) {
        matrix[y][x] = '|';
    }

    if (XYInBounds(x, y - 1)) {
        matrix[y - 1][x] = '|';
    } 

    if (XYInBounds(x, y - 2)) {
        matrix[y - 2][x] = '|';
    }

    if (XYInBounds(x, y - 3)) {
        matrix[y - 3][x] = '|';
    }

    if (XYInBounds(x, y - 4)) {
        matrix[y - 4][x] = '|';
    }

    if (XYInBounds(x, y - 5)) {
        matrix[y - 5][x] = '|';
    }
}

function randomObjectGeneration() {
    const rng = Math.random();

    if (rng < 1/(framesPerSecond * 1)) {
        obstacles.push(new Tree(widthL - 1, heightL - heightFromBottom));
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
