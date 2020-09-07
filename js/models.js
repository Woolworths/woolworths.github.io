import * as sprites from '/js/sprites.js';

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

        this.speed = 150;

        this.playerCanCollide = false;

        this.chaos = 1;
    }

    tick() {
        const diff = (1 / UPDATES_PER_SECOND) * this.speed * (1 + this.chaos);

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
        const e = Math.exp(-3 + 0.0008 * this.score);
        return e/(1 + e);
    }
}

const jumpHeight = 40;
const damping = 1/150;

class Player extends Obstacle {
    constructor(x, y) {
        super(x, y);

        this.colour = '#bfe66a';

        this.speed = 0;

        this.jumpTick = 0;

        this.runTick = 0;
        this.runStep = 0;
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

    jump() {
        if (!this.jumping) {
            console.log('Jumping');

            this.jumpTick = 1;
        }
    }

    tick() {
        if (this.jumping) {
            this.floatY = this.baseY + this.eqn(this.jumpTick);

            this.y = Math.round(this.floatY);

            if (this.y <= this.baseY && this.jumpTick > 1) {
                this.jumpTick = 0;
            } else {
                this.jumpTick++;
            }
        }

        if (this.running) {
            this.runTick += 1;
            
            if (this.runTick > 0.07 * UPDATES_PER_SECOND) {
                this.runStep += 1;
                this.runStep = this.runStep % 3;

                this.runTick = 0;
            }
        }
    }

    eqn(tick) {
        const t = (this.jumpTick - 1) / UPDATES_PER_SECOND;

        return -(1/damping) * Math.pow(t - Math.pow(jumpHeight, 1/2) * Math.pow(damping, 1/2), 2) + jumpHeight;
    }

    get running() {
        return !this.jumping;
    }

    get sprite() {
        if (this.jumping === true) {
            // Calculate up or down
            const a = this.jumpTick / UPDATES_PER_SECOND;
            const half = Math.pow(jumpHeight, 1/2) * Math.pow(damping, 1/2);

            const jumpY = this.eqn(this.jumpTick);

            if (a < half) {
                if (jumpY < jumpHeight * 2/3) {
                    return sprites.upSlime;
                }
            } else {
                if (jumpY < jumpHeight * 9/10) {
                    return sprites.downSlime;
                }
            }

            return sprites.normalSlime;

        }

        if (this.running) {
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

class Ground extends Obstacle {
    constructor(x, y) {
        super(x, y);

        const s = Math.random();

        if (s < 0.55) {
            this.height = 1;
        } else if (s < 0.65) {
            this.height = 2;
        } else if (s < 0.8) {
            this.height = 3;
        } else if (s < 0.85) {
            this.height = 4;
        } else if (s < 0.95) {
            this.height = 5;
        } else {
            this.height = 6;
        }

        this.y -= this.height;
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
    constructor(x, y) {
        super(x, y);

        this.colour = '#ff4500';

        const s = Math.random();

        if (s < 0.1) {
            this.height = 19;
        } else if (s < 0.2) {
            this.height = 15;
        } else if (s < 0.4) {
            this.height = 25;
        } else if (s < 0.55) {
            this.height = 23;
        } else if (s < 0.75){
            this.height = 16;
        } else {
            this.height = 11;
        }

        this.playerCanCollide = true;
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
