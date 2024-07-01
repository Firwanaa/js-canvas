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
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize() {
    const n = this.length();
    return new V2(this.x / n, this.y / n);
  }

}

const radius = 50;
const speed = 1000;
const BULLET_SPEED = 2000;
const BULLET_RADIUS = 20;

const directionMap = {
  'w': new V2(0, -1.0),
  's': new V2(0, 1.0),
  'a': new V2(-1.0, 0),
  'd': new V2(1.0, 0),
};

class TutorialPopup {
  constructor(text) {
    this.alpha = 0.0;
    this.dalpha = 0.00;
    this.text = text;
  }

  update(dt) {
    this.alpha += this.dalpha * dt;
    if (this.dalpha < 0.0 && this.alpha <= 0.0) {
      this.dalpha = 0.0;
      this.alpha = 0.0;
    } else if (this.dalpha <= 0.0 && this.alpha >= 1.0) {
      this.dalpha = 0.0;
      this.alpha = 1.0;
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
    this.dalpha = 1.0;
  }
  fadeOut() {
    this.dalpha = -1.0;
  }
}

class Bullet {
  constructor(pos, vel) {
    this.pos = pos;
    this.vel = vel;
    console.log(this);
  }

  update(dt) {
    this.pos = this.pos.add(this.vel.scale(dt));
  }
  render(ctx) {
    fillCircle(ctx, this.pos, BULLET_RADIUS, "green");
  }
}

class Game {
  constructor() {
    this.playerPos = new V2(radius + 10, radius + 10);
    this.mousePos = new V2(0, 0)
    this.pressedKeys = new Set();
    this.popup = new TutorialPopup("Movement: [w,a, s, d]");
    this.popup.fadeIn();
    this.playerLearntMovement = false;
    this.bullets = new Set();
  }

  update(dt) {
    let vel = new V2(0, 0);
    for (let key of this.pressedKeys) {
      if (key in directionMap) {
        vel = vel.add(directionMap[key].scale(speed));
      }
    }

    if (!this.playerLearntMovement && vel.length() > 0.0) {
      this.playerLearntMovement = true;
      this.popup.fadeOut();
    }

    this.playerPos = this.playerPos.add(vel.scale(dt));

    this.popup.update(dt);

    for (let bullet of this.bullets) {
      bullet.update(dt);
    }
    // this.bullets = new Set([...this.bullets].filter(bullet => bullet.pos.length() < radius * 2));

  }
  render(ctx) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    ctx.clearRect(0, 0, width, height);
    fillCircle(ctx, this.playerPos, radius, "red");

    for (let bullet of this.bullets) {
      bullet.render(ctx);
    }

    this.popup.render(ctx);


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
    const mousePos = new V2(e.clientX, e.clientY);
    const bulletVel = mousePos
      .sub(this.playerPos)
      .normalize()
      .scale(BULLET_SPEED);

    // new Bullet(this.playerPos, bulletVel);
    this.bullets.add(new Bullet(this.playerPos, bulletVel));
  }
}

function fillCircle(ctx, center, radius, color = "green") {
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
  let moved_for_the_first_time = false; // <== Here: 2:5
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
