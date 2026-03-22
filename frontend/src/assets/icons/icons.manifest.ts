/**
 * Ponsai Icon Set Manifest
 * 
 * Black icons collection for Furni e-commerce project
 * Location: assets/icons/
 * Format: PNG (transparent background)
 * 
 * Usage:
 * - In templates: <img src="assets/icons/[icon-name].png" alt="description">
 * - In CSS: background-image: url('/assets/icons/[icon-name].png');
 */

export const PONSAI_ICONS = {
  // Shopping & Cart
  ADD_TO_CART: 'assets/icons/add_to_cart.png',
  REMOVE: 'assets/icons/remove.png',
  WALLET: 'assets/icons/wallet.png',
  
  // Quantity Controls
  PLUS: 'assets/icons/plus.png',
  MINUS: 'assets/icons/minus.png',
  
  // Status & Actions
  CHECKED: 'assets/icons/checked.png',
  NOTIFICATION: 'assets/icons/notification.png',
  ORDER_TRACKING: 'assets/icons/order_tracking.png',
  
  // Filters & Search
  FILTER: 'assets/icons/filter.png',
  SORT: 'assets/icons/sort.png',
  MAGNIFYING_GLASS: 'assets/icons/magnifying_glass.png',
  
  // Promotions
  SALE_TAG: 'assets/icons/sale_tag.png',
} as const;

export type PonsaiIconKey = keyof typeof PONSAI_ICONS;

/**
 * Helper function to get icon path
 */
export function getIconPath(iconKey: PonsaiIconKey): string {
  return PONSAI_ICONS[iconKey];
}

/**
 * Icon categories for documentation
 */
export const ICON_CATEGORIES = {
  shopping: ['ADD_TO_CART', 'REMOVE', 'WALLET'],
  quantity: ['PLUS', 'MINUS'],
  status: ['CHECKED', 'NOTIFICATION', 'ORDER_TRACKING'],
  filter: ['FILTER', 'SORT', 'MAGNIFYING_GLASS'],
  promotions: ['SALE_TAG'],
};
