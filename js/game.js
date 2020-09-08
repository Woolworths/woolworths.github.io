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
                this.colourGrid[x][y] = fontColour;
            }
        }
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
function createHiDPICanvas(w, h) {
    const c = document.createElement("canvas");

    resizeCanvas(c, w, h);

    return c;
}

function resizeCanvas(canvas, width, height) {
    const ctx = canvas.getContext("2d"),
          dpr = window.devicePixelRatio || 1,
          bsr = ctx.webkitBackingStorePixelRatio ||
              ctx.mozBackingStorePixelRatio ||
              ctx.msBackingStorePixelRatio ||
              ctx.oBackingStorePixelRatio ||
              ctx.backingStorePixelRatio || 1;

    const ratio = dpr / bsr;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

const initialCanvasWidth = 700;
const initialCanvasHeight = 500;

const font = 'Menlo, "Courier New", Courier, monospace';
const fontSize = 3;
const fontColour = '#eeeeee';
const lineHeight = fontSize + 1.5;

const canvas = createHiDPICanvas(initialCanvasWidth, initialCanvasHeight);
const ctx = canvas.getContext('2d');

const el = document.getElementById('game');
el.appendChild(canvas);

//const approx = canvasWidth / ctx.measureText('.').width;

const matrix = new Matrix();
//matrix.calculateXY(initialCanvasWidth, initialCanvasHeight);

var updatesPerSecond = 90;
var framesPerSecond = 90;
const printDots = false;

const heightFromBottom = 15;

var obstacles = []; // [Obstacles()]
const player = new models.Player(50, heightFromBottom);
const scoreCounter = new models.ScoreCounter(10, 20);
const fpsCounter = new models.FPSCounter(10, 38);

var showFpsCounter = true;
var gameStarted = false;
var gameEndedAt = undefined;

function printMatrix(matrix) {
    const t0 = performance.now();

    ctx.font = `${fontSize}px ${font}`;

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

            if (colour && gameStarted)
                ctx.fillStyle = colour;
            else
                ctx.fillStyle = fontColour;

            ctx.fillText(c, x, y);

            x += textSize;
        }

        //y += 2 * approx;
        y = lineHeight * i;
    }

    const t1 = performance.now();

    //console.log(`Time taken: ${t1 - t0}`);
}


function printText(text, size, x, y, colour) {
    ctx.font = `${size}px ${font}`;

    if (colour)
        ctx.fillStyle = colour;
    else
        ctx.fillStyle = fontColour;

    ctx.fillText(text, x, y);
}

function updateText() {
    if (showFpsCounter) {
        printText(`FPS: ${fpsCounter.fps}`, 11, fpsCounter.x, fpsCounter.y);
        fpsCounter.tick();
    }

    if (!gameStarted && gameEndedAt === undefined) {
        printText('Hold SPACE or ↑ to play', 15, scoreCounter.x, scoreCounter.y);
    } else {
        printText(`Score: ${scoreCounter.score}`, 15, scoreCounter.x, scoreCounter.y, '#bfe66a');

        if (!gameStarted)
            return;

        scoreCounter.tick();
    }
}

function startGame() {
    if (!gameStarted) {
        if (gameEndedAt && (Date.now() - gameEndedAt) / 1000 < 1.5) {
            return;
        }

        gameStarted = true;

        scoreCounter.reset();

        gtag('event', 'start', {
            'event_category' : 'game',
            'event_label' : 'Game Started'
        });
    }
}

function endGame() {
    console.log('Resetting game');

    gameStarted = false;
    gameEndedAt = Date.now();

    //obstacles = [];

    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];

        if (obstacle.playerCanCollide) {
            obstacles.splice(i, 1);
        }
    }

    gtag('event', 'finish', {
        'event_category' : 'game',
        'event_label' : 'Game Finished',
        'value': scoreCounter.score
    });
}

function randomObjectGeneration() {
    // [0, inf] -> [0, 1]
    const chaos = scoreCounter.chaos;

    var rng = Math.random();

    if (rng < 1/(updatesPerSecond * 0.05)) {
        const g = new models.Ground(matrix.widthL - 1, heightFromBottom - 1);
        g.setChaos(chaos);

        obstacles.push(g);
    }

    if (!gameStarted)
        return;

    rng = Math.random();
    var odds = (0.7 + 0.3 * chaos) * 1/(updatesPerSecond * 1);

    if (rng < odds) {
        const t = new models.Tree(matrix.widthL - 1, heightFromBottom + 1);
        t.setChaos(chaos);

        obstacles.push(t);
    }

    rng = Math.random();

    if (rng < 1/(updatesPerSecond * 2)) {
        //obstacles.push(new models.Platform(matrix.widthL - 1, heightFromBottom));
    }
}

function updatePositions() {
    const chaos = scoreCounter.chaos;

    for (let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i];

        obstacle.setChaos(chaos);
        obstacle.tick();
    }
    
    player.setChaos(chaos);
    player.tick();
}

function checkIntersects() {
    for (let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i];

        if (obstacle.playerCanCollide) {
            const xFromPlayer = player.x;
            const xToPlayer = player.x + player.width;
            const yFromPlayer = player.y;
            const yToPlayer = player.y + player.height;

            const xFromObstacle = obstacle.x;
            const xToObstacle = obstacle.x + obstacle.sprite[0].length;
            const yFromObstacle = obstacle.y;
            const yToObstacle = obstacle.y + obstacle.sprite.length;

            // TODO: USE AND FOR PIXELS to check actual hitbox
            if (xFromPlayer <= xFromObstacle &&
                xToPlayer >= xToObstacle &&
                yFromPlayer <= yToObstacle &&
                yToPlayer >= yFromObstacle) {
                endGame();

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

function drawSprites() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        var obstacle = obstacles[i];

        matrix.drawSprite(obstacle.sprite, obstacle.x, obstacle.y, obstacle.colour);

        // TODO
        if (!matrix.XYInBounds(obstacle.x, obstacle.y)) {
            obstacles.splice(i, 1);
        }
    }

    matrix.drawSprite(player.sprite, player.x, player.y, player.colour);
}

function keydown(e) {
    if (e.keyCode === 38 || e.keyCode === 32) {
        startGame();

        e.preventDefault();

        player.jump();
    }
}

function keyup(e) {
    if (e.keyCode === 38 || e.keyCode === 32) {
        e.preventDefault();

        player.cancelJump();
    }
}

function touchstart(e) {
    startGame();

    player.jump();
}

document.addEventListener('keydown', keydown);
document.addEventListener('keyup', keyup);
document.addEventListener('touchstart', touchstart);

function resize(e) {
    const rect = el.getBoundingClientRect();

    fpsCounter.x = rect.width - 60;

    resizeCanvas(canvas, rect.width, rect.height);
    matrix.calculateXY(rect.width, rect.height);
}

window.addEventListener('resize', resize);

var lastUpdate = Date.now();

function loop() {
    const now = Date.now();

    if (now - lastUpdate > 500) {
        lastUpdate = now;
    }

    const updatesNeeded = ((now - lastUpdate) / 1000) * updatesPerSecond;

    for (let i = 0; i < updatesNeeded; i++) {
        randomObjectGeneration();

        updatePositions();
        checkIntersects();

        lastUpdate += 1000 * 1 / updatesPerSecond;
    }

    matrix.initGrid();

    drawSprites();

    printMatrix(matrix);

    updateText();
}

window.addEventListener('load', (e) => {
    resize();

    setInterval(loop, Math.round(1000 / framesPerSecond));
})

