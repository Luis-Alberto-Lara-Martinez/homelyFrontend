import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { AccessibilityService } from './services/accessibility.service';
import { filter } from 'rxjs/operators';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  isChatOpen = false;
  showHeaderFooter = false; // Empezamos en false para evitar el parpadeo inicial
  private router = inject(Router);
  private location = inject(Location);
  private accessibilityService = inject(AccessibilityService);

  ngOnInit() {
    const hiddenRoutes = ['/login', '/registro', '/forgot-password', '/reset-password'];
    
    // 1. Comprobación síncrona INMEDIATA para la primera carga de la página
    const initialPath = this.location.path().split('?')[0] || window.location.pathname;
    this.showHeaderFooter = !hiddenRoutes.includes(initialPath) && initialPath !== '/'; 
    // Nota: initialPath === '/' normalmente redirige a '/login', por eso también lo ocultamos.

    // 2. Comprobación asíncrona para cuando el usuario navega por la app
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const currentUrl = event.urlAfterRedirects.split('?')[0];
      this.showHeaderFooter = !hiddenRoutes.includes(currentUrl);
    });
  }

  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
  }
}
