
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



  const radius = 69;
  const ctx = c.getContext("2d");
  const speed = 1000;

  let start;
  let pos = new V2(radius + 10, radius + 10);
  
  let directionMap = {
    'w': new V2(0, -speed),
    's': new V2(0, speed),
    'a': new V2(-speed, 0),
    'd': new V2(speed, 0),
  };

let pressedKeys = new Set();

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

    let vel = new V2(0, 0);
    for (let key of pressedKeys) {
      if (key in directionMap) {
        vel = vel.add(directionMap[key]);
      }
    }
    pos = pos.add(vel.scale(dt));

    ctx.clearRect(0, 0, width, height);
    fillCircle(ctx, pos, radius, "red");
    // console.log(elapsed);

    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);

  document.addEventListener("keydown", (e) => {
    pressedKeys.add((e.key).toLowerCase());
  })

  document.addEventListener("keyup", (e) => {
    pressedKeys.delete((e.key).toLowerCase());
  })

})();
