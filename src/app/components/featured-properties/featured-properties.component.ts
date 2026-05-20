import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-featured-properties',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './featured-properties.component.html'
})
export class FeaturedPropertiesComponent {
  private _properties: any[] = [];

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

  @Input()
  set properties(val: any[] | null) {
    if (val && val.length > 0) {
      this._properties = val.map(prop => {
        let mappedImages = prop.images;
        if (prop.images && prop.images.length > 0) {
          mappedImages = prop.images.map((img: any) => ({
            ...img,
            imageUrl: this.formatImageUrl(img.imageUrl)
          }));
        }

        let mainImg = '/assets/img/house-placeholder.jpg';
        if (mappedImages && mappedImages.length > 0) {
          const sortedImgs = [...mappedImages].sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999));
          mainImg = sortedImgs[0]?.imageUrl || mainImg;
        } else if (prop.imageUrl) {
          mainImg = this.formatImageUrl(prop.imageUrl);
        }
        return {
          ...prop,
          images: mappedImages,
          imageUrl: prop.imageUrl ? this.formatImageUrl(prop.imageUrl) : prop.imageUrl,
          mainImageUrl: mainImg
        };
      });
    } else {
      this._properties = [];
    }
  }

  get properties(): any[] {
    return this._properties;
  }

  showRoomsAndBaths(prop: any): boolean {
    const type = (prop.type || prop.tipoVivienda || prop.residence?.type || '').toLowerCase();
    return type !== 'garaje' && type !== 'trastero';
  }
}
