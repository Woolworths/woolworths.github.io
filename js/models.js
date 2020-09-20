import * as sprites from '/js/sprites.js';
import { weightedRandomDist } from '/js/helpers.js';

// Ensure this is sync'd with game.js
const UPDATES_PER_SECOND = 90;

class Obstacle {
    constructor(x, y) {
        this.x = x;
        this.floatX = x;
        this.y = y;
        this.floatY = y;

        this.baseX = x;
        this.baseY = y;

        this.speed = 130;

        this.playerCanCollide = false;

        this.chaos = 1;
    }

    get chaosFactor() {
        return 1 + 2.5 * this.chaos;
    }

    tick() {
        const diff = (1 / UPDATES_PER_SECOND) * this.speed * this.chaosFactor;

        this.floatX -= diff;

        this.x = Math.round(this.floatX);
    }

    setChaos(chaos) {
        this.chaos = chaos;
    }
}

class FPSCounter {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.frameCounter = 0;

        this.prevFps = 0;

        this.prevTime = undefined;
    }

    tick() {
        const now = Date.now();

        if (this.prevTime) {
            const diff = (now - this.prevTime) / 1000;

            if (diff < 1) {
                this.frameCounter++;
            } else {
                this.prevFps = this.frameCounter;

                this.frameCounter = 0;
                this.prevTime = Date.now();
            }
        } else {
            this.prevTime = Date.now();
        }
    }

    get fps() {
        return this.prevFps;
    }
}

class ScoreCounter {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.score = 0;
    }

    tick() {
        this.score++;
    }

    reset() {
        this.score = 0;
    }

    get chaos() {
        if (this.score === 0)
            return 0;

        // https://www.desmos.com/calculator/jrgm7z6i0q
        const e = Math.exp(-1.5 + 1/1200 * this.score);
        return e/(1 + e);
    }
}

const MAX_JUMP_HEIGHT = 42;
const MIN_JUMP_HEIGHT = MAX_JUMP_HEIGHT * (3 / 4);
const DAMPING = 1/165;

class Player extends Obstacle {
    constructor(x, y) {
        super(x, y);

        this.colour = '#bfe66a';

        this.speed = 0;

        this.jumpTick = 0;

        this.runTick = 0;
        this.runStep = 0;

        this.toCancelJump = false;
    }

    get height() {
        return this.sprite.length;
    }

    get width() {
        return this.sprite[0].length;
    }

    get jumping() {
        return this.jumpTick > 0;
    }

    get firstHalfOfJump() {
        const a = this.jumpTick / UPDATES_PER_SECOND;
        var half = this.eqnMidpoint();

        if (a < half) {
            return true;
        }

        return false;
    }

    get canCancelJump() {
        if (this.jumping && this.firstHalfOfJump) {
            const jumpY = this.eqn(this.jumpTick);

            if (jumpY >= MIN_JUMP_HEIGHT) {
                return true;
            }
        }

        return false;
    }

    jump() {
        if (!this.jumping) {
            console.log('Jumping');

            this.jumpHeight = MAX_JUMP_HEIGHT;
            this.jumpTick = 1;
        }
    }

    cancelJump() {
        if (this.firstHalfOfJump) {
            if (this.canCancelJump) {
                console.log('Cancelling jump');

                const newJumpHeight = this.floatY - this.baseY;
                this.jumpHeight = newJumpHeight;

                const half = this.eqnMidpoint();

                this.jumpTick = Math.round(half * UPDATES_PER_SECOND);
            } else {
                this.toCancelJump = true;
            }
        }
    }

    tick() {
        if (this.toCancelJump && this.canCancelJump) {
            this.cancelJump();

            this.toCancelJump = false;
        }

        if (this.jumping) {
            const jumpY = this.eqn(this.jumpTick);

            this.floatY = this.baseY + jumpY;

            this.y = Math.floor(this.floatY);

            if (this.y <= this.baseY && this.jumpTick > 1) {
                this.jumpTick = 0;

                this.y = this.baseY;
            } else {
                this.jumpTick++;
            }
        } else {
            this.jumpTick = 0;

            this.y = this.baseY;
        }

        if (this.running) {
            this.runTick += 1;
            
            if (this.runTick > 0.06 * UPDATES_PER_SECOND) { // 0.07
                this.runStep += 1;
                this.runStep = this.runStep % 4;

                this.runTick = 0;
            }
        } else {
            this.runTick = 0;
        }
    }

    get jumpChaos() {
        return 1 + 4 * this.chaos;
    }

    eqn(tick) {
        const t = (this.jumpTick - 1) / UPDATES_PER_SECOND;

        return -((1/DAMPING) * this.jumpChaos) * Math.pow(t - Math.pow(this.jumpHeight, 1/2) * Math.pow(DAMPING * (1/this.jumpChaos), 1/2), 2) + this.jumpHeight;
    }

    eqnMidpoint() {
        return Math.pow(this.jumpHeight, 1/2) * Math.pow(DAMPING * (1/this.jumpChaos), 1/2);
    }

    get running() {
        return !this.jumping;
    }

    get sprite() {
        if (this.jumping === true) {
            const jumpY = this.eqn(this.jumpTick);

            if (this.firstHalfOfJump) {
                if (jumpY < this.jumpHeight * 2/3) {
                    return sprites.upSlime;
                }
            } else {
                if (jumpY < this.jumpHeight * 9/10) {
                    return sprites.downSlime;
                }
            }

            return sprites.normalSlime;
        }

        if (this.running) {
            if (this.runStep === 0) {
                return sprites.runningSlime1;
            } else if (this.runStep === 1) {
                return sprites.runningSlime;
            } else if (this.runStep === 2) {
                return sprites.runningSlime3;
            } else {
                return sprites.runningSlime;
            }
        }

        return sprites.normalSlime;
    }
}

class Ground extends Obstacle {
    constructor(x, y) {
        super(x, y);

        this.height = weightedRandomDist(1, 5, 1, 2);

        this.y -= this.height;

        this.colour = '#ffdead';
    }

    get sprite() {
        const sprite = [];

        for (let i = 0; i < this.height; i++) {
            sprite[i] = [];
            sprite[i][0] = '█';
        }

        return sprite;
    }
}

class Tree extends Obstacle {
    constructor(x, y, chaos) {
        super(x, y);

        this.chaos = chaos;

        this.colour = '#ff4500';

        this.height = weightedRandomDist(15, 30, 20 * this.heightChaos, 10);

        this.playerCanCollide = true;
    }

    get heightChaos() {
        return 0.6 + 0.4 * this.chaos;
    }

    get sprite() {
        const sprite = [];

        sprite[0] = [];
        sprite[0][1] = '_';
        sprite[0][2] = '_';
        sprite[0][3] = '_';

        for (let i = 1; i < this.height; i++) {
            sprite[i] = [];
            sprite[i][1] = '█';
        }

        return sprite;
    }
}

class Platform extends Obstacle {
    constructor(x, y) {
        super(x, y);

        this.playerCanCollide = true;

        const s1 = Math.random();
        this.height = Math.round(s1 * 30);

        const s2 = Math.random();
        this.width = Math.round(s2 * 300);
    }

    get sprite() {
        const sprite = [];

        for (let i = 0; i < 40; i++) {
            sprite[i] = [];
            sprite[i][0] = '|';
        }

        for (let i = 0; i < 10; i++) {
            sprite[0][i] = '=';
        }

        return sprite;
    }
}

export { Player, Tree, Ground, Platform, ScoreCounter, FPSCounter };
