const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level');
const startBtn = document.getElementById('startBtn');
const gameOver = document.getElementById('gameOver');
const finalText = document.getElementById('finalText');
const restartBtn = document.getElementById('restartBtn');

const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const fireBtn = document.getElementById('fireBtn');

const state = {
  running: false,
  score: 0,
  lives: 3,
  level: 1,
  frame: 0,
  enemySpawnRate: 45,
  fireCooldown: 0,
  keys: { left: false, right: false, fire: false },
  player: {
    x: canvas.width / 2,
    y: canvas.height - 46,
    width: 30,
    height: 22,
    speed: 4.2,
  },
  bullets: [],
  enemies: [],
  stars: Array.from({ length: 50 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    speed: 0.7 + Math.random() * 1.6,
    size: 1 + Math.random() * 2,
  })),
};

function resetGame() {
  state.running = true;
  state.score = 0;
  state.lives = 3;
  state.level = 1;
  state.frame = 0;
  state.enemySpawnRate = 45;
  state.fireCooldown = 0;
  state.bullets = [];
  state.enemies = [];
  state.player.x = canvas.width / 2;
  updateHud();
  gameOver.classList.add('hidden');
}

function updateHud() {
  scoreEl.textContent = `得分：${state.score}`;
  livesEl.textContent = `生命：${state.lives}`;
  levelEl.textContent = `关卡：${state.level}`;
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#050910';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  state.stars.forEach((star) => {
    star.y += star.speed;
    if (star.y > canvas.height) star.y = 0;
    ctx.fillRect(star.x, star.y, star.size, star.size);
  });
}

function drawPlayer() {
  const { x, y, width, height } = state.player;
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = '#7ce2ff';
  ctx.beginPath();
  ctx.moveTo(0, -height / 2);
  ctx.lineTo(width / 2, height / 2);
  ctx.lineTo(-width / 2, height / 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-3, -height / 2 + 5, 6, 8);
  ctx.restore();
}

function drawBullets() {
  ctx.fillStyle = '#ffed75';
  state.bullets.forEach((bullet) => {
    ctx.fillRect(bullet.x - 2, bullet.y, 4, 12);
  });
}

function drawEnemies() {
  state.enemies.forEach((enemy) => {
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1a1125';
    ctx.fillRect(enemy.x - 2, enemy.y - 2, 4, 4);
  });
}

function spawnEnemy() {
  const radius = 10 + Math.random() * 12;
  state.enemies.push({
    x: radius + Math.random() * (canvas.width - radius * 2),
    y: -radius,
    r: radius,
    speed: 1.2 + Math.random() * 1.4 + state.level * 0.12,
    color: Math.random() > 0.5 ? '#ff7396' : '#ffa05f',
  });
}

function shoot() {
  state.bullets.push({
    x: state.player.x,
    y: state.player.y - state.player.height / 2 - 6,
    speed: 6.8,
  });
}

function updatePlayer() {
  if (state.keys.left) state.player.x -= state.player.speed;
  if (state.keys.right) state.player.x += state.player.speed;

  state.player.x = Math.max(18, Math.min(canvas.width - 18, state.player.x));

  if (state.keys.fire && state.fireCooldown <= 0) {
    shoot();
    state.fireCooldown = 9;
  }

  if (state.fireCooldown > 0) state.fireCooldown--;
}

function updateBullets() {
  state.bullets.forEach((bullet) => {
    bullet.y -= bullet.speed;
  });
  state.bullets = state.bullets.filter((bullet) => bullet.y > -20);
}

function updateEnemies() {
  state.enemies.forEach((enemy) => {
    enemy.y += enemy.speed;
  });

  const remaining = [];
  state.enemies.forEach((enemy) => {
    if (enemy.y - enemy.r > canvas.height) {
      state.lives -= 1;
      return;
    }
    remaining.push(enemy);
  });
  state.enemies = remaining;
}

function checkCollisions() {
  const removedBullets = new Set();
  const removedEnemies = new Set();

  state.enemies.forEach((enemy, enemyIndex) => {
    state.bullets.forEach((bullet, bulletIndex) => {
      if (removedBullets.has(bulletIndex) || removedEnemies.has(enemyIndex)) return;
      const dx = bullet.x - enemy.x;
      const dy = bullet.y - enemy.y;
      if (dx * dx + dy * dy < enemy.r * enemy.r) {
        removedBullets.add(bulletIndex);
        removedEnemies.add(enemyIndex);
        state.score += 10;
      }
    });
  });

  state.bullets = state.bullets.filter((_, index) => !removedBullets.has(index));
  state.enemies = state.enemies.filter((_, index) => !removedEnemies.has(index));

  state.enemies.forEach((enemy) => {
    const px = state.player.x;
    const py = state.player.y;
    const nearX = Math.abs(enemy.x - px) < enemy.r + state.player.width / 2;
    const nearY = Math.abs(enemy.y - py) < enemy.r + state.player.height / 2;
    if (nearX && nearY) {
      state.lives = 0;
    }
  });
}

function updateDifficulty() {
  state.level = 1 + Math.floor(state.score / 120);
  state.enemySpawnRate = Math.max(18, 45 - state.level * 2);
}

function endGame() {
  state.running = false;
  finalText.textContent = `游戏结束，得分：${state.score}`;
  gameOver.classList.remove('hidden');
}

function gameLoop() {
  drawBackground();

  if (state.running) {
    state.frame++;
    updatePlayer();
    updateBullets();
    updateEnemies();

    if (state.frame % state.enemySpawnRate === 0) spawnEnemy();

    checkCollisions();
    updateDifficulty();
    updateHud();

    if (state.lives <= 0) endGame();
  }

  drawBullets();
  drawEnemies();
  drawPlayer();

  requestAnimationFrame(gameLoop);
}

function bindHold(button, key) {
  const start = (event) => {
    event.preventDefault();
    state.keys[key] = true;
  };

  const end = () => {
    state.keys[key] = false;
  };

  button.addEventListener('touchstart', start, { passive: false });
  button.addEventListener('touchend', end);
  button.addEventListener('touchcancel', end);
  button.addEventListener('mousedown', start);
  button.addEventListener('mouseup', end);
  button.addEventListener('mouseleave', end);
}

function bindDragMove() {
  const moveToX = (x) => {
    const rect = canvas.getBoundingClientRect();
    const ratio = canvas.width / rect.width;
    const targetX = (x - rect.left) * ratio;
    state.player.x = Math.max(18, Math.min(canvas.width - 18, targetX));
  };

  canvas.addEventListener('touchmove', (event) => {
    if (!state.running) return;
    event.preventDefault();
    moveToX(event.touches[0].clientX);
    state.keys.fire = true;
  }, { passive: false });

  canvas.addEventListener('touchend', () => {
    state.keys.fire = false;
  });

  canvas.addEventListener('mousemove', (event) => {
    if (event.buttons === 1 && state.running) {
      moveToX(event.clientX);
    }
  });
}

startBtn.addEventListener('click', () => {
  startBtn.classList.add('hidden');
  resetGame();
});

restartBtn.addEventListener('click', resetGame);

bindHold(leftBtn, 'left');
bindHold(rightBtn, 'right');
bindHold(fireBtn, 'fire');
bindDragMove();

gameLoop();
