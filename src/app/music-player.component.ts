import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MusicService } from './music.service';

@Component({
  selector: 'app-music-player',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="flex flex-col h-full bg-[#111] border-l border-white/5">
      <!-- Header -->
      <div class="p-6 border-b border-white/5">
        <h2 class="text-xl font-medium tracking-tight text-white flex items-center gap-2">
          <mat-icon class="text-emerald-500">graphic_eq</mat-icon>
          Now Playing
        </h2>
      </div>

      <!-- Now Playing Section -->
      <div class="p-6 flex flex-col items-center gap-6 border-b border-white/5">
        <div class="relative w-48 h-48 rounded-2xl overflow-hidden shadow-2xl group">
          <img 
            [src]="currentTrack().coverUrl" 
            [alt]="currentTrack().title"
            referrerpolicy="no-referrer"
            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            [class.animate-pulse]="isPlaying()"
            [style.animation-duration]="'4s'"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>

        <div class="text-center w-full px-4">
          <h3 class="text-lg font-semibold text-white truncate">{{ currentTrack().title }}</h3>
          <p class="text-sm text-gray-400 truncate">{{ currentTrack().artist }}</p>
        </div>

        <!-- Progress Bar -->
        <div class="w-full flex flex-col gap-2">
          <div 
            class="h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer relative group"
            (click)="onSeek($event)"
            (keydown.enter)="onSeek($event)"
            tabindex="0"
          >
            <div 
              class="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-all duration-100 ease-linear"
              [style.width.%]="progressPercent()"
            ></div>
            <!-- Hover handle -->
            <div 
              class="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow"
              [style.left.%]="progressPercent()"
              style="transform: translate(-50%, -50%)"
            ></div>
          </div>
          <div class="flex justify-between text-[10px] font-mono text-gray-500">
            <span>{{ formatTime(currentTime()) }}</span>
            <span>{{ formatTime(duration()) }}</span>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex items-center gap-6">
          <button 
            (click)="music.previous()"
            class="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <mat-icon>skip_previous</mat-icon>
          </button>
          
          <button 
            (click)="music.togglePlay()"
            class="w-14 h-14 flex items-center justify-center rounded-full bg-emerald-500 text-black hover:bg-emerald-400 hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
          >
            <mat-icon class="scale-125">{{ isPlaying() ? 'pause' : 'play_arrow' }}</mat-icon>
          </button>
          
          <button 
            (click)="music.next()"
            class="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <mat-icon>skip_next</mat-icon>
          </button>
        </div>
        
        <!-- Volume -->
        <div class="w-full flex items-center gap-3 px-4">
          <mat-icon class="text-gray-500 text-sm">volume_down</mat-icon>
          <div 
            class="flex-1 h-1 bg-white/10 rounded-full cursor-pointer relative group"
            (click)="onVolumeChange($event)"
            (keydown.enter)="onVolumeChange($event)"
            tabindex="0"
          >
            <div 
              class="absolute top-0 left-0 h-full bg-gray-400 rounded-full"
              [style.width.%]="volume() * 100"
            ></div>
          </div>
          <mat-icon class="text-gray-500 text-sm">volume_up</mat-icon>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-4">
        <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">Up Next</h4>
        <div class="flex flex-col gap-1">
          @for (track of tracks(); track track.id; let i = $index) {
            <button 
              (click)="music.play(i)"
              class="flex items-center gap-3 p-2 rounded-xl transition-colors text-left group"
              [class.bg-white]="currentTrackIndex() === i"
              [class.bg-opacity-5]="currentTrackIndex() === i"
              [class.hover:bg-white]="currentTrackIndex() !== i"
              [class.hover:bg-opacity-5]="currentTrackIndex() !== i"
            >
              <div class="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                <img 
                  [src]="track.coverUrl" 
                  [alt]="track.title"
                  referrerpolicy="no-referrer"
                  class="w-full h-full object-cover"
                />
                @if (currentTrackIndex() === i && isPlaying()) {
                  <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div class="flex gap-0.5 items-end h-3">
                      <div class="w-0.5 bg-emerald-500 animate-[bounce_1s_infinite]"></div>
                      <div class="w-0.5 bg-emerald-500 animate-[bounce_1.2s_infinite_0.2s]"></div>
                      <div class="w-0.5 bg-emerald-500 animate-[bounce_0.8s_infinite_0.4s]"></div>
                    </div>
                  </div>
                }
              </div>
              <div class="flex-1 min-w-0">
                <p 
                  class="text-sm font-medium truncate"
                  [class.text-emerald-500]="currentTrackIndex() === i"
                  [class.text-white]="currentTrackIndex() !== i"
                >
                  {{ track.title }}
                </p>
                <p class="text-xs text-gray-500 truncate">{{ track.artist }}</p>
              </div>
              @if (currentTrackIndex() === i) {
                <mat-icon class="text-emerald-500 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  {{ isPlaying() ? 'pause' : 'play_arrow' }}
                </mat-icon>
              } @else {
                <mat-icon class="text-gray-500 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  play_arrow
                </mat-icon>
              }
            </button>
          }
        </div>
      </div>
    </div>
  `
})
export class MusicPlayerComponent {
  music = inject(MusicService);

  tracks = this.music.tracks;
  currentTrack = this.music.currentTrack;
  currentTrackIndex = this.music.currentTrackIndex;
  isPlaying = this.music.isPlaying;
  currentTime = this.music.currentTime;
  duration = this.music.duration;
  volume = this.music.volume;

  progressPercent = computed(() => {
    const dur = this.duration();
    if (!dur) return 0;
    return (this.currentTime() / dur) * 100;
  });

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  onSeek(event: MouseEvent | Event) {
    if (!(event instanceof MouseEvent)) return;
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    this.music.seek(percent * this.duration());
  }

  onVolumeChange(event: MouseEvent | Event) {
    if (!(event instanceof MouseEvent)) return;
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    this.music.setVolume(percent);
  }
}
