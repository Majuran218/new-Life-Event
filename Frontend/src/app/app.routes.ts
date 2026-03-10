import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/feed/feed.component').then(m => m.FeedComponent) },
  { path: 'login', loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/register/register.component').then(m => m.RegisterComponent) },
  { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent), canActivate: [authGuard] },
  { path: 'event/:id', loadComponent: () => import('./features/event-detail/event-detail.component').then(m => m.EventDetailComponent) },
  { path: 'event/:id/edit', loadComponent: () => import('./features/edit-event/edit-event.component').then(m => m.EditEventComponent), canActivate: [authGuard] },
  { path: 'create-event', loadComponent: () => import('./features/create-event/create-event.component').then(m => m.CreateEventComponent), canActivate: [authGuard] },
  { path: 'create-event/payment/:draftId', loadComponent: () => import('./features/payment/payment.component').then(m => m.PaymentComponent), canActivate: [authGuard] },
  { path: 'create-event/success', loadComponent: () => import('./features/payment-success/payment-success.component').then(m => m.PaymentSuccessComponent), canActivate: [authGuard] },
  { path: 'contact', loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent) },
  { path: '**', redirectTo: '' }
];
