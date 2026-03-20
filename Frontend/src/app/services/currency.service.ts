import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
}

export interface PriceInfo {
  duration: number;
  displayText: string;
  amountUSD: number;
  amount: number;
  currency: string;
  symbol: string;
  formattedAmount: string;
  dailyRate: number;
  formattedDailyRate: string;
}

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private apiUrl = '/api/payments';
  private currenciesSubject = new BehaviorSubject<Currency[]>([]);
  public currencies$ = this.currenciesSubject.asObservable();
  
  private selectedCurrencySubject = new BehaviorSubject<Currency>({
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    exchangeRate: 1
  });
  public selectedCurrency$ = this.selectedCurrencySubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCurrencies();
  }

  loadCurrencies(): void {
    this.http.get<Currency[]>(`${this.apiUrl}/currencies`).subscribe({
      next: (currencies) => this.currenciesSubject.next(currencies),
      error: (error) => console.error('Error loading currencies:', error)
    });
  }

  getPrices(currencyCode: string = 'USD'): Observable<PriceInfo[]> {
    return this.http.get<{ prices: PriceInfo[] }>(`${this.apiUrl}/prices?currencyCode=${currencyCode}`)
      .pipe(map(response => response.prices));
  }

  setSelectedCurrency(currency: Currency): void {
    this.selectedCurrencySubject.next(currency);
    localStorage.setItem('selectedCurrency', JSON.stringify(currency));
  }

  getSelectedCurrency(): Currency {
    const saved = localStorage.getItem('selectedCurrency');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return this.selectedCurrencySubject.value;
      }
    }
    return this.selectedCurrencySubject.value;
  }

  processPayment(paymentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/process-payment`, paymentData);
  }

  formatAmount(amount: number, currency: Currency): string {
    return `${currency.symbol}${amount.toFixed(2)}`;
  }
}