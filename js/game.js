const game = document.getElementById('game');

var matrix = [];

var trees = []; // [[x, y]]
var player = []; // [x, y]

var width_l = 50;
var height_l = 15;
const framesPerSecond = 10;

function XYInBounds(y, x) {
    if (y >= 0 && y <= height_l - 1 && x >= 0 && x <= width_l - 1)
        return true;

    return false;
}

function initMatrix() {
    for (let x = 0; x < height_l; x++) {
        matrix[x] = [];

        for (let y = 0; y < width_l; y++) {
            //game.append(' . ');
            matrix[x][y] = ' . ';
        }
    }

    //console.log(matrix);
}

function printMatrix() {
    game.innerHTML = '';

    for (let x = 0; x < height_l; x++) {
        for (let y = 0; y < width_l; y++) {
            game.append(matrix[x][y]);
        }

        //matrix[x][y] = document.createElement("br");
        game.append(document.createElement("br"));
    }
}

function updateMatrix() {
    for (let i = trees.length - 1; i >= 0; i--) {
        var tree = trees[i];

        drawTree(tree[0], tree[1]);

        trees[i] = [tree[0] - 1, tree[1]];

        if (!XYInBounds(tree[1], tree[0])) {
            trees.splice(i, 1);
        }
    }

    console.log([...trees]);

    drawPlayer(5, 10);
}

function drawPlayer(x, y) {
    if (XYInBounds(y, x - 1)) {
        matrix[y][x - 1] = '';
    }

    if (XYInBounds(y, x)) {
        matrix[y][x] = ' 0 ';
    }

    if (XYInBounds(y, x + 1)) {
        matrix[y][x + 1] = ' . ';
    } 

    if (XYInBounds(y, x + 2)) {
        matrix[y][x + 2] = ' o ';
    }
}

function drawTree(x, y) {
    if (XYInBounds(y, x)) {
        matrix[y][x] = ' | ';
    }

    if (XYInBounds(y - 1, x)) {
        matrix[y - 1][x] = ' | ';
    } 

    if (XYInBounds(y - 2, x)) {
        matrix[y - 2][x] = ' | ';
    }
}

var globalId;
var lastUpdate = Date.now();

function l() {
    var now = Date.now();

    if (now - lastUpdate > 1000 / framesPerSecond) {
        lastUpdate = now;

        initMatrix();

        updateMatrix();

        printMatrix();
    }

    globalId = requestAnimationFrame(l);
}

initMatrix();

//trees.push([14, 10]);
trees.push([width_l - 1,height_l - 3]);

globalId = requestAnimationFrame(l);

// cancelAnimationFrame(globalId);
