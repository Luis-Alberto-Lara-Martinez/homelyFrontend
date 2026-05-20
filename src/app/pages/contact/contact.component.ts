import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Properties } from '../../services/properties/properties';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html'
})
export class ContactComponent {
  contactData = {
    name: '',
    email: '',
    message: ''
  };
  isSubmitted: boolean = false;

  constructor(
    private propertiesService: Properties,
    private cdr: ChangeDetectorRef
  ) {}

  submitContactForm(form: NgForm) {
    if (form.valid) {
      this.propertiesService.sendContactRequest(this.contactData).subscribe({
        next: (response) => {
          console.log('Contacto enviado con éxito:', response);
          this.isSubmitted = true;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al enviar el contacto:', err);
        }
      });
    } else {
      Object.keys(form.controls).forEach(key => {
        form.controls[key].markAsTouched();
      });
    }
  }

  resetContactForm(form?: NgForm) {
    this.isSubmitted = false;
    this.contactData = {
      name: '',
      email: '',
      message: ''
    };
    if (form) {
      form.resetForm();
    }
  }
}
