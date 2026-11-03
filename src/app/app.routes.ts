import { Routes } from '@angular/router';
import { Home } from './home/home';
import { CreateSurvey } from './create-survey/create-survey';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'create', component: CreateSurvey },
  { path: '**', redirectTo: '' },
];