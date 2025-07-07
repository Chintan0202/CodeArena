import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  Input,
  inject,
  PLATFORM_ID,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-monaco-editor',
  standalone: true,
  templateUrl: './monaco-editor.component.html',
  styles: [`
    .editor-container {
      width: 100%;
      height: 500px;
      // border: 1px solid #ccc;
    }
  `],
})
export class MonacoEditorComponent implements AfterViewInit, OnChanges {
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef;
  @Input() language: string = 'javascript';
  @Input() formControl!: FormControl;
  @Input() readonly: boolean = true;

  private editor: any;
  private monaco: typeof import('monaco-editor') | null = null;
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  async ngAfterViewInit(): Promise<void> {
    if (!this.isBrowser) return;

    this.monaco = await import('monaco-editor');

    this.editor = this.monaco.editor.create(this.editorContainer.nativeElement, {
      value: this.formControl.value || '',
      language: this.language,
      theme: 'vs-dark',
      automaticLayout: true,
      suggestOnTriggerCharacters: true,
      quickSuggestions: true,
      contextmenu: false,
      wordBasedSuggestions: 'off',
      lineNumbers: 'on',
      minimap: { enabled: false },
      dragAndDrop: false,
      links: false,
      readOnly: this.readonly
    });

    this.editor.onDidChangeModelContent(() => {
      const newValue = this.editor.getValue();
      if (this.formControl.value !== newValue) {
        this.formControl.setValue(newValue);
      }
    });

    this.formControl.valueChanges.subscribe((value) => {
      if (this.editor && this.editor.getValue() !== value) {
        this.editor.setValue(value || '');
      }
    });

    // this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {});
    // this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {});
    // this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX, () => {});

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['readonly'] && !changes['readonly'].firstChange && this.editor) {
      this.editor.updateOptions({ readOnly: this.readonly });
    }
  }
}
