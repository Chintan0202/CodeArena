import { Component, EventEmitter, HostListener, Inject, OnChanges, OnInit, Output, PLATFORM_ID, ViewChild } from '@angular/core';
import { ProblemDescriptionComponent } from '../problem-description-component/problem-description-component';
import { CodeEditorComponent } from '../code-editor-component/code-editor-component';
import { Questions } from '../../Data/Questions';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-code-editor-layout-component',
  standalone: true,
  imports: [ProblemDescriptionComponent, CodeEditorComponent, ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatOptionModule, CommonModule],
  templateUrl: './code-editor-layout-component.html',
  styleUrl: './code-editor-layout-component.scss'
})
export class CodeEditorLayoutComponent implements OnInit {
  @Output() questionChange = new EventEmitter<number>();
  @ViewChild(CodeEditorComponent) codeEditorComponent!: CodeEditorComponent;
  form!: FormGroup;
  questionList = Questions
  currentQuestion = Questions[0];
  examStarted = false;
  examEndTime!: number;
  timeLeft!: number;
  minutes = 0;
  seconds = 0;
  timerInterval!: any;
  loading = true;

  constructor(
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object

  ) {
  }
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          console.log('Tab switch detected! User became inactive. Logging this activity.');
          // Do your logging here. Avoid 'alert()' as it's disruptive.
        }
      });
    }
    const endTimeStr = localStorage.getItem('examEndTime');
    if (endTimeStr) {
      this.examEndTime = parseInt(endTimeStr, 2);
      this.examStarted = true;
      this.startCountdown();
    }

    this.form = this.fb.group({
      question: [this.questionList[0].id],
    });

    this.form.get('question')?.valueChanges.subscribe((_) => {
      this.questionChange.emit(this.form.get('question')?.value);
    });
    this.loading = false;
  }
  // @HostListener('window:beforeunload', ['$event'])
  // unloadNotification($event: any): void {
  //   // If you return true or set event.returnValue to true,
  //   // the browser will show a confirmation dialog.
  //   // The exact message is determined by the browser, not your string.
  //   $event.returnValue = true; // For older browsers
  //   // return true; // Alternative for modern browsers if not using event.returnValue
  // }
  startExam() {
    const durationInMinutes = 10;
    const now = Date.now();
    this.examEndTime = now + durationInMinutes * 60 * 1000;

    localStorage.setItem('examEndTime', this.examEndTime.toString());
    this.examStarted = true;
    this.startCountdown();
  }

  startCountdown() {
    this.timerInterval = setInterval(() => {
      const now = Date.now();
      this.timeLeft = Math.floor((this.examEndTime - now) / 1000);

      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
        this.onExamTimeout();
      } else {
        this.updateTimeDisplay();
      }
    }, 1000);
  }

  updateTimeDisplay() {
    this.minutes = Math.floor(this.timeLeft / 60);
    this.seconds = this.timeLeft % 60;
  }

  onExamTimeout() {
    // this.codeEditorComponent.submitCode();
  }

  onQuestionChange(questionId: number): void {
    console.log('Question changed to:', questionId);
    this.currentQuestion = this.questionList.find((question) => question.id == questionId) || Questions[0];
  }
  startResize(event: MouseEvent) {
    event.preventDefault();
    const leftPanel = document.getElementById('leftPanel');

    const startX = event.clientX;
    const startWidth = leftPanel!.offsetWidth;

    const mouseMove = (moveEvent: MouseEvent) => {
      const newWidth = startWidth + (moveEvent.clientX - startX);
      leftPanel!.style.width = `${newWidth}px`;
    };

    const mouseUp = () => {
      document.removeEventListener('mousemove', mouseMove);
      document.removeEventListener('mouseup', mouseUp);
    };

    document.addEventListener('mousemove', mouseMove);
    document.addEventListener('mouseup', mouseUp);
  }

}
