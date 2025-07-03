import { CommonModule, isPlatformBrowser, NgFor } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
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
import { createSubmission, ProblemDetails, ProblemMetadata } from '../../Models/types';
import { CodeExecutorService } from '../../Services/code-executor-service';
import { MonacoEditorComponent } from '../monaco-editor/monaco-editor.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog-component';
import { TimerComponent } from '../timer/timer.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

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
    MonacoEditorComponent,
    MatCheckboxModule,
    ConfirmationDialogComponent,
    TimerComponent,
    MatSnackBarModule
  ],
})
export class CodeEditorComponent implements OnInit, OnChanges {
  @Output() codeChange = new EventEmitter<string>();
  @Output() languageChange = new EventEmitter<number>();
  @Input() selectedQuestion?: ProblemDetails;
  private snackBar = inject(MatSnackBar);
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
    isHidden?: boolean
  }[] = [];
  isLoading: boolean = false;
  isPersonalInputEnabled: boolean = false;
  isEditorReadonly = true;
  constructor(
    private fb: FormBuilder,
    private codeGenerationService: CodeGenerationService,
    private codeExecutionService: CodeExecutorService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private dialog: MatDialog,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }
  onCodeChange(updatedCode: string) {
    console.log('Updated code:', updatedCode);
  }
  get codeControl(): FormControl {
    return this.form.get('code') as FormControl;
  }

  async ngOnInit() {
    this.form = this.fb.group({
      language: [this.languages[0].id],
      code: [atob("I2luY2x1ZGUgPGlvc3RyZWFtPgojaW5jbHVkZSA8dmVjdG9yPgojaW5jbHVkZSA8dW5vcmRlcmVkX21hcD4KI2luY2x1ZGUgPHNzdHJlYW0+CnVzaW5nIG5hbWVzcGFjZSBzdGQ7CiAKY2xhc3MgU29sdXRpb24gewpwdWJsaWM6CiAgICB2ZWN0b3I8aW50PiB0d29TdW0odmVjdG9yPGludD4gbnVtYmVycywgaW50IHRhcmdldCkgewogICAgICAgIHVub3JkZXJlZF9tYXA8aW50LCBpbnQ+IHNlZW47CiAgICAgICAgZm9yIChpbnQgaSA9IDA7IGkgPCBudW1iZXJzLnNpemUoKTsgKytpKSB7CiAgICAgICAgICAgIGludCBjb21wbGVtZW50ID0gdGFyZ2V0IC0gbnVtYmVyc1tpXTsKICAgICAgICAgICAgaWYgKHNlZW4uY291bnQoY29tcGxlbWVudCkpIHsKICAgICAgICAgICAgICAgIHJldHVybiB7c2Vlbltjb21wbGVtZW50XSwgaX07CiAgICAgICAgICAgIH0KICAgICAgICAgICAgc2VlbltudW1iZXJzW2ldXSA9IGk7CiAgICAgICAgfQogICAgICAgIHJldHVybiB7fTsKICAgIH0KfTsKIAppbnQgbWFpbigpIHsKICAgIGlvc19iYXNlOjpzeW5jX3dpdGhfc3RkaW8oZmFsc2UpOwogICAgY2luLnRpZShOVUxMKTsKIAogICAgdmVjdG9yPGludD4gbnVtYmVyczsKICAgIGludCB0YXJnZXQ7CiAKICAgIHN0cmluZyBsaW5lOwogCQogICAgLy8gUmVhZCB0aGUgZmlyc3QgbGluZTogWzIsNywxMSwxNV0KICAgIGdldGxpbmUoY2luLCBsaW5lKTsKICAgIC8vIFJlbW92ZSBicmFja2V0cwogICAgaWYgKCFsaW5lLmVtcHR5KCkgJiYgbGluZS5mcm9udCgpID09ICdbJykgbGluZS5lcmFzZSgwLCAxKTsKICAgIGlmICghbGluZS5lbXB0eSgpICYmIGxpbmUuYmFjaygpID09ICddJykgbGluZS5wb3BfYmFjaygpOwogCiAgICAvLyBTcGxpdCBieSBjb21tYQogICAgaXN0cmluZ3N0cmVhbSBpc3MobGluZSk7CiAgICBzdHJpbmcgbnVtU3RyOwogICAgd2hpbGUgKGdldGxpbmUoaXNzLCBudW1TdHIsICcsJykpIHsKICAgICAgICBudW1iZXJzLnB1c2hfYmFjayhzdG9pKG51bVN0cikpOwogICAgfQogCiAgICAvLyBSZWFkIHRoZSBzZWNvbmQgbGluZTogOQogICAgZ2V0bGluZShjaW4sIGxpbmUpOwogICAgdGFyZ2V0ID0gc3RvaShsaW5lKTsKIAogICAgU29sdXRpb24gc29sOwogICAgdmVjdG9yPGludD4gcmVzdWx0ID0gc29sLnR3b1N1bShudW1iZXJzLCB0YXJnZXQpOwogCiAgICAvLyBPdXRwdXQgaW4gW3gsIHldIGZvcm1hdAogICAgY291dCA8PCAiWyI7CiAgICBmb3IgKHNpemVfdCBpID0gMDsgaSA8IHJlc3VsdC5zaXplKCk7ICsraSkgewogICAgICAgIGNvdXQgPDwgcmVzdWx0W2ldOwogICAgICAgIGlmIChpICsgMSA8IHJlc3VsdC5zaXplKCkpIGNvdXQgPDwgIiwgIjsKICAgIH0KICAgIGNvdXQgPDwgIl1cbiI7CiAKICAgIHJldHVybiAwOwp9")],
      input: [''],
      output: [{ value: '', disabled: true }],
      isPersonalInputEnabled: false
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
    // this.form.get('code')?.setValue(boilerplate);
  }

  runCode(): void {
    this.isLoading = true;
    this.testResults = [];
    this.form.get('output')?.patchValue('');
    const selectedLanguage = this.form.value.language;
    const input = this.form.get('input')?.value;
    const code = this.form.value.code;
    const payload = {
      source_code: btoa(code),
      language_id: selectedLanguage,
      stdin: btoa(input)
    }
    this.codeExecutionService.runCode(payload).subscribe((res: any) => {
      const checkResults = () => {
        this.codeExecutionService
          .getJudge0ResultsRun(res.token)
          .subscribe((output: any) => {
            console.log(output);
            if (output.status_id >= 3) {
              this.isLoading = false;
              const hasCompileError = output.compile_output !== null;
              if (hasCompileError) {
                this.form.get('output')?.patchValue(atob(output.compile_output))
              } else if (output.stdout !== null) {
                this.form.get('output')?.patchValue(atob(output.stdout))
              }
              else if (output.stderr !== null) {
                this.form.get('output')?.patchValue(atob(output.stderr))
              }
            }
            else {
              setTimeout(checkResults, 1500);
            }
          });
      };

      checkResults();
    });
  }

  submitCode(): void {
    this.isLoading = true;
    this.testResults = [];
    this.form.get('output')?.patchValue('');
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
              this.isLoading = false;
              const testCases = this.selectedQuestion?.testCases ?? [];

              this.testResults = batch.submissions.map((submission: any, index: number) => {
                const expectedOutput = testCases[index]?.expectedOutput;
                const isHidden = testCases[index]?.isHidden
                const expected = JSON.stringify(expectedOutput);

                const hasCompileError = submission.compile_output !== null;

                let actual = '';
                let passed = false;
                let compileError = '';

                if (hasCompileError) {
                  compileError = atob(submission.compile_output);
                } else if (submission.stdout !== null) {
                  const decoded = atob((submission.stdout ?? '').trim());
                  const sanitizedActual = decoded.replace(/\r\n/g, '\n').replace(/\s+/g, '').trim();
                  const sanitizedExpected = expected.replace(/\r\n/g, '\n').replace(/\s+/g, '').trim();
                  passed = sanitizedExpected == sanitizedActual;
                  actual = decoded.trim();
                }

                return {
                  passed,
                  expected: hasCompileError ? null : expectedOutput,
                  actual: hasCompileError ? null : actual,
                  compileError,
                  hasCompileError,
                  isHidden
                };
              });


            } else {
              setTimeout(checkResults, 1500);
            }
          });
      };

      checkResults();
    });
  }

  submitExam(timeOut: boolean): void {
    this.isLoading = true;
    this.testResults = [];
    this.form.get('output')?.patchValue('');
    let isPerfectSolution: boolean = true;
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
              this.isLoading = false;
              const testCases = this.selectedQuestion?.testCases ?? [];

              this.testResults = batch.submissions.map((submission: any, index: number) => {
                const expectedOutput = testCases[index]?.expectedOutput;
                const isHidden = testCases[index]?.isHidden
                const expected = JSON.stringify(expectedOutput);

                const hasCompileError = submission.compile_output !== null;

                let actual = '';
                let passed = false;
                let compileError = '';

                if (hasCompileError) {
                  compileError = atob(submission.compile_output);
                  isPerfectSolution = false;
                } else if (submission.stdout !== null) {
                  const decoded = atob((submission.stdout ?? '').trim());
                  const sanitizedActual = decoded.replace(/\r\n/g, '\n').replace(/\s+/g, '').trim();
                  const sanitizedExpected = expected.replace(/\r\n/g, '\n').replace(/\s+/g, '').trim();
                  passed = sanitizedExpected == sanitizedActual;
                  if (!passed) {
                    isPerfectSolution = false;
                  }
                  actual = decoded.trim();
                }
                return {
                  passed,
                  expected: hasCompileError ? null : expectedOutput,
                  actual: hasCompileError ? null : actual,
                  compileError,
                  hasCompileError,
                  isHidden
                };
              });
              if (!isPerfectSolution && !timeOut) {
                const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
                  width: '400px',
                  panelClass: 'custom-dialog-container'
                });
                dialogRef.afterClosed().subscribe(result => {
                  if (result) {

                  }
                });
              }

            } else {
              setTimeout(checkResults, 1500);
            }
          });
      };

      checkResults();
    });
  }
  onExamStarted() {
    this.isEditorReadonly = false;
  }

  onTimeUp() {
    this.snackBar.open('Time is up! Your exam has been auto-submitted.', 'Close', {
      duration: 5000,
      panelClass: 'snackbar-success',
      horizontalPosition: 'end',
      verticalPosition: 'bottom'
    });
    this.submitExam(true);
    this.isEditorReadonly = true;
  }

  onSave(isSubmitted: boolean) {
    const requestObj: createSubmission = {
      code: atob(this.form.value.code),
      languageId: this.form.value.language,
      studentId: 1,
      isSubmitted,
      questionId: 1
    }
    this.codeExecutionService.createSubmission(requestObj).subscribe((res: any) => {
      if (res.submissionId) {
        this.snackBar.open('Your exam has been auto-submitted succesfully', 'Close', {
          duration: 5000,
          panelClass: 'snackbar-success',
          horizontalPosition: 'end',
          verticalPosition: 'bottom'
        });
      }
    });
  }
}
