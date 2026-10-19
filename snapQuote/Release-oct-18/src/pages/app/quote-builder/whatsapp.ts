import { LineItem, SelectedLead, QuoteEvent } from './types';
import { formatCurrencyDecimal } from '../../../lib/currency';

interface BuildWhatsAppUrlOptions {
  lead: SelectedLead | null;
  quoteNumber: string;
  displayTotal: number;
  enabledItems: LineItem[];
  studioName: string;
  events?: QuoteEvent[];
}

export function buildWhatsAppUrl(opts: BuildWhatsAppUrlOptions): string {
  const { lead, quoteNumber, displayTotal, enabledItems, studioName, events = [] } = opts;

  const clientName = lead?.full_name ?? 'there';
  const phone = lead?.phone?.replace(/\D/g, '') ?? '';
  const studio = studioName || 'Our Studio';

  const serviceLines = enabledItems
    .slice(0, 5)
    .map(item => `  • ${item.name} — ${formatCurrencyDecimal(item.price)}`)
    .join('\n');

  const moreCount = enabledItems.length - 5;
  const moreText = moreCount > 0 ? `\n  + ${moreCount} more service${moreCount > 1 ? 's' : ''}` : '';

  const eventsWithData = events.filter(e => e.name.trim() || e.date || e.time);
  const eventLine = eventsWithData.length > 0
    ? '\n📅 *Events:*\n' + eventsWithData.map(e => {
        const dateStr = e.date ? new Date(e.date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
        const dateTime = dateStr && e.time ? `${dateStr}, ${e.time}` : dateStr || e.time || '';
        return `  • ${e.name || 'Event'}${dateTime ? ` — ${dateTime}` : ''}`;
      }).join('\n')
    : lead?.event_type
      ? `\n📅 *Event:* ${lead.event_type}${lead.event_date ? ` on ${new Date(lead.event_date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}`
      : '';

  const servicesSection =
    enabledItems.length > 0
      ? `\n\n*Services Included:*\n${serviceLines}${moreText}`
      : '';

  const message = [
    `Hi ${clientName}! 👋`,
    ``,
    `Here is your customized photography quotation from *${studio}*.`,
    ``,
    `📄 *Quote Reference:* ${quoteNumber}${eventLine}`,
    `${servicesSection}`,
    ``,
    `💰 *Total: ${formatCurrencyDecimal(displayTotal)}*`,
    ``,
    `Please review the details and let us know if you have any questions or would like to make any changes. We'd love to work with you!`,
    ``,
    `— ${studio}`,
  ].join('\n');

  const encoded = encodeURIComponent(message);
  return phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}
