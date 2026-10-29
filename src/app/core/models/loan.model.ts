export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  status?: 'active' | 'inactive';
  created_at?: string;
  total_loans?: number;
  total_contacts?: number;
  pendingReceivable?: number;
  pendingPayable?: number;
  totalPending?: number;
  netPosition?: number;
}

export interface Person {
  id: number;
  user_id: number;
  name: string;
  phone?: string;
  email?: string;
  location?: string;
  notes?: string;
  created_at?: string;
  total_loans?: number;
  total_given?: number;
  total_taken?: number;
  pendingReceivable?: number;
  pendingPayable?: number;
  netBalance?: number;
}

export interface LoanPayment {
  id: number;
  loan_id: number;
  user_id: number;
  payment_date: string;
  amount: number;
  payment_method: 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'other';
  notes?: string;
  created_at?: string;
}

export interface Loan {
  id: number;
  user_id: number;
  person_id: number;
  person_name?: string;
  person_phone?: string;
  person_email?: string;
  type: 'given' | 'taken';
  principal_amount: number;
  interest_rate: number;
  issue_date: string;
  due_date?: string;
  location?: string;
  status: 'pending' | 'partially_paid' | 'settled' | 'overdue';
  notes?: string;
  total_paid?: number;
  remaining_balance?: number;
  is_overdue?: number | boolean;
  is_due_today?: number | boolean;
  payments?: LoanPayment[];
  created_at?: string;
}

export interface DashboardMetrics {
  pendingReceivable: number;
  pendingPayable: number;
  netPosition: number;
  todaySpent: number;
  todayReceived: number;
  todayNet: number;
}

export interface LocationStat {
  location_name: string;
  total_loans: number;
  total_amount: number;
  given_amount: number;
  taken_amount: number;
}

export interface DashboardSummary {
  todayDate: string;
  metrics: DashboardMetrics;
  peopleOweMe: Loan[];
  peopleIOwe: Loan[];
  activeLoansCount: number;
  locationStats: LocationStat[];
}

export interface MonthlyActivity {
  month: string;
  loansCreated: number;
  givenAmount: number;
  takenAmount: number;
  activeUsers: number;
  paymentsCount: number;
  repaidAmount: number;
}

export interface SecurityLog {
  id: number;
  user_id?: number;
  ip_address: string;
  user_agent: string;
  client_type: string;
  method: string;
  url: string;
  route: string;
  headers?: string;
  params?: string;
  query?: string;
  body?: string;
  status_code: number;
  failure_reason: string;
  response_body?: string;
  created_at: string;
}
