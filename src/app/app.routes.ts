import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { AdminComponent } from './dashboard/admin/admin.component';
import { BuyerComponent } from './dashboard/buyer/buyer.component';
import { SellerComponent } from './dashboard/seller/seller.component';
// import { AuctionDashboardComponent } from './dashboard/auction/auction.component';
 
export const routes: Routes = [
  { path: '', component: HomeComponent },           // ✅ Default route shows HomeComponent
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'admin/dashboard', component: AdminComponent },
  { path: 'buyer/dashboard', component: BuyerComponent },
  { path: 'seller/dashboard', component: SellerComponent },
  // { path: 'auction/dashboard', component: AuctionComponent },
  { path: '**', redirectTo: '' }
];
 