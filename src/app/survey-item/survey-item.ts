import { Component, input } from '@angular/core';
import { Survey } from '../interfaces/survey.interface';
import { EndsInPipe } from '../ends-in-pipe';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-survey-item',
  imports: [EndsInPipe, RouterLink],
  templateUrl: './survey-item.html',
  styleUrl: './survey-item.scss',
})
export class SurveyItem {
  survey = input.required<Survey>();
}