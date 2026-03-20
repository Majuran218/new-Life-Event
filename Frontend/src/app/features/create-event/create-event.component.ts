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
  <input 
    type="date" 
    [(ngModel)]="eventDate" 
    name="eventDate" 
    required
    #eventDateInput="ngModel"
  />
  @if (eventDateInput.invalid && (eventDateInput.dirty || eventDateInput)) {
    <div class="validation-error">
      @if (eventDateInput.errors?.['required']) {
        <small>Event date is required.</small>
      }
    </div>
  }
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
          <input 
            [(ngModel)]="title" 
            name="title" 
            placeholder="e.g. John & Jane's Wedding" 
            required 
            #titleInput="ngModel"
            minlength="3"
            maxlength="100"
          />
          @if (titleInput.invalid && (titleInput.dirty || titleInput.touched)) {
            <div class="validation-error">
              @if (titleInput.errors?.['required']) {
                <small>Title is required.</small>
              }
              @if (titleInput.errors?.['minlength']) {
                <small>Title must be at least 3 characters.</small>
              }
              @if (titleInput.errors?.['maxlength']) {
                <small>Title cannot exceed 100 characters.</small>
              }
            </div>
          }
        </div>



        <div class="form-group">
          <label>Description *</label>
          <textarea 
            [(ngModel)]="description" 
            name="description" 
            placeholder="Share the story, details, and meaning of this event..." 
            required
            #descriptionInput="ngModel"
            minlength="10"
            maxlength="2000"
            rows="5"
          ></textarea>

          @if (descriptionInput.invalid && (descriptionInput.dirty || descriptionInput.touched)) {
            <div class="validation-error">
              @if (descriptionInput.errors?.['required']) {
                <small>Description is required.</small>
              }

              @if (descriptionInput.errors?.['minlength']) {
                <small>Description must be at least 10 characters.</small>
              }
              @if (descriptionInput.errors?.['maxlength']) {
                <small>Description cannot exceed 2000 characters.</small>
              }
            </div>
          }
          <div class="character-count" [class.exceed-limit]="description.length > 2000">
            {{ description.length }}/2000
          </div>
        </div>




        <div class="form-group">
          <label>Location *</label>
          <input 
            [(ngModel)]="location" 
            name="location" 
            placeholder="e.g. Central Park, New York"
            #locationInput="ngModel"
            required
            maxlength="200"
          />

          @if (locationInput.invalid && (locationInput.dirty || locationInput.touched)) {
            <div class="validation-error">

              @if (locationInput.errors?.['required']) {
                <small>Location is required.</small>
              }
                
              @if (locationInput.errors?.['minlength']) {
                <small>Location must be at least 3 characters.</small>
              }
        </div>
          }

          @if (locationInput.invalid && locationInput.errors?.['maxlength']) {
            <div class="validation-error">
              <small>Location cannot exceed 200 characters.</small>
            </div>
          }
          @if (location) {
            <div class="character-count" [class.exceed-limit]="location.length > 200">
              {{ location.length }}/200
            </div>
          }
        </div>

<div class="form-group">
  <label>Country *</label>
  <select [(ngModel)]="country" name="country" required #countryInput="ngModel">
    <option value="">Select country</option>
    <option value="">Select country</option>
<option value="Afghanistan">Afghanistan</option>
<option value="Albania">Albania</option>
<option value="Algeria">Algeria</option>
<option value="Andorra">Andorra</option>
<option value="Angola">Angola</option>
<option value="Argentina">Argentina</option>
<option value="Armenia">Armenia</option>
<option value="Australia">Australia</option>
<option value="Austria">Austria</option>
<option value="Azerbaijan">Azerbaijan</option>
<option value="Bahamas">Bahamas</option>
<option value="Bahrain">Bahrain</option>
<option value="Bangladesh">Bangladesh</option>
<option value="Belarus">Belarus</option>
<option value="Belgium">Belgium</option>
<option value="Belize">Belize</option>
<option value="Benin">Benin</option>
<option value="Bhutan">Bhutan</option>
<option value="Bolivia">Bolivia</option>
<option value="Bosnia and Herzegovina">Bosnia and Herzegovina</option>
<option value="Botswana">Botswana</option>
<option value="Brazil">Brazil</option>
<option value="Brunei">Brunei</option>
<option value="Bulgaria">Bulgaria</option>
<option value="Burkina Faso">Burkina Faso</option>
<option value="Burundi">Burundi</option>
<option value="Cambodia">Cambodia</option>
<option value="Cameroon">Cameroon</option>
<option value="Canada">Canada</option>
<option value="Chad">Chad</option>
<option value="Chile">Chile</option>
<option value="China">China</option>
<option value="Colombia">Colombia</option>
<option value="Congo">Congo</option>
<option value="Costa Rica">Costa Rica</option>
<option value="Croatia">Croatia</option>
<option value="Cuba">Cuba</option>
<option value="Cyprus">Cyprus</option>
<option value="Czech Republic">Czech Republic</option>
<option value="Denmark">Denmark</option>
<option value="Djibouti">Djibouti</option>
<option value="Dominican Republic">Dominican Republic</option>
<option value="Ecuador">Ecuador</option>
<option value="Egypt">Egypt</option>
<option value="El Salvador">El Salvador</option>
<option value="Estonia">Estonia</option>
<option value="Ethiopia">Ethiopia</option>
<option value="Finland">Finland</option>
<option value="France">France</option>
<option value="Gabon">Gabon</option>
<option value="Georgia">Georgia</option>
<option value="Germany">Germany</option>
<option value="Ghana">Ghana</option>
<option value="Greece">Greece</option>
<option value="Guatemala">Guatemala</option>
<option value="Guinea">Guinea</option>
<option value="Haiti">Haiti</option>
<option value="Honduras">Honduras</option>
<option value="Hungary">Hungary</option>
<option value="Iceland">Iceland</option>
<option value="India">India</option>
<option value="Indonesia">Indonesia</option>
<option value="Iran">Iran</option>
<option value="Iraq">Iraq</option>
<option value="Ireland">Ireland</option>
<option value="Israel">Israel</option>
<option value="Italy">Italy</option>
<option value="Jamaica">Jamaica</option>
<option value="Japan">Japan</option>
<option value="Jordan">Jordan</option>
<option value="Kazakhstan">Kazakhstan</option>
<option value="Kenya">Kenya</option>
<option value="Kuwait">Kuwait</option>
<option value="Kyrgyzstan">Kyrgyzstan</option>
<option value="Laos">Laos</option>
<option value="Latvia">Latvia</option>
<option value="Lebanon">Lebanon</option>
<option value="Libya">Libya</option>
<option value="Lithuania">Lithuania</option>
<option value="Luxembourg">Luxembourg</option>
<option value="Madagascar">Madagascar</option>
<option value="Malaysia">Malaysia</option>
<option value="Maldives">Maldives</option>
<option value="Mali">Mali</option>
<option value="Malta">Malta</option>
<option value="Mexico">Mexico</option>
<option value="Moldova">Moldova</option>
<option value="Monaco">Monaco</option>
<option value="Mongolia">Mongolia</option>
<option value="Montenegro">Montenegro</option>
<option value="Morocco">Morocco</option>
<option value="Mozambique">Mozambique</option>
<option value="Myanmar">Myanmar</option>
<option value="Namibia">Namibia</option>
<option value="Nepal">Nepal</option>
<option value="Netherlands">Netherlands</option>
<option value="New Zealand">New Zealand</option>
<option value="Nicaragua">Nicaragua</option>
<option value="Niger">Niger</option>
<option value="Nigeria">Nigeria</option>
<option value="North Korea">North Korea</option>
<option value="Norway">Norway</option>
<option value="Oman">Oman</option>
<option value="Pakistan">Pakistan</option>
<option value="Panama">Panama</option>
<option value="Paraguay">Paraguay</option>
<option value="Peru">Peru</option>
<option value="Philippines">Philippines</option>
<option value="Poland">Poland</option>
<option value="Portugal">Portugal</option>
<option value="Qatar">Qatar</option>
<option value="Romania">Romania</option>
<option value="Russia">Russia</option>
<option value="Rwanda">Rwanda</option>
<option value="Saudi Arabia">Saudi Arabia</option>
<option value="Senegal">Senegal</option>
<option value="Serbia">Serbia</option>
<option value="Singapore">Singapore</option>
<option value="Slovakia">Slovakia</option>
<option value="Slovenia">Slovenia</option>
<option value="Somalia">Somalia</option>
<option value="South Africa">South Africa</option>
<option value="South Korea">South Korea</option>
<option value="Spain">Spain</option>
<option value="Sri Lanka">Sri Lanka</option>
<option value="Sudan">Sudan</option>
<option value="Sweden">Sweden</option>
<option value="Switzerland">Switzerland</option>
<option value="Syria">Syria</option>
<option value="Taiwan">Taiwan</option>
<option value="Tanzania">Tanzania</option>
<option value="Thailand">Thailand</option>
<option value="Tunisia">Tunisia</option>
<option value="Turkey">Turkey</option>
<option value="Uganda">Uganda</option>
<option value="Ukraine">Ukraine</option>
<option value="United Arab Emirates">United Arab Emirates</option>
<option value="United Kingdom">United Kingdom</option>
<option value="USA">USA</option>
<option value="Uruguay">Uruguay</option>
<option value="Uzbekistan">Uzbekistan</option>
<option value="Venezuela">Venezuela</option>
<option value="Vietnam">Vietnam</option>
<option value="Yemen">Yemen</option>
<option value="Zambia">Zambia</option>
<option value="Zimbabwe">Zimbabwe</option>
<option value="Other">Other</option>
    <option value="Other">Other</option>
  </select>

  @if (countryInput.invalid && (countryInput.dirty || countryInput.touched)) {
    <div class="validation-error">
      @if (countryInput.errors?.['required']) {
        <small>Country is required.</small>
      }
    </div>
  }
</div>
    <div class="form-group">
  <label>Country Currency(Which Country Currency You need to pay the Money) *</label>
  <div class="currency-select-wrapper">
    <select [(ngModel)]="currencyCode" name="currency" required #currencyInput="ngModel" (ngModelChange)="onCurrencyChange($event)">
      <option value="">Select currency</option>
      <option value="">Select country</option>
<option value="Afghanistan">Afghanistan</option>
<option value="Albania">Albania</option>
<option value="Algeria">Algeria</option>
<option value="Andorra">Andorra</option>
<option value="Angola">Angola</option>
<option value="Argentina">Argentina</option>
<option value="Armenia">Armenia</option>
<option value="Australia">Australia</option>
<option value="Austria">Austria</option>
<option value="Azerbaijan">Azerbaijan</option>
<option value="Bahamas">Bahamas</option>
<option value="Bahrain">Bahrain</option>
<option value="Bangladesh">Bangladesh</option>
<option value="Belarus">Belarus</option>
<option value="Belgium">Belgium</option>
<option value="Belize">Belize</option>
<option value="Benin">Benin</option>
<option value="Bhutan">Bhutan</option>
<option value="Bolivia">Bolivia</option>
<option value="Bosnia and Herzegovina">Bosnia and Herzegovina</option>
<option value="Botswana">Botswana</option>
<option value="Brazil">Brazil</option>
<option value="Brunei">Brunei</option>
<option value="Bulgaria">Bulgaria</option>
<option value="Burkina Faso">Burkina Faso</option>
<option value="Burundi">Burundi</option>
<option value="Cambodia">Cambodia</option>
<option value="Cameroon">Cameroon</option>
<option value="Canada">Canada</option>
<option value="Chad">Chad</option>
<option value="Chile">Chile</option>
<option value="China">China</option>
<option value="Colombia">Colombia</option>
<option value="Congo">Congo</option>
<option value="Costa Rica">Costa Rica</option>
<option value="Croatia">Croatia</option>
<option value="Cuba">Cuba</option>
<option value="Cyprus">Cyprus</option>
<option value="Czech Republic">Czech Republic</option>
<option value="Denmark">Denmark</option>
<option value="Djibouti">Djibouti</option>
<option value="Dominican Republic">Dominican Republic</option>
<option value="Ecuador">Ecuador</option>
<option value="Egypt">Egypt</option>
<option value="El Salvador">El Salvador</option>
<option value="Estonia">Estonia</option>
<option value="Ethiopia">Ethiopia</option>
<option value="Finland">Finland</option>
<option value="France">France</option>
<option value="Gabon">Gabon</option>
<option value="Georgia">Georgia</option>
<option value="Germany">Germany</option>
<option value="Ghana">Ghana</option>
<option value="Greece">Greece</option>
<option value="Guatemala">Guatemala</option>
<option value="Guinea">Guinea</option>
<option value="Haiti">Haiti</option>
<option value="Honduras">Honduras</option>
<option value="Hungary">Hungary</option>
<option value="Iceland">Iceland</option>
<option value="India">India</option>
<option value="Indonesia">Indonesia</option>
<option value="Iran">Iran</option>
<option value="Iraq">Iraq</option>
<option value="Ireland">Ireland</option>
<option value="Israel">Israel</option>
<option value="Italy">Italy</option>
<option value="Jamaica">Jamaica</option>
<option value="Japan">Japan</option>
<option value="Jordan">Jordan</option>
<option value="Kazakhstan">Kazakhstan</option>
<option value="Kenya">Kenya</option>
<option value="Kuwait">Kuwait</option>
<option value="Kyrgyzstan">Kyrgyzstan</option>
<option value="Laos">Laos</option>
<option value="Latvia">Latvia</option>
<option value="Lebanon">Lebanon</option>
<option value="Libya">Libya</option>
<option value="Lithuania">Lithuania</option>
<option value="Luxembourg">Luxembourg</option>
<option value="Madagascar">Madagascar</option>
<option value="Malaysia">Malaysia</option>
<option value="Maldives">Maldives</option>
<option value="Mali">Mali</option>
<option value="Malta">Malta</option>
<option value="Mexico">Mexico</option>
<option value="Moldova">Moldova</option>
<option value="Monaco">Monaco</option>
<option value="Mongolia">Mongolia</option>
<option value="Montenegro">Montenegro</option>
<option value="Morocco">Morocco</option>
<option value="Mozambique">Mozambique</option>
<option value="Myanmar">Myanmar</option>
<option value="Namibia">Namibia</option>
<option value="Nepal">Nepal</option>
<option value="Netherlands">Netherlands</option>
<option value="New Zealand">New Zealand</option>
<option value="Nicaragua">Nicaragua</option>
<option value="Niger">Niger</option>
<option value="Nigeria">Nigeria</option>
<option value="North Korea">North Korea</option>
<option value="Norway">Norway</option>
<option value="Oman">Oman</option>
<option value="Pakistan">Pakistan</option>
<option value="Panama">Panama</option>
<option value="Paraguay">Paraguay</option>
<option value="Peru">Peru</option>
<option value="Philippines">Philippines</option>
<option value="Poland">Poland</option>
<option value="Portugal">Portugal</option>
<option value="Qatar">Qatar</option>
<option value="Romania">Romania</option>
<option value="Russia">Russia</option>
<option value="Rwanda">Rwanda</option>
<option value="Saudi Arabia">Saudi Arabia</option>
<option value="Senegal">Senegal</option>
<option value="Serbia">Serbia</option>
<option value="Singapore">Singapore</option>
<option value="Slovakia">Slovakia</option>
<option value="Slovenia">Slovenia</option>
<option value="Somalia">Somalia</option>
<option value="South Africa">South Africa</option>
<option value="South Korea">South Korea</option>
<option value="Spain">Spain</option>
<option value="Sri Lanka">Sri Lanka</option>
<option value="Sudan">Sudan</option>
<option value="Sweden">Sweden</option>
<option value="Switzerland">Switzerland</option>
<option value="Syria">Syria</option>
<option value="Taiwan">Taiwan</option>
<option value="Tanzania">Tanzania</option>
<option value="Thailand">Thailand</option>
<option value="Tunisia">Tunisia</option>
<option value="Turkey">Turkey</option>
<option value="Uganda">Uganda</option>
<option value="Ukraine">Ukraine</option>
<option value="United Arab Emirates">United Arab Emirates</option>
<option value="United Kingdom">United Kingdom</option>
<option value="USA">USA</option>
<option value="Uruguay">Uruguay</option>
<option value="Uzbekistan">Uzbekistan</option>
<option value="Venezuela">Venezuela</option>
<option value="Vietnam">Vietnam</option>
<option value="Yemen">Yemen</option>
<option value="Zambia">Zambia</option>
<option value="Zimbabwe">Zimbabwe</option>
<option value="Other">Other</option>
      @for (currency of currencies; track currency.code) {
        <option [value]="currency.code">
          {{ currency.symbol }} {{ currency.name }} ({{ currency.code }}) — {{ currency.country }}
        </option>
      }
    </select>

    @if (selectedCurrency) {
      <div class="currency-badge">
        <span class="currency-symbol">{{ selectedCurrency.symbol }}</span>
        <span class="currency-code">{{ selectedCurrency.code }}</span>
      </div>
    }
  </div>

  @if (currencyInput.invalid && (currencyInput.dirty || currencyInput.touched)) {
    <div class="validation-error">
      @if (currencyInput.errors?.['required']) {
        <small>Currency is required.</small>
      }
    </div>
  }
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
  <label>Privacy / Visibility *</label>
  <select [(ngModel)]="visibility" name="visibility" required #visibilityInput="ngModel"
    (ngModelChange)="onVisibilityChange($event)">
    <option value="">Select visibility</option>
    <option value="Public">Public — Anyone can view</option>
    <option value="Private">Private — Only you</option>
    <option value="InviteOnly">Invite Only — Only you and invited people</option>
  </select>

  @if (visibilityInput.invalid && (visibilityInput.dirty || visibilityInput.touched)) {
    <div class="validation-error">
      @if (visibilityInput.errors?.['required']) {
        <small>Privacy / Visibility is required.</small>
      }
    </div>
  }
</div>
        @if (visibility === 'InviteOnly') {
          <div class="form-group invite-section">
            <label>Invite people by email *</label>
            <p class="form-hint">Comma-separated emails. Invited users must log in with that email to view.</p>
            <textarea 
              [(ngModel)]="invitedEmails" 
              name="invitedEmails" 
              rows="3" 
              placeholder="sister@example.com, brother@example.com"
              #emailInput="ngModel"
              minlength="5"
              maxlength="500"
              pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(,\s*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})*$"
            ></textarea>
            @if (emailInput.invalid && (emailInput.dirty || emailInput.touched)) {
              <div class="validation-error">
                @if (emailInput.errors?.['required']) {
                  <small>At least one email is required for invite-only events.</small>
                }
                @if (emailInput.errors?.['minlength']) {
                  <small>Please enter valid email addresses.</small>
                }
                @if (emailInput.errors?.['maxlength']) {
                  <small>Email list cannot exceed 500 characters.</small>
                }
                @if (emailInput.errors?.['pattern']) {
                  <small>Please enter valid comma-separated email addresses.</small>
                }
              </div>
            }
            @if (invitedEmails) {
              <div class="character-count" [class.exceed-limit]="invitedEmails.length > 500">
                {{ invitedEmails.length }}/500
              </div>
            }
          </div>
        }

        @if (!auth.isLoggedIn()) {
          <div class="form-group">
            <label>Your Name (optional)</label>
            <input 
              [(ngModel)]="createdBy" 
              name="createdBy" 
              placeholder="Anonymous"
              #nameInput="ngModel"
              maxlength="100"
            />
            @if (nameInput.invalid && nameInput.errors?.['maxlength']) {
              <div class="validation-error">
                <small>Name cannot exceed 100 characters.</small>
              </div>
            }
            @if (createdBy) {
              <div class="character-count" [class.exceed-limit]="createdBy.length > 100">
                {{ createdBy.length }}/100
              </div>
            }
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

        <button type="submit" class="btn btn-primary btn-lg" [disabled]="saving() || !isFormValid()">
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

    .validation-error {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
    .validation-error small {
      display: block;
      margin-bottom: 0.125rem;
    }
    .character-count {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-align: right;
      margin-top: 0.25rem;
    }
    .character-count.exceed-limit {
      color: #dc3545;
      font-weight: 600;
    }
    input.ng-invalid.ng-touched, textarea.ng-invalid.ng-touched, select.ng-invalid.ng-touched {
      border-color: #dc3545;
    }
    input.ng-valid.ng-touched, textarea.ng-valid.ng-touched, select.ng-valid.ng-touched {
      border-color: #28a745;
    }
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
  currencyCode = '';
  currencies: { code: string; name: string; symbol: string; country: string }[] = [];
  selectedCurrency: { code: string; name: string; symbol: string; country: string } | null = null;
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

  onCurrencyChange(code: string) {
    this.selectedCurrency = this.currencies.find(c => c.code === code) || null;
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

  isFormValid(): boolean {
    // Basic required field checks
    if (!this.title.trim() || this.title.length < 3 || this.title.length > 100) return false;
    if (!this.description.trim() || this.description.length < 10 || this.description.length > 2000) return false;
    if (!this.eventType) return false;
    if (!this.eventDate) return false;
    if (!this.country) return false;
    if (!this.currencyCode) return false;
    
    // Event type specific validations
    if (this.eventType === 'Obituary' && (!this.birthDate || !this.deathDate)) return false;
    if (this.eventType === 'Anniversary' && !this.weddingDate) return false;
    
    // Visibility validations
    if (this.visibility === 'InviteOnly') {
      if (!this.invitedEmails.trim() || this.invitedEmails.length > 500) return false;
      // Simple email pattern validation
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(,\s*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})*$/;
      if (!emailPattern.test(this.invitedEmails.trim())) return false;
    }
    
    // Location validation
    if (this.location && this.location.length > 200) return false;
    
    // Created by validation
    if (!this.auth.isLoggedIn() && this.createdBy && this.createdBy.length > 100) return false;
    
    // Display days validation
    const validDays = [1, 3, 7, 14, 30, 90];
    if (!validDays.includes(this.displayDays)) return false;
    
    return true;
  }

  submit() {
    if (!this.isFormValid()) {
      this.error.set('Please fill in all required fields correctly.');
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
    if (this.currencyCode) formData.append('currency', this.currencyCode);
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