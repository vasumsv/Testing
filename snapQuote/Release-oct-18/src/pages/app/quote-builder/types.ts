export interface LineItem {
  id: string;
  name: string;
  price: number;
  enabled: boolean;
  packageId?: string;
  isPackageHeader?: boolean;
}

export interface QuickAddLead {
  full_name: string;
  phone: string;
  event_type: string;
}

export interface SelectedLead {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  event_type: string;
  event_date: string | null;
}

export interface PortfolioImage {
  id: string;
  url: string;
  caption: string;
  sort_order: number;
}

export interface PaymentDetails {
  account_holder: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  upi_id: string;
  notes: string;
}

export interface StudioInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  gst_number: string;
  owner_name: string;
  logo_url: string;
  watermark_url?: string;
  portfolio_images?: PortfolioImage[];
  details_section?: string;
  terms_and_conditions?: string;
  payment_details?: PaymentDetails;
  default_deliverables?: string[];
}

export interface QuoteEvent {
  id: string;
  name: string;
  date: string;
  time?: string;
}

export interface PackageDeliverables {
  packageId: string;
  packageName: string;
  deliverables: string[];
  terms?: string;
}

export type DeliverableMode = 'default' | 'package' | 'custom';

export interface QuoteOptions {
  events: QuoteEvent[];
  includeSignature: boolean;
  includeGst: boolean;
  serviceName: string;
  showPaymentDetails?: boolean;
  showWatermark?: boolean;
  showPortfolio?: boolean;
  packageDeliverables?: PackageDeliverables[];
  // Deliverables
  showDeliverables?: boolean;
  deliverableMode?: DeliverableMode;
  customDeliverables?: string[];
  // Per-quote overrides for package deliverables (keyed by packageId)
  packageDeliverableOverrides?: Record<string, string[]>;
  // Per-package Terms & Conditions (keyed by packageId)
  packageTerms?: Record<string, string>;
  // Default T&C from studio settings (default true)
  showDefaultTerms?: boolean;
  // Quote-level additional T&C
  showAdditionalTerms?: boolean;
  additionalTerms?: string[];
  // Custom A4 background image URL (stored in studio-assets bucket)
  backgroundImageUrl?: string;
  // Typography customization
  typography?: TypographyConfig;
}

export interface TypographyConfig {
  fontFamily: string;
  fontSize: number;
  textColor: string;
}

export const FONT_OPTIONS = [
  { value: "'Inter', sans-serif", label: 'Inter', category: 'Modern', sample: 'The quick brown fox' },
  { value: "'Poppins', sans-serif", label: 'Poppins', category: 'Modern', sample: 'The quick brown fox' },
  { value: "'DM Sans', sans-serif", label: 'DM Sans', category: 'Modern', sample: 'The quick brown fox' },
  { value: "'Manrope', sans-serif", label: 'Manrope', category: 'Modern', sample: 'The quick brown fox' },
  { value: "'Montserrat', sans-serif", label: 'Montserrat', category: 'Elegant', sample: 'The quick brown fox' },
  { value: "'Playfair Display', serif", label: 'Playfair Display', category: 'Elegant', sample: 'The quick brown fox' },
  { value: "'Lora', serif", label: 'Lora', category: 'Classic', sample: 'The quick brown fox' },
  { value: "'Libre Baskerville', serif", label: 'Libre Baskerville', category: 'Classic', sample: 'The quick brown fox' },
] as const;

export const PRESET_COLORS = [
  { label: 'Black', value: '#0a0a0a' },
  { label: 'Charcoal', value: '#333333' },
  { label: 'Navy', value: '#1e3a5f' },
  { label: 'Slate', value: '#475569' },
  { label: 'Indigo', value: '#4f46e5' },
  { label: 'Burgundy', value: '#7c2d3a' },
  { label: 'Forest', value: '#2d5a3d' },
  { label: 'Warm Brown', value: '#6b4f3a' },
] as const;

export const DEFAULT_TYPOGRAPHY: TypographyConfig = {
  fontFamily: "'Inter', sans-serif",
  fontSize: 16,
  textColor: '#0a0a0a',
};

export const MIN_FONT_SIZE = 12;
export const MAX_FONT_SIZE = 24;

// Every unique font-size (in px) used across all 11 layout templates.
// When the user changes the base font size, each of these is scaled
// proportionally so the typographic hierarchy is preserved.
export const ALL_FONT_SIZES = [
  9.2, 10.35, 11.5, 12.65, 13.8, 14.95, 16.1, 17.25, 18.4, 19.55,
  20.7, 23, 25.3, 27.6, 29.9, 32.2, 34.5, 36.8, 39.1, 41.4,
  43.7, 46, 50.6, 52.9, 55.2, 59.8, 82.8,
] as const;

// The default base size that template font sizes are calibrated against.
export const TEMPLATE_BASE_SIZE = 16.1;
