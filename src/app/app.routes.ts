import { Routes } from '@angular/router';
import { Home } from './home/home';
import { CreateSurvey } from './create-survey/create-survey';
import { SurveyView } from './survey-view/survey-view';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'create', component: CreateSurvey },
  { path: 'survey/:id', component: SurveyView },
  { path: '**', redirectTo: '' },
];