import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Upload, Trash2, ImagePlus, AlertCircle, Check, GripVertical, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { invalidateStudioData } from '../../lib/studioDataCache';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface PortfolioImage {
  id: string;
  studio_id: string;
  url: string;
  storage_path: string;
  caption: string;
  sort_order: number;
  created_at: string;
}

export function Portfolio() {
  const { profile } = useAuth();
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile?.studio_id) loadImages();
    else setLoading(false);
  }, [profile?.studio_id]);

  async function loadImages() {
    setLoading(true);
    const { data } = await supabase
      .from('studio_portfolio_images')
      .select('id, url, storage_path, caption, sort_order, created_at')
      .eq('studio_id', profile!.studio_id)
      .order('sort_order', { ascending: true });
    setImages(data ?? []);
    setLoading(false);
  }

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = '';

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setUploadError(`Maximum ${MAX_IMAGES} portfolio images allowed.`);
      return;
    }
    const toUpload = files.slice(0, remaining);

    setUploadError(null);
    setUploading(true);

    const studioId = profile!.studio_id!;
    const newImages: PortfolioImage[] = [];

    for (const file of toUpload) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Only image files are allowed (JPG, PNG, WebP).');
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`"${file.name}" exceeds the 5 MB size limit.`);
        continue;
      }

      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `${studioId}/portfolio-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('studio-logos')
        .upload(path, file, { upsert: false, contentType: file.type });

      if (upErr) {
        setUploadError(`Upload failed: ${upErr.message}`);
        continue;
      }

      const { data: urlData } = supabase.storage.from('studio-logos').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      const nextOrder = images.length + newImages.length;

      const { data: inserted, error: dbErr } = await supabase
        .from('studio_portfolio_images')
        .insert({
          studio_id: studioId,
          url: publicUrl,
          storage_path: path,
          caption: '',
          sort_order: nextOrder,
        })
        .select('id, url, storage_path, caption, sort_order, created_at')
        .maybeSingle();

      if (dbErr) {
        setUploadError(`Database error: ${dbErr.message}`);
        await supabase.storage.from('studio-logos').remove([path]);
        continue;
      }

      if (inserted) newImages.push(inserted as PortfolioImage);
    }

    setImages(prev => [...prev, ...newImages]);
    if (newImages.length > 0) invalidateStudioData(studioId, 'portfolio');
    setUploading(false);
    if (newImages.length > 0) showSuccess(`${newImages.length} image${newImages.length > 1 ? 's' : ''} uploaded successfully.`);
  }

  async function handleDelete(image: PortfolioImage) {
    setDeletingId(image.id);
    await supabase.storage.from('studio-logos').remove([image.storage_path]);
    await supabase.from('studio_portfolio_images').delete().eq('id', image.id);
    const updated = images.filter(i => i.id !== image.id).map((img, idx) => ({ ...img, sort_order: idx }));
    for (const img of updated) {
      await supabase.from('studio_portfolio_images').update({ sort_order: img.sort_order }).eq('id', img.id);
    }
    setImages(updated);
    invalidateStudioData(studioId, 'portfolio');
    setDeletingId(null);
    showSuccess('Image removed.');
  }

  async function handleCaptionChange(id: string, caption: string) {
    setImages(prev => prev.map(i => i.id === id ? { ...i, caption } : i));
  }

  async function handleCaptionBlur(id: string, caption: string) {
    await supabase.from('studio_portfolio_images').update({ caption }).eq('id', id);
  }

  const canUpload = images.length < MAX_IMAGES;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">Studio Portfolio</h2>
          <p className="text-sm text-ink-muted mt-0.5">
            Upload your best work — these photos appear in your client quotations automatically.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-medium text-ink-subtle bg-surface-raised border border-border rounded-full px-3 py-1">
            {images.length} / {MAX_IMAGES} photos
          </span>
          {canUpload && (
            <>
              <Button
                size="sm"
                icon={<ImagePlus className="w-3.5 h-3.5" />}
                onClick={() => fileInputRef.current?.click()}
                loading={uploading}
              >
                {uploading ? 'Uploading...' : 'Add Photos'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </>
          )}
        </div>
      </div>

      {uploadError && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{uploadError}</p>
          </div>
          <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-700">{successMsg}</p>
        </div>
      )}

      {images.length === 0 ? (
        <div
          className="border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-4 py-20 cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all duration-200 group"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-100 group-hover:bg-primary-100 flex items-center justify-center transition-colors duration-200">
            <Upload className="w-7 h-7 text-slate-400 group-hover:text-primary-500 transition-colors duration-200" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-ink">Upload your portfolio photos</p>
            <p className="text-xs text-ink-muted mt-1">JPG, PNG, or WebP &bull; Max 5 MB per image &bull; Up to {MAX_IMAGES} photos</p>
          </div>
          <Button size="sm" icon={<ImagePlus className="w-3.5 h-3.5" />} loading={uploading}>
            {uploading ? 'Uploading...' : 'Choose Photos'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img) => (
              <div key={img.id} className="group flex flex-col gap-2">
                <div className="relative rounded-xl overflow-hidden border border-border shadow-sm" style={{ backgroundColor: '#F8FAFC' }}>
                  <div className="h-48 w-full">
                    <img
                      src={img.url}
                      alt={img.caption || 'Portfolio image'}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      crossOrigin="anonymous"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-200 rounded-xl flex items-center justify-center">
                    <button
                      onClick={() => handleDelete(img)}
                      disabled={deletingId === img.id}
                      className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 w-9 h-9 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg disabled:opacity-50"
                      title="Remove photo"
                    >
                      {deletingId === img.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="absolute top-2 left-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-60 transition-opacity duration-200">
                    <GripVertical className="w-4 h-4 text-white drop-shadow" />
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Add a caption..."
                  value={img.caption}
                  onChange={e => handleCaptionChange(img.id, e.target.value)}
                  onBlur={e => handleCaptionBlur(img.id, e.target.value)}
                  className="w-full text-xs text-ink-muted bg-transparent border-b border-transparent focus:border-border focus:outline-none px-0.5 py-0.5 placeholder:text-ink-subtle/40 transition-colors"
                />
              </div>
            ))}

            {canUpload && (
              <div
                className="h-[13.5rem] rounded-xl border-2 border-dashed border-border hover:border-primary-400 hover:bg-primary-50/20 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-primary-100 flex items-center justify-center transition-colors duration-200">
                  <ImagePlus className="w-5 h-5 text-slate-400 group-hover:text-primary-500 transition-colors duration-200" />
                </div>
                <span className="text-xs text-ink-subtle group-hover:text-primary-600 transition-colors font-medium">Add more</span>
              </div>
            )}
          </div>

          <div className="bg-slate-50 border border-border rounded-xl px-5 py-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
              <ImagePlus className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Your portfolio appears in client quotations</p>
              <p className="text-xs text-ink-muted mt-0.5">
                These photos are automatically displayed in the "Our Portfolio" section of every quote you create, giving clients a visual preview of your work.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
