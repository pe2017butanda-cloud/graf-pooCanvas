// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Clase Ball (Pelota)
class Ball {
  constructor(x, y, radius, speedX, speedY, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.speedX = speedX;
    this.speedY = speedY;
    this.color = color;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color; // Usa el color de la pelota
    ctx.fill();
    ctx.closePath();
  }

  move() {
    this.x += this.speedX;
    this.y += this.speedY;

    // Colisión con la parte superior e inferior
    if (this.y - this.radius <= 0 || this.y + this.radius >= canvas.height) {
      this.speedY = -this.speedY;
    }
  }

  reset() {
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.speedX = -this.speedX; // Cambia dirección al resetear
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
    this.speed = 5;
  }

  draw() {
    ctx.fillStyle = this.color; // Usa el color de la paleta
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  move(direction) {
    if (direction == 'up' && this.y > 0) {
      this.y -= this.speed;
    } else if (direction == 'down' && this.y + this.height < canvas.height) {
      this.y += this.speed;
    }
  }

  // Movimiento de la paleta automática (IA)
  autoMove(ball) {
    // Se mueve hacia la pelota más cercana (o la única que le pasemos)
    if (ball.y < this.y + this.height / 2) {
      this.y -= this.speed;
    } else if (ball.y > this.y + this.height / 2) {
      this.y += this.speed;
    }
  }
}

// Clase Game (Controla el juego)
class Game {
  constructor() {
    // 1. Crear 5 pelotas con diferente tamaño, color y velocidad
    this.balls = [
      new Ball(canvas.width / 2, canvas.height / 2, 10, 4, 4, 'white'),
      new Ball(canvas.width / 2, canvas.height / 2, 15, -3, 5, 'cyan'),
      new Ball(canvas.width / 2, canvas.height / 2, 8, 5, -3, 'orange'),
      new Ball(canvas.width / 2, canvas.height / 2, 12, -4, -4, 'blue'),
      new Ball(canvas.width / 2, canvas.height / 2, 6, 3, 6, 'gray')
    ];

    // 2. Paletas con colores. La del jugador (izquierda) es verde y el doble de alto (200px)
    this.paddle1 = new Paddle(0, canvas.height / 2 - 100, 10, 200, 'green', true); 
    
    // La paleta de la CPU (derecha) es roja y mantiene su tamaño original (100px)
    this.paddle2 = new Paddle(canvas.width - 10, canvas.height / 2 - 50, 10, 100, 'red'); 

    this.keys = {}; // Para capturar las teclas
  }

  draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar todas las pelotas
    this.balls.forEach(ball => ball.draw());
    
    // Dibujar paletas
    this.paddle1.draw();
    this.paddle2.draw();
  }

  update() {
    // Movimiento de la paleta 1 (Jugador) controlado por teclas
    if (this.keys['ArrowUp']) {
      this.paddle1.move('up');
    }
    if (this.keys['ArrowDown']) {
      this.paddle1.move('down');
    }

    // Movimiento de la paleta 2 (Controlada por IA)
    // La IA sigue a la primera pelota (puedes cambiarlo si quieres que siga a otra)
    this.paddle2.autoMove(this.balls[0]);

    // Actualizar cada pelota
    this.balls.forEach(ball => {
      ball.move();

      // Colisión con la paleta 1 (Jugador) - Detecta TODAS las pelotas
      if (
        ball.x - ball.radius <= this.paddle1.x + this.paddle1.width &&
        ball.x + ball.radius >= this.paddle1.x &&
        ball.y + ball.radius >= this.paddle1.y &&
        ball.y - ball.radius <= this.paddle1.y + this.paddle1.height
      ) {
        ball.speedX = -ball.speedX;
        // Opcional: Mover la pelota un poco para evitar que se quede atascada
        ball.x = this.paddle1.x + this.paddle1.width + ball.radius;
      }

      // Colisión con la paleta 2 (CPU)
      if (
        ball.x + ball.radius >= this.paddle2.x &&
        ball.x - ball.radius <= this.paddle2.x + this.paddle2.width &&
        ball.y + ball.radius >= this.paddle2.y &&
        ball.y - ball.radius <= this.paddle2.y + this.paddle2.height
      ) {
        ball.speedX = -ball.speedX;
        // Opcional: Mover la pelota un poco para evitar que se quede atascada
        ball.x = this.paddle2.x - ball.radius;
      }

      // Detectar cuando la pelota sale de los bordes (punto marcado)
      if (
        ball.x - ball.radius <= 0 ||
        ball.x + ball.radius >= canvas.width
      ) {
        ball.reset();
      }
    });
  }
}

// Captura de teclas para el control de la paleta
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