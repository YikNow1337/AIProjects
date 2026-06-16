// ================= CORE =================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let level = 1;
let keys = {};
let bullets = [];
let enemies = [];

// ================= ASSETS =================
const playerImg = new Image();
playerImg.src = "https://u.pcloud.link/publink/show?code=XZfPtE5ZKl1YJ4yDyNFgTTaKqQSgEyofdKVy";

const enemyImg = new Image();
enemyImg.src = "https://u.pcloud.link/publink/show?code=XZWPtE5Z1Cpqfq4K3AkSNqRt9xBLo01NTUTk";

// ================= SOUNDS =================
// ВСТАВЬ ССЫЛКИ НА ЗВУКИ
const shootSound = new Audio("https://u.pcloud.link/publink/show?code=XZWgtE5ZlsEoPL9gKiyubcvdKbpfE5leOIok");
const hitSound = new Audio("HIT_SOUND_URL");
const reloadSound = new Audio("RELOAD_SOUND_URL");
const deathSound = new Audio("DEATH_SOUND_URL");

// НОВЫЕ ЗВУКИ
const bgMusic = new Audio("https://u.pcloud.link/publink/show?code=XZLPtE5ZyW3vSg0ElQLMrOtHsiG37bL9zkI7");
const bgMusicLevel1 = new Audio("MUSIC_LEVEL1_URL");
const bgMusicLevel2 = new Audio("MUSIC_LEVEL2_URL");
const bgMusicBoss = new Audio("MUSIC_BOSS_URL");

const healSound = new Audio("https://u.pcloud.link/publink/show?code=XZ1gtE5ZKFF2dT4qn3u6APu5g0lpDLRHlXvy");
const pickupSound = new Audio("https://u.pcloud.link/publink/show?code=XZfgtE5ZTFYAJvWoclBsI5WqbJM7CFiqj2py");

// настройки музыки
[bgMusicLevel1, bgMusicLevel2, bgMusicBoss].forEach(m => {
  m.loop = true;
  m.volume = 0.5;
});

let currentMusic = null;

function playMusicForLevel(level) {
  // остановить текущую музыку
  if (currentMusic) {
    currentMusic.pause();
    currentMusic.currentTime = 0;
  }

  if (level === 1) currentMusic = bgMusicLevel1;
  else if (level === 2) currentMusic = bgMusicLevel2;
  else currentMusic = bgMusicBoss;

  currentMusic.play();
}

// ================= PLAYER =================
const player = {
  x: 400,
  y: 250,
  hp: 100,
  lives: 3,
  speed: 3,
  ammo: 12,
  reloading: false
};

// ================= ENEMIES =================
function spawnEnemies(level) {
  enemies = [];
  let count = level === 1 ? 3 : level === 2 ? 6 : 1;

  for (let i = 0; i < count; i++) {
    enemies.push(createEnemy(level));
  }
}

function createEnemy(level) {
  if (level === 3) return createBoss();

  let types = ["normal", "fast", "shooter"];
  let type = types[Math.floor(Math.random() * types.length)];

  let enemy = {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    type
  };

  if (type === "normal") {
    enemy.hp = 40;
    enemy.speed = 1;
    enemy.damage = 20;
  }

  if (type === "fast") {
    enemy.hp = 25;
    enemy.speed = 3;
    enemy.damage = 10;
  }

  if (type === "shooter") {
    enemy.hp = 35;
    enemy.speed = 0.5;
    enemy.damage = 40;
    enemy.lastShot = 0;
  }

  return enemy;
}

function createBoss() {
  return {
    x: 400,
    y: 100,
    type: "boss",
    hp: 300,
    damage: 10,
    speed: 1,
    lastShot: 0
  };
}

// ================= ITEMS (АПТЕЧКИ) =================
let medkits = [];

function spawnMedkit() {
  medkits.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: 20
  });
}

function updateMedkits() {
  medkits.forEach(m => {
    let dist = Math.hypot(player.x - m.x, player.y - m.y);

    if (dist < 20) {
      pickupSound.play(); // звук поднятия

      player.hp = Math.min(100, player.hp + 20);
      healSound.play(); // звук лечения

      m.collected = true;
    }
  });

  medkits = medkits.filter(m => !m.collected);
}

// ================= SHOOTING =================
function shoot() {
  if (player.ammo <= 0 || player.reloading) return;

  bullets.push({ x: player.x, y: player.y, speed: 5 });

  shootSound.currentTime = 0;
  shootSound.play();

  player.ammo--;

  if (player.ammo === 0) reload();
}

function reload() {
  player.reloading = true;
  reloadSound.play();

  setTimeout(() => {
    player.ammo = 12;
    player.reloading = false;
  }, 1500);
}

// ================= INPUT =================
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);
canvas.addEventListener("click", () => {
  shoot();

  // запуск музыки при первом клике (важно для браузера)
  if (bgMusic.paused) {
    bgMusic.play();
  }
});

// ================= GAME LOGIC =================
function updatePlayer() {
  if (keys["w"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["a"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;

  player.x = Math.max(0, Math.min(canvas.width - 40, player.x));
  player.y = Math.max(0, Math.min(canvas.height - 40, player.y));
}

function updateEnemies() {
  enemies.forEach(e => {
    let dx = player.x - e.x;
    let dy = player.y - e.y;
    let dist = Math.hypot(dx, dy) || 1;

    if (e.type === "fast") {
      e.x += (dx / dist) * e.speed;
      e.y += (dy / dist) * e.speed;

      if (dist < 10) player.hp = 0;

    } else if (e.type === "shooter") {
      if (Date.now() - e.lastShot > 4000) {
        player.hp -= e.damage;
        hitSound.play();
        e.lastShot = Date.now();
      }

    } else {
      e.x += (dx / dist) * e.speed;
      e.y += (dy / dist) * e.speed;
    }

    if (dist < 15) {
      player.hp -= e.damage;
      hitSound.play();
    }
  });
}

function updateBullets() {
  bullets.forEach(b => {
    b.y -= b.speed;

    enemies.forEach(e => {
      let dist = Math.hypot(b.x - e.x, b.y - e.y);
      if (dist < 15) {
        e.hp -= 20;
        hitSound.play();
        b.hit = true;
      }
    });
  });

  bullets = bullets.filter(b => !b.hit);
  enemies = enemies.filter(e => e.hp > 0);
}

function updateLevel() {
  if (enemies.length === 0) {
    level++;

    // шанс появления аптечки
    spawnMedkit();

    if (level > 3) {
      alert("ПОБЕДА!");
      location.reload();
    }

    spawnEnemies(level);
  }
}

function updatePlayerState() {
  if (player.hp <= 0) {
    deathSound.play();

    player.lives--;
    player.hp = 100;

    if (player.lives <= 0) {
      alert("ИГРА ОКОНЧЕНА");
      location.reload();
    }
  }
}

function updateUI() {
  document.getElementById("hp").textContent = player.hp;
  document.getElementById("lives").textContent = player.lives;
  document.getElementById("ammo").textContent = player.ammo;
  document.getElementById("level").textContent = level;
}

function update() {
  updatePlayer();
  updateEnemies();
  updateBullets();
  updateMedkits();
  updateLevel();
  updatePlayerState();
  updateUI();
}

// ================= RENDER =================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "blue";
  ctx.fillRect(player.x, player.y, 40, 40);

  ctx.fillStyle = "red";
  enemies.forEach(e => {
    ctx.fillRect(e.x, e.y, 40, 40);
  });

  // аптечки
  ctx.fillStyle = "green";
  medkits.forEach(m => {
    ctx.fillRect(m.x, m.y, 20, 20);
  });

  bullets.forEach(b => {
    ctx.fillRect(b.x, b.y, 5, 10);
  });
}

// ================= GAME LOOP =================
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// ================= INIT =================
spawnEnemies(level);
gameLoop();
