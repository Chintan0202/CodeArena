import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ProblemDescriptionComponent } from '../problem-description-component/problem-description-component';
import { CodeEditorComponent } from '../code-editor-component/code-editor-component';
import { Questions } from '../../Data/Questions';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NgFor } from '@angular/common';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-code-editor-layout-component',
  standalone: true,
  imports: [ProblemDescriptionComponent, CodeEditorComponent, ReactiveFormsModule, MatFormFieldModule,
    MatSelectModule,
    MatInputModule, NgFor, MatOptionModule],
  templateUrl: './code-editor-layout-component.html',
  styleUrl: './code-editor-layout-component.scss'
})
export class CodeEditorLayoutComponent implements OnInit {
  @Output() questionChange = new EventEmitter<number>();
  form!: FormGroup;
  questionList = Questions
  currentQuestion = Questions[0];
  constructor(
    private fb: FormBuilder,
  ) { }
  ngOnInit(): void {
    this.form = this.fb.group({
      question: [this.questionList[0].id],
    });

    this.form.get('question')?.valueChanges.subscribe((_) => {
      this.questionChange.emit(this.form.get('question')?.value);
    });
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
