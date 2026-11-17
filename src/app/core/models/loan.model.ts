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

// ----------------- CATERING SERVICES MODELS -----------------

export interface CateringMember {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  role: string;
  notes?: string;
  status: 'active' | 'inactive';
  created_at?: string;
  total_services_worked?: number;
  total_salary_earned?: number;
  total_salary_paid?: number;
  pending_balance?: number;
}

export interface CateringServiceStaff {
  id: number;
  member_id: number;
  name: string;
  phone: string;
  role: string;
  worked_morning: boolean;
  worked_afternoon: boolean;
  worked_night: boolean;
  session_count: number;
  rate_per_session: number;
  total_salary: number;
  paid_amount: number;
  pending_salary: number;
  paid_status: 'pending' | 'paid' | 'partially_paid';
  remarks?: string;
}

export interface CateringService {
  id: number;
  user_id: number;
  service_name: string;
  customer_name?: string;
  customer_phone?: string;
  service_date: string;
  sessions: ('morning' | 'afternoon' | 'night' | string)[];
  location: string;
  map_link?: string;
  total_amount: number;
  advance_amount: number;
  pending_amount: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  remarks?: string;
  staff_count?: number;
  total_staff_salary?: number;
  total_staff_paid?: number;
  staff_list?: CateringServiceStaff[];
  created_at?: string;
  isExpanded?: boolean; // UI state for expanding members list
}

export interface CateringStaffPayment {
  id: number;
  service_staff_id?: number;
  service_id?: number;
  member_id: number;
  user_id: number;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'other';
  notes?: string;
  created_at?: string;
  member_name?: string;
  member_phone?: string;
  member_role?: string;
  service_name?: string;
  service_date?: string;
  service_location?: string;
  user_name?: string;
  username?: string;
}

export interface CateringSummary {
  totalServices: number;
  upcomingServices: number;
  completedServices: number;
  totalRevenue: number;
  totalUpcomingAmount: number;
  totalAdvanceReceived: number;
  totalPendingCustomerAmount: number;
  totalRosterMembers: number;
  totalStaffSalaryObligation: number;
  totalStaffSalaryPaid: number;
  pendingStaffSalaryToPay: number;
}

export interface AdminCateringStaffByPerson {
  member_id: number;
  member_name: string;
  member_phone: string;
  member_role: string;
  member_notes?: string;
  user_id: number;
  user_name: string;
  username: string;
  total_services_worked: number;
  total_sessions_worked: number;
  total_salary_earned: number;
  total_salary_paid: number;
  pending_balance: number;
  created_at?: string;
}

// ----------------- DAILY EXPENSES & TAGS MODELS -----------------

export interface ExpenseTag {
  id: number;
  user_id: number;
  name: string;
  color: string;
  icon: string;
  expense_count?: number;
  total_spent?: number;
  created_at?: string;
}

export interface ExpensePaymentMethod {
  id: number;
  user_id: number;
  type: 'cash' | 'upi' | 'other';
  name: string;
  icon: string;
  is_default: boolean;
  status: 'active' | 'inactive';
  expense_count?: number;
  total_spent?: number;
  created_at?: string;
}

export interface DailyExpense {
  id: number;
  user_id: number;
  title: string;
  amount: number;
  expense_date: string;
  tag_id?: number | null;
  tag_name?: string;
  tag_color?: string;
  tag_icon?: string;
  payment_type: 'cash' | 'upi' | 'other';
  payment_method_id?: number | null;
  payment_app_name?: string;
  method_name?: string;
  method_icon?: string;
  notes?: string;
  created_at?: string;
}

export interface ExpenseTagBreakdown {
  tag_id: number | null;
  tag_name: string;
  tag_color: string;
  tag_icon: string;
  total_amount: number;
  count: number;
  percentage: number;
}

export interface ExpensePaymentBreakdown {
  payment_type: 'cash' | 'upi' | 'other';
  method_name: string;
  method_icon: string;
  total_amount: number;
  count: number;
  percentage: number;
}

export interface ExpenseDailyItem {
  date: string;
  day: number;
  total_amount: number;
  count: number;
}

export interface ExpenseMonthlyItem {
  month: number;
  monthName: string;
  total_amount: number;
  count: number;
  percentage: number;
}

export interface ExpenseOverviewSummary {
  mode: 'monthly' | 'yearly';
  year: number;
  month?: number;
  monthName?: string;
  totalSpent: number;
  dailyAverage?: number;
  monthlyAverage?: number;
  todaySpent: number;
  transactionsCount: number;
  cashSpent: number;
  upiSpent: number;
  highestMonth?: { month: number; monthName: string; amount: number } | null;
  tagBreakdown: ExpenseTagBreakdown[];
  paymentBreakdown: ExpensePaymentBreakdown[];
  dailyBreakdown?: ExpenseDailyItem[];
  monthlyBreakdown?: ExpenseMonthlyItem[];
}

// ==========================================
// 📱 SMS GATEWAY & DAD'S PHONE TELEMETRY MODELS
// ==========================================

export interface SmsDevice {
  id: number;
  owner_id: number;
  owner_name?: string;
  owner_user_name?: string;
  owner_user_email?: string;
  device_name: string;
  phone_number?: string;
  created_at?: string;
  updated_at?: string;
  total_messages?: number;
  unread_messages?: number;
  latest_message_at?: string;
  authorized_users_count?: number;
}

export interface SmsMessage {
  id: number;
  messageId?: string;
  type?: string;
  inferred_type?: string;
  device_id: number;
  device_name?: string;
  device_phone?: string;
  owner_name?: string;
  sender: string;
  message: string;
  is_read: number | boolean;
  read_by?: number;
  read_by_name?: string;
  read_at?: string;
  received_at: string;
  deleted_by?: number;
  deleted_at?: string;
  inserted_at?: string;
  updated_at?: string;
  is_otp?: boolean;
  otp_code?: string | null;
  copied?: boolean;
}

export interface SmsNotification {
  id: number;
  message_id: number;
  user_id: number;
  user_name?: string;
  user_email?: string;
  msg_sender?: string;
  msg_content?: string;
  msg_type?: string;
  device_name?: string;
  sent_at?: string;
  delivery_status: 'pending' | 'sent' | 'failed';
}

export interface SmsUserDeviceAccess {
  id: number;
  user_id: number;
  device_id: number;
  user_name?: string;
  user_email?: string;
  user_type?: 'parent' | 'child' | 'admin';
  device_name?: string;
  device_phone?: string;
  can_view_messages: number | boolean;
  can_delete_messages: number | boolean;
  can_receive_notifications: number | boolean;
  can_send_sms: number | boolean;
  granted_by: number;
  granted_by_name?: string;
  granted_at?: string;
  updated_at?: string;
}

export interface SmsUserFcmToken {
  id: number;
  user_id: number;
  user_name?: string;
  user_email?: string;
  user_type?: string;
  fcm_token: string;
  device_type: string;
  is_active: number | boolean;
  created_at?: string;
  updated_at?: string;
  last_used_at?: string;
}

export interface SmsUser {
  id: number;
  name?: string;
  email: string;
  user_type: 'parent' | 'child' | 'admin';
  is_admin: number | boolean;
  created_at?: string;
  devices_owned?: number;
  active_fcm_tokens?: number;
  accessible_devices?: number;
}

export interface SmsLog {
  id: number;
  title: string;
  message: string;
  inserted_at?: string;
}

export interface SmsGatewayOverview {
  devices: {
    total: number;
    active: number;
    latest: SmsDevice | null;
  };
  messages: {
    total: number;
    unread: number;
    today: number;
    last24h: number;
    latestAt: string | null;
    recentOtpCount: number;
  };
  notifications: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
    deliveryRate: number;
  };
  fcm: {
    total: number;
    active: number;
  };
  users: {
    total: number;
    parents: number;
    children: number;
    admins: number;
  };
  accessGrants: number;
}
