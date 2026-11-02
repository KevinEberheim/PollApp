import { Component, input } from '@angular/core';
import { Survey } from '../interfaces/survey.interface';
import { EndsInPipe } from '../ends-in-pipe';

@Component({
  selector: 'app-survey-card',
  imports: [EndsInPipe],
  templateUrl: './survey-card.html',
  styleUrl: './survey-card.scss',
})
export class SurveyCard {
  survey = input.required<Survey>();
}