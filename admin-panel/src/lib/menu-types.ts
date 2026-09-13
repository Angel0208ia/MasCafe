export type MenuGroup = {
  id: string;
  name: string;
  type: "single" | "multiple";
  required: boolean;
  minSelections: number;
  maxSelections: number;
  options: { id: string; name: string; extraPrice: number }[];
};
export type MenuProduct = {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  base_price: number | string;
  available: boolean;
  customizations: MenuGroup[];
  updated_at: string;
};
