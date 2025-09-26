const domReplay = document.querySelector("#replay");

const domSpeedUP = document.querySelector("#speedUP");

const domSpeedDW = document.querySelector("#speedDW");

const domScore = document.querySelector("#score");

const domCanvas = document.createElement("canvas");

document.querySelector("#canvas").appendChild(domCanvas);

const CTX = domCanvas.getContext("2d");
const W = (domCanvas.width = 400);
const H = (domCanvas.height = 400);

let snake;
let food;
const cells = 20; // колво влеток
let cellSize; // размер клетки
let isGameOver = false; // флаг
let score = 0; // счет игры
let maxScore = window.localStorage.getItem("maxScore") || undefined; // проверка на наличие mS

let requestID; // идентификатор запроса

const helpers = {
  Vec: class {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }

    add(v) {
      this.x += v.x;
      this.y += v.y;
      return this;
    }

    mult(v) {
      if (v instanceof helpers.Vec) {
        this.x *= v.x;
        this.y *= v.y;
        return this;
      } else {
        this.x *= v;
        this.y *= v;
        return this;
      }
    }
  },

  // проверка на столкновение
  isCollision(v1, v2) {
    return v1.x === v2.x && v1.y === v2.y;
  },

  // сетка на поле
  drawGrid() {
    CTX.lineWidth = 1.1;
    CTX.strokeStyle = "#232332";
    CTX.shadowBlur = 0;
    for (let i = 1; i < cells; i++) {
      const f = (W / cells) * i;
      CTX.beginPath();
      CTX.moveTo(f, 0);
      CTX.lineTo(f, H);
      CTX.stroke();
      CTX.beginPath();
      CTX.moveTo(0, f);
      CTX.lineTo(W, f);
      CTX.stroke();
      CTX.closePath();
    }
  },
};

// состояние клавиш на клавиатуре и управление
const KEY = {
  ArrowUp: false,
  ArrowRight: false,
  ArrowDown: false,
  ArrowLeft: false,
  resetState() {
    this.ArrowUp = false;
    this.ArrowRight = false;
    this.ArrowDown = false;
    this.ArrowLeft = false;
  },
  listen() {
    addEventListener(
      "keydown",
      (ev) => {
        if (ev.key === "ArrowUp" && this.ArrowDown) return;
        if (ev.key === "ArrowDown" && this.ArrowUp) return;
        if (ev.key === "ArrowLeft" && this.ArrowRight) return;
        if (ev.key === "ArrowRight" && this.ArrowLeft) return;
        this[ev.key] = true;
        Object.keys(this)
          .filter((f) => f !== ev.key && f !== "listen" && f !== "resetState")
          .forEach((k) => {
            this[k] = false;
          });
      },
      false,
    );
  },
};

class Snake {
  constructor(i, type) {
    this.pos = new helpers.Vec(W / 2, H / 2);
    this.dir = new helpers.Vec(0, 0);
    this.type = type;
    this.index = i;
    this.delay = 5;
    this.size = W / cells;
    this.color = "white";
    this.history = [];
    this.total = 1;
  }

  draw() {
    const { x, y } = this.pos;
    CTX.fillStyle = this.color;
    CTX.shadowBlur = 20;
    CTX.shadowColor = "rgba(255,255,255,.3 )";
    CTX.fillRect(x, y, this.size, this.size);
    CTX.shadowBlur = 0;
    if (this.total >= 2) {
      for (let i = 0; i < this.history.length - 1; i++) {
        const { x, y } = this.history[i];
        CTX.lineWidth = 1;
        CTX.fillStyle = "rgba(225,225,225,1)";
        CTX.fillRect(x, y, this.size, this.size);
      }
    }
  }

  walls() {
    const { x, y } = this.pos;
    if (x + cellSize > W) {
      this.pos.x = 0;
    }
    if (y + cellSize > W) {
      this.pos.y = 0;
    }
    if (y < 0) {
      this.pos.y = H - cellSize;
    }
    if (x < 0) {
      this.pos.x = W - cellSize;
    }
  }

  controlls() {
    const dir = this.size;
    if (KEY.ArrowUp) {
      this.dir = new helpers.Vec(0, -dir);
    }
    if (KEY.ArrowDown) {
      this.dir = new helpers.Vec(0, dir);
    }
    if (KEY.ArrowLeft) {
      this.dir = new helpers.Vec(-dir, 0);
    }
    if (KEY.ArrowRight) {
      this.dir = new helpers.Vec(dir, 0);
    }
  }

  selfCollision() {
    for (let i = 0; i < this.history.length; i++) {
      const p = this.history[i];
      if (helpers.isCollision(this.pos, p)) {
        isGameOver = true;
      }
    }
  }

  update() {
    this.walls();
    this.draw();
    this.controlls();
    if (!this.delay--) {
      if (helpers.isCollision(this.pos, food.pos)) {
        incrementScore();
        food.spawn();
        this.total++;
      }
      this.history[this.total - 1] = new helpers.Vec(this.pos.x, this.pos.y);
      for (let i = 0; i < this.total - 1; i++) {
        this.history[i] = this.history[i + 1];
      }
      this.pos.add(this.dir);
      this.delay = 5;
      if (this.total > 3) {
        this.selfCollision();
      }
    }
  }
}

class Food {
  constructor() {
    this.pos = new helpers.Vec(
      ~~(Math.random() * cells) * cellSize,
      ~~(Math.random() * cells) * cellSize,
    );
    this.color = "#4cffd7";
    this.size = cellSize;
  }

  draw() {
    const { x, y } = this.pos;
    CTX.globalCompositeOperation = "lighter";
    CTX.shadowBlur = 20;
    CTX.shadowColor = this.color;
    CTX.fillStyle = this.color;
    CTX.fillRect(x, y, this.size, this.size);
    CTX.globalCompositeOperation = "source-over";
    CTX.shadowBlur = 0;
  }

  spawn() {
    const randX = ~~(Math.random() * cells) * this.size;
    const randY = ~~(Math.random() * cells) * this.size;
    for (const path of snake.history) {
      if (helpers.isCollision(new helpers.Vec(randX, randY), path)) {
        return this.spawn();
      }
    }
    this.color = "#4cffd7";
    this.pos = new helpers.Vec(randX, randY);
  }
}

// увеличение счета
function incrementScore() {
  score++;
  domScore.innerText = score.toString().padStart(2, "0");
}

// очищение поля
function clear() {
  CTX.clearRect(0, 0, W, H);
}

// инициализация самой игры
function initialize() {
  CTX.imageSmoothingEnabled = false;
  KEY.listen();
  cellSize = W / cells;
  snake = new Snake();
  food = new Food();
  domReplay.addEventListener("click", reset, false);
  domSpeedUP.addEventListener("click", speedUP, false);
  domSpeedDW.addEventListener("click", speedDW, false);
  loop();
}

let fameRate = 60;

function speedUP() {
  fameRate += 10;
  // console.log(fameRate)
}

function speedDW() {
  fameRate -= 10;
  // console.log(fameRate)
}

function loop() {
  clear();
  if (!isGameOver) {
    requestID = setTimeout(loop, 1000 / fameRate);
    helpers.drawGrid();
    snake.update();
    food.draw();
  } else {
    clear();
    gameOver();
  }
}

function gameOver() {
  if (!maxScore) {
    maxScore = score;
  }
  if (score > maxScore) {
    maxScore = score;
  }
  window.localStorage.setItem("maxScore", maxScore);
  CTX.fillStyle = "#4cffd7";
  CTX.textAlign = "center";
  CTX.font = "bold 30px Poppins, sans-serif";
  CTX.fillText("ХА ЛОХ", W / 2, H / 2);
  CTX.font = "15px Poppins, sans-serif";
  CTX.fillText(`SCORE   ${score}`, W / 2, H / 2 + 60);
  CTX.fillText(`MAXSCORE   ${maxScore}`, W / 2, H / 2 + 80);
}

function reset() {
  domScore.innerText = "00";
  score = "00";
  snake = new Snake();
  food.spawn();
  KEY.resetState();
  isGameOver = false;
  clearTimeout(requestID);
  loop();
}

initialize();
