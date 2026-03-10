import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { EventStatsService } from '../../services/event-stats.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <section class="create-hero">
      <div class="container">
        <h1>Create an Event</h1>
        <p>Record and preserve memories — birthdays, anniversaries, and obituaries.</p>
      </div>
    </section>

    <div class="container form-container">
      <form (ngSubmit)="submit()" class="create-form">
        <div class="form-row">
          <div class="form-group">
            <label>Event Type *</label>
            <select [(ngModel)]="eventType" name="eventType" required (ngModelChange)="onEventTypeChange($event)">
              <option value="">Select type</option>
              <option value="Birthday">Birthday Wishes</option>
              <option value="Anniversary">Wedding Anniversary</option>
              <option value="Obituary">Obituary & Memorial</option>
            </select>
          </div>
          <div class="form-group">
            <label>Event Date *</label>
            <input type="date" [(ngModel)]="eventDate" name="eventDate" required />
          </div>
        </div>

        @if (eventType === 'Obituary') {
          <div class="form-row">
            <div class="form-group">
              <label>Birth Date *</label>
              <input type="date" [(ngModel)]="birthDate" name="birthDate" required />
            </div>
            <div class="form-group">
              <label>Date of Passing *</label>
              <input type="date" [(ngModel)]="deathDate" name="deathDate" required />
            </div>
          </div>
        }

        @if (eventType === 'Anniversary') {
          <div class="form-group">
            <label>Wedding Date *</label>
            <input type="date" [(ngModel)]="weddingDate" name="weddingDate" required />
          </div>
        }

        <div class="form-group">
          <label>Title *</label>
          <input [(ngModel)]="title" name="title" placeholder="e.g. John & Jane's Wedding" required />
        </div>

        <div class="form-group">
          <label>Description *</label>
          <textarea [(ngModel)]="description" name="description" placeholder="Share the story, details, and meaning of this event..." required></textarea>
        </div>

        <div class="form-group">
          <label>Location (optional)</label>
          <input [(ngModel)]="location" name="location" placeholder="e.g. Central Park, New York" />
        </div>

        <div class="form-group">
          <label>Country *</label>
          <select [(ngModel)]="country" name="country" required>
            <option value="">Select country</option>
            <option value="USA">USA</option>
            <option value="UK">UK</option>
            <option value="Canada">Canada</option>
            <option value="Australia">Australia</option>
            <option value="India">India</option>
            <option value="Germany">Germany</option>
            <option value="France">France</option>
            <option value="Japan">Japan</option>
            <option value="Brazil">Brazil</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div class="form-group display-duration-section">
          <div class="duration-header">
            <label class="duration-label">Display Duration</label>
            <p class="duration-subtitle">Choose how long your event will be featured on our platform. Payment is required to publish.</p>
          </div>
          <div class="display-options">
            @for (opt of displayOptions(); track opt.days) {
              <label class="display-option-card" [class.selected]="displayDays === opt.days">
                <input type="radio" [(ngModel)]="displayDays" name="displayDays" [value]="opt.days" required />
                <span class="option-duration">{{ getDurationLabel(opt.days) }}</span>
                <span class="option-days">{{ opt.label }} display</span>
                <span class="option-price">{{ opt.price | currency }}</span>
                <span class="option-per-day">{{ getPricePerDay(opt) }}/day</span>
              </label>
            }
          </div>
        </div>

        <div class="form-group">
          <label>Privacy / Visibility</label>
          <select [(ngModel)]="visibility" name="visibility" (ngModelChange)="onVisibilityChange($event)">
            <option value="Public">Public — Anyone can view</option>
            <option value="Private">Private — Only you</option>
            <option value="InviteOnly">Invite Only — Only you and invited people</option>
          </select>
        </div>

        @if (visibility === 'InviteOnly') {
          <div class="form-group invite-section">
            <label>Invite people by email *</label>
            <p class="form-hint">Comma-separated emails. Invited users must log in with that email to view.</p>
            <textarea [(ngModel)]="invitedEmails" name="invitedEmails" rows="3" placeholder="sister@example.com, brother@example.com"></textarea>
          </div>
        }

        @if (!auth.isLoggedIn()) {
          <div class="form-group">
            <label>Your Name (optional)</label>
            <input [(ngModel)]="createdBy" name="createdBy" placeholder="Anonymous" />
          </div>
        }

        <div class="form-group">
          <label>Main Image</label>
          <input type="file" accept="image/*" (change)="onMainImageChange($event)" />
          @if (mainImagePreview()) {
            <img [src]="mainImagePreview()" alt="Preview" class="preview-img" />
          }
        </div>

        <div class="form-group">
          <label>Gallery Images (optional)</label>
          <input type="file" accept="image/*" multiple (change)="onGalleryChange($event)" />
        </div>

        @if (error()) {
          <div class="error-msg">{{ error() }}</div>
        }

        <button type="submit" class="btn btn-primary btn-lg" [disabled]="saving()">
          {{ saving() ? 'Saving...' : 'Proceed to Payment' }}
        </button>
      </form>
    </div>
  `,
  styles: [`
    .create-hero {
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
      color: white;
      padding: 3rem 1.5rem;
      text-align: center;
    }
    .create-hero h1 { color: white; margin-bottom: 0.5rem; }
    .create-hero p { opacity: 0.9; margin: 0; }

    .form-container { max-width: 700px; margin: 0 auto; padding: 2rem 1.5rem; }
    .create-form {
      background: white;
      padding: 2rem;
      border-radius: var(--radius);
      box-shadow: var(--shadow);
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }
    .form-group input[type="file"] {
      padding: 0.5rem 0;
      border: none;
    }
    .preview-img {
      max-width: 200px;
      max-height: 150px;
      border-radius: var(--radius);
      margin-top: 0.5rem;
      object-fit: cover;
    }
    .error-msg {
      background: #fef2f2;
      color: #c53030;
      padding: 1rem;
      border-radius: var(--radius);
      margin-bottom: 1rem;
    }
    .btn-lg { padding: 1rem 2rem; font-size: 1.05rem; margin-top: 0.5rem; }
    .invite-section textarea { min-height: 80px; }
    .form-hint { font-size: 0.875rem; color: var(--text-muted); margin: -0.25rem 0 0.5rem; }
    .display-duration-section { margin-top: 1.5rem; }
    .duration-header { margin-bottom: 1rem; }
    .duration-label { font-size: 1rem; font-weight: 600; color: var(--text, #1a2934); display: block; margin-bottom: 0.25rem; }
    .duration-subtitle { font-size: 0.875rem; color: var(--text-muted); margin: 0; line-height: 1.5; }
    .display-options {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    .display-option-card {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 1.25rem 1.5rem;
      border: 2px solid var(--border);
      border-radius: var(--radius);
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }
    .display-option-card input { position: absolute; opacity: 0; pointer-events: none; }
    .display-option-card:hover { border-color: rgba(26, 95, 74, 0.4); background: rgba(26, 95, 74, 0.02); }
    .display-option-card.selected {
      border-color: var(--primary);
      background: rgba(26, 95, 74, 0.06);
      box-shadow: 0 0 0 1px var(--primary);
    }
    .option-duration { font-size: 1rem; font-weight: 700; color: var(--primary); margin-bottom: 0.25rem; }
    .option-days { font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 0.75rem; }
    .option-price { font-size: 1.25rem; font-weight: 700; color: var(--primary); }
    .option-per-day { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem; }
  `]
})
export class CreateEventComponent implements OnInit {
  auth = inject(AuthService);
  displayOptions = signal<{ days: number; price: number; label: string }[]>([]);
  displayDays = 30;
  title = '';
  description = '';
  eventType = '';
  eventDate = '';
  birthDate = '';
  deathDate = '';
  weddingDate = '';
  visibility = 'Public';
  invitedEmails = '';
  location = '';
  country = '';
  createdBy = '';
  mainImage: File | null = null;
  galleryImages: File[] = [];
  mainImagePreview = signal<string | null>(null);
  saving = signal(false);
  error = signal('');

  constructor(private api: ApiService, private stats: EventStatsService, private router: Router) {}

  ngOnInit() {
    this.api.getDisplayOptions().subscribe({
      next: (opts) => {
        this.displayOptions.set(opts);
        if (opts.length && !this.displayDays) this.displayDays = opts[0].days;
      }
    });
  }

  onMainImageChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.mainImage = file;
      const reader = new FileReader();
      reader.onload = () => this.mainImagePreview.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  onGalleryChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this.galleryImages = Array.from(input.files || []);
  }

  onVisibilityChange(v: string) {
    if (v !== 'InviteOnly') this.invitedEmails = '';
  }

  onEventTypeChange(type: string) {
    if (type !== 'Obituary') {
      this.birthDate = '';
      this.deathDate = '';
    }
    if (type !== 'Anniversary') {
      this.weddingDate = '';
    }
  }

  getDurationLabel(days: number): string {
    if (days === 1) return '1 Day';
    if (days === 3) return '3 Days';
    if (days === 7) return '1 Week';
    if (days === 14) return '2 Weeks';
    if (days === 30) return '1 Month';
    if (days === 90) return '3 Months';
    return `${days} days`;
  }

  getPricePerDay(opt: { days: number; price: number }): string {
    const perDay = opt.days > 0 ? opt.price / opt.days : 0;
    return `$${perDay.toFixed(2)}`;
  }

  submit() {
    if (!this.title.trim() || !this.description.trim() || !this.eventType || !this.eventDate || !this.country) {
      this.error.set('Please fill in all required fields.');
      return;
    }
    if (this.eventType === 'Obituary' && (!this.birthDate || !this.deathDate)) {
      this.error.set('Birth date and Date of Passing are required for obituaries.');
      return;
    }
    if (this.eventType === 'Anniversary' && !this.weddingDate) {
      this.error.set('Wedding date is required for anniversaries.');
      return;
    }
    if (this.visibility === 'InviteOnly' && !this.invitedEmails.trim()) {
      this.error.set('Please add at least one email to invite.');
      return;
    }
    const validDays = [1, 3, 7, 14, 30, 90];
    if (!validDays.includes(this.displayDays)) {
      this.error.set('Please select a display duration (1, 3, 7, 14, 30, or 90 days).');
      return;
    }
    this.saving.set(true);
    this.error.set('');

    const formData = new FormData();
    formData.append('title', this.title);
    formData.append('description', this.description);
    formData.append('eventType', this.eventType);
    formData.append('eventDate', this.eventDate);
    if (this.eventType === 'Obituary') {
      if (this.birthDate) formData.append('birthDate', this.birthDate);
      if (this.deathDate) formData.append('deathDate', this.deathDate);
    }
    if (this.eventType === 'Anniversary' && this.weddingDate) {
      formData.append('weddingDate', this.weddingDate);
    }
    formData.append('visibility', this.visibility);
    formData.append('displayDays', String(this.displayDays));
    if (this.visibility === 'InviteOnly' && this.invitedEmails.trim()) {
      formData.append('invitedEmails', this.invitedEmails.trim());
    }
    if (this.location) formData.append('location', this.location);
    if (this.country) formData.append('country', this.country);
    if (this.auth.isLoggedIn() && this.auth.currentUser()) {
      formData.append('createdBy', this.auth.currentUser()!.displayName);
    } else if (this.createdBy) formData.append('createdBy', this.createdBy);
    if (this.mainImage) formData.append('mainImage', this.mainImage);
    this.galleryImages.forEach((f, i) => formData.append(`galleryImages`, f));

    this.api.saveEventDraft(formData).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.router.navigate(['/create-event/payment', res.draftId], {
          queryParams: { days: res.displayDays, price: res.price, label: res.label }
        });
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to create event. Please try again.');
        this.saving.set(false);
      }
    });
  }
}
