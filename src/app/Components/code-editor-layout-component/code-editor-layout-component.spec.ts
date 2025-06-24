import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodeEditorLayoutComponent } from './code-editor-layout-component';

describe('CodeEditorLayoutComponentComponent', () => {
  let component: CodeEditorLayoutComponent;
  let fixture: ComponentFixture<CodeEditorLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeEditorLayoutComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CodeEditorLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
