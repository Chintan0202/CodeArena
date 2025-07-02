import { Component, EventEmitter, HostListener, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { ProblemDescriptionComponent } from '../problem-description-component/problem-description-component';
import { CodeEditorComponent } from '../code-editor-component/code-editor-component';
import { Questions } from '../../Data/Questions';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
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
  @HostListener('window:beforeunload', ['$event'])
unloadNotification($event: any): void {
  $event.preventDefault();
  $event.returnValue = ''; 
}
  constructor(
    private fb: FormBuilder,
  ) {
   }
  ngOnInit(): void {
    if(document) {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          // alert('Tab switch detected! Your activity will be logged.');
        }
      });
    }
    const endTimeStr = localStorage.getItem('examEndTime');
    if (endTimeStr) {
      this.examEndTime = parseInt(endTimeStr, 2);
      this.examStarted = true;
      this.startCountdown();
    }
    // window.addEventListener('blur', () => {
    //   alert('Tab switch detected! Your activity will be logged.');
    // });
  
    // // On window regain focus
    // window.addEventListener('focus', () => {
    //   // alert('Tab switch detected! Your activity will be logged.');
    // });
    this.form = this.fb.group({
      question: [this.questionList[0].id],
    });

    this.form.get('question')?.valueChanges.subscribe((_) => {
      this.questionChange.emit(this.form.get('question')?.value);
    });
    this.loading = false;
  }

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
