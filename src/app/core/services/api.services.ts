import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Borrower, CreateBorrowerRequest, BorrowerFilterRequest,
  Loan, CreateLoanApplicationRequest, ApproveLoanRequest, DisburseLoanRequest, LoanFilterRequest,
  Payment, RecordPaymentRequest, PaymentFilterRequest,
  DashboardSummary, PortfolioHealth, CashFlowProjection,
  LoanCalculatorRequest, LoanCalculatorResult, LoanDetailsResponse,
  RegisterUserRequest
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class BorrowerService {
  private base = `${environment.apiUrl}/borrowers`;
  constructor(private http: HttpClient) {}

  create(req: CreateBorrowerRequest): Observable<Borrower> {
    return this.http.post<Borrower>(this.base, req);
  }

  update(id: number, req: CreateBorrowerRequest): Observable<Borrower> {
    return this.http.put<Borrower>(`${this.base}/${id}`, req);
  }

  getById(id: number): Observable<Borrower> {
    return this.http.get<Borrower>(`${this.base}/${id}`);
  }

  filter(req: BorrowerFilterRequest): Observable<any> {
    return this.http.post<any>(`${this.base}/filter`, req);
  }

  getLoanHistory(id: number): Observable<Loan[]> {
    return this.http.get<Loan[]>(`${this.base}/${id}/loans`);
  }

  getStatement(borrowerId: number, loanId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${borrowerId}/statement/${loanId}`);
  }

  updateCreditScore(id: number): Observable<any> {
    return this.http.post<any>(`${this.base}/${id}/update-credit-score`, {});
  }
}

@Injectable({ providedIn: 'root' })
export class LoanService {
  private base = `${environment.apiUrl}/loans`;
  constructor(private http: HttpClient) {}

  calculate(req: LoanCalculatorRequest): Observable<LoanCalculatorResult> {
    return this.http.post<LoanCalculatorResult>(`${this.base}/calculate`, req);
  }

  createApplication(req: CreateLoanApplicationRequest): Observable<Loan> {
    return this.http.post<Loan>(`${this.base}/application`, req);
  }

  approve(req: ApproveLoanRequest): Observable<Loan> {
    return this.http.post<Loan>(`${this.base}/approve`, req);
  }

  disburse(req: DisburseLoanRequest): Observable<Loan> {
    return this.http.post<Loan>(`${this.base}/disburse`, req);
  }

  getById(id: number): Observable<LoanDetailsResponse> {
    return this.http.get<LoanDetailsResponse>(`${this.base}/${id}`);
  }

  filter(req: LoanFilterRequest): Observable<any> {
    return this.http.post<any>(`${this.base}/filter`, req);
  }

  updateStatuses(): Observable<any> {
    return this.http.post<any>(`${this.base}/update-statuses`, {});
  }
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private base = `${environment.apiUrl}/payments`;
  constructor(private http: HttpClient) {}

  record(req: RecordPaymentRequest): Observable<Payment> {
    return this.http.post<Payment>(this.base, req);
  }

  filter(req: PaymentFilterRequest): Observable<any> {
    return this.http.post<any>(`${this.base}/filter`, req);
  }

  getReceipt(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}/receipt`);
  }
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private base = `${environment.apiUrl}/analytics`;
  constructor(private http: HttpClient) {}

  getDashboard(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.base}/dashboard`);
  }

  getPortfolioHealth(): Observable<PortfolioHealth> {
    return this.http.get<PortfolioHealth>(`${this.base}/portfolio-health`);
  }

  getCashFlow(days = 30): Observable<CashFlowProjection[]> {
    return this.http.get<CashFlowProjection[]>(`${this.base}/cash-flow?days=${days}`);
  }

  getRevenue(fromDate: string, toDate: string): Observable<any> {
    return this.http.get<any>(`${this.base}/revenue?fromDate=${fromDate}&toDate=${toDate}`);
  }

  getTopBorrowers(count = 10): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/top-borrowers?count=${count}`);
  }

  getHighRiskBorrowers(count = 10): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/high-risk-borrowers?count=${count}`);
  }
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private base = `${environment.apiUrl}/users`;
  constructor(private http: HttpClient) {}

  register(req: RegisterUserRequest): Observable<any> {
    return this.http.post<any>(`${this.base}/register`, req);
  }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.base);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}`);
  }

  update(id: number, req: any): Observable<any> {
    return this.http.put<any>(`${this.base}/${id}`, req);
  }

  changePassword(req: any): Observable<any> {
    return this.http.post<any>(`${this.base}/change-password`, req);
  }

  getActivityLog(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/${userId}/activity`);
  }
}
