import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProblemDescriptionComponent } from './problem-description-component';

describe('ProblemDescriptionComponentComponent', () => {
  let component: ProblemDescriptionComponent;
  let fixture: ComponentFixture<ProblemDescriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProblemDescriptionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProblemDescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
