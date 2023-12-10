class Player {
  constructor(game) {
    this.game = game;
    this.width = 140;
    this.height = 120;
    this.x = this.game.width * 0.5 - this.width * 0.5; // game width half - half player
    this.y = this.game.height - this.height;
    this.speed = 2.5;
    this.maxLives = 10;
    this.lives = 3;
    this.image = new Image();
    this.image.crossOrigin = true;
    this.image.width = this.width;
    this.image.height = this.height;
    this.image.src = "./assets/player.png";
    this.frameX = 0;
    this.jets_image = new Image();
    this.jets_image.src = "./assets/player_jets.png";
    this.jets_image.crossOrigin = true;
    this.jetsFrame = 1;
  }
  draw(ctx) {
    if (this.game.keys.indexOf("1") > -1) {
      this.frameX = 1;
    } else {
      this.frameX = 0;
    }
    // add sx, sy, sw, sh to crop
    ctx.drawImage(
      this.jets_image,
      this.jetsFrame * this.width,
      0,
      this.width,
      this.height,
      this.x,
      this.y,
      this.width,
      this.height
    );
    ctx.drawImage(
      this.image,
      this.frameX * this.width,
      0,
      this.width,
      this.height,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
  update() {
    // Horizontal Movement
    if (this.game.keys.indexOf("ArrowLeft") > -1) {
      this.x -= this.speed;
      this.jetsFrame = 0;
    } else if (this.game.keys.indexOf("ArrowRight") > -1) {
      this.x += this.speed;
      this.jetsFrame = 2;
    } else {
      this.jetsFrame = 1;
    }
    // left boundary
    if (this.x < -this.width * 0.5) this.x = -this.width * 0.5;
    // right bounds
    else if (this.x > this.game.width - this.width * 0.5)
      this.x = this.game.width - this.width * 0.5;
  }
  shoot() {
    const proj = this.game.getProjectile();
    if (proj) {
      proj.start(this.x + this.width * 0.5, this.y);
      console.log(proj);
    }
  }
  reset() {
    this.x = this.game.width * 0.5 - this.width * 0.5; // game width half - half player
    this.y = this.game.height - this.height;
    this.lives = 3;
  }
}
class Projectile {
  constructor() {
    this.width = 8;
    this.height = 20;
    this.x = 0;
    this.y = 0;
    this.speed = 5;
    this.free = true; // if true - free for use - else it is in use - object pool design pattern
  }
  draw(ctx) {
    if (!this.free) {
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }
  update() {
    if (!this.free) {
      this.y -= this.speed;
      if (this.y < -this.height) this.reset();
    }
  }
  start(x, y) {
    this.x = x - this.width * 0.5;
    this.y = y - this.height * 0.5;
    this.free = false;
  }
  reset() {
    this.free = true;
  }
}
class Enemy {
  constructor(game, posX, posY) {
    this.game = game;
    this.width = this.game.enemySize;
    this.height = this.game.enemySize;
    this.x = 0;
    this.y = 0;
    this.positionX = posX;
    this.positionY = posY;
    this.markedForDeletion = false;
  }

  draw(ctx) {
    ctx.strokeRect(this.x, this.y, this.width, this.height);
  }
  update(x, y) {
    this.x = x + this.positionX;
    this.y = y + this.positionY;

    this.game.projectiles.forEach((pro) => {
      if (!pro.free && this.game.checkCollision(this, pro) && this.lives > 0) {
        this.hit(1);
        pro.reset();
        if (!this.game.gameOver) this.game.score++;
      }
    });
    if (this.lives < 1) {
      if (this.game.spriteUpdate) this.frameX++;
      if (this.frameX > this.maxFrame) {
        this.markedForDeletion = true;
        if (!this.game.gameOver) this.game.score += this.maxLives;
      }
    }
    if (this.game.checkCollision(this, this.game.player) && this.lives > 0) {
      this.lives = 0;
      this.game.player.lives--;
      this.game.player.lives > 0 && this.game.player.lives--;
    }

    if (this.y + this.height > this.game.height) {
      this.game.gameOver = true;
    }
  }

  hit(dmg) {
    this.lives -= dmg;
  }
}
class Beetlemorph extends Enemy {
  constructor(game, posX, posY) {
    super(game, posX, posY);
    this.image = new Image();
    this.image.crossOrigin = true;
    this.image.width = this.width;
    this.image.height = this.height;
    this.image.src = "./assets/beetlemorph.png";
    this.frameX = 0;
    this.maxFrame = 2;
    this.frameY = Math.floor(Math.random() * 4);
    this.lives = 1;
    this.maxLives = this.lives;
  }
  draw(ctx) {
    ctx.drawImage(
      this.image,
      this.frameX * this.width,
      this.frameY * this.height,
      this.width,
      this.height,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
}
class Wave {
  constructor(game) {
    this.game = game;
    this.width = this.game.columns * this.game.enemySize;
    this.height = this.game.rows * this.game.enemySize;
    this.x = this.game.width * 0.5 - this.width * 0.5;
    this.y = -this.height;
    this.speedX = Math.random() < 0.5 ? -0.5 : 0.5;
    this.speedY = 0;
    this.enemies = [];
    this.nextWaveTriggered = false;
    this.create();
  }

  render(ctx) {
    if (this.y < 0) this.y += 5;
    this.speedY = 0;
    // ctx.strokeRect(this.x, this.y, this.width, this.height);
    this.x += this.speedX;
    if (this.x < 0 || this.x > this.game.width - this.width) {
      this.speedX *= -1;
      this.speedY = this.game.enemySize;
    }
    this.x += this.speedX;
    this.y += this.speedY;
    this.enemies.forEach((en) => {
      en.update(this.x, this.y);
      en.draw(ctx);
    });

    if (this.y > this.game.height) {
      this.y = 0;
      this.x = 0;
    }
    this.enemies = this.enemies.filter((obj) => !obj.markedForDeletion);
  }
  create() {
    for (let y = 0; y < this.game.rows; y++) {
      for (let x = 0; x < this.game.columns; x++) {
        let eX = x * this.game.enemySize;
        let eY = y * this.game.enemySize;
        this.enemies.push(new Beetlemorph(this.game, eX, eY));
      }
    }
  }
}
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.score = 0;
    this.gameOver = false;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.player = new Player(this);
    this.keys = [];
    this.projectiles = [];
    this.numOfProjectiles = 10;
    this.createProjectiles();
    this.fired = false;
    this.columns = 1;
    this.rows = 1;
    this.enemySize = 80;
    this.waves = [];
    this.waves.push(new Wave(this));
    this.waveCount = 1;
    this.spriteUpdate = false;
    this.spriteTimer = 0;
    this.spriteInterval = 50;
    this.handleKeys();
  }

  reset() {
    this.player.reset();
    this.keys = [];
    this.columns = 2;
    this.rows = 2;
    this.waves = [new Wave(this)];
    this.waveCount = 1;
    this.gameOver = false;
    this.score = 0;
  }
  render(ctx, deltaTime) {
    if (this.spriteTimer > this.spriteInterval) {
      this.spriteUpdate = true;
      this.spriteTimer = 0;
    } else {
      this.spriteUpdate = false;
      this.spriteTimer += deltaTime;
    }
    this.drawStatus(ctx);
    this.player.draw(ctx);
    this.player.update();
    this.projectiles.forEach((pro) => {
      pro.update();
      pro.draw(ctx);
    });
    this.waves.forEach((wave) => {
      wave.render(ctx);
      if (
        wave.enemies.length < 1 &&
        !wave.nextWaveTriggered &&
        !this.gameOver
      ) {
        this.nextWave();
        this.waveCount++;
        wave.nextWaveTriggered = true;
        if (this.player.lives < this.player.maxLives) this.player.lives++;
      }
    });
  }
  handleKeys() {
    window.addEventListener("keydown", (e) => {
      if (this.keys.indexOf(e.key) === -1) {
        this.keys.push(e.key);
        console.log(this.keys);
      }
      if (e.key === "1" && !this.fired) {
        this.player.shoot();
        this.fired = true;
      }
      if (e.key.toLocaleLowerCase() === "r") {
        if (this.gameOver) this.reset();
      }
    });
    window.addEventListener("keyup", (e) => {
      this.fired = false;
      const idx = this.keys.indexOf(e.key);
      if (idx > -1) this.keys.splice(idx, 1);
      console.log(this.keys);
    });
  }
  createProjectiles() {
    for (let i = 0; i < this.numOfProjectiles; i++) {
      this.projectiles.push(new Projectile());
    }
  }
  getProjectile() {
    for (let i = 0; i < this.projectiles.length; i++) {
      if (this.projectiles[i].free) return this.projectiles[i];
    }
  }

  checkCollision(a, b) {
    // Check if collide on horizontal (first two)
    // Check if collision on vertical axis (second two)
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }
  drawStatus(ctx) {
    ctx.save(); // save canvas settings like font size and reset back after game over to keep the score font styles
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowColor = "teal";
    ctx.fillText(`Score: ${this.score}`, 20, 40);
    ctx.fillText(`Wave: ${this.waveCount}`, 20, 80);

    for (let i = 0; i < this.player.maxLives; i++) {
      ctx.strokeStyle = "white";
      ctx.shadowColor = "gray";
      ctx.strokeRect(20 + i * 20, 100, 10, 15);
    }
    for (let i = 0; i < this.player.lives; i++) {
      ctx.fillStyle = "orange";
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillRect(20 + i * 20, 100, 10, 15);
    }

    if (this.gameOver) {
      ctx.textAlign = "center";
      ctx.font = "100px Impact";
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 4;
      ctx.shadowColor = "red";
      ctx.fillText("GAME OVER!", this.width * 0.5, this.height * 0.5);
      ctx.font = "20px Impact";
      ctx.fillText(
        `Press R to restart.`,
        this.width * 0.5,
        this.height * 0.5 + 30
      );
    }
    ctx.restore();
  }

  nextWave() {
    if (
      Math.random() < 0.5 &&
      this.columns * this.enemySize < this.width * 0.8
    ) {
      this.columns++;
    } else if (this.rows * this.enemySize < this.height * 0.6) {
      this.rows++;
    }

    this.waves.push(new Wave(this));
  }
}

function main() {
  window.onload = () => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 600;
    canvas.height = 600;
    ctx.fillStyle = "white";
    ctx.strokeStyle = "rgb(0,175,250)";
    ctx.lineWidth = 5;
    ctx.font = "30px Impact";
    const game = new Game(canvas);
    let lastTime = 0;
    function animate(timestamp) {
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      game.render(ctx, deltaTime);

      requestAnimationFrame(animate);
    }

    animate(0);
  };
}
main();
