class V2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(that) {
    return new V2(this.x + that.x, this.y + that.y);
  }
  scale(s) {
    return new V2(this.x * s, this.y * s);
  }

  sub(that) {
    return new V2(this.x - that.x, this.y - that.y);
  }
  len() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize() {
    const n = this.len();
    return new V2(this.x / n, this.y / n);
  }

  distance(that) {
    return this.sub(that).len();
  }

}

function polarVec(mag, dir) {
  return new V2(Math.cos(dir) * mag, Math.sin(dir) * mag);
}

const LOCAL_STORAGE_TUTORIAL = "tutorial";
const PALYER_RADIUS = 50;
const PLAY_SPEED = 1000;
const BULLET_SPEED = 2000;
const BULLET_RADIUS = 20;
const BULLET_LIFETIME = 5.0;
const TUTORIAL_POPUP_SPEED = 0.5;
const PLAYER_COLOR = "#f43841";
const ENEMY_SPEED = PLAY_SPEED / 3.0;
const ENEMY_COLOR = "#9e95c7";
const ENEMY_RADIUS = PALYER_RADIUS;
const ENEMY_SPAWN_COOLDOWN = 1.0;
const ENEMY_SPAWN_DISTANCE = 1000.0;
const PARTICLE_RADIUS = 10.0;
const PARTICLE_COLOR = ENEMY_COLOR;
const PARTICLE_COUNT = 20;
const PARTICLE_MAG = BULLET_SPEED;
const PARTICLE_LIFETIME = 1.0;


const directionMap = {
  'w': new V2(0, -1.0),
  's': new V2(0, 1.0),
  'a': new V2(-1.0, 0),
  'd': new V2(1.0, 0),
};


class TutorialPopup {
  constructor(text) {
    this.alpha = 0.0;
    this.dalpha = 0.0;
    this.text = text;
    this.onFadedOut = undefined;
    this.onFadedIn = undefined;
  }

  update(dt) {
    this.alpha += this.dalpha * dt;
    if (this.dalpha < 0.0 && this.alpha <= 0.0) {
      this.dalpha = 0.0;
      this.alpha = 0.0;

      if (this.onFadedOut !== undefined) {
        this.onFadedOut();
      }

    } else if (this.dalpha <= 0.0 && this.alpha >= 1.0) {
      this.dalpha = 0.0;
      this.alpha = 1.0;

      if (this.onFadedIn !== undefined) {
        this.onFadedIn();
      }
    }

  }
  render(ctx) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    // ctx.fillStyle = "#4feb34";
    ctx.fillStyle = `rgba(255,255,255,${this.alpha})`;
    ctx.font = "40px ComicNeue-Regular";
    ctx.textAlign = "center";
    ctx.fillText(this.text, width / 2, height / 2);
  }
  fadeIn() {
    this.dalpha = TUTORIAL_POPUP_SPEED;
  }
  fadeOut() {
    this.dalpha = -TUTORIAL_POPUP_SPEED;
  }
}

const TutorialState = Object.freeze({
  "LearntMovement": 0,
  "LearntShooting": 1,
  "Finished": 2,
});

const TutorialMessages = [
  "Movement: [w,a, s, d]",
  "Shoot: [Left Mouse Click]",
  ""
];
class Tutorial {
  constructor() {
    this.state = 0;
    this.popup = new TutorialPopup(TutorialMessages[this.state]);
    this.popup.fadeIn();
    this.popup.onFadedOut = () => {
      this.popup.text = TutorialMessages[this.state];
      this.popup.fadeIn();
    };
  }

  update(dt) {
    this.popup.update(dt);
  }
  render(ctx) {
    this.popup.render(ctx);
  }

  playerMoved() {
    if (this.state == TutorialState.LearntMovement) {
      this.popup.fadeOut();
      this.state += 1;
      window.localStorage.setItem(LOCAL_STORAGE_TUTORIAL, this.state);
    }
  }
  playerShot() {
    if (this.state == TutorialState.LearntShooting) {
      this.popup.fadeOut();
      this.state += 1;
      window.localStorage.setItem(LOCAL_STORAGE_TUTORIAL, this.state);
    }
  }

}
function random_rgba() {
    var o = Math.round, r = Math.random, s = 255;
    return 'rgba(' + o(r()*s) + ',' + o(r()*s) + ',' + o(r()*s) + ',' + r().toFixed(1) + ')';
}

class Particle {
  constructor(pos, vel, lifetime, radius) {
    this.pos = pos;
    this.vel = vel;
    this.lifetime = lifetime;
    this.radius = radius;
  }
  update(dt) {
    this.pos = this.pos.add(this.vel.scale(dt));
    this.lifetime -= dt;
  }
  render(ctx) {
    const a = this.lifetime / PARTICLE_LIFETIME;
    fillCircle(ctx, this.pos, this.radius, random_rgba());
  }
}

function particleBurst(particles, center) {
  const N = Math.random() * PARTICLE_COUNT;
  for (let i = 0; i < N; ++i) {
    particles.add(new Particle(
      center,
      polarVec(Math.random() * PARTICLE_MAG, Math.random() * 2 * Math.PI),
      Math.random() * PARTICLE_LIFETIME,
      Math.random() * PARTICLE_RADIUS + 4));
  }
}

class Enemy {
  constructor(pos) {
    this.pos = pos;
    this.dead = false;
  }
  update(dt, followPos) {
    let vel = followPos
      .sub(this.pos)
      .normalize()
      .scale(ENEMY_SPEED * dt);
    this.pos = this.pos.add(vel);
  }
  render(ctx) {
    fillCircle(ctx, this.pos, ENEMY_RADIUS, ENEMY_COLOR);
  }
}

class Bullet {
  constructor(pos, vel) {
    this.pos = pos;
    this.vel = vel;
    this.lifetime = BULLET_LIFETIME;
  }

  update(dt) {
    this.pos = this.pos.add(this.vel.scale(dt));
    this.lifetime -= dt;
  }
  render(ctx) {
    fillCircle(ctx, this.pos, BULLET_RADIUS, PLAYER_COLOR);
  }
}

function renderEntities(ctx, entities) {
  for (let entity of entities) {
    entity.render(ctx);
  }
}

class Game {
  constructor() {
    this.playerPos = new V2(PALYER_RADIUS + 10, PALYER_RADIUS + 10);
    this.mousePos = new V2(0, 0)
    this.pressedKeys = new Set();
    this.tutorial = new Tutorial();
    this.playerLearntMovement = false;
    this.bullets = new Set();
    this.enemies = new Set();
    this.particles = new Set();
    this.enemySpawnRate = ENEMY_SPAWN_COOLDOWN;
    this.enemySpawnCooldown = ENEMY_SPAWN_COOLDOWN;

    // this.enemies.add(new Enemy(new V2(300, 300)));
  }

  update(dt) {
    let vel = new V2(0, 0);
    let moved = false;
    for (let key of this.pressedKeys) {
      if (key in directionMap) {
        vel = vel.add(directionMap[key].scale(PLAY_SPEED));
        moved = true;
      }
    }
    if (moved) {
      this.tutorial.playerMoved();
    }


    this.playerPos = this.playerPos.add(vel.scale(dt));

    this.tutorial.update(dt);

    for (let enemy of this.enemies) {
      for (let bullet of this.bullets) {
        if (!enemy.dead && enemy.pos.distance(bullet.pos) <= BULLET_RADIUS + ENEMY_RADIUS) {
          enemy.dead = true;
          bullet.lifetime = 0.0;
          console.log(this.particles);
          particleBurst(this.particles, enemy.pos);
        }
      }
    }
    for (let bullet of this.bullets) {
      bullet.update(dt);
    }
    this.bullets = new Set([...this.bullets].filter(bullet => bullet.lifetime > 0.0));

    for (let particle of this.particles) {
      particle.update(dt);
    }
    this.particles = new Set([...this.particles].filter(particle => particle.lifetime > 0.0));

    for (let enemy of this.enemies) {
      enemy.update(dt, this.playerPos);
    }
    this.enemies = new Set([...this.enemies].filter(enemy => !enemy.dead));

    if (this.tutorial.state == TutorialState.Finished) {
      this.enemySpawnCooldown -= dt;
     if (this.enemySpawnCooldown <= 0.0) {
       this.spawnEnemy();
       this.enemySpawnCooldown = this.enemySpawnRate;
      this.enemySpawnRate = Math.max(0.0, this.enemySpawnRate - 0.1);
     }
    }



  }
  render(ctx) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    ctx.clearRect(0, 0, width, height);
    fillCircle(ctx, this.playerPos, PALYER_RADIUS, PLAYER_COLOR);
  
    renderEntities(ctx, this.bullets);
    renderEntities(ctx, this.particles);
    renderEntities(ctx, this.enemies);

    this.tutorial.render(ctx);


  }

  spawnEnemy() {
    let dir = Math.random() * 2 * Math.PI;
    this.enemies.add(new Enemy(this.playerPos.add(polarVec(ENEMY_SPAWN_DISTANCE, dir))));
  }

  keyDown(e) {
    this.pressedKeys.add((e.key).toLowerCase());
  }
  keyUp(e) {
    this.pressedKeys.delete((e.key).toLowerCase());
  }
  mouseMove(e) {
  }

  mouseDown(e) {
    this.tutorial.playerShot();
    const mousePos = new V2(e.offsetX, e.offsetY); // also clientX and clientY
    const bulletVel = mousePos
      .sub(this.playerPos)
      .normalize()
      .scale(BULLET_SPEED);

    // new Bullet(this.playerPos, bulletVel);
    this.bullets.add(new Bullet(this.playerPos, bulletVel));
  }
}

function fillCircle(ctx, center, radius, color = PLAYER_COLOR) {
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI, false);
  ctx.fillStyle = color;
  ctx.fill();
}


(() => {
  // const pft = document.getElementById("pft");
  // var pft = new Audio('pft.wav');
  const c = document.getElementById("game");
  const ctx = c.getContext("2d");
  const game = new Game();

  let start;
  let moved_for_the_first_time = false;
  function step(timestamp) {
    // console.log(timestamp);
    // console.log(start)
    if (start === undefined) { start = timestamp; }
    const dt = (timestamp - start) / 1000.0; // seconds or multiply by 0.001
    start = timestamp;

    const width = window.innerWidth;
    const height = window.innerHeight;
    c.width = width;
    c.height = height;

    game.update(dt);
    game.render(ctx);


    // console.log(elapsed);

    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);

  document.addEventListener("keydown", (e) => {
    game.keyDown(e);
  })

  document.addEventListener("keyup", (e) => {
    game.keyUp(e);
  })

  document.addEventListener('mousemove', (e) => {
    game.mouseMove(e);
  })
  document.addEventListener('mousedown', (e) => {
    game.mouseDown(e);
  })

})();
