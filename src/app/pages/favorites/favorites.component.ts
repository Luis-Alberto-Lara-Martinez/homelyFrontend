import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Users } from '../../services/users/users';
import { FeaturedPropertiesComponent } from '../../components/featured-properties/featured-properties.component';
import { CtaBannerComponent } from '../../components/cta-banner/cta-banner.component';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterModule, FeaturedPropertiesComponent, CtaBannerComponent],
  templateUrl: './favorites.component.html'
})
export class FavoritesComponent implements OnInit {
  favorites: any[] = [];
  originalFavorites: any[] = [];
  isLoading: boolean = true;

  constructor(
    public usersService: Users,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadFavorites();
  }

  loadFavorites(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.usersService.getFavouritesProperties().subscribe({
      next: (favouritesList: any[]) => {
        console.log('Favorites Component - Favoritos obtenidos:', favouritesList);
        this.originalFavorites = favouritesList || [];
        this.favorites = (favouritesList || [])
          .map(fav => fav.property)
          .filter(prop => prop !== null && prop !== undefined);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Favorites Component - Error al cargar las propiedades favoritas:', err);
        this.originalFavorites = [];
        this.favorites = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' | 'loading' = 'success';
  toastTimeout: any;

  showToastMessage(message: string, type: 'success' | 'error' | 'loading' = 'success') {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    if (type !== 'loading') {
      this.toastTimeout = setTimeout(() => {
        this.showToast = false;
        this.cdr.detectChanges();
      }, 3000);
    }
    this.cdr.detectChanges();
  }

  removeFavorite(propertyId: number): void {
    const relation = this.originalFavorites.find(fav => fav.property && Number(fav.property.id) === Number(propertyId));
    if (relation) {
      this.showToastMessage('Eliminando de favoritos...', 'loading');
      this.usersService.deleteFavouriteProperty(propertyId).subscribe({
        next: () => {
          console.log('Favorites Component - Favorito eliminado con éxito:', propertyId);
          this.favorites = this.favorites.filter(p => p.id !== propertyId);
          this.originalFavorites = this.originalFavorites.filter(fav => fav.id !== relation.id);
          this.showToastMessage('Propiedad eliminada de favoritos.', 'success');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Favorites Component - Error al eliminar el favorito:', err);
          this.showToastMessage('No se pudo eliminar de favoritos.', 'error');
        }
      });
    } else {
      console.warn('Favorites Component - No se encontró la relación para el ID de propiedad:', propertyId);
      this.showToastMessage('No se encontró la propiedad en tus favoritos.', 'error');
    }
  }
}
