import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  signal
} from '@angular/core';

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timer.component.html',
  styleUrl: './timer.component.scss'
})
export class TimerComponent implements OnInit, OnDestroy {
  private readonly STORAGE_KEY = 'countdown_end_time';
  private readonly DEFAULT_TIME = 5 * 60; 

  @Output() timerCompleted = new EventEmitter<void>();
  @Output() examStarted = new EventEmitter<void>();

  timeLeft = signal(this.DEFAULT_TIME);
  isRunning = signal(false);

  private timerInterval: any;

  ngOnInit(): void {
    const endTime = localStorage.getItem(this.STORAGE_KEY);
    if (endTime) {
      this.examStarted.emit();
      const end = parseInt(endTime, 10);
      const remaining = Math.floor((end - Date.now()) / 1000);
      this.timeLeft.set(remaining > 0 ? remaining : 0);

      if (remaining > 0) {
        this.startTimerInternal(end);
      } else {
        this.handleTimerEnd();
      }
    }

    effect(() => {
      const remaining = this.timeLeft();
      if (remaining <= 0) {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    });
  }

  toggleTimer(): void {
    if (this.isRunning()) {
      this.pauseTimer();
    } else {
      this.examStarted.emit();
      const endTime = Date.now() + this.timeLeft() * 1000;
      localStorage.setItem(this.STORAGE_KEY, endTime.toString());
      this.startTimerInternal(endTime);
    }
  }

  private startTimerInternal(endTime: number): void {
    this.isRunning.set(true);

    this.timerInterval = setInterval(() => {
      const secondsLeft = Math.floor((endTime - Date.now()) / 1000);
      this.timeLeft.set(secondsLeft > 0 ? secondsLeft : 0);

      if (secondsLeft <= 0) {
        this.pauseTimer();
        this.handleTimerEnd();
      }
    }, 1000);
  }

  private handleTimerEnd() {
    this.timeLeft.set(this.DEFAULT_TIME);
    this.timerCompleted.emit();
    localStorage.removeItem(this.STORAGE_KEY);
  }

  pauseTimer(): void {
    this.isRunning.set(false);
    clearInterval(this.timerInterval);
  }

  resetTimer(): void {
    this.pauseTimer();
    this.timeLeft.set(this.DEFAULT_TIME);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  formatTime(seconds: number): string {
    const min = Math.floor(seconds / 60).toString().padStart(2, '0');
    const sec = (seconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  }

  ngOnDestroy(): void {
    this.pauseTimer();
  }
}
