// ==================== ENUMS ====================
export enum LoanStatus {
  Closed = 0,
  Pending = 1,
  Approved = 2,
  Active = 3,
  Upcoming = 4,
  Due = 5,
  Overdue = 6,
  Partial = 7,
  AtRisk = 8,
  Defaulted = 9
}

export enum CreditScore {
  A = 0,
  B = 1,
  C = 2,
  D = 3
}

export enum UserRole {
  Owner = 0,
  Admin = 1,
  Loan_Officer = 2,
  Collector = 3
}

export enum PaymentMethod {
  Cash = 0,
  BankTransfer = 1,
  MobilePayment = 2,
  Check = 3
}

// ==================== AUTH ====================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: number;
  email: string;
  role: string;
  fullName: string;
}

export interface RegisterUserRequest {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  phoneNumber: string;
}

// ==================== BORROWERS ====================
export interface Borrower {
  borrowerId: number;
  fullName: string;
  phoneNumber: string;
  alternatePhoneNumber?: string;
  email?: string;
  nationalIdNumber: string;
  homeAddress?: string;
  employerOrBusiness?: string;
  guarantorName?: string;
  guarantorPhone?: string;
  internalCreditScore: CreditScore;
  onTimePaymentPercentage: number;
  totalLoansCount: number;
  defaultedLoansCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateBorrowerRequest {
  fullName: string;
  phoneNumber: string;
  alternatePhoneNumber?: string;
  email?: string;
  nationalIdNumber: string;
  homeAddress?: string;
  employerOrBusiness?: string;
  guarantorName?: string;
  guarantorPhone?: string;
}

export interface BorrowerFilterRequest {
  searchTerm?: string;
  creditScore?: CreditScore;
  isActive?: boolean;
  page: number;
  pageSize: number;
}

// ==================== LOANS ====================
export interface Loan {
  loanId: number;
  loanNumber: string;
  borrowerId: number;
  borrowerName?: string;
  requestedAmount: number;
  approvedAmount: number;
  outstandingPrincipal: number;
  totalInterestAccrued: number;
  totalPenaltiesAccrued: number;
  phase1InterestRate: number;
  phase2InterestRate: number;
  durationInMonths: number;
  gracePeriodDays: number;
  dailyPenaltyAmount: number;
  status: LoanStatus;
  applicationDate: string;
  approvalDate?: string;
  disbursementDate?: string;
  firstPaymentDueDate?: string;
  lastPaymentDate?: string;
  closedDate?: string;
  notes?: string;
}

export interface CreateLoanApplicationRequest {
  borrowerId: number;
  requestedAmount: number;
  durationInMonths: number;
  phase1InterestRate?: number;
  phase2InterestRate?: number;
  gracePeriodDays?: number;
  dailyPenaltyAmount?: number;
  notes?: string;
}

export interface ApproveLoanRequest {
  loanId: number;
  approvedAmount: number;
  phase1InterestRate?: number;
  phase2InterestRate?: number;
  repaymentDay?: number;
  notes?: string;
}

export interface DisburseLoanRequest {
  loanId: number;
  disbursementMethod: PaymentMethod;
  disbursementDate?: string;
}

export interface LoanFilterRequest {
  searchTerm?: string;
  status?: LoanStatus;
  borrowerId?: number;
  fromDate?: string;
  toDate?: string;
  page: number;
  pageSize: number;
}

// ==================== PAYMENTS ====================
export interface Payment {
  paymentId: number;
  loanId: number;
  loanNumber?: string;
  borrowerName?: string;
  amount: number;
  principalPaid: number;
  interestPaid: number;
  penaltiesPaid: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  receiptNumber?: string;
}

export interface RecordPaymentRequest {
  loanId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate?: string;
  notes?: string;
}

export interface PaymentFilterRequest {
  loanId?: number;
  borrowerId?: number;
  fromDate?: string;
  toDate?: string;
  page: number;
  pageSize: number;
}

// ==================== ANALYTICS ====================
export interface DashboardSummary {
  totalLoansOutstanding: number;
  interestIncomeMonthToDate: number;
  penaltiesCollected: number;
  activeLoansCount: number;
  overdueLoansCount: number;
  averageLoanSize: number;
  averageInterestRate: number;
  totalPrincipalDisbursedThisMonth: number;
  collectionRate: number;
}

export interface PortfolioHealth {
  totalActiveLoans: number;
  percentOnTime: number;
  percentDue: number;
  percentOverdue: number;
  percentAtRisk: number;
  percentDefaulted: number;
  par30: number;
  par60: number;
  par90: number;
}

export interface CashFlowProjection {
  date: string;
  expectedPrincipal: number;
  expectedInterest: number;
  expectedTotal: number;
}

// ==================== REPAYMENT ====================
export interface RepaymentScheduleDto {
  scheduleId: number;
  loanId: number;
  dueDate: string;
  principalDue: number;
  interestDue: number;
  penaltyDue: number;
  totalDue: number;
  isPaid: boolean;
  paidDate?: string;
  paidAmount?: number;
  interestPhase: string;
  balanceAfterPayment: number;
  amountPaid: number;
}

export interface LoanDetailsResponse {
  loan: Loan;
  borrower: Borrower;
  repaymentSchedule: RepaymentScheduleDto[];
  paymentHistory: Payment[];
  totalPaid: number;
  totalRemaining: number;
}

// ==================== LOAN CALCULATOR ====================
export interface LoanCalculatorRequest {
  loanAmount: number;
  periodInMonths: number;
  phase1InterestRate?: number;
  phase2InterestRate?: number;
  phase1Months?: number;
}

export interface LoanCalculatorResult {
  loanAmount: number;
  totalInterest: number;
  totalRepayment: number;
  monthlyAveragePayment: number;
  schedule: RepaymentScheduleDto[];
  summary: {
    effectiveInterestRate: number;
    phase1TotalInterest: number;
    phase2TotalInterest: number;
  };
}

// ==================== PAGINATION ====================
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
