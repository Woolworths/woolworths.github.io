import * as sprites from '/js/sprites.js';

const jumpHeight = 7;
const damping = 1/30;

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.baseX = x;
        this.baseY = y;

        this.jumpTime = undefined;
        this.jumping = false;
    }

    jump() {
        if (this.jumping === false) {
            console.log('Jumping');

            this.jumpTime = Date.now();

            this.jumping = true;
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

                this.jumping = false;
            }
        }
    }

    get jumpX() {
        return 0;
    }

    get jumpY() {
        if (this.jumping === true) {
            var a = (Date.now() - this.jumpTime) / 1000;

            const moveBy = -(1/damping) * Math.pow(a - Math.pow(jumpHeight, 1/2) * Math.pow(damping, 1/2), 2) + jumpHeight;

            return Math.round(moveBy);
        }

        return 0;
    }
}

class Tree {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.prevTime = undefined;

        this.baseX = x;
        this.baseY = y;
    }

    tick() {
        const now = Date.now();

        if (this.prevTime) {
            const diff = (now - this.prevTime) / 1000 * 24;

            this.x = this.baseX - Math.round(diff);
        } else {
            this.prevTime = Date.now();
        }
    }
}

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

var matrix = [];

var globalId;
var lastUpdate = Date.now();

var width_l = 95;
var height_l = 25;
const framesPerSecond = 60;

var obstacles = []; // [Obstacles()]
var player = new Player(0, 7);

function XYInBounds(x, y) {
    if (y >= 0 && y <= height_l - 1 && x >= 0 && x <= width_l - 1)
        return true;

    return false;
}

function initMatrix() {
    for (let x = 0; x < height_l; x++) {
        matrix[x] = [];

        for (let y = 0; y < width_l; y++) {
            matrix[x][y] = '.';
        }
    }
}

function printMatrix() {
    const t0 = performance.now();

    var c = '';

    for (let x = 0; x < height_l; x++) {
        for (let y = 0; y < width_l; y++) {
            c += matrix[x][y];
        }

        c += '\n';
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = "12px Courier New";

    ctx.fillText(c, 0, 12);

    /*ctx.fillStyle = '#ffffff';

    canvasTxt.default.font = "Courier New";
    canvasTxt.default.fontSize = 10;

    canvasTxt.default.drawText(ctx, c, 0, 0, canvas.width, canvas.height);*/

    //game.innerHTML = '';
    //game.appendChild(c);

        //game.appendChild(canvas);

    const t1 = performance.now();

    console.log(`Time taken: ${t1 - t0}`);
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

    drawPlayer(player.x, player.y);

    player.tick();
}

function drawPlayer(x, y) {
    /*if (XYInBounds(x, y)) {
        matrix[y][x] = '0';
    }

    if (XYInBounds(x + 1, y)) {
        matrix[y][x + 1] = '.';
    } 

    if (XYInBounds(x + 2, y)) {
        matrix[y][x + 2] = 'o';
    }*/

    //console.log(sprites.slime);

    for (let i = sprites.slime.length - 1; i >= 0; i--) {
        const line = sprites.slime[i];

        for (let j = line.length - 1; j >= 0; j--) {
            if (XYInBounds(j + x, i + y)) {
                matrix[i + y][j + x] = sprites.slime[i][j];
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
}

function randomObjectGeneration() {
    const rng = Math.random();

    if (rng < 1/(framesPerSecond * 2)) {
        obstacles.push(new Tree(width_l - 1, height_l - 3));
    }
}

function keydown(e) {
    if (e.keyCode === 38 || e.keyCode === 32) {
        player.jump();
    }
}

document.addEventListener('keydown', keydown);

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
