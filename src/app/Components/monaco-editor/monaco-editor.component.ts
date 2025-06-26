import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  Input,
  inject,
  PLATFORM_ID,
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
      border: 1px solid #ccc;
    }
  `],
})
export class MonacoEditorComponent implements AfterViewInit {
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef;
  @Input() language: string = 'javascript';
  @Input() formControl!: FormControl;

  private editor: any;
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  async ngAfterViewInit(): Promise<void> {
    if (!this.isBrowser) return;

    const monaco = await import('monaco-editor');

    this.editor = monaco.editor.create(this.editorContainer.nativeElement, {
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
      links: false
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
}
