import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="contact-hero">
      <div class="container">
        <h1>Contact Us</h1>
        <p>Have a question or feedback? We'd love to hear from you.</p>
      </div>
    </section>

    <div class="container contact-container">
      <form (ngSubmit)="submit()" class="contact-form">
        <div class="form-group">
          <label>Name *</label>
          <input [(ngModel)]="name" name="name" placeholder="Your name" required />
        </div>
        <div class="form-group">
          <label>Email *</label>
          <input type="email" [(ngModel)]="email" name="email" placeholder="your@email.com" required />
        </div>
        <div class="form-group">
          <label>Subject</label>
          <input [(ngModel)]="subject" name="subject" placeholder="What's this about?" />
        </div>
        <div class="form-group">
          <label>Message *</label>
          <textarea [(ngModel)]="message" name="message" placeholder="Your message..." required></textarea>
        </div>

        @if (success()) {
          <div class="success-msg">✓ Thank you! Your message has been sent. We'll get back to you soon.</div>
        }
        @if (error()) {
          <div class="error-msg">{{ error() }}</div>
        }

        <button type="submit" class="btn btn-primary btn-lg" [disabled]="sending()">
          {{ sending() ? 'Sending...' : 'Send Message' }}
        </button>
      </form>

      <div class="contact-info">
        <h3>Get in Touch</h3>
        <p>Life Events Hub is here to help you share and preserve life's meaningful moments. Whether you're celebrating a wedding, honoring a loved one, or marking a birthday, we're here to support you.</p>
      </div>
    </div>
  `,
  styles: [`
    .contact-hero {
      background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%);
      color: white;
      padding: 3rem 1.5rem;
      text-align: center;
    }
    .contact-hero h1 { color: white; margin-bottom: 0.5rem; }
    .contact-hero p { opacity: 0.9; margin: 0; }

    .contact-container {
      max-width: 700px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
      display: grid;
      gap: 2rem;
    }
    .contact-form {
      background: white;
      padding: 2rem;
      border-radius: var(--radius);
      box-shadow: var(--shadow);
    }
    .success-msg {
      background: #f0fdf4;
      color: #166534;
      padding: 1rem;
      border-radius: var(--radius);
      margin-bottom: 1rem;
    }
    .error-msg {
      background: #fef2f2;
      color: #c53030;
      padding: 1rem;
      border-radius: var(--radius);
      margin-bottom: 1rem;
    }
    .btn-lg { padding: 1rem 2rem; font-size: 1.05rem; margin-top: 0.5rem; }
    .contact-info {
      text-align: center;
      color: var(--text-muted);
      padding: 2rem;
    }
    .contact-info h3 { color: var(--text); margin-bottom: 0.5rem; }
  `]
})
export class ContactComponent {
  name = '';
  email = '';
  subject = '';
  message = '';
  sending = signal(false);
  success = signal(false);
  error = signal('');

  constructor(private api: ApiService) {}

  submit() {
    if (!this.name.trim() || !this.email.trim() || !this.message.trim()) {
      this.error.set('Please fill in all required fields.');
      return;
    }
    this.sending.set(true);
    this.success.set(false);
    this.error.set('');

    this.api.submitContact(this.name, this.email, this.subject, this.message).subscribe({
      next: () => {
        this.sending.set(false);
        this.success.set(true);
        this.name = '';
        this.email = '';
        this.subject = '';
        this.message = '';
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to send message. Please try again.');
        this.sending.set(false);
      }
    });
  }
}
