import { Component } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CodeExecutorService } from './Services/code-executor-service';
import { HttpClientModule } from '@angular/common/http';
import { CodeEditorLayoutComponent } from './Components/code-editor-layout-component/code-editor-layout-component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    HttpClientModule,
    CodeEditorLayoutComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
// ... same imports ...
export class AppComponent {
  code: string = '';
  output: string = '';
  selectedLanguageId: number = 50;
  selectedProblemId: number = 1;
  isLoading: boolean = false;

  problems = [
    {
      id: 1,
      title: 'Sum of Two Numbers',
      description: 'Given two integers, return their sum.',
      testCases: ['3 5', '10 20'],
    },
    {
      id: 2,
      title: 'Factorial',
      description: 'Calculate factorial of a number.',
      testCases: ['5', '7'],
    },
    {
      id: 3,
      title: 'Check Prime',
      description: 'Check whether a number is prime or not.',
      testCases: ['17', '18'],
    },
    {
      id: 4,
      title: 'Fibonacci Sequence',
      description: 'Return first N Fibonacci numbers.',
      testCases: ['5', '8'],
    },
    {
      id: 5,
      title: 'Palindrome Check',
      description: 'Check whether a string is a palindrome.',
      testCases: ['racecar', 'hello'],
    },
  ];

  languages = [
    { id: 50, name: 'C (GCC 9.2.0)' },
    { id: 54, name: 'C++ (G++ 9.2.0)' },
    { id: 62, name: 'Java (OpenJDK 13.0.1)' },
    { id: 71, name: 'Python (3.8.1)' },
    { id: 63, name: 'JavaScript (Node.js 12.14.0)' },
    { id: 51, name: 'C# (Mono 6.6.0)' },
  ];

  constructor(private codeExecutor: CodeExecutorService) {}

  get selectedProblem() {
    return this.problems.find((p) => p.id === Number(this.selectedProblemId));
  }

  runCodeForAllTestCases() {
    this.output = '';
    this.isLoading = true;

    const problem = this.problems.find(
      (p) => p.id === Number(this.selectedProblemId)
    );
    if (!problem || !this.code.trim()) {
      this.output = 'Please select a problem and write your code.';
      this.isLoading = false;
      return;
    }

    let results: string[] = [];

    const runNext = (index: number) => {
      if (index >= problem.testCases.length) {
        this.output = results.join('\n\n');
        this.isLoading = false;
        return;
      }

      const input = problem.testCases[index];
      // this.codeExecutor.executeCode(this.code, input, this.selectedLanguageId).subscribe({
      //   next: (res: any) => {
      //     const out = res.stdout || res.stderr || res.compile_output || 'No output';
      //     results.push(`Test Case ${index + 1} (Input: ${input}):\n${out}`);
      //     runNext(index + 1);
      //   },
      //   error: (err: any) => {
      //     results.push(`Test Case ${index + 1} (Input: ${input}):\nError: ${JSON.stringify(err)}`);
      //     runNext(index + 1);
      //   }
      // });
    };

    runNext(0);
  }
}
