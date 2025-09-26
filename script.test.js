const { JSDOM } = require('jsdom');

// Создание виртуального DOM
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <body>
      <div id="canvas"></div>
      <button id="replay"></button>
      <button id="speedUP"></button>
      <button id="speedDW"></button>
      <div id="score"></div>
    </body>
  </html>
`);
global.document = dom.window.document;
global.window = dom.window;
global.requestAnimationFrame = callback => setTimeout(callback, 0);

describe('Snake Game', () => {
  beforeEach(() => {
    // Инициализация перед каждым тестом
    initialize();
  });

  test('Snake initializes correctly', () => {
    const snake = new Snake();
    expect(snake.pos).toBeInstanceOf(helpers.Vec);
    expect(snake.dir).toBeInstanceOf(helpers.Vec);
    expect(snake.total).toBe(1);
  });

  test('Food initializes correctly', () => {
    const food = new Food();
    expect(food.pos).toBeInstanceOf(helpers.Vec);
    expect(food.color).toBe('#4cffd7');
  });

  test('Collision detection works', () => {
    const v1 = new helpers.Vec(1, 1);
    const v2 = new helpers.Vec(1, 1);
    expect(helpers.isCollision(v1, v2)).toBe(true);
  });

  test('Increment score works', () => {
    incrementScore();
    expect(document.querySelector('#score').innerText).toBe('01');
  });

  test('Clear canvas works', () => {
    const spy = jest.spyOn(CTX, 'clearRect');
    clear();
    expect(spy).toHaveBeenCalledWith(0, 0, 400, 400);
  });

  test('Speed up works', () => {
    speedUP();
    expect(fameRate).toBe(70);
  });

  test('Speed down works', () => {
    speedDW();
    expect(fameRate).toBe(50);
  });

  test('Game over works', () => {
    score = 10;
    gameOver();
    expect(window.localStorage.getItem('maxScore')).toBe('10');
  });

  test('Reset game works', () => {
    reset();
    expect(document.querySelector('#score').innerText).toBe('00');
    expect(isGameOver).toBe(false);
  });

  test('Key listener works', () => {
    KEY.listen();
    const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    document.dispatchEvent(event);
    expect(KEY.ArrowUp).toBe(true);
  });
});
