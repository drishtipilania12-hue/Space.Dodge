const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const countdownScreen = document.getElementById('countdown');
const gameOverScreen = document.getElementById('game-over');
const scoreDisplay = document.getElementById('score-display');
const finalScoreElement = document.getElementById('final-score');
const playButton = document.getElementById('play-button');
const restartButton = document.getElementById('restart-button');

// Ship and Debris Images
const shipImg = new Image();
shipImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjUgNSBMNDUgNDAgTDI1IDMyIEw1IDQwIFoiIGZpbGw9IiMwMGQyZmYiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==';

const debrisImg = new Image();
debrisImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTAgNSBMMzAgOCBMMzUgMjUgTDIwIDM1IEw1IDI1IFoiIGZpbGw9IiM4ODgiIHN0cm9rZT0iIzU1NSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+';

let gameRunning = false;
let score = 0;
let animationId;
let debrisArray = [];
let lastDebrisTime = 0;
let debrisSpawnRate = 600; // ms (Faster spawn)

const ship = {
    x: 0,
    y: 0,
    width: 50,
    height: 50,
    speed: 8, // Slightly faster ship to compensate
    movingLeft: false,
    movingRight: false,
    visible: true
};

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ship.y = canvas.height - 80;
    if (!gameRunning) {
        ship.x = canvas.width / 2 - ship.width / 2;
    } else {
        if (ship.x > canvas.width - ship.width) ship.x = canvas.width - ship.width;
    }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Controls
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') ship.movingLeft = true;
    if (e.key === 'ArrowRight') ship.movingRight = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') ship.movingLeft = false;
    if (e.key === 'ArrowRight') ship.movingRight = false;
});

// Touch controls
canvas.addEventListener('touchmove', (e) => {
    if (!gameRunning) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    ship.x = touchX - ship.width / 2;
    
    // Boundary check
    if (ship.x < 0) ship.x = 0;
    if (ship.x > canvas.width - ship.width) ship.x = canvas.width - ship.width;
    
    e.preventDefault();
}, { passive: false });

class Debris {
    constructor() {
        this.width = 30 + Math.random() * 30;
        this.height = this.width;
        this.x = Math.random() * (canvas.width - this.width);
        this.y = -this.height;
        // Faster base speed and faster scaling
        this.speed = 5 + Math.random() * 5 + (score / 5);
    }

    update() {
        this.y += this.speed;
    }

    draw() {
        ctx.drawImage(debrisImg, this.x, this.y, this.width, this.height);
    }
}

function startGame() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    score = 0;
    debrisArray = [];
    ship.x = canvas.width / 2 - ship.width / 2;
    ship.visible = true;
    debrisSpawnRate = 600; 
    updateScore();
    
    // 3 Second Countdown
    countdownScreen.classList.remove('hidden');
    let count = 3;
    countdownScreen.innerText = count;
    
    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownScreen.innerText = count;
        } else {
            clearInterval(interval);
            countdownScreen.classList.add('hidden');
            scoreDisplay.classList.remove('hidden');
            gameRunning = true;
            lastDebrisTime = performance.now();
            requestAnimationFrame(animate);
        }
    }, 1000);
}

function updateScore() {
    scoreDisplay.innerText = `Score: ${score}`;
    finalScoreElement.innerText = score;
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function endGame() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    gameOverScreen.classList.remove('hidden');
}

function animate(time) {
    if (!gameRunning) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update ship
    if (ship.movingLeft && ship.x > 0) ship.x -= ship.speed;
    if (ship.movingRight && ship.x < canvas.width - ship.width) ship.x += ship.speed;
    
    // Draw ship
    if (ship.visible) {
        ctx.drawImage(shipImg, ship.x, ship.y, ship.width, ship.height);
    }
    
    // Spawn debris
    if (time - lastDebrisTime > debrisSpawnRate) {
        debrisArray.push(new Debris());
        lastDebrisTime = time;
        // Increase difficulty faster
        debrisSpawnRate = Math.max(150, 600 - (score * 15));
    }
    
    // Update and draw debris
    for (let i = debrisArray.length - 1; i >= 0; i--) {
        const d = debrisArray[i];
        d.update();
        d.draw();
        
        // Check collision
        if (ship.visible && checkCollision(ship, d)) {
            ship.visible = false;
            debrisArray.splice(i, 1); // Debris disappears
            // Redraw frame without ship and colliding debris
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            debrisArray.forEach(item => item.draw());
            
            endGame();
            return;
        }
        
        // Remove off-screen debris and increase score
        if (d.y > canvas.height) {
            debrisArray.splice(i, 1);
            score++;
            updateScore();
        }
    }
    
    animationId = requestAnimationFrame(animate);
}

playButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
