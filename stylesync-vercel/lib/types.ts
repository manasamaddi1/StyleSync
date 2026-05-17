// Shared types between client and API routes.

export type Category = 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes';

export type Vibe =
  | 'casual'
  | 'business_casual'
  | 'minimal'
  | 'athletic'
  | 'punk'
  | 'cottage';

export type WardrobeItem = {
  id: string;
  label: string;       // e.g. "Linen tee"
  cat: Category;
  color: string;       // named color, e.g. "blue"
  swatch: string;      // hex, e.g. "#5A7CA8"
  pattern?: string;    // solid / stripe / denim / rib / ...
  fabric?: string;
  tags: Vibe[];
  image: string;       // public URL to the uploaded photo
  confidence?: number; // model confidence at upload time
  createdAt: number;
};

export type SavedOutfit = {
  id: string;
  name: string;
  slots: Record<Category, string | null>; // wardrobe item IDs
  tag: Vibe | null;
  createdAt: number;
};

export type Prediction = {
  category: Category;
  subcategory: string;
  color: string;
  swatch: string;
  confidence: number;
};
