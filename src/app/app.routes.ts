import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';

export const routes: Routes = [
  { path: '', component: Dashboard, title: 'Live market · Market Ledger' },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings').then((m) => m.Settings),
    title: 'Producer settings · Market Ledger',
  },
  { path: '**', redirectTo: '' },
];
