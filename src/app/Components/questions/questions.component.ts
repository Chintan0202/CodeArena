import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { CodeExecutorService } from '../../Services/code-executor-service';

@Component({
  selector: 'app-questions',
  standalone: true,
  imports: [CommonModule, RouterModule, MatTableModule, MatPaginatorModule, MatButtonModule],
  templateUrl: './questions.component.html',
  styleUrl: './questions.component.scss'
})
export class QuestionsComponent implements OnInit {
  displayedColumns = ['title', 'action'];
  questions = [];
  paginatedQuestions = this.questions.slice(0, 5);
  pageSize = 5;
  pageIndex = 0;
  isLoading: boolean = true;

  constructor(
    private router: Router,
    private codeExecutionService: CodeExecutorService
  ) { }
  ngOnInit(): void {
    this.getQuestions();
  }
  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    const start = event.pageIndex * event.pageSize;
    const end = start + event.pageSize;
    this.paginatedQuestions = this.questions.slice(start, end);
  }

  handleAction(question: any) {
    const isPreview = !question.isPreview ? 'false' : 'true';
    this.router.navigate(['/code', question.id, isPreview]);
  }

  getQuestions() {
    this.codeExecutionService.getQuestions().subscribe({
      next: (res: any) => {
        if (res) {
          this.isLoading = false;
         this.questions = res;
         this.paginatedQuestions = res.slice(0, 5);
         console.log(this.questions);
        }
      },
      error: (err) => {
        console.error('Error getting submission:', err);
      }
    });
  }
}
