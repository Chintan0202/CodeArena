import { Routes } from '@angular/router';
import { CodeEditorLayoutComponent } from './Components/code-editor-layout-component/code-editor-layout-component';
import { QuestionsComponent } from './Components/questions/questions.component';

export const routes: Routes = [
    { path: '', redirectTo: 'questions', pathMatch: 'full' },
    { path: 'questions', component: QuestionsComponent },
    { path: 'code/:questionId/:isPreview', component: CodeEditorLayoutComponent },
  ];
