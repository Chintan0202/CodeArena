import { CommonModule, isPlatformBrowser, NgFor } from '@angular/common';
import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  PLATFORM_ID,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CodeGenerationService } from '../../Services/code-generation-service';
import { ProblemDetails, ProblemMetadata } from '../../Models/types';
import { CodeExecutorService } from '../../Services/code-executor-service';
import { MonacoEditorComponent } from '../monaco-editor/monaco-editor.component';

@Component({
  selector: 'app-code-editor',
  standalone: true,
  templateUrl: './code-editor-component.html',
  styleUrl: './code-editor-component.scss',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    CommonModule,
    NgFor,
    MatOptionModule,
    MonacoEditorComponent
  ],
})
export class CodeEditorComponent implements OnInit, OnChanges {
  @Output() codeChange = new EventEmitter<string>();
  @Output() languageChange = new EventEmitter<number>();
  @Input() selectedQuestion?: ProblemDetails;
  form!: FormGroup;
  isBrowser = false;
  languages = [
    { id: 50, name: 'C (GCC 9.2.0)' },
    { id: 54, name: 'C++ (G++ 9.2.0)' },
    { id: 62, name: 'Java (OpenJDK 13.0.1)' },
    { id: 71, name: 'Python (3.8.1)' },
    { id: 63, name: 'JavaScript (Node.js 12.14.0)' },
    { id: 51, name: 'C# (Mono 6.6.0)' },
  ];
  testResults: {
    passed: boolean;
    expected: string | null;
    actual: string | null;
    compileError?: string;
    hasCompileError?: boolean;
  }[] = [];
  
  constructor(
    private fb: FormBuilder,
    private codeGenerationService: CodeGenerationService,
    private codeExecutionService: CodeExecutorService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }
  code = `function greet() {\n  console.log("Hello, world!");\n}`;

  onCodeChange(updatedCode: string) {
    console.log('Updated code:', updatedCode);
  }
  get codeControl(): FormControl {
    return this.form.get('code') as FormControl;
  }
  
  async ngOnInit() {
    this.form = this.fb.group({
      language: [this.languages[0].id],
      code: [''],  // ← Monaco now bound directly to this
    });

    this.form.get('language')?.valueChanges.subscribe(() => {
      this.languageChange.emit(this.form.get('language')?.value);
      if (this.selectedQuestion) {
        this.generateBoilerplate(this.selectedQuestion);
      }
    });

    if (this.selectedQuestion) {
      this.generateBoilerplate(this.selectedQuestion);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['selectedQuestion'] &&
      changes['selectedQuestion'].currentValue
    ) {
      if (this.selectedQuestion) {
        this.generateBoilerplate(this.selectedQuestion);
      }
    }
  }

  onLanguageChange(languageId: number): void {
    console.log('Language changed to:', languageId);
  }

  generateBoilerplate(question: ProblemDetails) {
    const selectedLangId = this.form.get('language')?.value;
    const selectedLangKey =
      this.languages.find((lang) => lang.id === selectedLangId)?.id || 54;

    const metadata: ProblemMetadata = {
      functionName: question.functionName,
      inputs: question.inputs,
      output: question.output,
    };

    const boilerplate = this.codeGenerationService.generate(selectedLangKey, metadata);
    this.form.get('code')?.setValue(boilerplate);
  }

  runCode(): void {
    const selectedLanguage = this.form.value.language;
    const code = this.form.value.code;
    console.log('Running Code...');
    console.log('Language ID:', selectedLanguage);
    console.log('Code:\n', code);
  }

  submitCode(): void {
    const selectedLanguage = this.form.value.language;
    const code = this.form.value.code;
    const payloads = this.codeGenerationService.generateJudge0PayloadBase64(
      code,
      selectedLanguage,
      this.selectedQuestion?.testCases,
      this.selectedQuestion ?? ({} as ProblemDetails)
    );
    this.codeExecutionService.executeCode(payloads).subscribe((res: any) => {
      const tokens = res.map((r: any) => r.token);
      const checkResults = () => {
        this.codeExecutionService
          .getJudge0Results(tokens)
          .subscribe((batch: any) => {
            const allDone = batch.submissions.every(
              (s: any) => s.status_id >= 3
            );

            if (allDone) {
              const testCases = this.selectedQuestion?.testCases ?? [];
    
              this.testResults = batch.submissions.map((submission: any, index: number) => {
                const expectedOutput = testCases[index]?.expectedOutput;
                const expected = JSON.stringify(expectedOutput);
              
                const hasCompileError = submission.compile_output !== null;
              
                let actual = '';
                let passed = false;
                let compileError = '';
              
                if (hasCompileError) {
                  compileError = atob(submission.compile_output); // Decode base64 error
                } else if (submission.stdout !== null) {
                  const decoded = atob((submission.stdout ?? '').trim());
                  const sanitizedActual = decoded.replace(/\s+/g, '');
                  const sanitizedExpected = expected.replace(/\s+/g, '');
                  passed = sanitizedExpected === sanitizedActual;
                  actual = decoded.trim();
                }
              
                return {
                  passed,
                  expected: hasCompileError ? null : expectedOutput,
                  actual: hasCompileError ? null : actual,
                  compileError,
                  hasCompileError
                };
              });
              
    
            } else {
              setTimeout(checkResults, 1500);
            }
          });
      };

      checkResults();

      // Here you would send the code to the server for submission
    });
  }
}
