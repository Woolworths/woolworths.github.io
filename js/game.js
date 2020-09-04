import * as models from '/js/models.js';

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

const el = document.getElementById('game');
el.appendChild(canvas);

//const approx = canvasWidth / ctx.measureText('.').width;

var widthL = Math.floor(canvasWidth * 412 / 1000);
var heightL = Math.round(canvasHeight / lineHeight);

const framesPerSecond = 60;
const printDots = false;

const heightFromBottom = 15;

const obstacles = []; // [Obstacles()]
const player = new models.Player(15, heightFromBottom);
const fpsCounter = new models.FPSCounter(200, 60);

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

    ctx.font = `${fontSize}px Menlo`;

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

            if (!printDots && c === '.') {
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

        // TODO
        if (!XYInBounds(obstacle.x, obstacle.y)) {
            obstacles.splice(i, 1);
        }
    }

    drawSprite(player.sprite, player.x, player.y, '#bfe66a');
    player.tick();
}

function printText(text, size, x, y) {
    ctx.font = `${size}px Menlo`;

    ctx.fillText(text, x, y);
}

function updateText() {
    printText(`FPS: ${fpsCounter.fps}`, 10, canvasWidth - 50, 11.5);
    fpsCounter.tick();
}

function drawSprite(sprite, x, y, colour) {
    for (let i = sprite.length - 1; i >= 0; i--) {
        const line = sprite[i];

        for (let j = line.length - 1; j >= 0; j--) {
            if (XYInBounds(j + x, heightL - (i + y) - 1) &&
                sprite[sprite.length - i - 1][j] &&
                sprite[sprite.length - i - 1][j] !== '.') {

                matrix[heightL - (i + y) - 1][x + j] = sprite[sprite.length - i - 1][j];

                if (colour)
                    colourMatrix[heightL - (i + y) - 1][x + j] = colour;
            }
        }
    }
}

function randomObjectGeneration() {
    var rng = Math.random();

    if (rng < 1/(framesPerSecond * 0.1)) {
        obstacles.push(new models.Ground(widthL - 1, heightFromBottom - 2));
    }

    var rng = Math.random();

    if (rng < 1/(framesPerSecond * 1)) {
        obstacles.push(new models.Tree(widthL - 1, heightFromBottom + 2));
    }

    var rng = Math.random();

    if (rng < 1/(framesPerSecond * 2)) {
        //obstacles.push(new models.Platform(widthL - 1, heightL - heightFromBottom));
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

    //if (now - lastUpdate > 1000 / framesPerSecond) {
        lastUpdate = now;

        randomObjectGeneration();

        initMatrix();
        updateMatrix();
        printMatrix();

        updateText();
    //}

    //globalId = requestAnimationFrame(l);
}

//globalId = requestAnimationFrame(l);
// cancelAnimationFrame(globalId);

setInterval(l, Math.round(1000 / framesPerSecond));
