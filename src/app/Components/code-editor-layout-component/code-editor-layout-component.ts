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

    this.form = this.fb.group({
      question: [this.questionList[0].id],
    });

    this.form.get('question')?.valueChanges.subscribe((_) => {
      this.questionChange.emit(this.form.get('question')?.value);
    });
    this.loading = false;
  }


  onQuestionChange(questionId: number): void {
    console.log('Question changed to:', questionId);
    this.currentQuestion = this.questionList.find((question) => question.id == questionId) || Questions[0];
  }
  startResize(event: MouseEvent) {
    event.preventDefault();
  
    const leftPanel = document.getElementById('leftPanel');
    const rightPanel = document.getElementById('rightPanel');
  
    const startX = event.clientX;
    const startWidth = leftPanel!.offsetWidth;
  
    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = startWidth + delta;
  
      // Apply boundaries
      if (newWidth >= 200 && newWidth <= window.innerWidth * 0.8) {
        leftPanel!.style.width = `${newWidth}px`;
      }
    };
  
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }
  

}
