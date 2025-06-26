// main.ts
(self as any).MonacoEnvironment = {
  getWorkerUrl: function (_moduleId: any, label: string) {
    switch (label) {
      case 'json':
        return 'assets/monaco/vs/language/json/json.worker.js';
      case 'css':
        return 'assets/monaco/vs/language/css/css.worker.js';
      case 'html':
        return 'assets/monaco/vs/language/html/html.worker.js';
      case 'typescript':
      case 'javascript':
        return 'assets/monaco/vs/language/typescript/ts.worker.js';
      default:
        return 'assets/monaco/vs/editor/editor.worker.js';
    }
  }
};

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
