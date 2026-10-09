// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 🎨 Colores para las pelotas
const COLORES = [
  '#ff6b6b', '#4ecdc4', '#ffe66d', '#a06cd5', '#ff9f1c',
  '#06d6a0', '#118ab2', '#ef476f', '#f78c6b', '#c77dff'
];

function colorAleatorio() {
  return COLORES[Math.floor(Math.random() * COLORES.length)];
}

// Clase Ball (Pelota)
class Ball {
  constructor(x, y, radius, speedX, speedY, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.speedX = speedX;
    this.speedY = speedY;
    this.color = color;
    // Guardamos las velocidades iniciales para que cada pelota conserve su "personalidad"
    this.speedXInicial = speedX;
    this.speedYInicial = speedY;
  }

  draw() {
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();

    ctx.shadowBlur = 0;
  }

  move() {
    this.x += this.speedX;
    this.y += this.speedY;

    if (this.y - this.radius <= 0 || this.y + this.radius >= canvas.height) {
      this.speedY = -this.speedY;
    }
  }

  reset() {
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    // Conservar la velocidad original de cada pelota
    this.speedX = -this.speedXInicial;
    this.speedY = this.speedYInicial;
    this.color = colorAleatorio();
  }
}

// Clase Paddle (Paleta)
class Paddle {
  constructor(x, y, width, height, color, isPlayerControlled = false) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.isPlayerControlled = isPlayerControlled;
    this.speed = 5.5; // Velocidad base natural
  }

  draw() {
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 20;

    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.shadowBlur = 0;
  }

  move(direction) {
    if (direction == 'up' && this.y > 0) {
      this.y -= this.speed;
    } else if (direction == 'down' && this.y + this.height < canvas.height) {
      this.y += this.speed;
    }
  }

  // 🤖 IA PERFECTA: nunca pierde una pelota sin importar su velocidad
  autoMove(balls) {
    let targetBall = null;
    let objetivoY = null;
    let minTiempo = Infinity;

    // 1. Analizar TODAS las pelotas que vienen hacia la CPU
    balls.forEach(ball => {
      if (ball.speedX > 0) {
        // Tiempo estimado de llegada (en frames)
        const tiempo = (this.x - ball.x) / ball.speedX;

        if (tiempo > 0 && tiempo < minTiempo) {
          minTiempo = tiempo;

          // 🎯 PREDICCIÓN CON REBOTES EN LAS PAREDES
          let yFuturo = ball.y + ball.speedY * tiempo;
          const alturaUtil = canvas.height - 2 * ball.radius;
          const periodo = 2 * alturaUtil;

          let yRel = (yFuturo - ball.radius) % periodo;
          if (yRel < 0) yRel += periodo;
          if (yRel > alturaUtil) {
            yRel = periodo - yRel;
          }

          objetivoY = yRel + ball.radius;
          targetBall = ball;
        }
      }
    });

    // 2. Si no hay ninguna viniendo, seguir a la más cercana
    if (!targetBall) {
      let minDist = Infinity;
      balls.forEach(ball => {
        const dist = Math.abs(this.x - ball.x);
        if (dist < minDist) {
          minDist = dist;
          targetBall = ball;
          objetivoY = ball.y;
        }
      });
    }

    if (!targetBall || objetivoY === null) return;

    // 3. Mover la paleta hacia el punto de intercepción
    const targetCentro = objetivoY - this.height / 2;
    const diff = targetCentro - this.y;

    // 🚀 Velocidad adaptativa según la urgencia:
    //    - Si la pelota está lejos → velocidad normal (natural)
    //    - Si la pelota está cerca y es rápida → velocidad de emergencia
    const urgencia = Math.max(0, 1 - minTiempo / 40);
    const velocidadBase = this.speed;

    // La velocidad de emergencia se adapta a la velocidad real de la pelota
    const velocidadPelota = Math.abs(targetBall.speedX);
    const factorEmergencia = 1 + urgencia * (velocidadPelota * 0.8);

    const velocidadMax = velocidadBase * factorEmergencia;
    const velocidad = Math.min(velocidadMax, Math.abs(diff));

    if (Math.abs(diff) > 1) {
      this.y += Math.sign(diff) * velocidad;
    }

    // Limitar dentro del canvas
    if (this.y < 0) this.y = 0;
    if (this.y + this.height > canvas.height) this.y = canvas.height - this.height;
  }
}

// Clase Game (Controla el juego)
class Game {
  constructor() {
    // ⚡ 5 PELOTAS CON VELOCIDADES MUY DIFERENTES ENTRE SÍ
    //    (unas lentas, otras rápidas, otras con mucho movimiento vertical)
    this.balls = [
      // 1. Lenta y pesada (roja, grande)
      new Ball(canvas.width / 2, canvas.height / 2, 14, 1.2, 1.2, '#ff6b6b'),
      
      // 2. Rápida horizontal (turquesa, mediana)
      new Ball(canvas.width / 2, canvas.height / 2, 10, 3.5, 1.0, '#4ecdc4'),
      
      // 3. Muy rápida y con mucho rebote vertical (amarilla, pequeña)
      new Ball(canvas.width / 2, canvas.height / 2, 7, 2.8, 3.2, '#ffe66d'),
      
      // 4. Velocidad media equilibrada (púrpura, mediana)
      new Ball(canvas.width / 2, canvas.height / 2, 11, -2.0, -2.0, '#a06cd5'),
      
      // 5. Muy lenta pero muy vertical (naranja, pequeña)
      new Ball(canvas.width / 2, canvas.height / 2, 6, 1.5, 3.5, '#ff9f1c')
    ];

    this.paddle1 = new Paddle(0, canvas.height / 2 - 100, 12, 200, '#00ffcc', true);
    this.paddle2 = new Paddle(canvas.width - 12, canvas.height / 2 - 50, 12, 100, '#ff2e63');

    this.keys = {};
  }

  drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0f0c29');
    gradient.addColorStop(0.5, '#302b63');
    gradient.addColorStop(1, '#24243e');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([15, 15]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  draw() {
    this.drawBackground();
    this.balls.forEach(ball => ball.draw());
    this.paddle1.draw();
    this.paddle2.draw();
  }

  update() {
    if (this.keys['ArrowUp']) {
      this.paddle1.move('up');
    }
    if (this.keys['ArrowDown']) {
      this.paddle1.move('down');
    }

    this.paddle2.autoMove(this.balls);

    this.balls.forEach(ball => {
      ball.move();

      // Colisión con la paleta del jugador
      if (
        ball.x - ball.radius <= this.paddle1.x + this.paddle1.width &&
        ball.x + ball.radius >= this.paddle1.x &&
        ball.y + ball.radius >= this.paddle1.y &&
        ball.y - ball.radius <= this.paddle1.y + this.paddle1.height
      ) {
        ball.speedX = Math.abs(ball.speedX);
        ball.x = this.paddle1.x + this.paddle1.width + ball.radius;
        ball.color = colorAleatorio();
      }

      // Colisión con la paleta de la CPU
      if (
        ball.x + ball.radius >= this.paddle2.x &&
        ball.x - ball.radius <= this.paddle2.x + this.paddle2.width &&
        ball.y + ball.radius >= this.paddle2.y &&
        ball.y - ball.radius <= this.paddle2.y + this.paddle2.height
      ) {
        ball.speedX = -Math.abs(ball.speedX);
        ball.x = this.paddle2.x - ball.radius;
        ball.color = colorAleatorio();
      }

      // Detectar cuando la pelota sale del área de juego
      if (
        ball.x - ball.radius <= 0 ||
        ball.x + ball.radius >= canvas.width
      ) {
        ball.reset();
      }
    });
  }
}

// Captura de teclas
document.addEventListener('keydown', (e) => {
  game.keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
  game.keys[e.key] = false;
});

// Inicializar el juego
const game = new Game();

// Bucle de animación
function gameLoop() {
  game.draw();
  game.update();
  requestAnimationFrame(gameLoop);
}

gameLoop();