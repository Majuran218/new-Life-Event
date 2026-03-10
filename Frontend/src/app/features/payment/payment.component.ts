import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { EventStatsService } from '../../services/event-stats.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="payment-hero">
      <div class="container">
        <h1>Complete Payment</h1>
        <p>Your event will be displayed for the selected duration after payment.</p>
      </div>
    </section>

    <div class="container payment-container">
      <div class="payment-card">
        <h2>Order Summary</h2>
        <div class="summary-row">
          <span>Display duration</span>
          <strong>{{ label() }}</strong>
        </div>
        <div class="summary-row total">
          <span>Total</span>
          <strong>\${{ price().toFixed(2) }}</strong>
        </div>

        @if (error()) {
          <div class="error-msg">{{ error() }}</div>
        }

        <div class="payment-actions">
          <button class="btn btn-primary btn-lg" (click)="payNow()" [disabled]="paying()">
            {{ paying() ? 'Processing...' : 'Pay with Card (Stripe)' }}
          </button>
          <a routerLink="/create-event" class="btn btn-outline">Cancel</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .payment-hero {
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
      color: white;
      padding: 3rem 1.5rem;
      text-align: center;
    }
    .payment-hero h1 { color: white; margin-bottom: 0.5rem; }
    .payment-hero p { opacity: 0.9; margin: 0; }

    .payment-container { max-width: 480px; margin: 0 auto; padding: 2rem 1.5rem; }
    .payment-card {
      background: white;
      padding: 2rem;
      border-radius: var(--radius);
      box-shadow: var(--shadow);
    }
    .payment-card h2 { margin: 0 0 1.5rem; font-size: 1.25rem; }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border);
    }
    .summary-row.total {
      font-size: 1.25rem;
      border-bottom: none;
      margin-top: 0.5rem;
      padding-top: 1rem;
      border-top: 2px solid var(--primary);
    }
    .error-msg {
      background: #fef2f2;
      color: #c53030;
      padding: 1rem;
      border-radius: var(--radius);
      margin: 1rem 0;
    }
    .payment-actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
    }
    .payment-actions .btn { flex: 1; }
  `]
})
export class PaymentComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private stats = inject(EventStatsService);

  draftId = 0;
  label = signal('');
  price = signal(0);
  paying = signal(false);
  error = signal('');

  constructor() {
    const id = this.route.snapshot.paramMap.get('draftId');
    this.draftId = id ? parseInt(id, 10) : 0;
    const days = this.route.snapshot.queryParamMap.get('days');
    const p = this.route.snapshot.queryParamMap.get('price');
    const lbl = this.route.snapshot.queryParamMap.get('label');
    this.label.set(lbl || (days ? `${days} days` : ''));
    this.price.set(p ? parseFloat(p) : 0);
  }

  payNow() {
    if (!this.draftId || this.draftId <= 0) {
      this.error.set('Invalid draft. Please go back and create the event again.');
      return;
    }
    this.paying.set(true);
    this.error.set('');
    this.api.createCheckoutSession(this.draftId).subscribe({
      next: (res) => {
        this.paying.set(false);
        if (res.url) {
          window.location.href = res.url;
        } else {
          this.error.set('No payment URL received.');
        }
      },
      error: (err) => {
        const msg = err.error?.message || '';
        if (msg.includes('not configured')) {
          this.payWithMock();
        } else {
          this.error.set(msg || 'Payment failed. Please try again.');
          this.paying.set(false);
        }
      }
    });
  }

  payWithMock() {
    if (!this.draftId || this.draftId <= 0) return;
    this.paying.set(true);
    this.error.set('');
    this.api.confirmPaymentMock(this.draftId).subscribe({
      next: (ev: { id: number }) => {
        this.stats.loadFromApi();
        this.paying.set(false);
        this.router.navigate(['/event', ev.id]);
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(err.error?.message || 'Payment failed. Please try again.');
        this.paying.set(false);
      }
    });
  }
}
