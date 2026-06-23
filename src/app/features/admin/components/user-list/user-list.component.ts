import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { AdminUserResponse } from '../../../../core/models/admin.models';
import { RoleName } from '../../../../core/models/auth.models';
import { AlertService } from '../../../../shared/services/alert.service';

@Component({
  selector: 'app-admin-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-list.component.html'
})
export class UserListComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly alertService = inject(AlertService);

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

  async removeRole(user: AdminUserResponse, role: RoleName): Promise<void> {
    const confirmed = await this.alertService.confirm('Quitar rol', `¿Quitar el rol ${this.roleLabel(role)} a ${user.email}?`, true);
    if (!confirmed) return;
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
