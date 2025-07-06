import { CommonModule, isPlatformBrowser, NgFor } from '@angular/common';
import {
  Component,
  effect,
  EventEmitter,
  inject,
  Inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  PLATFORM_ID,
  signal,
  SimpleChanges,
  DestroyRef // Import DestroyRef for automatic unsubscription
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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  private destroyRef = inject(DestroyRef); // Injects DestroyRef for automatic unsubscription

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
    isHidden?: boolean;
  }[] = [];
  isLoading: boolean = false;
  isPersonalInputEnabled: boolean = false;
  isEditorReadonly = true;
  examStarted = signal(false); // Signal to track if exam has started
  currentSubmissionId = signal<number | null>(null); // Signal to store the current submission ID for autosave
  autoSaveIntervalId: any; // Stores the interval ID for clearing
  isFinalSubmissionHappen: boolean = false;
  constructor(
    private fb: FormBuilder,
    private codeGenerationService: CodeGenerationService,
    private codeExecutionService: CodeExecutorService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private dialog: MatDialog,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    // Angular effect to manage autosave interval based on examStarted signal
    effect(() => {
      if (this.examStarted()) {
        // Clear any existing interval to prevent duplicates
        if (this.autoSaveIntervalId) {
          clearInterval(this.autoSaveIntervalId);
        }
        // Set new autosave interval
        this.autoSaveIntervalId = setInterval(() => {
          // Call autosave with the current submission ID from the signal
          this.onTemporarySave(true, this.currentSubmissionId());
        }, 30000); // Autosave every 1 minute

        // Automatically clear interval when component is destroyed
        this.destroyRef.onDestroy(() => {
          clearInterval(this.autoSaveIntervalId);
          this.autoSaveIntervalId = null;
        });
      } else {
        // If exam is not started or has ended, clear the interval
        clearInterval(this.autoSaveIntervalId);
        this.autoSaveIntervalId = null;
      }
    });
  }

  onCodeChange(updatedCode: string) {
    // Emits the updated code to any parent component listening
    this.codeChange.emit(updatedCode);
  }

  get codeControl(): FormControl {
    return this.form.get('code') as FormControl;
  }

  async ngOnInit() {
    this.form = this.fb.group({
      language: [{ value: this.languages[0].id, disabled: this.isFinalSubmissionHappen }],
      code: [''],
      input: [''],
      output: [{ value: '', disabled: true }],
      isPersonalInputEnabled: false
    });

    // Subscribe to language changes to regenerate boilerplate code

    // Attempt to load a previous submission if ID exists in localStorage
    const storedSubmissionId = Number(localStorage.getItem('submissionId'));
    if (storedSubmissionId && !isNaN(storedSubmissionId)) {
      this.currentSubmissionId.set(storedSubmissionId); // Set the signal with the stored ID
      this.getSubmission(storedSubmissionId);
    }
    else{
      this.form.get('language')?.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef)) // Automatically unsubscribe
        .subscribe(() => {
          this.languageChange.emit(this.form.get('language')?.value);
          if (this.selectedQuestion) {
            this.generateBoilerplate(this.selectedQuestion);
          }
        });
  
      // Generate boilerplate for the initially selected question
      if (this.selectedQuestion) {
        this.generateBoilerplate(this.selectedQuestion);
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // React to changes in the selectedQuestion Input property
    if (
      changes['selectedQuestion'] &&
      changes['selectedQuestion'].currentValue
    ) {
      if (this.selectedQuestion) {
        // this.generateBoilerplate(this.selectedQuestion);
        // Reset results when a new question is selected
        this.testResults = [];
        this.form.get('output')?.patchValue('');
      }
    }
  }

  onLanguageChange(languageId: number): void {
    console.log('Language changed to:', languageId);
    // This method is redundant as language change is handled by valueChanges subscription in ngOnInit
  }

  /**
   * Generates boilerplate code for the selected language and question.
   * @param question The problem details to generate boilerplate for.
   */
  generateBoilerplate(question: ProblemDetails) {
    const selectedLangId = this.form.get('language')?.value;
    const selectedLangKey =
      this.languages.find((lang) => lang.id === selectedLangId)?.id || 54; // Default to C++

    const metadata: ProblemMetadata = {
      functionName: question.functionName,
      inputs: question.inputs,
      output: question.output,
    };

    const boilerplate = this.codeGenerationService.generate(selectedLangKey, metadata);
    this.form.get('code')?.setValue(boilerplate);
  }

  /**
   * Executes code against a single input (personal input) using Judge0.
   */
  runCode(): void {
    const code = this.form.value.code;
    const selectedLanguage = this.form.value.language;
    const input = this.form.get('input')?.value;

    // Judge0 run API expects a single payload
    const payload = {
      source_code: btoa(code),
      language_id: selectedLanguage,
      stdin: btoa(input)
    };

    this.executeCodeOnJudge0([payload], false); // Pass isBatch = false for single run
  }

  /**
   * Submits code to Judge0 for evaluation against all test cases (user-initiated test).
   */
  submitCode(): void {
    const code = this.form.value.code;
    const selectedLanguage = this.form.value.language;

    // Generate payloads for all test cases
    const payloads = this.codeGenerationService.generateJudge0PayloadBase64(
      code,
      selectedLanguage,
      this.selectedQuestion?.testCases,
      this.selectedQuestion ?? ({} as ProblemDetails)
    );

    this.executeCodeOnJudge0(payloads, true); // Pass isBatch = true for multiple test cases
  }

  /**
   * Submits code as part of the exam (can be user-initiated or timeout auto-submit).
   * It evaluates against all test cases and potentially triggers final save.
   * @param timeOut True if the submission is due to a timer timeout.
   */
  submitExam(timeOut: boolean): void {
    const code = this.form.value.code;
    const selectedLanguage = this.form.value.language;

    const payloads = this.codeGenerationService.generateJudge0PayloadBase64(
      code,
      selectedLanguage,
      this.selectedQuestion?.testCases,
      this.selectedQuestion ?? ({} as ProblemDetails)
    );

    this.executeCodeOnJudge0(payloads, true, true, timeOut); // Pass isExamSubmission = true and timeOut status
    clearInterval(this.autoSaveIntervalId); // Stop autosave
    this.autoSaveIntervalId = null;
    this.isEditorReadonly = true; // Make editor readonly after submission
    this.isFinalSubmissionHappen = true;
  }

  /**
   * Generic method to handle code execution and result processing from Judge0.
   * Reduces code duplication between runCode, submitCode, and submitExam.
   * @param payloads An array of Judge0 submission payloads.
   * @param isBatch True if processing multiple test cases (submitCode/submitExam).
   * @param isExamSubmission True if this is a final exam submission.
   * @param isTimeOut True if the exam submission is due to timeout.
   */
  private executeCodeOnJudge0(
    payloads: any[],
    isBatch: boolean,
    isExamSubmission: boolean = false,
    isTimeOut: boolean = false
  ): void {
    this.isLoading = true;
    this.testResults = [];
    this.form.get('output')?.patchValue('');

    const executionObservable = isBatch
      ? this.codeExecutionService.executeCode(payloads) // For multiple test cases (submit/exam)
      : this.codeExecutionService.runCode(payloads[0]); // For single run (personal input)

    executionObservable.subscribe({
      next: (res: any) => {
        const tokens = isBatch ? res.map((r: any) => r.token) : [res.token];

        const checkResults = () => {
          const resultsObservable = isBatch
            ? this.codeExecutionService.getJudge0Results(tokens)
            : this.codeExecutionService.getJudge0ResultsRun(tokens[0]);

          resultsObservable.subscribe({
            next: (batchOrOutput: any) => {
              const submissions = isBatch ? batchOrOutput.submissions : [batchOrOutput];
              const allDone = submissions.every((s: any) => s.status_id >= 3); // Status ID 3 means Accepted, 4 means Wrong Answer, etc.

              if (allDone) {
                this.isLoading = false;
                const testCases = this.selectedQuestion?.testCases ?? [];
                let isPerfectSolution: boolean = true; // Tracks if all tests passed for exam submission

                this.testResults = submissions.map((submission: any, index: number) => {
                  const expectedOutput = testCases[index]?.expectedOutput;
                  const isHidden = testCases[index]?.isHidden;
                  // Stringify expectedOutput for robust comparison
                  const expected = JSON.stringify(expectedOutput);

                  const hasCompileError = submission.compile_output !== null;
                  let actual = '';
                  let passed = false;
                  let compileError = '';

                  if (hasCompileError) {
                    compileError = atob(submission.compile_output);
                    if (isExamSubmission) isPerfectSolution = false; // Compile error means not perfect
                  } else if (submission.stdout !== null) {
                    const decoded = atob((submission.stdout ?? '').trim());
                    // Normalize line endings and remove all whitespace for strict comparison
                    const sanitizedActual = decoded.replace(/\r\n/g, '\n').replace(/\s+/g, '').trim();
                    const sanitizedExpected = expected.replace(/\r\n/g, '\n').replace(/\s+/g, '').trim();
                    passed = sanitizedExpected === sanitizedActual; // Strict equality check
                    if (isExamSubmission && !passed) {
                      isPerfectSolution = false;
                    }
                    actual = decoded.trim();
                  } else if (submission.stderr !== null) { // Handle runtime errors or other execution issues
                    actual = atob(submission.stderr).trim();
                    passed = false; // Runtime error means it didn't pass
                    if (isExamSubmission) isPerfectSolution = false;
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

                // Logic specific to personal input run (display output directly)
                if (!isBatch && submissions.length > 0) {
                  if (submissions[0].compile_output !== null) {
                    this.form.get('output')?.patchValue(atob(submissions[0].compile_output));
                  } else if (submissions[0].stdout !== null) {
                    this.form.get('output')?.patchValue(atob(submissions[0].stdout));
                  } else if (submissions[0].stderr !== null) {
                    this.form.get('output')?.patchValue(atob(submissions[0].stderr));
                  }
                }

                // Logic specific to exam submission
                if (isExamSubmission) {
                  if (!isPerfectSolution && !isTimeOut) {
                    // If not perfect solution and not a timeout, ask for confirmation
                    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
                      width: '400px',
                      panelClass: 'custom-dialog-container'
                    });
                    dialogRef.afterClosed().subscribe(result => {
                      if (result) {
                        this.onSave(true); // User confirmed, submit
                      }
                    });
                  } else {
                    // If perfect solution or timeout, submit immediately
                    this.onSave(true);
                  }
                }

              } else {
                // If not all submissions are done, poll again after a delay
                setTimeout(checkResults, 1500);
              }
            },
            error: (err) => {
              this.isLoading = false;
              this.snackBar.open('Error fetching code execution results. Please try again.', 'Close', { duration: 3000 });
              console.error('Error getting Judge0 results:', err);
            }
          });
        };
        checkResults();
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('Error submitting code for execution. Please try again.', 'Close', { duration: 3000 });
        console.error('Error submitting code to Judge0:', err);
      }
    });
  }

  /**
   * Called when the exam timer starts. Enables the editor and triggers initial save.
   */
  onExamStarted() {
    this.isEditorReadonly = false; // Make editor editable
    this.examStarted.set(true); // Update examStarted signal
    // If no submission ID exists yet, create a new temporary submission
    if (this.currentSubmissionId() === null) {
      this.onTemporarySave(false);
    }
  }

  /**
   * Called when the exam timer runs out. Auto-submits the exam.
   */
  onTimeUp() {
    this.snackBar.open('Time is up! Your exam has been auto-submitted.', 'Close', {
      duration: 5000,
      panelClass: 'snackbar-success',
      horizontalPosition: 'end',
      verticalPosition: 'bottom'
    });
    this.submitExam(true); // Submit exam, indicating it's a timeout submission
    clearInterval(this.autoSaveIntervalId); // Stop autosave
    this.autoSaveIntervalId = null;
    this.isEditorReadonly = true; // Make editor readonly after submission
    this.isFinalSubmissionHappen = true;
  }

  /**
   * Saves the current code, marking it as a final submission if isSubmitted is true.
   * Creates a new submission or updates an existing one.
   * @param isSubmitted True if this save is to finalize the exam submission.
   */
  onSave(isSubmitted: boolean) {
    const requestObj: createSubmission = {
      code: btoa(this.form.value.code),
      languageId: this.form.value.language,
      studentId: 1, 
      isSubmitted,
      questionId: 1 
    }

    if (this.currentSubmissionId()) {
      // If a submission ID exists, update the existing submission
      this.codeExecutionService.updateSubmission(requestObj, this.currentSubmissionId()!)
        .subscribe({
          next: () => {
            this.snackBar.open(isSubmitted ? 'Exam submitted successfully!' : 'Code saved successfully!', 'Close', {
              duration: 3000,
              panelClass: 'snackbar-success',
              horizontalPosition: 'end',
              verticalPosition: 'bottom'
            });
          },
          error: (err) => {
            this.snackBar.open('Failed to save/submit code. Please try again.', 'Close', { duration: 3000 });
            console.error('Error updating submission:', err);
          }
        });
    } else {
      // If no submission ID, create a new submission
      this.codeExecutionService.createSubmission(requestObj)
        .subscribe({
          next: (res: any) => {
            if (res.submissionId) {
              this.currentSubmissionId.set(res.submissionId); // Update the signal
              localStorage.setItem('submissionId', res.submissionId); // Store in localStorage (FIXED TYPO HERE)
              this.snackBar.open(isSubmitted ? 'Exam submitted successfully!' : 'Code saved successfully!', 'Close', {
                duration: 3000,
                panelClass: 'snackbar-success',
                horizontalPosition: 'end',
                verticalPosition: 'bottom'
              });
              // No need to call getSubmission after creation here, as we already have the code and ID.
            }
          },
          error: (err) => {
            this.snackBar.open('Failed to save/submit code. Please try again.', 'Close', { duration: 3000 });
            console.error('Error creating submission:', err);
          }
        });
    }
  }

  /**
   * Saves the current code temporarily for autosave purposes.
   * @param isUpdate True if updating an existing submission, false if creating a new one.
   * @param submissionId The ID of the submission to update, if applicable.
   */
  onTemporarySave(isUpdate: boolean, submissionId?: number | null) {
    const requestObj: createSubmission = {
      code: btoa(this.form.value.code),
      languageId: this.form.value.language,
      studentId: 1, // TODO: Replace with dynamic student ID
      isSubmitted: false, // Temporary saves are never marked as submitted
      questionId: 1 // TODO: Replace with dynamic question ID
    }
    if(this.isFinalSubmissionHappen){
      return
    }
    let apiObservable;
    if (isUpdate && submissionId) {
      apiObservable = this.codeExecutionService.updateSubmission(requestObj, submissionId);
    } else {
      apiObservable = this.codeExecutionService.createSubmission(requestObj);
    }

    apiObservable.subscribe({
      next: (res: any) => {
        if (res.submissionId) {
          if (!isUpdate) { // If it was a create operation, set the new submission ID
            this.currentSubmissionId.set(res.submissionId);
            localStorage.setItem('submissionId', res.submissionId); // Store in localStorage (FIXED TYPO HERE)
          }
          else {
            this.snackBar.open('Your code saved!', 'Close', {
              duration: 3000,
              panelClass: 'snackbar-success',
              horizontalPosition: 'end',
              verticalPosition: 'bottom'
            });
          }
        }
      },
      error: (err) => {
        this.snackBar.open('Autosave failed. Please check your connection.', 'Close', { duration: 3000 });
        console.error('Autosave error:', err);
      }
    });
  }

  /**
   * Fetches a previous submission by its ID and loads the code and language into the editor.
   * @param submissionId The ID of the submission to retrieve.
   */
  getSubmission(submissionId: number) {
    this.codeExecutionService.getSubmission(submissionId).subscribe({
      next: (res: any) => {
        if (res) {
          this.form.get('code')?.patchValue(atob(res.code));
          this.form.get('language')?.setValue(res.languageId); // Load the saved language
          this.currentSubmissionId.set(submissionId); // Ensure the signal holds the correct ID
          this.isFinalSubmissionHappen = res.isSubmitted
        }
      },
      error: (err) => {
        this.snackBar.open('Failed to load previous submission.', 'Close', { duration: 3000 });
        console.error('Error getting submission:', err);
      }
    });
  }
}