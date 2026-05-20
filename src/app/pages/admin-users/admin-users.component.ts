import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Users } from '../../services/users/users';
import { timeout } from 'rxjs';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html'
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];
  searchQuery: string = '';
  loading: boolean = true;

  // Roles y Status
  roles: any[] = [];
  statuses: any[] = [];

  // Edición
  editingUserId: number | null = null;
  editData: { roleId?: number, statusId?: number } = {};
  activeDropdown: 'role' | 'status' | null = null;

  // Modal de Creación
  showCreateModal: boolean = false;
  isSavingUser: boolean = false;
  newUser = {
    name: '',
    email: '',
    role: '',
    status: '',
    password: '',
    confirmedPassword: ''
  };

  // Modal de Eliminación
  showDeleteModal: boolean = false;
  userToDelete: any = null;
  isDeleting: boolean = false;

  // Paginación
  currentPage: number = 0;
  totalPages: number = 0;
  totalElements: number = 0;
  pageSize: number = 3;

  // Sistema de Notificaciones Toast (Premium)
  toast: { show: boolean, message: string, type: 'success' | 'error' } = { show: false, message: '', type: 'success' };
  toastTimeout: any;

  constructor(
    private usersService: Users,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadUsers();
    this.loadRolesAndStatuses();
  }

  loadRolesAndStatuses() {
    this.usersService.getAllRoles().subscribe({
      next: (data) => {
        this.roles = data;
      },
      error: (err) => console.error('Error loading roles:', err)
    });

    this.usersService.getAllStatuses().subscribe({
      next: (data) => {
        this.statuses = data;
      },
      error: (err) => console.error('Error loading statuses:', err)
    });
  }

  loadUsers(page: number = 1) {
    this.loading = true;
    this.usersService.getAllUsers(page, this.pageSize).subscribe({
      next: (data: any) => {
        this.users = data.content;
        this.filteredUsers = data.content;

        // Actualizamos estado de paginación
        this.currentPage = page;
        this.totalPages = data.totalPages;
        this.totalElements = data.totalElements;

        this.loading = false;
        console.log('Usuarios cargados:', this.users);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.loadUsers(this.currentPage + 1);
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.loadUsers(this.currentPage - 1);
    }
  }

  onSearch() {
    const query = this.searchQuery.trim();

    if (query === '') {
      this.loadUsers(1);
      return;
    }

    this.loading = true;

    this.usersService.getUser(query).subscribe({
      next: (user: any) => {
        this.filteredUsers = user ? [user] : [];
        this.loading = false;
        this.currentPage = 1;
        this.totalPages = 1;
        this.totalElements = 1;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('Usuario no encontrado por email en el servidor:', err);
        this.filteredUsers = [];
        this.loading = false;
        this.showToast('Usuario no encontrado.', 'error');
        this.cdr.detectChanges();
      }
    });

    this.cdr.detectChanges();
  }

  openDeleteModal(user: any) {
    this.userToDelete = user;
    this.showDeleteModal = true;
    this.cdr.detectChanges();
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.userToDelete = null;
    this.cdr.detectChanges();
  }

  confirmDelete() {
    if (!this.userToDelete) return;

    this.isDeleting = true;
    this.cdr.detectChanges();

    this.usersService.deleteUser(this.userToDelete.id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.loadUsers(this.currentPage);
        this.showToast('Usuario eliminado correctamente.', 'success');
        this.closeDeleteModal();
      },
      error: (err) => {
        this.isDeleting = false;
        console.error('Error deleting user:', err);
        this.showToast('Error al eliminar el usuario: ' + (err.error?.message || err.message), 'error');
        this.closeDeleteModal();
      }
    });
  }

  startEdit(user: any) {
    this.editingUserId = user.id;

    // Buscar los ids correspondientes a los nombres actuales
    const userRole = this.roles.find(r => r.name.toLowerCase() === user.role.toLowerCase());
    const userStatus = this.statuses.find(s => s.name.toLowerCase() === user.status.toLowerCase());

    this.editData = {
      roleId: userRole ? userRole.id : undefined,
      statusId: userStatus ? userStatus.id : undefined
    };
    this.activeDropdown = null;
    this.cdr.detectChanges();
  }

  cancelEdit() {
    this.editingUserId = null;
    this.editData = {};
    this.activeDropdown = null;
    this.cdr.detectChanges();
  }

  @HostListener('document:click')
  closeDropdowns() {
    this.activeDropdown = null;
  }

  toggleDropdown(type: 'role' | 'status', event: Event) {
    event.stopPropagation();
    if (this.activeDropdown === type) {
      this.activeDropdown = null;
    } else {
      this.activeDropdown = type;
    }
  }

  selectRole(roleId: number, event: Event) {
    event.stopPropagation();
    this.editData.roleId = roleId;
    this.activeDropdown = null;
  }

  selectStatus(statusId: number, event: Event) {
    event.stopPropagation();
    this.editData.statusId = statusId;
    this.activeDropdown = null;
  }

  getSelectedRoleName(): string {
    const role = this.roles.find(r => r.id === this.editData.roleId);
    return role ? role.name : 'Seleccionar Rol';
  }

  getSelectedStatusName(): string {
    const stat = this.statuses.find(s => s.id === this.editData.statusId);
    return stat ? stat.name : 'Seleccionar Estado';
  }

  saveEdit(user: any) {
    if (!this.editingUserId) return;

    const newRoleId = Number(this.editData.roleId);
    const newStatusId = Number(this.editData.statusId);

    const oldRole = this.roles.find(r => r.name.toLowerCase() === user.role.toLowerCase());
    const oldStatus = this.statuses.find(s => s.name.toLowerCase() === user.status.toLowerCase());

    const newRoleObj = this.roles.find(r => r.id === newRoleId);
    const newStatusObj = this.statuses.find(s => s.id === newStatusId);

    const roleChanged = oldRole && oldRole.id !== newRoleId;
    const statusChanged = oldStatus && oldStatus.id !== newStatusId;

    if (roleChanged && statusChanged) {
      this.usersService.updateUserRole(user.email, newRoleObj.name).subscribe({
        next: () => {
          this.usersService.updateUserStatus(user.email, newStatusObj.name).subscribe({
            next: () => {
              // Actualización local inmediata
              user.role = newRoleObj.name;
              user.status = newStatusObj.name;
              this.cancelEdit();
              this.showToast('Rol y Estado actualizados con éxito.', 'success');
              // Recarga en segundo plano
              this.loadUsers(this.currentPage);
            },
            error: (err) => {
              console.error('Error updating status:', err);
              this.showToast('Error al actualizar el estado.', 'error');
              this.cancelEdit();
            }
          });
        },
        error: (err) => {
          console.error('Error updating role:', err);
          this.showToast('Error al actualizar el rol.', 'error');
          this.cancelEdit();
        }
      });
    } else if (roleChanged) {
      this.usersService.updateUserRole(user.email, newRoleObj.name).subscribe({
        next: () => {
          // Actualización local inmediata
          user.role = newRoleObj.name;
          this.cancelEdit();
          this.showToast('Rol de usuario actualizado con éxito.', 'success');
          // Recarga en segundo plano
          this.loadUsers(this.currentPage);
        },
        error: (err) => {
          console.error('Error updating role:', err);
          this.showToast('Error al actualizar el rol.', 'error');
          this.cancelEdit();
        }
      });
    } else if (statusChanged) {
      this.usersService.updateUserStatus(user.email, newStatusObj.name).subscribe({
        next: () => {
          // Actualización local inmediata
          user.status = newStatusObj.name;
          this.cancelEdit();
          this.showToast('Estado de usuario actualizado con éxito.', 'success');
          // Recarga en segundo plano
          this.loadUsers(this.currentPage);
        },
        error: (err) => {
          console.error('Error updating status:', err);
          this.showToast('Error al actualizar el estado.', 'error');
          this.cancelEdit();
        }
      });
    } else {
      this.cancelEdit();
    }
  }

  openCreateModal() {
    this.newUser = {
      name: '',
      email: '',
      role: '',
      status: '',
      password: '',
      confirmedPassword: ''
    };
    this.showCreateModal = true;
    this.cdr.detectChanges();
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.cdr.detectChanges();
  }

  showToast(message: string, type: 'success' | 'error' = 'success') {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toast = { show: true, message, type };
    this.cdr.detectChanges();
    this.toastTimeout = setTimeout(() => {
      this.toast.show = false;
      this.cdr.detectChanges();
    }, 4000);
  }

  submitCreateUser() {
    if (!this.newUser.name || !this.newUser.email || !this.newUser.role || !this.newUser.status || !this.newUser.password || !this.newUser.confirmedPassword) {
      this.showToast('Por favor, rellena todos los campos.', 'error');
      return;
    }

    if (this.newUser.password !== this.newUser.confirmedPassword) {
      this.showToast('Las contraseñas no coinciden.', 'error');
      return;
    }

    this.isSavingUser = true;
    this.cdr.detectChanges();

    this.usersService.postUser(
      this.newUser.name,
      this.newUser.email,
      this.newUser.role,
      this.newUser.status,
      this.newUser.password,
      this.newUser.confirmedPassword
    ).subscribe({
      next: () => {
        this.isSavingUser = false;
        this.closeCreateModal();
        this.loadUsers(this.currentPage);
        this.showToast('¡Usuario creado correctamente!', 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSavingUser = false;
        // Si el error es un Timeout (nombre del error 'TimeoutError'), significa que el backend
        // se ha quedado colgado (por ejemplo, subiendo a Cloudinary) pero el registro ya se insertó en la BD.
        if (err.name === 'TimeoutError') {
          console.warn('La petición tardó demasiado, pero probablemente se guardó con éxito en el backend (Cloudinary síncrono).');
          this.closeCreateModal();
          this.loadUsers(this.currentPage);
          this.showToast('¡Usuario creado correctamente! (Sincronizando avatar)', 'success');
        } else {
          console.error('Error al crear el usuario:', err);
          this.showToast('Error al crear el usuario: ' + (err.error?.message || err.message), 'error');
        }
        this.cdr.detectChanges();
      }
    });
  }
}
