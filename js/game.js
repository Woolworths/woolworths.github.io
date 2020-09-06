import * as models from '/js/models.js';

class Matrix {
    constructor() {
        this.grid = [];
        this.colourGrid = [];

        this.widthL = 100;
        this.heightL = 100;
    }

    calculateXY(canvasWidth, canvasHeight) {
        this.widthL = Math.floor(canvasWidth * 612 / 1000);
        this.heightL = Math.round(canvasHeight / lineHeight);
    }

    XYInBounds(x, y) {
        if (y >= 0 && y <= this.heightL - 1 && x >= 0 && x <= this.widthL - 1)
            return true;

        return false;
    }

    initGrid() {
        for (let x = 0; x < this.heightL; x++) {
            this.grid[x] = [];
            this.colourGrid[x] = [];

            for (let y = 0; y < this.widthL; y++) {
                this.grid[x][y] = '.';
                this.colourGrid[x][y] = '#ffffff';
            }
        }
    }

    updateSprites(obstacles, player) {
        for (let i = obstacles.length - 1; i >= 0; i--) {
            var obstacle = obstacles[i];

            this.drawSprite(obstacle.sprite, obstacle.x, obstacle.y);
            obstacle.tick();

            // TODO
            if (!this.XYInBounds(obstacle.x, obstacle.y)) {
                obstacles.splice(i, 1);
            }
        }

        this.drawSprite(player.sprite, player.x, player.y, '#bfe66a');
        player.tick();
    }

    drawSprite(sprite, x, y, colour) {
        for (let i = sprite.length - 1; i >= 0; i--) {
            const line = sprite[i];

            for (let j = line.length - 1; j >= 0; j--) {
                if (this.XYInBounds(j + x, this.heightL - (i + y) - 1) &&
                    sprite[sprite.length - i - 1][j] &&
                    sprite[sprite.length - i - 1][j] !== '.') {

                    this.grid[this.heightL - (i + y) - 1][x + j] = sprite[sprite.length - i - 1][j];

                    if (colour)
                        this.colourGrid[this.heightL - (i + y) - 1][x + j] = colour;
                }
            }
        }
    }
}

// TODO
//class Game {
//}

// From: https://stackoverflow.com/a/15666143/3223010
const createHiDPICanvas = function(w, h) {
    const c = document.createElement("canvas");

    const ctx = c.getContext("2d"),
          dpr = window.devicePixelRatio || 1,
          bsr = ctx.webkitBackingStorePixelRatio ||
              ctx.mozBackingStorePixelRatio ||
              ctx.msBackingStorePixelRatio ||
              ctx.oBackingStorePixelRatio ||
              ctx.backingStorePixelRatio || 1;

    const ratio = dpr / bsr;

    c.width = w * ratio;
    c.height = h * ratio;
    c.style.width = w + "px";
    c.style.height = h + "px";

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    return c;
}

//var globalId;
//var lastUpdate = Date.now();

var canvasWidth = 700;
var canvasHeight = 500;

const fontSize = 3;
const lineHeight = fontSize + 1.5;

const canvas = createHiDPICanvas(canvasWidth, canvasHeight);
const ctx = canvas.getContext('2d');

const el = document.getElementById('game');
el.appendChild(canvas);

//const approx = canvasWidth / ctx.measureText('.').width;

const matrix = new Matrix();
matrix.calculateXY(canvasWidth, canvasHeight);

var updatesPerSecond = 120;
var framesPerSecond = 90;
const printDots = false;

const heightFromBottom = 15;

const obstacles = []; // [Obstacles()]
const player = new models.Player(50, heightFromBottom);
const fpsCounter = new models.FPSCounter(canvasWidth - 50, 11.5);

function printMatrix(matrix) {
    const t0 = performance.now();

    ctx.font = `${fontSize}px Menlo`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cache = new Map();

    var y = 0;
    //const approx = ctx.measureText('M').width;

    for (let i = 0; i < matrix.heightL; i++) {
        //var c = '';

        var x = 0;

        for (let j = 0; j < matrix.widthL; j++) {
            const c = matrix.grid[i][j];

            var textSize = undefined;

            if (cache.has(c)) {
                textSize = cache.get(c);
            } else {
                textSize = ctx.measureText(c).width;
                cache.set(c, textSize);
            }

            if (!printDots && c === '.') {
                x += textSize;

                continue;
            }
            
            const colour = matrix.colourGrid[i][j];

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


function printText(text, size, x, y) {
    ctx.font = `${size}px Menlo`;
    ctx.fillStyle = '#ffffff';

    ctx.fillText(text, x, y);
}

function updateText() {
    printText(`FPS: ${fpsCounter.fps}`, 10, fpsCounter.x, fpsCounter.y);
    fpsCounter.tick();
}

function randomObjectGeneration() {
    var rng = Math.random();

    if (rng < 1/(framesPerSecond * 0.1)) {
        obstacles.push(new models.Ground(matrix.widthL - 1, heightFromBottom - 2));
    }

    var rng = Math.random();

    if (rng < 1/(framesPerSecond * 1)) {
        obstacles.push(new models.Tree(matrix.widthL - 1, heightFromBottom + 2));
    }

    var rng = Math.random();

    if (rng < 1/(framesPerSecond * 2)) {
        //obstacles.push(new models.Platform(matrix.widthL - 1, heightFromBottom));
    }
}

function checkIntersects() {
    for (let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i];

        if (obstacle.playerCanCollide) {
            // TODO: USE AND FOR PIXELS to check actual hitbox
            if (obstacle.x > player.x &&
                obstacle.x < player.x + player.sprite[0].length &&
                obstacle.y > player.y &&
                obstacle.y < player.y + player.sprite.length) {
                console.log('PLAYER DEAD');

                break;
            }

            /*for (let x = 0; x < player.sprite.length; x++) {
                for (let y = 0; y < player.sprite[x].length; y++) {
                    if (player.sprite[x][y] && player.sprite[x][y] !== '.') {
                        //
                    }
                }
            }*/
        }
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

function renderLoop() {
    const now = Date.now();

    //if (now - lastUpdate > 1000 / framesPerSecond) {
        //lastUpdate = now;

        randomObjectGeneration();

        matrix.initGrid();
        matrix.updateSprites(obstacles, player);

        printMatrix(matrix);

        updateText();
    //}

    //globalId = requestAnimationFrame(loop);
}

function backendLoop() {
    checkIntersects();
}

setInterval(renderLoop, Math.round(1000 / framesPerSecond));
setInterval(backendLoop, Math.round(1000 / updatesPerSecond));
//globalId = requestAnimationFrame(loop);
// cancelAnimationFrame(globalId);

