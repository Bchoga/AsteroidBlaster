class Player {
  constructor(game) {
    this.game = game;
    this.context = game.context;
    this.width = 80;
    this.height = 80;
    this.life = 3;
    this.speed = this.game.speed;
    this.numberOfBullets = 10;
    this.magazine = [];
    // bottom center position
    this.x = game.canvas.width * 0.5 - 0.5 * this.width;
    this.y = game.canvas.height - this.height;
    // bind this to always refer to Game
    this.draw = this.draw.bind(this);
    this.update = this.update.bind(this);
    this.loadBullets = this.loadBullets.bind(this);
    this.shoot = this.shoot.bind(this);
    // load bullets
    this.loadBullets();
  }

  loadBullets() {
    for (let i = 0; i < this.numberOfBullets; i++) {
      this.magazine.push(new Bullet(this.context));
    }
  }

  shoot() {
    // check in magazine if there is a bulet available
    for (let bullet of this.magazine) {
      if (!bullet.busy) {
        // set start position of the bullet according to the player size and position
        bullet.setStartPosition(this.x + this.width * 0.5, this.y);
        bullet.busy = true;
        break;
      }
    }
  }

  update() {
    // horizontal movement
    if (this.game.pressedKeys.indexOf("ArrowLeft") > -1) this.x -= this.speed;
    if (this.game.pressedKeys.indexOf("ArrowRight") > -1) this.x += this.speed;

    //mantain horizontal bounderies and allow player to go beyond by half width
    if (this.x < -this.width * 0.5) this.x = -this.width * 0.5;
    else if (this.x > this.game.canvas.width - 0.5 * this.width)
      this.x = this.game.canvas.width - 0.5 * this.width;
  }

  draw() {
    this.context.fillRect(this.x, this.y, this.width, this.height);
  }
}

class Bullet {
  constructor(context) {
    this.context = context;
    this.width = 5;
    this.height = 20;
    this.x = 0;
    this.y = 0;
    this.speed = 10;
    this.busy = false;
  }

  setStartPosition(x, y) {
    console.log("setting bullet position");
    this.x = x - this.width * 0.5;
    this.y = y;
  }

  draw() {
    this.context.fillRect(this.x, this.y, this.width, this.height);
  }

  update() {
    if (this.busy) {
    }
    this.y -= this.speed;
    if (this.y < -this.height) {
      this.busy = false;
    }
  }

  reset() {
    this.busy = false;
    this.x = 0;
    this.y = 0;
  }
}

class Shield {
  constructor(context) {
    this.context = context;
  }
}

class Asteroid {
  constructor(game) {
    this.game = game;
    this.context = game.context;
    this.maxSpeed = 10;
    this.maxDamge = 3;
    this.maxLife = 3;
    this.speed = 1;
    this.damage = 1;
    this.life = 1;
    this.width = 60;
    this.height = 60;
    this.x = Math.floor(Math.random() * 600);
    this.y = Math.floor(Math.random() * -100);
  }

  // instead of using bind we can also use arrow functions to automatically bind 'this'
  update = () => {
    this.y += this.speed;
    if (this.y >= this.game.canvas.height) {
      this.reset();
    }
    this.game.player.magazine.forEach((bullet) => {
      if (bullet.busy && this.game.checkCollision(this, bullet)) {
        bullet.reset();

        if (this.life-- <= 1) {
          this.reset();
        }
      }
    });
  };
  reset = () => {
    this.x = Math.floor(Math.random() * 540);
    this.y = Math.floor(Math.random() * -100);
  };
  draw = () => {
    this.context.fillRect(this.x, this.y, this.width, this.height);
  };
}

class AsteroidSpawner {
  constructor() {}
  generateAsteroid() {}
}

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = this.canvas.getContext("2d");
    this.pressedKeys = [];
    this.speed = 5;
    this.asteroids = [];
    this.maxAsteroids = 8;
    this.player = new Player(this);
    // this.asteroid = new Asteroid(this);

    // bind this to always refer to Game
    this.render = this.render.bind(this);
    this.animate = this.animate.bind(this);
  }

  createAsteroids() {
    for (let i = 0; i < this.maxAsteroids; i++) {
      this.asteroids.push(new Asteroid(this));
    }
  }

  throwAsteroids() {
    for (let asteroid of this.asteroids) {
      asteroid.update();
      asteroid.draw();
    }
  }

  createKeyPressEvents() {
    // collect pressed keys that we want
    window.addEventListener("keydown", (event) => {
      const pressedKey = event.key;
      if (this.pressedKeys.indexOf(pressedKey) === -1)
        this.pressedKeys.push(pressedKey);
      if (pressedKey === "1") this.player.shoot();
      // if (pressedKey === '2') this.player.shield();
    });

    // remove keys @keyup
    window.addEventListener("keyup", (event) => {
      const releasedKey = event.key;
      const index = this.pressedKeys.indexOf(releasedKey);
      if (index > -1) this.pressedKeys.splice(index, 1);
    });
  }

  render() {
    // draw player
    this.player.update();
    this.player.draw();

    // draw active bullet
    for (let bullet of this.player.magazine) {
      if (bullet.busy === true) {
        bullet.update();
        bullet.draw();
      }
    }

    // draw asteroids
    this.throwAsteroids();
  }

  animate() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.render();
    window.requestAnimationFrame(this.animate);
  }

  checkCollision(a, b) {
    return (
      a.x <= b.x + b.width &&
      a.x + a.width >= b.x &&
      a.y <= b.y + b.height &&
      a.y + a.height >= b.y
    );
  }
}

// wait for everything to load before doing anything.
window.addEventListener("load", function (e) {
  // create canvas
  const canvas = document.getElementById("canvas");
  canvas.width = 600;
  canvas.height = 800;

  // create game
  const game = new Game(canvas);
  game.createKeyPressEvents();
  game.createAsteroids();
  game.animate();
});
