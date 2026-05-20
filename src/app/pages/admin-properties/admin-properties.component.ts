import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Properties } from '../../services/properties/properties';

import { RouterModule, ActivatedRoute } from '@angular/router';

// Triggering build
@Component({
  selector: 'app-admin-properties',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-properties.component.html'
})
export class AdminPropertiesComponent implements OnInit {
  properties: any[] = [];
  filteredProperties: any[] = [];
  searchQuery: string = '';
  loading: boolean = true;

  // Modals
  showDeleteModal: boolean = false;
  propertyToDelete: any = null;
  isDeleting: boolean = false;

  // Pagination (Backend)
  currentPage: number = 1;
  pageSize: number = 3;
  totalPages: number = 0;
  totalElements: number = 0;

  // Toast
  toast: { show: boolean, message: string, type: 'success' | 'error' } = { show: false, message: '', type: 'success' };
  toastTimeout: any;

  constructor(
    private propertiesService: Properties,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.loadProperties();
    this.route.queryParams.subscribe(params => {
      if (params['success'] === 'true') {
        this.showToast('Propiedad guardada correctamente.', 'success');
      }
    });
  }

  loadProperties(page: number = 1) {
    this.loading = true;
    this.cdr.detectChanges();
    this.propertiesService.getPagedProperties(page - 1, this.pageSize).subscribe({
      next: (data: any) => {
        // En base a la estructura Page de Spring Boot o array directo
        let items: any[] = [];
        if (data && Array.isArray(data.content)) {
          items = data.content;
          this.totalPages = data.totalPages || 0;
          this.totalElements = data.totalElements || 0;
        } else if (Array.isArray(data)) {
          items = data;
          this.totalPages = Math.ceil(items.length / this.pageSize);
          this.totalElements = items.length;
        }

        this.properties = items;
        this.filteredProperties = items;
        this.currentPage = page;
        this.loading = false;
        console.log('Propiedades cargadas:', this.properties);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading properties:', err);
        this.loading = false;
        this.showToast('Error al cargar propiedades.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  onSearch() {
    const query = this.searchQuery.trim();

    if (query === '') {
      this.loadProperties(1);
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    // Si es un número (ID de la propiedad), podemos intentar buscar por ID
    if (/^\d+$/.test(query)) {
      this.propertiesService.getPropertyById(Number(query)).subscribe({
        next: (property: any) => {
          this.filteredProperties = property ? [property] : [];
          this.currentPage = 1;
          this.totalPages = property ? 1 : 0;
          this.totalElements = property ? 1 : 0;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.warn('Propiedad no encontrada por ID, intentando búsqueda local:', err);
          this.searchLocally(query);
        }
      });
    } else {
      this.searchLocally(query);
    }
  }

  searchLocally(query: string) {
    const q = query.toLowerCase();
    this.propertiesService.getAllProperties().subscribe({
      next: (data: any) => {
        let items: any[] = [];
        if (data && Array.isArray(data.content)) {
          items = data.content;
        } else if (Array.isArray(data)) {
          items = data;
        }

        const filtered = items.filter(p =>
          (p.title && p.title.toLowerCase().includes(q)) ||
          (p.location && p.location.toLowerCase().includes(q)) ||
          (p.address && typeof p.address === 'string' && p.address.toLowerCase().includes(q)) ||
          (p.address && typeof p.address === 'object' && (
            (p.address.street && p.address.street.toLowerCase().includes(q)) ||
            (p.address.city && p.address.city.toLowerCase().includes(q))
          ))
        );

        this.filteredProperties = filtered;
        this.currentPage = 1;
        this.totalPages = 1;
        this.totalElements = filtered.length;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al realizar búsqueda local:', err);
        this.filteredProperties = [];
        this.loading = false;
        this.showToast('Error al realizar la búsqueda.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.loadProperties(this.currentPage + 1);
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.loadProperties(this.currentPage - 1);
    }
  }

  openDeleteModal(property: any) {
    this.propertyToDelete = property;
    this.showDeleteModal = true;
    this.cdr.detectChanges();
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.propertyToDelete = null;
    this.cdr.detectChanges();
  }

  confirmDelete() {
    if (!this.propertyToDelete) return;

    this.isDeleting = true;
    this.cdr.detectChanges();
    this.propertiesService.deleteProperty(this.propertyToDelete.id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.showToast('Propiedad eliminada correctamente.', 'success');
        this.closeDeleteModal();
        this.loadProperties(this.currentPage);
      },
      error: (err) => {
        console.error('Error deleting property', err);
        this.isDeleting = false;
        this.showToast('Error al eliminar la propiedad.', 'error');
        this.closeDeleteModal();
      }
    });
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

  formatImageUrl(url: string): string {
    if (!url) return url;
    const targetBase = 'https://res.cloudinary.com/homely-cloudinary/image/upload/';
    if (url.startsWith(targetBase) && !url.includes('homely/properties/')) {
      const pathPart = url.substring(targetBase.length);
      const match = pathPart.match(/^(v\d+\/)?(.+)$/);
      if (match) {
        const version = match[1] || '';
        const filename = match[2];
        return `${targetBase}${version}homely/properties/${filename}`;
      }
    }
    return url;
  }

  getFirstImage(property: any): string {
    if (property.images && Array.isArray(property.images) && property.images.length > 0) {
      let img = property.images[0];
      if (typeof img === 'object' && img.imageUrl) {
        return this.formatImageUrl(img.imageUrl);
      }
      return this.formatImageUrl(img);
    }
    if (property.imageUrl) return this.formatImageUrl(property.imageUrl);
    return '/assets/img/house-placeholder.jpg';
  }

  getLocation(property: any): string {
    if (property.address) {
      if (typeof property.address === 'object') {
        const parts = [];
        if (property.address.street) parts.push(property.address.street);
        if (property.address.city) parts.push(property.address.city);
        return parts.join(', ') || 'Ubicación no especificada';
      }
      return property.address;
    }
    return property.location || 'Ubicación no especificada';
  }

  getType(property: any): string {
    return property.type || property.residence?.type || 'Vivienda';
  }

  getStatus(property: any): string {
    return property.transaction || property.status || 'En Venta';
  }
}
