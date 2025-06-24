import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-problem-description',
  standalone: true,
  imports: [],
  templateUrl: './problem-description-component.html',
  styleUrl: './problem-description-component.scss'
})
export class ProblemDescriptionComponent{
  @Input() title: string = 'Two Sum';
  @Input() description: string = '';
  @Input() example: string = '';
}
