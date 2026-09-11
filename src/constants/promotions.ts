import type { CartItem } from '../types/product';

export type PromotionRequirement = {
  productId: string;
  quantity: number;
};

export type Promotion = {
  id: string;
  day: 2 | 4;
  dayLabel: 'MARTES' | 'JUEVES';
  title: string;
  description: string;
  priceLabel: string;
  discountPerBundle: number;
  requirements: PromotionRequirement[];
  accentColor: string;
  softColor: string;
};

export type AppliedPromotion = {
  id: string;
  title: string;
  discount: number;
};

export const PROMOTIONS: readonly Promotion[] = [
  {
    id: 'tuesday-cappuccino',
    day: 2,
    dayLabel: 'MARTES',
    title: 'Segundo cappuccino por $45',
    description: 'Lleva dos cappuccinos y el segundo queda a precio especial.',
    priceLabel: '2 por $105',
    discountPerBundle: 15,
    requirements: [{ productId: '2', quantity: 2 }],
    accentColor: '#C86532',
    softColor: '#FBE9DE',
  },
  {
    id: 'thursday-brownie-matcha',
    day: 4,
    dayLabel: 'JUEVES',
    title: 'Brownie + matcha',
    description: 'Combina un brownie con un matcha y disfruta el precio especial.',
    priceLabel: 'Combo por $90',
    discountPerBundle: 15,
    requirements: [
      { productId: '55', quantity: 1 },
      { productId: '7', quantity: 1 },
    ],
    accentColor: '#607C45',
    softColor: '#E9F0E3',
  },
];

const WEEKDAYS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function getCancunWeekday(date = new Date()): number {
  try {
    const weekday = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Cancun',
      weekday: 'short',
    }).format(date);
    return WEEKDAYS[weekday] ?? date.getDay();
  } catch {
    return date.getDay();
  }
}

export function isPromotionActive(promotion: Promotion, date = new Date()): boolean {
  return getCancunWeekday(date) === promotion.day;
}

export function getPromotionById(promotionId: string): Promotion | undefined {
  return PROMOTIONS.find((promotion) => promotion.id === promotionId);
}

function getPromotionBundleCount(cart: CartItem[], promotion: Promotion): number {
  return Math.min(
    ...promotion.requirements.map((requirement) => {
      const quantity = cart
        .filter((item) => item.productId === requirement.productId)
        .reduce((total, item) => total + item.quantity, 0);
      return Math.floor(quantity / requirement.quantity);
    })
  );
}

export function getCartPricing(cart: CartItem[], date = new Date()) {
  const subtotal = cart.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0
  );

  const appliedPromotions: AppliedPromotion[] = PROMOTIONS.flatMap((promotion) => {
    if (!isPromotionActive(promotion, date)) return [];

    const bundleCount = getPromotionBundleCount(cart, promotion);
    if (bundleCount === 0) return [];

    return [{
      id: promotion.id,
      title: promotion.title,
      discount: promotion.discountPerBundle * bundleCount,
    }];
  });

  const discount = appliedPromotions.reduce(
    (total, promotion) => total + promotion.discount,
    0
  );

  return {
    subtotal,
    discount,
    total: Math.max(0, subtotal - discount),
    appliedPromotions,
  };
}
