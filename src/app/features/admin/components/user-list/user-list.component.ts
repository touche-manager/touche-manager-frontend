import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { AdminUserResponse } from '../../../../core/models/admin.models';
import { RoleName } from '../../../../core/models/auth.models';

@Component({
  selector: 'app-admin-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4">

      <!-- Search -->
      <input
        id="filter-user-email"
        type="text"
        [ngModel]="search()"
        (ngModelChange)="search.set($event)"
        placeholder="Buscar por email..."
        class="w-full sm:w-80 text-sm border border-slate-200 rounded-xl px-4 py-2.5 text-touche-navy
               placeholder-slate-400 focus:outline-none focus:border-touche-celeste transition-colors"
      />

      @if (error()) {
        <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-touche-alert font-semibold">
          {{ error() }}
        </div>
      }

      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-10 w-10 border-4 border-touche-celeste border-t-transparent"></div>
        </div>
      }

      @if (!loading()) {
        <div class="card overflow-hidden p-0">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-200 bg-touche-slate">
                  <th class="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-12">#</th>
                  <th class="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                  <th class="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Roles</th>
                  <th class="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Alta</th>
                  <th class="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Agregar rol</th>
                </tr>
              </thead>
              <tbody>
                @for (user of filteredUsers(); track user.id) {
                  <tr class="border-b border-slate-100 hover:bg-touche-slate/60 transition-colors">
                    <td class="py-3 px-4 text-slate-400">{{ user.id }}</td>
                    <td class="py-3 px-4 font-medium text-touche-navy break-all">{{ user.email }}</td>
                    <td class="py-3 px-4">
                      <div class="flex flex-wrap gap-1.5">
                        @for (role of user.roles; track role) {
                          <span class="inline-flex items-center gap-1 badge bg-touche-celeste/12 text-touche-navy">
                            {{ roleLabel(role) }}
                            <button
                              [id]="'btn-remove-role-' + user.id + '-' + role"
                              (click)="removeRole(user, role)"
                              [disabled]="user.roles.length <= 1 || updatingUserId() === user.id"
                              class="text-slate-400 hover:text-touche-alert transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Quitar rol"
                            >×</button>
                          </span>
                        }
                      </div>
                    </td>
                    <td class="py-3 px-4 hidden md:table-cell text-slate-400">{{ user.createdAt | date:'dd/MM/yyyy' }}</td>
                    <td class="py-3 px-4">
                      <div class="flex gap-1.5">
                        <select
                          [id]="'select-add-role-' + user.id"
                          [ngModel]="pendingRole()[user.id] || ''"
                          (ngModelChange)="setPendingRole(user.id, $event)"
                          class="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-touche-navy bg-white
                                 focus:outline-none focus:border-touche-celeste transition-colors"
                        >
                          <option value="" disabled>Rol...</option>
                          @for (role of missingRoles(user); track role) {
                            <option [value]="role">{{ roleLabel(role) }}</option>
                          }
                        </select>
                        <button
                          [id]="'btn-add-role-' + user.id"
                          (click)="addRole(user)"
                          [disabled]="!pendingRole()[user.id] || updatingUserId() === user.id"
                          class="px-2.5 py-1.5 rounded-lg bg-touche-celeste/15 hover:bg-touche-celeste/25 text-touche-navy
                                 text-xs font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Agregar
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
        @if (filteredUsers().length === 0) {
          <p class="text-center text-sm text-slate-400 py-8">No se encontraron usuarios.</p>
        }
      }
    </div>
  `
})
export class UserListComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly users = signal<AdminUserResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly search = signal('');
  readonly pendingRole = signal<Record<number, RoleName | ''>>({});
  readonly updatingUserId = signal<number | null>(null);

  readonly allRoles: RoleName[] = ['ATHLETE', 'REFEREE', 'ORGANIZER', 'ADMIN'];

  readonly filteredUsers = computed(() => {
    const term = this.search().toLowerCase().trim();
    return this.users().filter(u => !term || u.email.toLowerCase().includes(term));
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.adminService.getUsers().subscribe({
      next: (users) => { this.users.set(users); this.loading.set(false); },
      error: () => { this.error.set('Error al cargar los usuarios.'); this.loading.set(false); }
    });
  }

  missingRoles(user: AdminUserResponse): RoleName[] {
    return this.allRoles.filter(r => !user.roles.includes(r));
  }

  setPendingRole(userId: number, role: RoleName | ''): void {
    this.pendingRole.update(m => ({ ...m, [userId]: role }));
  }

  addRole(user: AdminUserResponse): void {
    const role = this.pendingRole()[user.id];
    if (!role) return;
    this.changeRole(user, role, 'ADD');
  }

  removeRole(user: AdminUserResponse, role: RoleName): void {
    if (!confirm(`¿Quitar el rol ${this.roleLabel(role)} a ${user.email}?`)) return;
    this.changeRole(user, role, 'REMOVE');
  }

  roleLabel(role: RoleName): string {
    const labels: Record<RoleName, string> = {
      ATHLETE: 'Atleta', REFEREE: 'Árbitro', ORGANIZER: 'Organizador', ADMIN: 'Admin'
    };
    return labels[role] ?? role;
  }

  private changeRole(user: AdminUserResponse, role: RoleName, action: 'ADD' | 'REMOVE'): void {
    this.updatingUserId.set(user.id);
    this.error.set(null);
    this.adminService.updateUserRole(user.id, { role, action }).subscribe({
      next: (updated) => {
        this.users.update(list => list.map(u => u.id === updated.id ? updated : u));
        this.pendingRole.update(m => ({ ...m, [user.id]: '' }));
        this.updatingUserId.set(null);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'No se pudo actualizar el rol.');
        this.updatingUserId.set(null);
      }
    });
  }
}
