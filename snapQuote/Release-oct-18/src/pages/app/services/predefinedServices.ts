import { ServiceCategory } from '../../../types';

export interface PredefinedService {
  name: string;
  category: ServiceCategory;
  suggestedPrice: number;
}

export const PREDEFINED_SERVICES: PredefinedService[] = [
  { name: 'Candid Photography', category: 'photography', suggestedPrice: 25000 },
  { name: 'Traditional Photography', category: 'photography', suggestedPrice: 15000 },
  { name: 'Pre-Wedding Shoot', category: 'photography', suggestedPrice: 20000 },
  { name: 'Engagement Shoot', category: 'photography', suggestedPrice: 12000 },
  { name: 'Wedding Photography', category: 'photography', suggestedPrice: 35000 },
  { name: 'Reception Photography', category: 'photography', suggestedPrice: 18000 },
  { name: 'Haldi Ceremony Photography', category: 'photography', suggestedPrice: 8000 },
  { name: 'Mehendi Photography', category: 'photography', suggestedPrice: 8000 },
  { name: 'Baby Shoot', category: 'photography', suggestedPrice: 6000 },
  { name: 'Maternity Shoot', category: 'photography', suggestedPrice: 8000 },
  { name: 'Family Portrait Shoot', category: 'photography', suggestedPrice: 5000 },
  { name: 'Outdoor Shoot', category: 'photography', suggestedPrice: 7000 },
  { name: 'Indoor Studio Shoot', category: 'photography', suggestedPrice: 5000 },
  { name: 'Couple Portrait Session', category: 'photography', suggestedPrice: 10000 },
  { name: 'Celebrity Style Shoot', category: 'photography', suggestedPrice: 30000 },
  { name: 'Luxury Wedding Coverage', category: 'photography', suggestedPrice: 60000 },
  { name: 'Save the Date Shoot', category: 'photography', suggestedPrice: 8000 },
  { name: 'Invitation Video Creation', category: 'videography', suggestedPrice: 5000 },

  { name: 'Traditional Videography', category: 'videography', suggestedPrice: 20000 },
  { name: 'Cinematic Videography', category: 'videography', suggestedPrice: 35000 },
  { name: 'Wedding Film', category: 'videography', suggestedPrice: 40000 },
  { name: 'Teaser Video', category: 'videography', suggestedPrice: 8000 },
  { name: 'Full Wedding Video', category: 'videography', suggestedPrice: 30000 },
  { name: 'Drone Videography', category: 'videography', suggestedPrice: 15000 },
  { name: 'Slow Motion Coverage', category: 'videography', suggestedPrice: 10000 },
  { name: 'Instagram Reel Video', category: 'videography', suggestedPrice: 5000 },
  { name: 'Haldi Coverage', category: 'videography', suggestedPrice: 8000 },
  { name: 'Mehendi Coverage', category: 'videography', suggestedPrice: 8000 },
  { name: 'Sangeet Coverage', category: 'videography', suggestedPrice: 12000 },
  { name: 'Reception Coverage', category: 'videography', suggestedPrice: 15000 },
  { name: 'Temple Wedding Coverage', category: 'videography', suggestedPrice: 18000 },
  { name: 'Destination Wedding Coverage', category: 'videography', suggestedPrice: 80000 },
  { name: '4K Video Coverage', category: 'videography', suggestedPrice: 20000 },
  { name: '8K Video Coverage', category: 'videography', suggestedPrice: 35000 },
  { name: 'Multi Camera Setup', category: 'videography', suggestedPrice: 20000 },
  { name: 'Gimbal Shoot', category: 'videography', suggestedPrice: 8000 },
  { name: 'Crane Shot Coverage', category: 'videography', suggestedPrice: 12000 },
  { name: 'Same Day Edit', category: 'videography', suggestedPrice: 15000 },

  { name: 'Photo Editing', category: 'addon', suggestedPrice: 5000 },
  { name: 'Color Grading', category: 'addon', suggestedPrice: 4000 },
  { name: 'Album Designing', category: 'addon', suggestedPrice: 6000 },
  { name: 'Premium Album Printing', category: 'addon', suggestedPrice: 12000 },
  { name: 'Photo Retouching', category: 'addon', suggestedPrice: 3000 },
  { name: 'Video Editing', category: 'addon', suggestedPrice: 8000 },
  { name: 'Highlight Video Editing', category: 'addon', suggestedPrice: 5000 },
  { name: 'Drone Photography', category: 'addon', suggestedPrice: 10000 },
  { name: 'LED Wall Setup', category: 'addon', suggestedPrice: 15000 },
  { name: 'Live Streaming', category: 'addon', suggestedPrice: 10000 },
  { name: 'Instant Photo Print', category: 'addon', suggestedPrice: 8000 },
  { name: 'Photo Booth Setup', category: 'addon', suggestedPrice: 12000 },
];
