import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Package, Plus, Wrench, Trash2, Search, Lock, X, ChevronDown } from 'lucide-react';
import { Toggle } from '../../../components/ui/Toggle';
import { formatCurrency, formatCurrencyDecimal } from '../../../lib/currency';
import { Service, Package as PkgType, StudioPlan, isBusinessPlan } from '../../../types';
import { LineItem } from './types';

interface Props {
  services: Service[];
  packages: PkgType[];
  items: LineItem[];
  onItemsChange: (items: LineItem[]) => void;
  finalPrice: string;
  onFinalPriceChange: (val: string) => void;
  showDiscount: boolean;
  onToggleDiscount: () => void;
  includeGst: boolean;
  onToggleGst: () => void;
  plan: StudioPlan;
}

export function MiddlePanel({
  services,
  packages,
  items,
  onItemsChange,
  finalPrice,
  onFinalPriceChange,
  showDiscount,
  onToggleDiscount,
  includeGst,
  onToggleGst,
  plan,
}: Props) {
  const canShowDiscount = isBusinessPlan(plan);
  const [svcOpen, setSvcOpen] = useState(false);
  const [svcSearch, setSvcSearch] = useState('');

  const [pkgOpen, setPkgOpen] = useState(false);
  const [pkgSearch, setPkgSearch] = useState('');
  const pkgRef = useRef<HTMLDivElement>(null);
  const newIncludeIdRef = useRef<string | null>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pkgRef.current && !pkgRef.current.contains(e.target as Node)) {
        setPkgOpen(false);
        setPkgSearch('');
      }
    }
    if (pkgOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [pkgOpen]);

  useEffect(() => {
    if (newIncludeIdRef.current) {
      const el = itemRefs.current.get(newIncludeIdRef.current);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const input = el.querySelector('input[type="text"]') as HTMLInputElement | null;
        input?.focus();
      }
      newIncludeIdRef.current = null;
    }
  }, [items]);

  const { subtotal, finalNum, discountAmount, discountPct, gstAmount, totalWithGst, baseAmount } = useMemo(() => {
    const sub = items.filter(i => i.enabled).reduce((s, i) => s + i.price, 0);
    const fn = parseFloat(finalPrice) || 0;
    const base = finalPrice !== '' && fn > 0 ? fn : sub;
    const dAmt = sub > 0 && fn > 0 && fn < sub ? sub - fn : 0;
    const dPct = sub > 0 && dAmt > 0 ? (dAmt / sub) * 100 : 0;
    const gst = includeGst ? Math.round(base * 0.18 * 100) / 100 : 0;
    const total = Math.round((base + gst) * 100) / 100;
    return { subtotal: sub, finalNum: fn, discountAmount: dAmt, discountPct: dPct, gstAmount: gst, totalWithGst: total, baseAmount: base };
  }, [items, finalPrice, includeGst]);

  const { addedPackageIds, addedServiceIds, availableServices, filteredServices } = useMemo(() => {
    const pkgIds = new Set(items.filter(i => i.isPackageHeader).map(i => i.id));
    const svcIds = new Set(items.filter(i => !i.packageId && !i.isPackageHeader).map(i => i.id));
    const avail = services.filter(s => s.is_active && !svcIds.has(s.id));
    const filtered = avail.filter(s =>
      s.name.toLowerCase().includes(svcSearch.toLowerCase())
    );
    return { addedPackageIds: pkgIds, addedServiceIds: svcIds, availableServices: avail, filteredServices: filtered };
  }, [items, services, svcSearch]);

  function togglePackage(pkg: PkgType) {
    if (addedPackageIds.has(pkg.id)) {
      onItemsChange(items.filter(i => i.id !== pkg.id && i.packageId !== pkg.id));
    } else {
      const newItems: LineItem[] = [
        { id: pkg.id, name: pkg.name + ' (Package)', price: pkg.price, enabled: true, isPackageHeader: true },
      ];
      const includes = pkg.includes ?? [];
      includes.filter(s => s.trim()).forEach((label, idx) => {
        newItems.push({
          id: `${pkg.id}__include__${idx}`,
          name: label,
          price: 0,
          enabled: true,
          packageId: pkg.id,
          isPackageHeader: false,
        });
      });
      onItemsChange([...items, ...newItems]);
    }
  }

  function addService(svc: Service) {
    onItemsChange([...items, { id: svc.id, name: svc.name, price: svc.price, enabled: true }]);
  }

  function removeItem(id: string) {
    const itemToRemove = items.find(i => i.id === id);
    if (itemToRemove?.isPackageHeader) {
      onItemsChange(items.filter(i => i.id !== id && i.packageId !== id));
    } else {
      onItemsChange(items.filter(i => i.id !== id));
    }
  }

  const addIncludeItem = useCallback((pkgId: string) => {
    const newId = `${pkgId}__include__custom__${Date.now()}`;
    const insertAfterIdx = items.map((item, i) => ({ item, i }))
      .filter(({ item }) => item.id === pkgId || item.packageId === pkgId)
      .pop()?.i ?? items.length - 1;

    const updated = [...items];
    updated.splice(insertAfterIdx + 1, 0, {
      id: newId,
      name: '',
      price: 0,
      enabled: true,
      packageId: pkgId,
      isPackageHeader: false,
    });
    newIncludeIdRef.current = newId;
    onItemsChange(updated);
  }, [items, onItemsChange]);

  function toggleItem(id: string) {
    onItemsChange(items.map(i => i.id === id ? { ...i, enabled: !i.enabled } : i));
  }

  function updatePrice(id: string, val: string) {
    const n = parseFloat(val);
    onItemsChange(items.map(i => i.id === id ? { ...i, price: isNaN(n) ? 0 : n } : i));
  }

  function updateName(id: string, val: string) {
    onItemsChange(items.map(i => i.id === id ? { ...i, name: val } : i));
  }

  const { activePackages, unselectedPackages, filteredPackages, selectedPackages } = useMemo(() => {
    const active = packages.filter(p => p.is_active);
    const unselected = active.filter(p => !addedPackageIds.has(p.id));
    const filtered = unselected.filter(p =>
      p.name.toLowerCase().includes(pkgSearch.toLowerCase()) ||
      (p.description ?? '').toLowerCase().includes(pkgSearch.toLowerCase())
    );
    const selected = active.filter(p => addedPackageIds.has(p.id));
    return { activePackages: active, unselectedPackages: unselected, filteredPackages: filtered, selectedPackages: selected };
  }, [packages, addedPackageIds, pkgSearch]);

  return (
    <div className="flex flex-col gap-5">
      {activePackages.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-ink-subtle" />
            <h3 className="text-sm font-semibold text-ink">
              Packages & Services
            </h3>
          </div>

          <div ref={pkgRef} className="relative">
            <button
              type="button"
              onClick={() => { setPkgOpen(p => !p); setPkgSearch(''); }}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all duration-100 ${
                pkgOpen ? 'border-primary-600 bg-surface ring-2 ring-primary-600/15' : 'border-border bg-surface hover:bg-surface-raised'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Search className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
                <span className="text-ink-subtle text-sm truncate">
                  {unselectedPackages.length === 0 ? 'All packages selected' : `Search packages... (${unselectedPackages.length} available)`}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-ink-subtle shrink-0 transition-transform duration-150 ${pkgOpen ? 'rotate-180' : ''}`} />
            </button>

            {pkgOpen && unselectedPackages.length > 0 && (
              <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-surface border border-border rounded-lg shadow-elevated overflow-hidden">
                <div className="p-2 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-subtle" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search packages..."
                      value={pkgSearch}
                      onChange={e => setPkgSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-sm bg-surface-raised border border-border rounded-md outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
                    />
                  </div>
                </div>
                <div className="max-h-52 overflow-y-auto">
                  {filteredPackages.length === 0 ? (
                    <p className="text-xs text-ink-subtle px-4 py-3 text-center">No matching packages.</p>
                  ) : (
                    filteredPackages.map(pkg => (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => {
                          togglePackage(pkg);
                          setPkgOpen(false);
                          setPkgSearch('');
                        }}
                        className="w-full text-left flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-surface-raised border-b border-border last:border-0 transition-colors group"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-ink truncate">{pkg.name}</p>
                          {pkg.description && (
                            <p className="text-xs text-ink-muted truncate mt-0.5">{pkg.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-semibold text-ink tabular-nums">{formatCurrency(Number(pkg.price))}</span>
                          <Plus className="w-3.5 h-3.5 text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {selectedPackages.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {selectedPackages.map(pkg => (
                <span
                  key={pkg.id}
                  className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200"
                >
                  <span className="truncate max-w-[120px]">{pkg.name}</span>
                  <span className="text-primary-500 font-normal tabular-nums">{formatCurrency(Number(pkg.price))}</span>
                  <button
                    type="button"
                    onClick={() => togglePackage(pkg)}
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-primary-200 transition-colors ml-0.5 shrink-0"
                    title={`Remove ${pkg.name}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-ink">
            Added Items
          </h3>
          <button
            onClick={() => { setSvcOpen(p => !p); setSvcSearch(''); }}
            className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add service
          </button>
        </div>

        {svcOpen && (
          <div className="mb-3 bg-surface border border-border rounded-lg shadow-elevated overflow-hidden">
            <div className="p-2.5 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-subtle" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search services..."
                  value={svcSearch}
                  onChange={e => setSvcSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-surface-raised border border-border rounded-md outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
                />
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto">
              {filteredServices.length === 0 ? (
                <p className="text-xs text-ink-subtle px-4 py-3 text-center">
                  {availableServices.length === 0 ? 'All services added.' : 'No matching services.'}
                </p>
              ) : (
                filteredServices.map(svc => (
                  <button
                    key={svc.id}
                    onClick={() => { addService(svc); if (filteredServices.length === 1) setSvcOpen(false); }}
                    className="w-full text-left flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-surface-raised border-b border-border last:border-0 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Wrench className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{svc.name}</p>
                        {svc.description && (
                          <p className="text-xs text-ink-muted truncate">{svc.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold text-ink">{formatCurrency(Number(svc.price))}</span>
                      <Plus className="w-3.5 h-3.5 text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="border-t border-border p-2">
              <button
                onClick={() => setSvcOpen(false)}
                className="w-full text-xs text-ink-subtle hover:text-ink px-3 py-1.5 rounded-md hover:bg-surface-raised transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-border rounded-lg">
            <Wrench className="w-7 h-7 text-ink-subtle mx-auto mb-2" />
            <p className="text-xs text-ink-subtle">No services added yet.</p>
            <p className="text-xs text-ink-subtle mt-0.5">Select a package or click "Add service".</p>
          </div>
        ) : (
          <div className="space-y-1">
            {items.map(item => {
              const isHeader = item.isPackageHeader;
              const isInclude = !!item.packageId;

              return (
                <div
                  key={item.id}
                  ref={el => { if (el) itemRefs.current.set(item.id, el); else itemRefs.current.delete(item.id); }}
                >
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-100 ${
                      isHeader
                        ? 'border-primary-200 bg-primary-50/40'
                        : isInclude
                          ? 'border-border/40 bg-surface-raised/30 ml-4'
                          : item.enabled
                            ? 'border-border bg-surface'
                            : 'border-border/50 bg-surface-raised/40 opacity-60'
                    }`}
                  >
                    <button
                      onClick={() => toggleItem(item.id)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        item.enabled ? 'bg-primary-600 border-primary-600' : 'border-border bg-surface'
                      }`}
                    >
                      {item.enabled && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>

                    {isInclude ? (
                      <input
                        type="text"
                        value={item.name}
                        onChange={e => updateName(item.id, e.target.value)}
                        placeholder="Item description..."
                        className={`flex-1 text-xs min-w-0 bg-transparent outline-none placeholder:text-ink-subtle ${item.enabled ? 'text-ink-muted' : 'text-ink-subtle line-through'}`}
                      />
                    ) : (
                      <span className={`flex-1 text-sm min-w-0 truncate ${item.enabled ? 'text-ink' : 'text-ink-subtle line-through'} ${isHeader ? 'font-medium' : ''}`}>
                        {item.name}
                      </span>
                    )}

                    <div className="w-20 sm:w-24 shrink-0">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-subtle">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={item.price || ''}
                          onChange={e => updatePrice(item.id, e.target.value)}
                          disabled={!item.enabled}
                          className="w-full bg-surface-raised border border-border rounded-md pl-5 pr-2 py-1.5 text-xs text-right text-ink tabular-nums outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-9 h-9 flex items-center justify-center rounded text-ink-subtle hover:text-danger hover:bg-red-50 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {isHeader && (
                    <div className="ml-4 mt-1">
                      {!items.some(i => i.packageId === item.id) && (
                        <p className="text-[11px] text-ink-subtle italic px-3 py-1">No included items — add some below.</p>
                      )}
                      <button
                        onClick={() => addIncludeItem(item.id)}
                        className="flex items-center gap-1 text-[11px] text-primary-600 hover:text-primary-700 font-medium px-3 py-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Add included item
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-border pt-5 space-y-3">
        <h3 className="text-sm font-semibold text-ink mb-1">
          Pricing & Settings
        </h3>
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-muted">Subtotal</span>
          <span className="font-semibold text-ink tabular-nums">{formatCurrencyDecimal(subtotal)}</span>
        </div>

        <div>
          <label className="text-xs font-medium text-ink-muted block mb-1.5">Final Negotiated Price</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-subtle">₹</span>
            <input
              type="number"
              min="0"
              step="1"
              placeholder={subtotal > 0 ? subtotal.toFixed(2) : '0.00'}
              value={finalPrice}
              onChange={e => onFinalPriceChange(e.target.value)}
              className="w-full bg-surface border border-border rounded-md pl-7 pr-3 py-2 text-sm text-ink tabular-nums outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
            />
          </div>
        </div>

        {finalPrice && finalNum > 0 && discountAmount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 space-y-0.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-700 font-medium">Discount</span>
              <span className="font-semibold text-amber-700 tabular-nums">
                −{formatCurrencyDecimal(discountAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-amber-600">
              <span>Percentage off</span>
              <span className="tabular-nums">{discountPct.toFixed(1)}%</span>
            </div>
          </div>
        )}

        {finalPrice && finalNum > subtotal && (
          <p className="text-xs text-danger">Final price is above the subtotal.</p>
        )}

        <div
          onClick={onToggleGst}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border hover:bg-surface-raised transition-colors cursor-pointer"
        >
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-xs font-medium text-ink">Include GST (18%)</span>
            {includeGst && (
              <span className="text-[10px] text-ink-muted">+{formatCurrencyDecimal(gstAmount)} will be added</span>
            )}
          </div>
          <Toggle checked={includeGst} onChange={() => onToggleGst()} size="sm" />
        </div>

        {includeGst && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-700">Base Amount</span>
              <span className="font-medium text-blue-700 tabular-nums">{formatCurrencyDecimal(baseAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-700">GST @ 18%</span>
              <span className="font-medium text-blue-700 tabular-nums">+{formatCurrencyDecimal(gstAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-xs border-t border-blue-200 pt-1.5 mt-1">
              <span className="font-semibold text-blue-800">Total (incl. GST)</span>
              <span className="font-bold text-blue-800 tabular-nums">{formatCurrencyDecimal(totalWithGst)}</span>
            </div>
          </div>
        )}

        {canShowDiscount ? (
          <div
            onClick={onToggleDiscount}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border hover:bg-surface-raised transition-colors cursor-pointer"
          >
            <span className="text-xs font-medium text-ink">Show discount in quote</span>
            <Toggle checked={showDiscount} onChange={() => onToggleDiscount()} size="sm" />
          </div>
        ) : (
          <a
            href="/app/settings?tab=billing"
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-dashed border-border bg-surface hover:bg-surface-raised transition-colors group"
            title="Available on Growth & Pro plans"
          >
            <span className="text-xs font-medium text-ink-subtle">Show discount in quote</span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
              <Lock className="w-2.5 h-2.5" />
              Growth+
            </span>
          </a>
        )}
      </div>
    </div>
  );
}
