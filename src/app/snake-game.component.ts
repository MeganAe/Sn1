import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, HostListener, signal, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface Point {
  x: number;
  y: number;
}

enum GameState {
  MENU,
  PLAYING,
  PAUSED,
  GAME_OVER
}

@Component({
  selector: 'app-snake-game',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="flex flex-col h-full bg-[#0a0a0a] relative">
      <!-- Header -->
      <div class="p-6 flex justify-between items-center z-10">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <mat-icon class="text-emerald-500">sports_esports</mat-icon>
            Snake & Groove
          </h1>
          <p class="text-sm text-gray-500 mt-1">Play to the beat</p>
        </div>
        
        <div class="flex gap-6">
          <div class="flex flex-col items-end">
            <span class="text-xs font-mono text-gray-500 uppercase tracking-widest">Score</span>
            <span class="text-2xl font-mono font-bold text-emerald-500">{{ score() }}</span>
          </div>
          <div class="flex flex-col items-end">
            <span class="text-xs font-mono text-gray-500 uppercase tracking-widest">High Score</span>
            <span class="text-2xl font-mono font-bold text-white">{{ highScore() }}</span>
          </div>
        </div>
      </div>

      <!-- Game Area -->
      <div class="flex-1 relative flex items-center justify-center p-6 min-h-0">
        <div class="relative aspect-square max-h-full max-w-full rounded-2xl overflow-hidden shadow-2xl shadow-emerald-900/20 border border-white/10 bg-[#111]">
          <canvas #gameCanvas class="block w-full h-full"></canvas>
          
          <!-- Overlays -->
          @if (gameState() !== GameState.PLAYING) {
            <div class="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center">
              
              @if (gameState() === GameState.MENU) {
                <mat-icon class="text-6xl text-emerald-500 mb-6">videogame_asset</mat-icon>
                <h2 class="text-3xl font-bold text-white mb-2">Ready to Play?</h2>
                <p class="text-gray-400 mb-8">Use Arrow Keys or WASD to move</p>
                <button 
                  (click)="startGame()"
                  class="px-8 py-4 bg-emerald-500 text-black font-bold rounded-full hover:bg-emerald-400 hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
                >
                  START GAME
                </button>
              }

              @if (gameState() === GameState.PAUSED) {
                <mat-icon class="text-6xl text-white mb-6">pause_circle_outline</mat-icon>
                <h2 class="text-3xl font-bold text-white mb-8">Paused</h2>
                <button 
                  (click)="resumeGame()"
                  class="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 hover:scale-105 transition-all"
                >
                  RESUME
                </button>
              }

              @if (gameState() === GameState.GAME_OVER) {
                <mat-icon class="text-6xl text-red-500 mb-6">sentiment_very_dissatisfied</mat-icon>
                <h2 class="text-3xl font-bold text-white mb-2">Game Over</h2>
                <p class="text-gray-400 mb-8">You scored {{ score() }} points</p>
                <button 
                  (click)="startGame()"
                  class="px-8 py-4 bg-emerald-500 text-black font-bold rounded-full hover:bg-emerald-400 hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
                >
                  PLAY AGAIN
                </button>
              }
              
            </div>
          }
        </div>
      </div>
      
      <!-- Footer Controls -->
      <div class="p-6 flex justify-center gap-8 text-sm text-gray-500 font-mono z-10">
        <div class="flex items-center gap-2">
          <kbd class="px-2 py-1 bg-white/10 rounded text-white">W</kbd>
          <kbd class="px-2 py-1 bg-white/10 rounded text-white">A</kbd>
          <kbd class="px-2 py-1 bg-white/10 rounded text-white">S</kbd>
          <kbd class="px-2 py-1 bg-white/10 rounded text-white">D</kbd>
          <span>to move</span>
        </div>
        <div class="flex items-center gap-2">
          <kbd class="px-2 py-1 bg-white/10 rounded text-white">SPACE</kbd>
          <span>to pause</span>
        </div>
      </div>
    </div>
  `
})
export class SnakeGameComponent implements AfterViewInit, OnDestroy {
  @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  
  GameState = GameState;
  gameState = signal<GameState>(GameState.MENU);
  score = signal<number>(0);
  highScore = signal<number>(0);

  private ctx!: CanvasRenderingContext2D;
  private animationId = 0;
  private lastTime = 0;
  private moveInterval = 120; // ms per move
  private timeSinceLastMove = 0;

  private gridSize = 20;
  private tileCount = 20;
  
  private snake: Point[] = [];
  private velocity: Point = { x: 0, y: 0 };
  private nextVelocity: Point = { x: 0, y: 0 };
  private food: Point = { x: 15, y: 15 };
  private platformId = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('snakeHighScore');
      if (saved) {
        this.highScore.set(parseInt(saved, 10));
      }
    }
  }

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    
    // Set internal resolution
    canvas.width = 400;
    canvas.height = 400;
    
    this.draw(); // Initial draw for menu background
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animationId);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (this.gameState() !== GameState.PLAYING) {
      if (event.code === 'Space' && this.gameState() === GameState.PAUSED) {
        this.resumeGame();
      } else if (event.code === 'Space' && (this.gameState() === GameState.MENU || this.gameState() === GameState.GAME_OVER)) {
        this.startGame();
      }
      return;
    }

    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        if (this.velocity.y !== 1) this.nextVelocity = { x: 0, y: -1 };
        break;
      case 'ArrowDown':
      case 'KeyS':
        if (this.velocity.y !== -1) this.nextVelocity = { x: 0, y: 1 };
        break;
      case 'ArrowLeft':
      case 'KeyA':
        if (this.velocity.x !== 1) this.nextVelocity = { x: -1, y: 0 };
        break;
      case 'ArrowRight':
      case 'KeyD':
        if (this.velocity.x !== -1) this.nextVelocity = { x: 1, y: 0 };
        break;
      case 'Space':
        this.pauseGame();
        break;
    }
  }

  startGame() {
    this.snake = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 }
    ];
    this.velocity = { x: 0, y: -1 };
    this.nextVelocity = { x: 0, y: -1 };
    this.score.set(0);
    this.placeFood();
    this.gameState.set(GameState.PLAYING);
    this.lastTime = performance.now();
    this.timeSinceLastMove = 0;
    
    cancelAnimationFrame(this.animationId);
    this.gameLoop(performance.now());
  }

  pauseGame() {
    this.gameState.set(GameState.PAUSED);
  }

  resumeGame() {
    this.gameState.set(GameState.PLAYING);
    this.lastTime = performance.now();
    this.gameLoop(performance.now());
  }

  gameOver() {
    this.gameState.set(GameState.GAME_OVER);
    if (this.score() > this.highScore()) {
      this.highScore.set(this.score());
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('snakeHighScore', this.score().toString());
      }
    }
  }

  private gameLoop(timestamp: number) {
    if (this.gameState() !== GameState.PLAYING) return;

    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;
    this.timeSinceLastMove += deltaTime;

    if (this.timeSinceLastMove >= this.moveInterval) {
      this.update();
      this.timeSinceLastMove = 0;
    }

    this.draw();
    this.animationId = requestAnimationFrame((ts) => this.gameLoop(ts));
  }

  private update() {
    this.velocity = this.nextVelocity;
    
    const head = { ...this.snake[0] };
    head.x += this.velocity.x;
    head.y += this.velocity.y;

    // Wall collision
    if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
      this.gameOver();
      return;
    }

    // Self collision
    for (const segment of this.snake) {
      if (head.x === segment.x && head.y === segment.y) {
        this.gameOver();
        return;
      }
    }

    this.snake.unshift(head);

    // Food collision
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score.update(s => s + 10);
      // Speed up slightly
      this.moveInterval = Math.max(50, 120 - Math.floor(this.score() / 50) * 5);
      this.placeFood();
    } else {
      this.snake.pop();
    }
  }

  private placeFood() {
    let newFood: Point;
    let valid = false;
    while (!valid) {
      newFood = {
        x: Math.floor(Math.random() * this.tileCount),
        y: Math.floor(Math.random() * this.tileCount)
      };
      valid = true;
      for (const segment of this.snake) {
        if (segment.x === newFood.x && segment.y === newFood.y) {
          valid = false;
          break;
        }
      }
      this.food = newFood;
    }
  }

  private draw() {
    const canvas = this.canvasRef.nativeElement;
    const w = canvas.width;
    const h = canvas.height;
    const tileW = w / this.tileCount;
    const tileH = h / this.tileCount;

    // Clear background
    this.ctx.fillStyle = '#111111';
    this.ctx.fillRect(0, 0, w, h);

    // Draw grid lines
    this.ctx.strokeStyle = '#222222';
    this.ctx.lineWidth = 1;
    for (let i = 0; i <= this.tileCount; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(i * tileW, 0);
      this.ctx.lineTo(i * tileW, h);
      this.ctx.stroke();
      
      this.ctx.beginPath();
      this.ctx.moveTo(0, i * tileH);
      this.ctx.lineTo(w, i * tileH);
      this.ctx.stroke();
    }

    if (this.gameState() === GameState.MENU) return;

    // Draw food (glowing effect)
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = '#10b981';
    this.ctx.fillStyle = '#10b981';
    this.ctx.beginPath();
    this.ctx.arc(
      this.food.x * tileW + tileW / 2, 
      this.food.y * tileH + tileH / 2, 
      tileW / 2.5, 
      0, 
      Math.PI * 2
    );
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    // Draw snake
    for (let i = 0; i < this.snake.length; i++) {
      const segment = this.snake[i];
      
      // Gradient for head
      if (i === 0) {
        this.ctx.fillStyle = '#34d399'; // Lighter emerald
      } else {
        // Fade out tail
        const opacity = Math.max(0.3, 1 - (i / this.snake.length));
        this.ctx.fillStyle = `rgba(16, 185, 129, ${opacity})`;
      }
      
      // Rounded rects for snake segments
      const x = segment.x * tileW + 1;
      const y = segment.y * tileH + 1;
      const sizeW = tileW - 2;
      const sizeH = tileH - 2;
      
      this.ctx.fillRect(x, y, sizeW, sizeH);
    }
  }
}
