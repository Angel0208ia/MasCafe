export type PromotionRow = {
  id: string;
  title: string;
  description: string;
  day: number;
  discount: number;
  active: boolean;
  requirements: { productId: string; quantity: number }[];
  updated_at: string;
};
export const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
