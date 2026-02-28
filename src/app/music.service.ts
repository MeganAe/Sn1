import { Injectable, signal, computed, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  coverUrl: string;
}

const DEFAULT_TRACKS: Track[] = [
  {
    id: '1',
    title: 'Neon Nights',
    artist: 'Synthwave Explorer',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    coverUrl: 'https://picsum.photos/seed/neon/400/400?blur=2'
  },
  {
    id: '2',
    title: 'Digital Horizon',
    artist: 'Cybernetic Dreams',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    coverUrl: 'https://picsum.photos/seed/cyber/400/400?blur=2'
  },
  {
    id: '3',
    title: 'Retro Arcade',
    artist: '8-Bit Hero',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    coverUrl: 'https://picsum.photos/seed/arcade/400/400?blur=2'
  },
  {
    id: '4',
    title: 'Deep Space',
    artist: 'Void Walker',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    coverUrl: 'https://picsum.photos/seed/space/400/400?blur=2'
  },
  {
    id: '5',
    title: 'Chill Vibes',
    artist: 'Lo-Fi Beats',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    coverUrl: 'https://picsum.photos/seed/chill/400/400?blur=2'
  }
];

@Injectable({ providedIn: 'root' })
export class MusicService {
  private audio: HTMLAudioElement | null = null;
  private platformId = inject(PLATFORM_ID);
  
  tracks = signal<Track[]>(DEFAULT_TRACKS);
  currentTrackIndex = signal<number>(0);
  isPlaying = signal<boolean>(false);
  currentTime = signal<number>(0);
  duration = signal<number>(0);
  volume = signal<number>(0.5);

  currentTrack = computed(() => this.tracks()[this.currentTrackIndex()]);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.audio = new Audio();
      this.audio.volume = this.volume();

      this.audio.addEventListener('timeupdate', () => {
        this.currentTime.set(this.audio!.currentTime);
      });

      this.audio.addEventListener('loadedmetadata', () => {
        this.duration.set(this.audio!.duration);
      });

      this.audio.addEventListener('ended', () => {
        this.next();
      });
    }

    // Effect to handle track changes
    effect(() => {
      const track = this.currentTrack();
      if (this.audio && track && this.audio.src !== track.url) {
        this.audio.src = track.url;
        this.audio.load();
        if (this.isPlaying()) {
          this.audio.play().catch(e => console.error('Playback failed', e));
        }
      }
    });

    // Effect to handle play/pause
    effect(() => {
      if (this.audio) {
        if (this.isPlaying()) {
          if (this.audio.paused) {
            this.audio.play().catch(e => console.error('Playback failed', e));
          }
        } else {
          if (!this.audio.paused) {
            this.audio.pause();
          }
        }
      }
    });

    // Effect to handle volume
    effect(() => {
      if (this.audio) {
        this.audio.volume = this.volume();
      }
    });
  }

  togglePlay() {
    this.isPlaying.update(v => !v);
  }

  play(index: number) {
    this.currentTrackIndex.set(index);
    this.isPlaying.set(true);
  }

  next() {
    this.currentTrackIndex.update(i => (i + 1) % this.tracks().length);
  }

  previous() {
    this.currentTrackIndex.update(i => (i - 1 + this.tracks().length) % this.tracks().length);
  }

  seek(time: number) {
    if (this.audio) {
      this.audio.currentTime = time;
      this.currentTime.set(time);
    }
  }

  setVolume(vol: number) {
    this.volume.set(Math.max(0, Math.min(1, vol)));
  }
}
