import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.css']
})
export class ReviewComponent implements OnInit {
  auction: any;
  product: any;
  buyerId: number | null = null;
  reviewForm: FormGroup;
  submittedReview: any = null;
  isEditing = false;
  showDeleteMessage: boolean = false;


  constructor(
    private router: Router,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state;

    this.reviewForm = this.fb.group({
      rating: [null, [Validators.required, Validators.min(1), Validators.max(10)]],
      comment: ['', Validators.required]
    });

    if (state) {
      this.auction = state['auction'];
      this.product = state['product'];
      this.buyerId = state['buyerId'];
    }
  }

  ngOnInit() {
    if (this.product?.productId && this.buyerId) {
      this.fetchReview();
    }
  }

  goBack() {
    this.router.navigate(['/buyer/dashboard']);
  }

  fetchReview() {
    this.http.get(`https://localhost:7046/api/Review/byUserAndProduct/${this.buyerId}/${this.product.productId}`)
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.submittedReview = res;
          }
        },
        error: (err) => {
          console.error('Failed to fetch review:', err);
        }
      });
  }

  async submitReview() {
    if (!this.product?.productId || !this.buyerId) {
      alert('Missing product or buyer information.');
      return;
    }

    try {
      const productDetails: any = await this.http
        .get(`https://localhost:7046/api/Product/${this.product.productId}`)
        .toPromise();

      const sellerId = productDetails?.sellerId;

      if (!sellerId) {
        alert('Seller information not found.');
        return;
      }

      const payload = {
        userId: this.buyerId,
        targetUserId: sellerId,
        rating: this.reviewForm.value.rating,
        comment: this.reviewForm.value.comment
      };

      this.http.post('https://localhost:7046/api/Review/create', payload).subscribe({
        next: (res) => {
          this.submittedReview = res;
          this.reviewForm.reset();
        },
        error: (err) => {
          console.error('Review submission failed:', err);
          alert('Failed to submit review.');
        }
      });
    } catch (error) {
      console.error('Error fetching product details:', error);
      alert('Error fetching product details.');
    }
  }

  updateReview() {
    if (!this.submittedReview?.reviewId) return;
  
    const payload = {
      reviewId: this.submittedReview.reviewId,
      rating: this.reviewForm.value.rating,
      comment: this.reviewForm.value.comment
    };
  
    this.http.put('https://localhost:7046/api/Review/update', payload).subscribe({
      next: (res) => {
        this.submittedReview = res;
        this.isEditing = false;
        this.reviewForm.reset(); // Clear the form
      },
      error: (err) => {
        console.error('Review update failed:', err);
        alert('Failed to update review.');
      }
    });
  }
  
deleteReview() {
  if (!this.submittedReview?.reviewId) return;

  this.http.delete(`https://localhost:7046/api/Review/delete/${this.submittedReview.reviewId}`).subscribe({
    next: () => {
      this.submittedReview = null;
      this.reviewForm.reset();

      // Show toast message
      this.showDeleteMessage = true;
      setTimeout(() => {
        this.showDeleteMessage = false;
      }, 1800);
    },
    error: (err) => {
      console.error('Review deletion failed:', err);
      alert('Failed to delete review.');
    }
  });
}


  enableEdit() {
    this.isEditing = true;
    this.reviewForm.patchValue({
      rating: this.submittedReview.rating,
      comment: this.submittedReview.comment
    });
  }  
}


