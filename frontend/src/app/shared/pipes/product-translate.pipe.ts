import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '@core/services/translation.service';

/**
 * Pipe to translate product names based on common keywords
 * Usage: {{ product.name | productTranslate }}
 */
@Pipe({
  name: 'productTranslate',
  standalone: true,
  pure: false // Re-evaluate when language changes
})
export class ProductTranslatePipe implements PipeTransform {
  private translationService = inject(TranslationService);

  // Product name keyword mappings (EN -> VI)
  private readonly translations: Record<string, string> = {
    // Tree types
    'Bonsai': 'Cây Bonsai',
    'Juniper': 'Cây Tùng',
    'Pine': 'Cây Thông',
    'Maple': 'Cây Phong',
    'Elm': 'Cây Du',
    'Ficus': 'Cây Sung',
    'Oak': 'Cây Sồi',
    'Cherry': 'Cây Anh Đào',
    'Azalea': 'Cây Đỗ Quyên',
    
    // Product types
    'Pot': 'Chậu',
    'Ceramic': 'Gốm sứ',
    'Planter': 'Chậu trồng',
    'Container': 'Hộp',
    'Dish': 'Đĩa',
    'Bowl': 'Bát',
    'Vase': 'Bình',
    
    // Tools
    'Scissors': 'Kéo',
    'Shears': 'Kéo cắt',
    'Pruning': 'Cắt tỉa',
    'Wire': 'Dây',
    'Tools': 'Dụng cụ',
    'Cutters': 'Dụng cụ cắt',
    'Trimming': 'Tỉa cành',
    'Rake': 'Cào',
    
    // Materials & Supplies
    'Soil': 'Đất',
    'Fertilizer': 'Phân bón',
    'Moss': 'Rêu',
    'Stone': 'Đá',
    'Gravel': 'Sỏi',
    'Sand': 'Cát',
    'Compost': 'Phân trộn',
    'Mix': 'Hỗn hợp',
    
    // Colors
    'Brown': 'Nâu',
    'Green': 'Xanh lá',
    'Blue': 'Xanh dương',
    'White': 'Trắng',
    'Black': 'Đen',
    'Red': 'Đỏ',
    'Yellow': 'Vàng',
    'Gray': 'Xám',
    'Cream': 'Kem',
    'Beige': 'Be',
    
    // Styles & Descriptions
    'Rustic': 'Phong cách mộc mạc',
    'Modern': 'Hiện đại',
    'Classic': 'Cổ điển',
    'Traditional': 'Truyền thống',
    'Vintage': 'Cổ điển',
    'Handmade': 'Thủ công',
    'Handcrafted': 'Làm thủ công',
    'Glazed': 'Tráng men',
    'Unglazed': 'Không tráng men',
    'Rectangular': 'Hình chữ nhật',
    'Round': 'Tròn',
    'Square': 'Vuông',
    'Oval': 'Hình bầu dục',
    'Cascade': 'Thác',
    'Cube': 'Khối lập phương',
    
    // Sizes
    'Small': 'Nhỏ',
    'Medium': 'Vừa',
    'Large': 'Lớn',
    'Starter': 'Khởi đầu',
    'Mini': 'Mini',
    
    // Common words
    'Set': 'Bộ',
    'Kit': 'Bộ dụng cụ',
    'Pack': 'Gói',
    'Bag': 'Túi',
    'Box': 'Hộp',
    'Tree': 'Cây',
    'Plant': 'Cây',
    'Garden': 'Vườn',
    'Indoor': 'Trong nhà',
    'Outdoor': 'Ngoài trời',
    'Care': 'Chăm sóc',
    'Romantic': 'Lãng mạn',
    'Venus': 'Sao Kim',
  };

  transform(productName: string): string {
    if (!productName) return '';

    const currentLang = this.translationService.getCurrentLanguage();
    
    // If English, return original name
    if (currentLang === 'en') {
      return productName;
    }

    // If Vietnamese, translate
    let translatedName = productName;
    
    // Replace each keyword found in the product name
    Object.entries(this.translations).forEach(([english, vietnamese]) => {
      // Use word boundary regex for accurate replacement
      const regex = new RegExp(`\\b${english}\\b`, 'gi');
      translatedName = translatedName.replace(regex, vietnamese);
    });

    return translatedName;
  }
}
