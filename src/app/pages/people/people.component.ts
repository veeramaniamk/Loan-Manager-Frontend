import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Person, Loan } from '../../core/models/loan.model';

@Component({
  selector: 'app-people',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
    <div class="container people-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">People & Contacts Directory</h1>
          <p class="page-subtitle">Track debtors, creditors, net balances, and transactions per person</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <span>➕ Add Contact</span>
        </button>
      </div>

      <!-- Search Input -->
      <div class="card search-card">
        <input 
          type="text" 
          class="form-control" 
          placeholder="Search contacts by name, location, or phone..." 
          [(ngModel)]="searchTerm" 
        />
      </div>

      @if (loading) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading contacts directory...</p>
        </div>
      } @else if (filteredPeople.length === 0) {
        <div class="card empty-card">
          <span class="empty-icon">👥</span>
          <h3>No contacts found</h3>
          <p class="text-muted">Start by adding people you lend money to or borrow money from.</p>
          <button class="btn btn-primary btn-sm" (click)="openCreateModal()">Add First Contact</button>
        </div>
      } @else {
        <!-- People Grid -->
        <div class="people-grid">
          @for (person of filteredPeople; track person.id) {
            <div class="card person-card">
              <div class="person-card-top">
                <div class="person-avatar">
                  {{ person.name.substring(0, 2).toUpperCase() }}
                </div>
                <div class="person-main-info">
                  <h3 class="person-title">{{ person.name }}</h3>
                  <span class="person-loc">📍 {{ person.location || 'Location unassigned' }}</span>
                </div>
                <div class="person-actions">
                  <button class="icon-btn" (click)="openEditModal(person)" title="Edit Contact">✏️</button>
                  <button class="icon-btn icon-btn-danger" (click)="deletePerson(person)" title="Delete Contact">🗑️</button>
                </div>
              </div>

              <!-- Contact Info -->
              <div class="contact-details">
                @if (person.phone) {
                  <div class="contact-row">
                    <span class="lbl">Phone:</span>
                    <a [href]="'tel:' + person.phone" class="val val-link">{{ person.phone }}</a>
                  </div>
                }
                @if (person.email) {
                  <div class="contact-row">
                    <span class="lbl">Email:</span>
                    <a [href]="'mailto:' + person.email" class="val val-link">{{ person.email }}</a>
                  </div>
                }
                @if (person.notes) {
                  <p class="person-notes">{{ person.notes }}</p>
                }
              </div>

              <!-- Financial Balance Widget -->
              <div class="person-finance-box">
                <div class="finance-row">
                  <span>Owes You:</span>
                  <strong class="text-success">{{ person.pendingReceivable | currency:'INR':'symbol':'1.0-0' }}</strong>
                </div>
                <div class="finance-row">
                  <span>You Owe:</span>
                  <strong class="text-danger">{{ person.pendingPayable | currency:'INR':'symbol':'1.0-0' }}</strong>
                </div>
                <div class="finance-divider"></div>
                <div class="finance-row net-row">
                  <span>Net Position:</span>
                  <strong [ngClass]="(person.netBalance ?? 0) >= 0 ? 'text-success' : 'text-danger'">
                    {{ ((person.netBalance ?? 0) >= 0 ? '+' : '') }}
                    {{ person.netBalance | currency:'INR':'symbol':'1.0-0' }}
                  </strong>
                </div>
              </div>

              <div class="person-card-footer">
                <span class="badge badge-secondary">{{ person.total_loans || 0 }} total loans</span>
                <button class="btn btn-secondary btn-sm" (click)="viewPersonLoans(person)">
                  View History
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Create / Edit Person Modal -->
      @if (showModal) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ editingPersonId ? 'Edit Contact' : '➕ Add New Contact' }}</h3>
              <button class="btn btn-sm btn-secondary" (click)="closeModal()">✕</button>
            </div>
            <div class="modal-body">
              @if (modalError) {
                <div class="alert alert-danger">{{ modalError }}</div>
              }

              <div class="form-group">
                <label class="form-label">Full Name *</label>
                <input type="text" class="form-control" [(ngModel)]="formData.name" placeholder="e.g. Anand Kumar" required />
              </div>

              <div class="form-group">
                <label class="form-label">Phone Number</label>
                <input type="text" class="form-control" [(ngModel)]="formData.phone" placeholder="+91 9876543210" />
              </div>

              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" class="form-control" [(ngModel)]="formData.email" placeholder="anand@gmail.com" />
              </div>

              <div class="form-group">
                <label class="form-label">Location (City / Area)</label>
                <input type="text" class="form-control" [(ngModel)]="formData.location" placeholder="e.g. Bangalore, Koramangala" />
              </div>

              <div class="form-group">
                <label class="form-label">Notes / Relationship</label>
                <textarea class="form-control" [(ngModel)]="formData.notes" placeholder="e.g. College friend, works in TCS"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button class="btn btn-primary" (click)="submitPerson()" [disabled]="saving">
                {{ saving ? 'Saving...' : 'Save Contact' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Person History Modal -->
      @if (selectedPersonDetail) {
        <div class="modal-overlay" (click)="closeDetailModal()">
          <div class="modal-dialog modal-lg" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h3>{{ selectedPersonDetail.name }}'s Loan History</h3>
                <span class="text-muted">📍 {{ selectedPersonDetail.location || 'Location unassigned' }}</span>
              </div>
              <button class="btn btn-sm btn-secondary" (click)="closeDetailModal()">✕</button>
            </div>
            <div class="modal-body">
              @if (!selectedPersonDetail.loans || selectedPersonDetail.loans.length === 0) {
                <p class="text-muted text-center py-4">No loan records associated with this person yet.</p>
              } @else {
                <div class="table-container">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Principal</th>
                        <th>Remaining</th>
                        <th>Status</th>
                        <th>Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (l of selectedPersonDetail.loans; track l.id) {
                        <tr>
                          <td>{{ l.issue_date }}</td>
                          <td>
                            <span class="badge" [ngClass]="l.type === 'given' ? 'badge-success' : 'badge-danger'">
                              {{ l.type === 'given' ? 'Lent' : 'Borrowed' }}
                            </span>
                          </td>
                          <td>{{ l.principal_amount | currency:'INR':'symbol':'1.0-0' }}</td>
                          <td>
                            <strong [ngClass]="l.remaining_balance === 0 ? 'text-muted' : (l.type === 'given' ? 'text-success' : 'text-danger')">
                              {{ l.remaining_balance | currency:'INR':'symbol':'1.0-0' }}
                            </strong>
                          </td>
                          <td>
                            <span class="badge badge-secondary">{{ l.status }}</span>
                          </td>
                          <td>{{ l.due_date || 'None' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeDetailModal()">Close</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .people-container {
      padding-top: 2rem;
      padding-bottom: 3rem;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .page-title {
      font-size: 1.85rem;
    }
    .page-subtitle {
      font-size: 0.95rem;
      color: var(--text-muted);
    }
    .search-card {
      margin-bottom: 1.5rem;
      padding: 0.75rem 1rem;
    }
    .people-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
    }
    .person-card {
      display: flex;
      flex-direction: column;
    }
    .person-card-top {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .person-avatar {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
      color: #3730a3;
      font-weight: 800;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .person-main-info {
      flex: 1;
    }
    .person-title {
      font-size: 1.05rem;
      line-height: 1.2;
    }
    .person-loc {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .person-actions {
      display: flex;
      gap: 0.25rem;
    }
    .icon-btn {
      background: none;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      cursor: pointer;
      padding: 0.35rem 0.5rem;
      font-size: 0.85rem;
    }
    .icon-btn:hover {
      background: #f1f5f9;
    }
    .contact-details {
      font-size: 0.8rem;
      margin-bottom: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .contact-row {
      display: flex;
      gap: 0.5rem;
    }
    .contact-row .lbl {
      color: var(--text-muted);
      width: 45px;
    }
    .val-link {
      color: var(--primary);
      text-decoration: underline;
    }
    .person-notes {
      font-style: italic;
      color: var(--text-muted);
      margin-top: 0.25rem;
      font-size: 0.775rem;
    }
    .person-finance-box {
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.75rem 1rem;
      margin-bottom: 1rem;
      font-size: 0.825rem;
    }
    .finance-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.25rem;
    }
    .finance-divider {
      height: 1px;
      background: var(--border-color);
      margin: 0.4rem 0;
    }
    .net-row {
      font-size: 0.9rem;
      font-weight: 700;
      margin-bottom: 0;
    }
    .person-card-footer {
      margin-top: auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-color);
    }
    .modal-lg {
      max-width: 720px;
    }
    .empty-card {
      text-align: center;
      padding: 4rem 1rem;
    }
    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      display: block;
    }
  `]
})
export class PeopleComponent implements OnInit {
  apiService = inject(ApiService);

  people: Person[] = this.getCachedPeople();
  searchTerm = '';
  loading = this.people.length === 0;

  // Modal state
  showModal = false;
  editingPersonId: number | null = null;
  formData = {
    name: '',
    phone: '',
    email: '',
    location: '',
    notes: ''
  };
  modalError = '';
  saving = false;

  // History modal
  selectedPersonDetail: (Person & { loans: Loan[] }) | null = null;

  private getCachedPeople(): Person[] {
    try {
      const cached = localStorage.getItem('lm_people_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }

  ngOnInit() {
    this.loadPeople();
  }

  loadPeople() {
    if (this.people.length === 0) {
      this.loading = true;
    }
    this.apiService.getPeople().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.people = res.data;
          try {
            localStorage.setItem('lm_people_cache', JSON.stringify(res.data));
          } catch {}
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to load people:', err);
      }
    });
  }

  get filteredPeople(): Person[] {
    if (!this.searchTerm.trim()) return this.people;
    const term = this.searchTerm.toLowerCase();
    return this.people.filter(p => 
      p.name.toLowerCase().includes(term) ||
      (p.location && p.location.toLowerCase().includes(term)) ||
      (p.phone && p.phone.includes(term))
    );
  }

  openCreateModal() {
    this.editingPersonId = null;
    this.formData = { name: '', phone: '', email: '', location: '', notes: '' };
    this.modalError = '';
    this.showModal = true;
  }

  openEditModal(person: Person) {
    this.editingPersonId = person.id;
    this.formData = {
      name: person.name,
      phone: person.phone || '',
      email: person.email || '',
      location: person.location || '',
      notes: person.notes || ''
    };
    this.modalError = '';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  submitPerson() {
    if (!this.formData.name.trim()) {
      this.modalError = 'Person name is required.';
      return;
    }

    this.saving = true;
    this.modalError = '';

    if (this.editingPersonId) {
      this.apiService.updatePerson(this.editingPersonId, this.formData).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadPeople();
        },
        error: (err) => {
          this.saving = false;
          this.modalError = err.error?.error || 'Failed to update person.';
        }
      });
    } else {
      this.apiService.createPerson(this.formData).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadPeople();
        },
        error: (err) => {
          this.saving = false;
          this.modalError = err.error?.error || 'Failed to create contact.';
        }
      });
    }
  }

  deletePerson(person: Person) {
    if (confirm(`Are you sure you want to delete ${person.name}? All associated loans will also be deleted.`)) {
      this.apiService.deletePerson(person.id).subscribe({
        next: () => this.loadPeople(),
        error: (err) => alert(err.error?.error || 'Failed to delete contact.')
      });
    }
  }

  viewPersonLoans(person: Person) {
    this.apiService.getPersonById(person.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedPersonDetail = res.data;
        }
      }
    });
  }

  closeDetailModal() {
    this.selectedPersonDetail = null;
  }
}
