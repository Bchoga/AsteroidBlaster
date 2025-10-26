class Player {
  constructor(game) {
    this.game = game;
    this.context = game.context;
    this.width = 60;
    this.height = 60;
    this.life = 5;
    this.maxLife = 5;
    this.score = 0;
    this.accuracy = 0;
    this.speed = this.game.speed;
    this.numberOfBullets = 10;
    this.shotsFired = 0;
    this.magazine = [];
    this.image = document.getElementById("ship2");
    // bottom center position (use game.width / game.height which are CSS pixels)
    this.x = game.width * 0.5 - 0.5 * this.width;
    this.y = game.height - this.height - 64;
    // bind this to always refer to Game
    this.draw = this.draw.bind(this);
    this.update = this.update.bind(this);
    this.loadBullets = this.loadBullets.bind(this);
    this.shoot = this.shoot.bind(this);
    this.shootSound = document.getElementById("laserShot");
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
        bullet.setStartPosition(
          this.x + this.width * 0.5,
          this.y - this.height
        );
        bullet.busy = true;
        // play shoot sound
        this.shootSound.currentTime = 0;
        this.shootSound.play();
        break;
      }
    }

    this.shotsFired++;
  }

  update() {
    // horizontal movement
    if (this.game.pressedKeys.indexOf("ArrowLeft") > -1) this.x -= this.speed;
    if (this.game.pressedKeys.indexOf("ArrowRight") > -1) this.x += this.speed;

    // maintain horizontal boundaries and allow player to go beyond by half width
    if (this.x < -this.width * 0.5) this.x = -this.width * 0.5;
    else if (this.x > this.game.width - 0.5 * this.width)
      this.x = this.game.width - 0.5 * this.width;

    // vertical stay within bounds
    if (this.y > this.game.height - this.height)
      this.y = this.y = this.game.height - this.height;

    if (this.y < 0) this.y = 0;

    // check colission with asteroid
    // its easier to put this method in asteroid because we wont need a foreach
    // but it makes more sense to make player check for collision with asteroid here
    // even tho we use foreach
    this.game.asteroids.forEach((asteroid) => {
      if (this.game.checkCollision(this, asteroid)) {
        asteroid.reset();
        this.life--;
        // play explosion sound
        asteroid.playExplosion();
      }
      // life can not be less than 0
      if (this.life < 0) {
      }
    });
  }

  draw() {
    // draw ship image then tint if image is monochrome
    const x = this.x,
      y = this.y,
      w = this.width,
      h = this.height;
    this.context.save();
    this.context.drawImage(this.image, x, y, w, h);

    const shipColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--ship")
        .trim() || "#60d4ff";

    this.context.globalCompositeOperation = "source-atop";
    this.context.fillStyle = shipColor;
    this.context.fillRect(x, y, w, h);
    this.context.globalCompositeOperation = "source-over";

    // small glow for player
    this.context.shadowColor = shipColor;
    this.context.shadowBlur = 18;
    // draw a faint circle under ship to imply thrust
    this.context.fillStyle = shipColor + "33"; // semi-transparent
    this.context.beginPath();
    this.context.ellipse(x + w / 2, y + h + 24, 8, w * 0.4, 0, 0, Math.PI * 2);
    this.context.fill();

    this.context.restore();
  }
}

class Bullet {
  constructor(context) {
    this.context = context;
    this.width = 3;
    this.height = 30;
    this.x = 0;
    this.y = 0;
    this.speed = 10;
    this.busy = false;
  }

  setStartPosition(x, y) {
    this.x = x - this.width * 0.5;
    this.y = y;
  }

  draw() {
    this.context.save();

    // read color from CSS variable (fallback)
    const bulletColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--bullet")
        .trim() || "#bffeff";

    // subtle glow
    this.context.shadowColor = bulletColor;
    this.context.shadowBlur = 12;

    this.context.fillStyle = bulletColor;
    this.context.fillRect(this.x, this.y, this.width, this.height);

    this.context.restore();
  }

  update() {
    if (!this.busy) return;
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
    this.speed = 0.5;
    this.maxSpeed = 5;
    this.damage = 1;
    this.life = 1;
    this.width = 50;
    this.height = 50;

    this.lastChangeTime;

    this.image = document.getElementById("asteroid");
    this.explosionSound = document.getElementById("explosion");
    this.reset();
  }

  // update using arrow functions as before
  update = () => {
    this.y += this.speed;
    if (this.y >= this.game.height) {
      this.reset();
    }
    // check collision with bullet
    this.game.player.magazine.forEach((bullet) => {
      if (bullet.busy && this.game.checkCollision(this, bullet)) {
        bullet.reset();
        if (this.game.player.life > 0) this.game.player.score++;

        if (this.life-- <= 1) {
          this.reset();
          this.playExplosion();
        }
      }
    });

    // increase speed every 10 seconds

    if (this.game.elapsedTime % 10 === 0) {
      if (this.game.elapsedTime != this.lastChangeTime) {
        this.lastChangeTime = this.game.elapsedTime;
        if (this.speed < this.maxSpeed) {
          this.speed += 0.5;
        }
      }
    }
  };
  reset = () => {
    // use game.width to determine horizontal spawn range
    const maxX = Math.max(0, this.game.width - this.width);
    this.x = Math.floor(Math.random() * maxX);
    this.y = Math.floor(Math.random() * -100);
    this.life = 1;
  };
  draw = () => {
    const x = this.x,
      y = this.y,
      w = this.width,
      h = this.height;
    this.context.save();
    this.context.drawImage(this.image, x, y, w, h);

    const shipColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--asteroid")
        .trim() || "#b9a77a";

    this.context.globalCompositeOperation = "source-atop";
    this.context.fillStyle = shipColor;
    this.context.fillRect(x, y, w, h);
    this.context.globalCompositeOperation = "source-over";
  };

  playExplosion = () => {
    this.explosionSound.currentTime = 0;
    this.explosionSound.play();
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
    this.comment = "";
    this.heart = document.getElementById("heart");

    // for tracking touch events
    this.touchId = 0;

    // width/height in CSS pixels (kept up-to-date in resize)
    this.width = canvas.clientWidth || 600;
    this.height = canvas.clientHeight || 800;

    this.startTime = performance.now();
    this.elapsedTime = 0;

    this.player = new Player(this);

    // bind this to always refer to Game
    this.render = this.render.bind(this);
    this.animate = this.animate.bind(this);
    this.resize = this.resize.bind(this);
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

  createTouchEvents() {
    window.addEventListener("touchstart", (e) => {
      [...e.changedTouches].forEach((touch) => {
        this.touchX = touch.pageX;
        this.touchY = touch.pageY;

        // check if the ship has been touched
        if (
          this.touchX > this.player.x &&
          this.touchX < this.player.x + this.player.width &&
          this.touchY > this.player.y &&
          this.touchY < this.player.y + this.player.height
        ) {
          this.touchId = touch.identifier;
        }
      });
    });

    window.addEventListener("touchmove", (e) => {
      [...e.changedTouches].forEach((touch) => {
        if (touch.identifier === this.touchId) {
          this.player.x = touch.pageX;
          this.player.y = touch.pageY;
        }
      });
    });

    window.addEventListener("touchend", (e) => {
      [...e.changedTouches].forEach((touch) => {
        if (this.touchId === touch.identifier) {
          this.player.shoot();
          this.touchId = 1;
        }
      });
    });
  }

  writeScoreComment() {
    const s = this.player.score;

    // tiered score message
    let scoreMsg;
    if (s === 0) scoreMsg = "You didn't hit anything.\n";
    else if (s < 20) scoreMsg = "Few hits.\n";
    else if (s < 50) scoreMsg = "A decent start.\n";
    else if (s < 100) scoreMsg = "Good run.\n";
    else scoreMsg = "Fantastic score!\n";

    this.context.fillText(
      scoreMsg,
      this.canvas.clientWidth / 2,
      this.canvas.clientHeight / 2 + 48
    );
  }
  writeAccuracyComment() {
    const a = Math.round(this.player.accuracy);

    // accuracy message
    let accMsg;
    if (a < 40) accMsg = "Accuracy is low.";
    else if (a < 60) accMsg = "Accuracy could improve.";
    else if (a < 80) accMsg = "Nice accuracy.";
    else accMsg = "Pinpoint accuracy!";

    this.context.fillText(
      accMsg,
      this.canvas.clientWidth / 2,
      this.canvas.clientHeight / 2 + 66
    );
  }
  writeTimeComment() {
    const t = this.elapsedTime;

    // survival/time message
    let timeMsg;
    if (t < 30) timeMsg = "Very short run.";
    else if (t < 120) timeMsg = "Good survival time.";
    else timeMsg = "Long run";

    this.context.fillText(
      timeMsg,
      this.canvas.clientWidth / 2,
      this.canvas.clientHeight / 2 + 84
    );
  }
  writeEfficiencyComment() {
    const s = this.player.score;
    const shots = this.player.shotsFired || 0;
    const hitRate = shots ? s / shots : 0;

    // small note about efficiency
    let efficiencyMsg = "";
    if (shots > 0) {
      if (hitRate < 0.2)
        efficiencyMsg = " Try to conserve ammo and aim better.";
      else if (hitRate > 0.6) efficiencyMsg = " Great shot economy!";
      this.context.fillText(
        efficiencyMsg,
        this.canvas.clientWidth / 2,
        this.canvas.clientHeight / 2 + 102
      );
    }
  }

  writeStatus() {
    this.context.save();

    // print score
    this.context.font = "bold 18px Impact";
    this.context.fillStyle = "#7ef9ff";
    this.context.textAlign = "left";
    this.context.fillText("Score: " + this.player.score, 20, 25);

    // print accuracy
    this.context.fillText("Accuracy: " + this.player.accuracy + "%", 20, 50);

    //print elapsed time
    this.context.fillText("Time: " + this.elapsedTime + " s", 20, 75);

    // display available life
    let x = 20;
    let y = 85;
    for (let l = 0; l < this.player.life; l++) {
      this.context.drawImage(this.heart, x, y, 16, 16);
      x += 18;
    }

    if (this.player.life < 1) {
      // print game over
      this.context.font = "32px Impact";
      this.context.fillStyle = "#ffb86b";
      this.context.textAlign = "center";
      this.context.fillText(
        "Game Over!",
        this.canvas.clientWidth / 2,
        this.canvas.clientHeight / 2
      );

      // print comment
      this.context.font = "bold 16px Impact";
      this.context.fillStyle = "white";
      this.writeScoreComment();
      this.writeAccuracyComment();
      this.writeTimeComment();
      this.writeEfficiencyComment();
    }
    this.context.restore();
  }

  render() {
    // update elapsed time
    if (this.player.life > 0)
      this.elapsedTime = Math.floor(
        (performance.now() - this.startTime) / 1000
      );

    // calculate player accuracy it works best if we do it here!
    if (this.player.shotsFired > 0)
      if (this.player.life > 0)
        this.player.accuracy = Math.floor(
          (this.player.score / this.player.shotsFired) * 100
        );

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

    // write score and other game statistics
    this.writeStatus();
  }

  animate() {
    this.context.clearRect(0, 0, this.width, this.height);
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

  resize() {
    // use full window size (no 600x800 limit)
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const cssWidth = Math.max(1, window.innerWidth);
    const cssHeight = Math.max(1, window.innerHeight);

    // set CSS size (what the user sees)
    this.canvas.style.width = cssWidth + "px";
    this.canvas.style.height = cssHeight + "px";

    // set internal pixel buffer size for crisp rendering on high-DPR screens
    this.canvas.width = Math.floor(cssWidth * dpr);
    this.canvas.height = Math.floor(cssHeight * dpr);

    // draw using CSS pixel coordinates scaled by DPR
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);

    // update game logical size in CSS pixels
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;

    // reposition player vertically and clamp horizontally to new size
    if (this.player) {
      this.player.y = this.height - this.player.height;
      this.player.x = Math.min(
        Math.max(this.player.x, -this.player.width * 0.5),
        this.width - 0.5 * this.player.width
      );
    }
    // optionally reposition asteroids to stay within new width
    this.asteroids.forEach((a) => {
      a.x = Math.min(a.x, Math.max(0, this.width - a.width));
    });
  }
}

// wait for everything to load before doing anything.
document.addEventListener("DOMContentLoaded", function (e) {
  // create canvas
  const canvas = document.getElementById("canvas");

  // create game
  const game = new Game(canvas);

  // make canvas responsive
  game.resize();
  window.addEventListener("resize", game.resize);

  game.createKeyPressEvents();
  game.createTouchEvents();
  game.createAsteroids();
  game.animate();

  const playSound = () => {};
});
