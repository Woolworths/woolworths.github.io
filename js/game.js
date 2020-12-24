import * as models from '/js/models.js';
import { weightedRandomDist } from '/js/helpers.js';

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

    XGreaterThanZero(x, y) {
        if (y >= 0 && y <= this.heightL - 1 && x >= 0)
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

var canvasWidth = 700;
var canvasHeight = 420;

const font = 'Menlo, "Courier New", Courier, monospace';
const fontSize = 3;
const fontColour = '#eeeeee';
const lineHeight = fontSize + 1.5;

const canvas = createHiDPICanvas(canvasWidth, canvasHeight);
const ctx = canvas.getContext('2d');

const el = document.getElementById('game');
el.innerHTML = '';
el.appendChild(canvas);

//const approx = canvasWidth / ctx.measureText('.').width;

const matrix = new Matrix();
matrix.calculateXY(canvasWidth, canvasHeight);

var updatesPerSecond = 90;
var framesPerSecond = 90;
const printDots = false;

const heightFromBottom = 15;

var obstacles = []; // [Obstacles()]
var prevGround = undefined;
var prevTree = undefined;
var distancePerGround = 1;
var distancePerTree = 160;

const player = new models.Player(50, heightFromBottom);
const scoreCounter = new models.ScoreCounter(10, 20);
const fpsCounter = new models.FPSCounter(10, 38);

var showFpsCounter = !window.production;
var gameStarted = false;
var gamePaused = false;
var gameEndedAt = undefined;
const endingSeconds = 1;

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

            if (colour && (gameStarted || gamePaused))
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
    fpsCounter.x = canvasWidth - 60;
    fpsCounter.y = 20;

    if (showFpsCounter) {
        printText(`FPS: ${fpsCounter.fps}`, 11, fpsCounter.x, fpsCounter.y);
        fpsCounter.tick();
    }

    //printText('Press SPACE or ↑ to play', 15, scoreCounter.x, scoreCounter.y);
    if (gameEndedAt || gameStarted) {
        printText(`${scoreCounter.score.toLocaleString('en-US', { minimumIntegerDigits: 5, useGrouping:false })}`, 16, scoreCounter.x, scoreCounter.y, '#bfe66a');

        if (gamePaused) {
            printText('GAME OVER', 16, canvasWidth / 2 - 45, 20, '#bfe66a');
        } else {
            if (!gameStarted)
                return;

            scoreCounter.tick();
        }
    }
}

function startGame() {
    if (!gameStarted) {
        if (gameEndedAt && (Date.now() - gameEndedAt) / 1000 < endingSeconds) {
            return;
        }

        removeAllObstacles();

        gameStarted = true;
        gamePaused = false;

        scoreCounter.reset();

        if (window.production) {
            gtag('event', 'start', {
                'event_category' : 'game',
                'event_label' : 'Game Started'
            });
        }
    }
}

function removeAllObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];

        if (obstacle.playerCanCollide) {
            obstacles.splice(i, 1);
        }
    }
}

function endGame() {
    console.log('Resetting game');

    gamePaused = true;
    gameStarted = false;
    gameEndedAt = Date.now();

    prevGround = undefined;
    prevTree = undefined;

    //obstacles = [];

    if (window.production) {
        gtag('event', 'finish', {
            'event_category' : 'game',
            'event_label' : 'Game Finished',
            'value': scoreCounter.score
        });
    }
}

function randomObjectGeneration() {
    // [0, inf] -> [0, 1]
    const chaos = scoreCounter.chaos;

    if (prevGround)
        var prevGroundDistance = matrix.widthL - prevGround.x - 1;
    else
        var prevGroundDistance = distancePerGround + 1;

    var rng = Math.random();

    if (prevGroundDistance >= distancePerGround && rng < 1/updatesPerSecond * 25) {
        const g = new models.Ground(matrix.widthL - 1, heightFromBottom - 1);
        g.setChaos(chaos);

        obstacles.push(g);

        prevGround = g;
    }

    if (!gameStarted)
        return;

    if (prevTree)
        var prevTreeDistance = matrix.widthL - prevTree.x - 1;
    else
        var prevTreeDistance = distancePerTree + 1;

    rng = Math.random();
    var odds = (0.6 + 0.4 * chaos) * 1/updatesPerSecond * 2;

    if (prevTreeDistance >= distancePerTree && rng < odds) {
        const n = weightedRandomDist(1, 5, 1, 2 * 1/chaos);

        for (let i = 0; i < n; i++) {
            const t = new models.Tree(matrix.widthL - 1 + i * 8, heightFromBottom + 1, chaos);

            obstacles.push(t);

            prevTree = t;
        }
    }
}

function updatePositions() {
    const chaos = scoreCounter.chaos;
    //var chaos = 1;

    for (let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i];

        obstacle.setChaos(chaos);
        obstacle.tick();

        if (!matrix.XGreaterThanZero(obstacle.x, obstacle.y)) {
            obstacles.splice(i, 1);
        }
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

                if (!player.sprite && !obstacle.sprite) {
                    endGame();

                    return;
                }

                const x2Diff = xToPlayer - xToObstacle;
                const y1Diff = - yFromPlayer + yToObstacle;
                
                for (let x = 0; x < x2Diff; x++) {
                    for (let y = 0; y < y1Diff; y++) {
                        const pixelX = player.width - x;
                        const pixelY = player.height - y - 1;

                        if (pixelX < 0 || pixelY < 0 || pixelX > player.width || pixelY >= player.height) {
                            console.log('Error in checking intersects');
                            
                            break;
                        }

                        if (player.sprite[pixelY][pixelX] !== '.') {
                            endGame();

                            return;
                        }
                    }
                }
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

function drawPlayer() {
    matrix.drawSprite(player.sprite, player.x, player.y, player.colour);
}

function drawSprites() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        var obstacle = obstacles[i];

        matrix.drawSprite(obstacle.sprite, obstacle.x, obstacle.y, obstacle.colour);
    }

    drawPlayer();
}

function keydown(e) {
    if (e.keyCode === 38 || e.keyCode === 32) {
        startGame();

        e.preventDefault();

        if (!gamePaused)
            player.jump();
    }
}

function keyup(e) {
    if (e.keyCode === 38 || e.keyCode === 32) {
        e.preventDefault();

        //player.cancelJump();
    }
}

function touchstart(e) {
    startGame();

    e.preventDefault();

    if (!gamePaused)
        player.jump();
}

function touchend(e) {
    e.preventDefault();

    //player.cancelJump();
}

document.addEventListener('keydown', keydown);
document.addEventListener('keyup', keyup);
game.addEventListener('touchstart', touchstart);
game.addEventListener('touchend', touchend);

function resize(e) {
    const rect = el.getBoundingClientRect();

    canvasWidth = rect.width;
    //canvasHeight = rect.height;

    prevGround = undefined;
    prevTree = undefined;

    //fpsCounter.x = canvasWidth - 60;
    //fpsCounter.y = 20;

    resizeCanvas(canvas, canvasWidth, canvasHeight);
    matrix.calculateXY(canvasWidth, canvasHeight);
}

window.addEventListener('resize', resize);

var lastUpdate = Date.now();

function loop() {
    const now = Date.now();

    if (!gamePaused) {
        if (now - lastUpdate > 500) {
            lastUpdate = now;
        }

        const updatesNeeded = ((now - lastUpdate) / 1000) * updatesPerSecond;

        for (let i = 0; i < updatesNeeded; i++) {
            randomObjectGeneration();

            updatePositions();
            checkIntersects();

            if (gamePaused) {
                break;
            }

            lastUpdate += 1000 * 1 / updatesPerSecond;
        }
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

