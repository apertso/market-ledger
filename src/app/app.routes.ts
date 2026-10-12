import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';

export const routes: Routes = [
  { path: '', component: Dashboard, title: 'Market · Market Ledger' },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings').then((m) => m.Settings),
    title: 'Settings · Market Ledger',
  },
  { path: '**', redirectTo: '' },
];
