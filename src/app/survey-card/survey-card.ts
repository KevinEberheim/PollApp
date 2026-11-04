import { Component, input } from '@angular/core';
import { Survey } from '../interfaces/survey.interface';
import { EndsInPipe } from '../ends-in-pipe';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-survey-card',
  imports: [EndsInPipe, RouterLink],
  templateUrl: './survey-card.html',
  styleUrl: './survey-card.scss',
})
export class SurveyCard {
  survey = input.required<Survey>();
}