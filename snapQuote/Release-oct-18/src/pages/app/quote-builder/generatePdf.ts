// A4 portrait dimensions at 96 DPI (screen pixels)
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123; // Math.round(794 * 1.414)
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

async function preloadBgImages(element: HTMLElement): Promise<void> {
  const bg = getComputedStyle(element).backgroundImage;
  if (bg && bg !== 'none') {
    const match = bg.match(/url\(["']?(.+?)["']?\)/);
    if (match) {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = match[1];
      });
    }
  }
}

async function preloadImages(element: HTMLElement): Promise<void> {
  const imgs = Array.from(element.querySelectorAll<HTMLImageElement>('img'));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          const onDone = () => {
            img.removeEventListener('load', onDone);
            img.removeEventListener('error', onDone);
            resolve();
          };
          img.addEventListener('load', onDone);
          img.addEventListener('error', onDone);
          if (img.src && !img.src.startsWith('data:')) {
            const url = new URL(img.src, window.location.href);
            const sep = url.search ? '&' : '?';
            img.src = `${url.href}${sep}_cb=${Date.now()}`;
          }
        }),
    ),
  );
}

// ─── Pagination helpers ──────────────────────────────────────────────

interface PageSlice {
  startY: number; // DOM px offset from top
  endY: number;
}

/**
 * Collect Y positions (relative to root top) where a page break is safe.
 * Looks for:
 *  - Elements with `data-page-break` attribute (explicit hints)
 *  - Page-section divs whose `minHeight` contains "1.414" (A4 ratio)
 *  - Section divs with a visible `borderTop` (natural section starts)
 *  - Section divs with significant `marginTop` (visual separation)
 * Scans up to depth 4 for fine-grained break candidates.
 */
function collectBreakCandidates(root: HTMLElement): number[] {
  const candidates = new Set<number>([0]);
  const rootRect = root.getBoundingClientRect();

  function addIfValid(el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    const top = Math.round(rect.top - rootRect.top);
    if (top > 24 && top < root.scrollHeight - 24) {
      candidates.add(top);
    }
  }

  function isVisibleBorder(value: string): boolean {
    if (!value || value === 'none' || value === '') return false;
    if (value.includes('transparent')) return false;
    if (value.includes('rgba(0,0,0,0)') || value.includes('rgba(0, 0, 0, 0)')) return false;
    return true;
  }

  function walk(el: HTMLElement, depth: number) {
    if (depth > 4) return;
    for (const child of Array.from(el.children) as HTMLElement[]) {
      let isBreakPoint = false;

      if (child.hasAttribute('data-page-break')) {
        isBreakPoint = true;
      }

      const mh = child.style.minHeight;
      if (mh && mh.includes('1.414')) {
        isBreakPoint = true;
      }

      if (isVisibleBorder(child.style.borderTop)) {
        isBreakPoint = true;
      }

      const mt = child.style.marginTop;
      if (mt) {
        const pxMatch = mt.match(/^(\d+)px$/);
        if (pxMatch && parseInt(pxMatch[1], 10) >= 24) {
          isBreakPoint = true;
        }
      }

      if (isBreakPoint) addIfValid(child);

      walk(child, depth + 1);
    }
  }

  walk(root, 0);
  candidates.add(root.scrollHeight);
  return Array.from(candidates).sort((a, b) => a - b);
}

/**
 * Divide the document into vertical slices, each at most A4_HEIGHT_PX tall.
 * Prefers breaking at a candidate position near the ideal A4 boundary so
 * headings, cards and images are not split across pages.
 * Guarantees no slice exceeds A4 height and no zero-height slices.
 */
function planPages(totalHeight: number, candidates: number[]): PageSlice[] {
  const slices: PageSlice[] = [];
  let currentY = 0;
  const minPageContent = A4_HEIGHT_PX * 0.4; // avoid very short pages

  while (currentY < totalHeight) {
    const idealEnd = currentY + A4_HEIGHT_PX;

    if (idealEnd >= totalHeight) {
      // Final page — always exactly up to totalHeight
      slices.push({ startY: currentY, endY: totalHeight });
      break;
    }

    // Search for the best break candidate at or before the A4 boundary.
    const earliest = currentY + minPageContent;
    let best = idealEnd; // fallback: hard cut at A4
    let bestDist = Infinity;

    for (const c of candidates) {
      if (c <= earliest) continue;
      if (c > idealEnd) continue; // never exceed A4
      const dist = idealEnd - c; // prefer closest to ideal (least whitespace)
      if (dist < bestDist) {
        bestDist = dist;
        best = c;
      }
    }

    // Ensure we always make progress and never exceed A4 height
    best = Math.min(best, idealEnd);
    if (best <= currentY) best = idealEnd;

    slices.push({ startY: currentY, endY: best });
    currentY = best;
  }

  return slices;
}

// ─── Core capture + pagination ───────────────────────────────────────

async function captureAndPaginate(element: HTMLElement): Promise<Blob> {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  // Resolve the actual document element — supports both quote and invoice IDs
  const inner = element.hasAttribute('data-quote-bg')
    ? element
    : (element.querySelector<HTMLElement>('[id="quote-pdf-document"]') ??
        element.querySelector<HTMLElement>('[id="invoice-pdf-document"]') ??
        element);

  await preloadImages(inner);
  await preloadBgImages(inner);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  const docWidth = inner.scrollWidth || inner.offsetWidth || A4_WIDTH_PX;
  const docHeight = inner.scrollHeight || inner.offsetHeight;

  if (!docWidth || !docHeight) {
    console.error('[generatePdf] Target element has no dimensions', { docWidth, docHeight });
    throw new Error('Quote element has no renderable dimensions');
  }

  const canvas = await html2canvas(inner, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    logging: false,
    imageTimeout: 30000,
    windowWidth: docWidth,
    windowHeight: docHeight,
    width: docWidth,
    height: docHeight,
    scrollX: 0,
    scrollY: 0,
    x: 0,
    y: 0,
    foreignObjectRendering: false,
  });

  if (canvas.width === 0 || canvas.height === 0) {
    console.error('[generatePdf] Canvas is empty after capture', { w: canvas.width, h: canvas.height });
    throw new Error('Canvas rendered empty');
  }

  const ctx = canvas.getContext('2d');
  if (ctx) {
    const pixel = ctx.getImageData(0, 0, 1, 1).data;
    if (pixel[3] === 0) {
      console.warn('[generatePdf] Canvas top-left pixel is transparent — possible blank render');
    }
  }

  const canvasScale = canvas.width / docWidth; // typically 2
  const candidates = collectBreakCandidates(inner);
  const slices = planPages(docHeight, candidates);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  for (let i = 0; i < slices.length; i++) {
    const { startY, endY } = slices[i];
    const sliceHeightPx = endY - startY;

    // Source region in canvas pixels — clamped to actual canvas bounds
    const srcY = Math.round(startY * canvasScale);
    const srcH = Math.min(
      Math.max(1, Math.round(sliceHeightPx * canvasScale)),
      canvas.height - srcY,
    );

    // Page canvas matches the source slice exactly — no stretching
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = srcH;
    const pctx = pageCanvas.getContext('2d')!;

    // White background to avoid transparency artifacts
    pctx.fillStyle = '#ffffff';
    pctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

    pctx.drawImage(
      canvas,
      0, srcY, canvas.width, srcH,
      0, 0, canvas.width, srcH,
    );

    const imgData = pageCanvas.toDataURL('image/jpeg', 0.92);

    if (i > 0) pdf.addPage();

    // Scale slice to A4 width preserving aspect ratio.
    // Height is proportional and clamped to A4_HEIGHT_MM.
    // Partial pages get a shorter image at the top; the rest of the
    // A4 page remains white — the page itself is always exactly A4.
    const imgHeightMm = (srcH / canvas.width) * A4_WIDTH_MM;
    const finalHeightMm = Math.min(imgHeightMm, A4_HEIGHT_MM);
    pdf.addImage(imgData, 'JPEG', 0, 0, A4_WIDTH_MM, finalHeightMm);
  }

  return pdf.output('blob');
}

export async function generateQuotePdf(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  const blob = await captureAndPaginate(element);
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
}

export async function generateQuotePdfBlob(
  element: HTMLElement,
): Promise<Blob> {
  return captureAndPaginate(element);
}
