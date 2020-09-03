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

    tick() {
        if (this.jumping) {
            const newX = this.baseX - this.jumpX;
            const newY = this.baseY - this.jumpY;

            if (newX <= this.baseX) {
                this.x = newX;
            } else {
                this.x = this.baseX;
            }

            if (newY <= this.baseY) {
                this.y = newY;
            } else {
                this.y = this.baseY;

                this.jumpTime = null;
            }
        } else {
            this.y = this.baseY;
        }
    }

    get jumping() {
        if (this.jumpY > 0) {
            return true;
        }

        return false;
    }

    get jumpX() {
        return 0;
    }

    get jumpY() {
        if (this.jumpTime) {
            var a = (Date.now() - this.jumpTime) / 1000;

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

        return sprites.runningSlime;
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

var globalId;
var lastUpdate = Date.now();

var canvasWidth = 700;
var canvasHeight = 500;

const canvas = createHiDPICanvas(canvasWidth, canvasHeight);
const ctx = canvas.getContext('2d');

const el = document.getElementById('game');
el.appendChild(canvas);

const fontSize = 4;
const lineHeight = fontSize + 1.5;

var widthL = Math.round(canvasWidth * (414.5 / 1000));
var heightL = Math.round(canvasHeight / lineHeight);

console.log(widthL);

const framesPerSecond = 90;

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

        for (let y = 0; y < widthL; y++) {
            matrix[x][y] = '.';
        }
    }
}

function printMatrix() {
    const t0 = performance.now();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff'; // pink: #f4c2c2

    ctx.font = `${fontSize}px Menlo`;


    for (let x = 0; x < heightL; x++) {
        var c = '';

        for (let y = 0; y < widthL; y++) {
            c += matrix[x][y];
        }

        ctx.fillText(c, 0.5, lineHeight * x);
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

    if (rng < 1/(framesPerSecond * 0.1)) {
        obstacles.push(new Tree(widthL - 1, heightL - heightFromBottom));
    }
}

function keydown(e) {
    e.preventDefault();

    if (e.keyCode === 38 || e.keyCode === 32) {
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
