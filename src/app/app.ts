import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SnakeGameComponent } from './snake-game.component';
import { MusicPlayerComponent } from './music-player.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  imports: [SnakeGameComponent, MusicPlayerComponent],
  template: `
    <main class="h-screen w-screen overflow-hidden bg-[#0a0a0a] flex flex-col md:flex-row">
      <!-- Left side: Game -->
      <div class="flex-1 h-full min-h-0 relative">
        <app-snake-game class="block h-full"></app-snake-game>
      </div>
      
      <!-- Right side: Music Player -->
      <div class="w-full md:w-80 lg:w-96 h-full shrink-0 border-t md:border-t-0 md:border-l border-white/5 bg-[#111]">
        <app-music-player class="block h-full"></app-music-player>
      </div>
    </main>
  `,
})
export class App {}
