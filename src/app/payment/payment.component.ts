import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css'],
})
export class PaymentComponent {
  private router = inject(Router);
  private http = inject(HttpClient);

  auctionId = signal<number | null>(null);
  productId = signal<number | null>(null);
  buyerId = signal<number | null>(null);
  bidAmount = signal<number>(1000); // You can fetch actual bid if needed
  paymentMethod = signal<string>('');
  transaction = signal<any>(null);
  showPayButton = signal(false);  
  productName = signal<string>('');

  constructor() {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as any;
  
    if (state?.auctionId && state?.productId && state?.buyerId) {
      this.auctionId.set(state.auctionId);
      this.productId.set(state.productId);
      this.buyerId.set(state.buyerId);

      this.fetchWinningBid(state.auctionId, state.buyerId);
    } else {
      console.error('Missing navigation state. Redirecting...');
      this.router.navigate(['/buyer/dashboard']);
    }
  }
  

  onMethodSelect(event: Event) {
    const selected = (event.target as HTMLSelectElement).value;
    this.paymentMethod.set(selected);
    this.showPayButton.set(true);
  }

  fetchWinningBid(auctionId: number, buyerId: number) {
    this.http.get<any[]>(`https://localhost:7046/api/Bid/auction/${auctionId}`).subscribe({
      next: (bids) => {
        const myWinningBid = bids.find(b => b.buyerId === buyerId);
        if (myWinningBid) {
          this.bidAmount.set(myWinningBid.amount);
        }
      },
      error: (err) => console.error('Error fetching bids:', err)
    });
  }

  goToDashboard() {
    this.router.navigate(['/buyer/dashboard']);
  }

  // API call to store transaction details
  
  makePayment() {
    const payload = {
      buyerId: this.buyerId(),
      auctionId: this.auctionId(),
      amount: this.bidAmount(),
    };

    this.http.post('https://localhost:7046/api/Transaction/create', payload).subscribe({
      next: (res) => this.transaction.set(res),
      error: (err) => console.error('Payment failed:', err),
    });
  }
}
