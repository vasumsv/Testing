export type QuoteLayoutStyle =
  | 'wedding-elegant'
  | 'royal-dark'
  | 'floral-wedding'
  | 'magazine-editorial'
  | 'minimal-clean'
  | 'corporate-professional'
  | 'split-layout'
  | 'luxury-dark'
  | 'creative-portfolio'
  | 'cinematic'
  | 'modern-studio-pro';

export interface QuoteTemplate {
  id: string;
  name: string;
  tagline: string;
  layoutStyle: QuoteLayoutStyle;
  previewGradient: string;
  previewAccent: string;
  tier: 'free' | 'growth' | 'pro';
}

export const QUOTE_TEMPLATES: QuoteTemplate[] = [
  // FREE (4)
  {
    id: 'modern-studio-pro',
    name: 'Studio Pro',
    tagline: 'Black · White · Luxury',
    layoutStyle: 'modern-studio-pro',
    previewGradient: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
    previewAccent: '#ffffff',
    tier: 'free',
  },
  {
    id: 'minimal-clean',
    name: 'Minimal',
    tagline: 'White · Clean · Crisp',
    layoutStyle: 'minimal-clean',
    previewGradient: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
    previewAccent: '#111111',
    tier: 'free',
  },
  {
    id: 'wedding-elegant',
    name: 'Elegant',
    tagline: 'Cream · Gold · Serif',
    layoutStyle: 'wedding-elegant',
    previewGradient: 'linear-gradient(135deg, #F5EDE3 0%, #EDD9C8 55%, #E5C9B0 100%)',
    previewAccent: '#B07D5A',
    tier: 'free',
  },
  {
    id: 'luxury-dark',
    name: 'Modern',
    tagline: 'Black · Gold · Premium',
    layoutStyle: 'luxury-dark',
    previewGradient: 'linear-gradient(135deg, #1E1E1E 0%, #2a2a2a 100%)',
    previewAccent: '#C9A961',
    tier: 'free',
  },
  // GROWTH (3)
  {
    id: 'magazine-editorial',
    name: 'Editorial Luxury',
    tagline: 'Bold · Photo-heavy · Editorial',
    layoutStyle: 'magazine-editorial',
    previewGradient: 'linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%)',
    previewAccent: '#FF4444',
    tier: 'growth',
  },
  {
    id: 'floral-wedding',
    name: 'Classic Wedding',
    tagline: 'Blush · Rose · Romantic',
    layoutStyle: 'floral-wedding',
    previewGradient: 'linear-gradient(135deg, #FDF0F3 0%, #FAD7E0 55%, #F5C2CF 100%)',
    previewAccent: '#C06080',
    tier: 'growth',
  },
  {
    id: 'corporate-professional',
    name: 'Studio Premium',
    tagline: 'Navy · Clean Grid · Professional',
    layoutStyle: 'corporate-professional',
    previewGradient: 'linear-gradient(135deg, #0f2040 0%, #1a3560 100%)',
    previewAccent: '#4A9EFF',
    tier: 'growth',
  },
  // PRO (4)
  {
    id: 'split-layout',
    name: 'Luxury B&W',
    tagline: 'Side Image · Modern · Dynamic',
    layoutStyle: 'split-layout',
    previewGradient: 'linear-gradient(90deg, #1a1a2e 50%, #f5f5f5 50%)',
    previewAccent: '#E8C97A',
    tier: 'pro',
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    tagline: 'Widescreen · Dark · Cinematic',
    layoutStyle: 'cinematic',
    previewGradient: 'linear-gradient(135deg, #050505 0%, #1a1a1a 100%)',
    previewAccent: '#F5A623',
    tier: 'pro',
  },
  {
    id: 'creative-portfolio',
    name: 'Signature',
    tagline: 'Image-first · Artistic · Bold',
    layoutStyle: 'creative-portfolio',
    previewGradient: 'linear-gradient(135deg, #F0F4F8 0%, #E2E8F0 100%)',
    previewAccent: '#2D3748',
    tier: 'pro',
  },
  {
    id: 'royal-dark',
    name: 'Royal',
    tagline: 'Deep Black · Ivory · Regal',
    layoutStyle: 'royal-dark',
    previewGradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
    previewAccent: '#D4AF37',
    tier: 'pro',
  },
];

export const DEFAULT_TEMPLATE_ID = 'minimal-clean';

export function getTemplate(id: string): QuoteTemplate {
  return QUOTE_TEMPLATES.find(t => t.id === id) ?? QUOTE_TEMPLATES[0];
}

export function canUseTemplate(id: string, plan: string): boolean {
  const t = getTemplate(id);
  if (t.tier === 'free') return true;
  if (t.tier === 'growth') return plan === 'growth' || plan === 'pro';
  if (t.tier === 'pro') return plan === 'pro';
  return false;
}

export function getAvailableTemplates(plan: string): QuoteTemplate[] {
  return QUOTE_TEMPLATES.filter(t => canUseTemplate(t.id, plan));
}

export type { QuoteTemplate as QuoteTheme };
export { DEFAULT_TEMPLATE_ID as DEFAULT_THEME_ID };
export { getTemplate as getTheme };
