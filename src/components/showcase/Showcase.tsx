import React, { useEffect, useMemo, useRef, useState } from 'react';
import { backend, MAX_UPLOAD_BYTES, NewWork, User, Work, viewOnce } from '../../backend';
import { Masonry } from '../Masonry';
import { DetailShell, RailRows, FooterButtons, useSize } from '../DetailShell';
import { useInView } from '../../hooks/useInView';
import { cursorById, themeById, STUDIO_TONE } from '../../data/catalog';
import { PACKS } from '../../data/packs';
import { CursorGlyph, PackLineup, TerminalPreview } from '../items/Previews';
import { detailPath, shareUrl } from '../../router';
import { BRAND } from '../../collection';
import { X } from 'lucide-react';

const CATEGORIES = ['Character', 'Setup', 'Theme', 'Cursor', 'Other'] as const;

const RATIO_BY_CATEGORY: Record<string, number> = { Setup: 1.3, Theme: 1.3, Character: 0.92, Cursor: 1.04, Other: 1.1 };

/* What a work looks like on its card / stage. House picks render live from
   the collection itself; community work is an image or a looping video. */
const WorkMedia: React.FC<{ work: Work; width: number; height: number; active: boolean; stage?: boolean }> = ({ work, width, height, active, stage }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) v.play().catch(() => {});
    else v.pause();
  }, [active]);

  if (work.media_type === 'video') {
    return (
      <video
        ref={videoRef}
        src={work.media_url}
        muted
        loop
        playsInline
        preload="metadata"
        controls={stage}
        className={`absolute inset-0 size-full ${stage ? 'object-contain' : 'object-cover'}`}
      />
    );
  }
  if (work.media_type === 'image') {
    return <img src={work.media_url} alt="" loading="lazy" decoding="async" className={`absolute inset-0 size-full ${stage ? 'object-contain' : 'object-cover'}`} />;
  }
  const [kind, id] = work.media_url.split(':');
  if (kind === 'theme') {
    const t = themeById.get(id);
    return t ? (
      <div className={`absolute ${stage ? 'inset-0 grid place-items-center p-10 pt-24' : 'inset-x-[9%] top-[24%] bottom-[11%]'}`}>
        <TerminalPreview theme={t} size={stage ? 'stage' : 'card'} animate={active} className={stage ? 'w-full max-w-[40rem]' : 'h-full'} />
      </div>
    ) : null;
  }
  if (kind === 'cursor') {
    const c = cursorById.get(id);
    return c ? (
      <div className="absolute inset-0 grid place-items-center">
        <div className="flex items-end gap-6">
          <CursorGlyph set={c} role="default" px={stage ? 8 : 4} className="pc-float" />
          <CursorGlyph set={c} role="pointer" px={stage ? 10 : 5} className="pc-float [animation-delay:-1.2s]" />
        </div>
      </div>
    ) : null;
  }
  if (kind === 'pack') {
    const p = PACKS.find((x) => x.id === id);
    return p && active ? <PackLineup pack={p} width={width} height={height} /> : null;
  }
  return null;
};

const workTone = (_w: Work) => STUDIO_TONE;

const WorkCard: React.FC<{ work: Work; index: number; width: number; ratio: number; views?: number; onOpen: (w: Work) => void }> = ({ work, index, width, ratio, views, onOpen }) => {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);
  const height = Math.round(width / ratio);
  return (
    <article
      ref={ref}
      className="pc-card group/tile relative cursor-pointer outline-none"
      style={{ '--i': index } as React.CSSProperties}
      tabIndex={0}
      role="button"
      aria-label={`${work.title} by ${work.author_name}`}
      onClick={() => onOpen(work)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen(work))}
    >
      <div
        data-pet-stage={`work:${work.id}`}
        className="pc-stage relative overflow-hidden rounded-[18px] group-focus-visible/tile:ring-2 group-focus-visible/tile:ring-brand"
        style={{ height, '--tint': workTone(work) } as React.CSSProperties}
      >
        <WorkMedia work={work} width={width} height={height} active={inView} />
        {work.status === 'pending' && (
          <span className="absolute top-3 left-3 z-20 rounded-full bg-page/85 px-2 py-0.5 text-[11px] text-ink-2 backdrop-blur-sm">In review</span>
        )}
        {work.media_type === 'video' && (
          <span className="absolute top-3 right-3 z-20 rounded-full bg-page/85 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-3 backdrop-blur-sm">Video</span>
        )}
      </div>
      <div className="flex items-start justify-between gap-2 px-1 pt-2.5 pb-1">
        <div className="min-w-0">
          <h3 className="truncate font-display text-[15px] font-medium leading-tight text-ink">{work.title}</h3>
          <p className="mt-0.5 truncate text-[12px] text-ink-3">
            {work.author_name} · {work.category}
          </p>
        </div>
        {views != null && views > 0 && <span className="shrink-0 pt-0.5 font-mono text-[10.5px] tabular-nums text-ink-3">{views.toLocaleString()} views</span>}
      </div>
    </article>
  );
};

const WorkDetail: React.FC<{ work: Work; works: Work[]; views: number | null; onSelect: (w: Work) => void; onClose: () => void; onCopied: (m: string) => void }> = ({
  work,
  works,
  views,
  onSelect,
  onClose,
  onCopied,
}) => {
  const [stageRef, size] = useSize<HTMLElement>();
  const i = works.findIndex((w) => w.id === work.id);
  const prev = works.length > 1 ? works[(i - 1 + works.length) % works.length] : undefined;
  const next = works.length > 1 ? works[(i + 1) % works.length] : undefined;
  return (
    <DetailShell
      label="Showcase"
      title={work.title}
      subtitle={`by ${work.author_name}`}
      avatar={<span className="font-display text-[14px] font-medium text-ink-2">{work.author_name.slice(0, 1).toUpperCase()}</span>}
      tone={workTone(work)}
      stageRef={stageRef}
      stage={size.w > 0 && <WorkMedia work={work} width={size.w} height={size.h} active stage />}
      onPrev={prev && (() => onSelect(prev))}
      onNext={next && (() => onSelect(next))}
      onClose={onClose}
      resetKey={work.id}
      footer={
        <FooterButtons
          onCopyLink={() => {
            navigator.clipboard?.writeText(shareUrl(detailPath('work', work.id)));
            onCopied(`Copied link to ${work.title}`);
          }}
          primaryLabel={work.link ? 'Visit' : 'Close'}
          onPrimary={() => (work.link ? window.open(work.link, '_blank', 'noopener,noreferrer') : onClose())}
        />
      }
    >
      <p className="text-[14px] leading-[1.6] text-ink-2">{work.description || 'No description.'}</p>
      <RailRows
        rows={[
          ['Category', work.category],
          ['Made by', work.author_name],
          ['Added', new Date(work.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })],
          ...(views != null ? ([['Views', views.toLocaleString()]] as [string, React.ReactNode][]) : []),
          ...(work.status !== 'approved' ? ([['Status', 'In review']] as [string, React.ReactNode][]) : []),
        ]}
      />
      {work.link && (
        <a href={work.link} target="_blank" rel="noopener noreferrer" className="mt-4 block truncate text-[13px] text-brand underline underline-offset-2">
          {work.link.replace(/^https?:\/\//, '')}
        </a>
      )}
    </DetailShell>
  );
};

/* ───────────────────────── Submit ───────────────────────── */

const field = 'mt-1.5 w-full rounded-[10px] bg-well px-3 py-2 text-[14px] text-ink outline-none ring-1 ring-line focus:ring-brand';

const SubmitWork: React.FC<{ user: User | null; onClose: () => void; onSubmitted: (w: Work) => void; onUser: (u: User | null) => void }> = ({
  user,
  onClose,
  onSubmitted,
  onUser,
}) => {
  const remote = backend.mode === 'supabase';
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState<Omit<NewWork, 'file'>>({ title: '', description: '', author_name: '', category: 'Setup', link: '', media_url: '' });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const needsSignIn = remote && !user;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (file && file.size > MAX_UPLOAD_BYTES) return setError('Files are limited to 25 MB.');
    if (form.link && !/^https:\/\//.test(form.link)) return setError('Links need to start with https://');
    if (!file && form.media_url && !/^https:\/\//.test(form.media_url)) return setError('Media links need to start with https://');
    setBusy(true);
    try {
      const work = await backend.submitWork({ ...form, file });
      onSubmitted(work);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Submit to the showcase">
      <div className="absolute inset-0 bg-page/70 backdrop-blur-md" onClick={onClose} />
      <div className="animate-popup-in relative max-h-[92dvh] w-full max-w-[30rem] overflow-y-auto rounded-sheet layer-float p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-[18px] font-medium text-ink">Add to the showcase</h2>
            <p className="mt-1 text-[13px] text-ink-3">
              {remote
                ? 'A screenshot or a short screen recording of what you made. Everything is reviewed before it goes live.'
                : 'Saved in this browser for now. Once the database is connected, submissions go live for everyone after review.'}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="tap grid size-8 shrink-0 place-items-center rounded-full text-ink-3 hover:bg-wash hover:text-ink">
            <X className="size-4" />
          </button>
        </div>

        {needsSignIn ? (
          <div className="mt-5">
            {sent ? (
              <p className="rounded-[12px] bg-well p-4 text-[14px] text-ink-2">
                Check <span className="font-medium text-ink">{email}</span> for a sign-in link. It brings you right back here.
              </p>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  setError('');
                  try {
                    await backend.signInWithEmail(email);
                    setSent(true);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Could not send the link.');
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label className="block text-[13px] text-ink-2">
                  Email
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={field} autoComplete="email" />
                </label>
                <button type="submit" disabled={busy} className="surface surface-primary mt-3 h-10 w-full rounded-full text-[14px] font-medium text-white disabled:opacity-60">
                  {busy ? 'Sending…' : 'Email me a sign-in link'}
                </button>
                <div className="my-3 flex items-center gap-3 text-[12px] text-ink-3">
                  <span className="h-px flex-1 bg-line" />
                  or
                  <span className="h-px flex-1 bg-line" />
                </div>
                <button type="button" onClick={() => backend.signInWithGitHub()} className="surface surface-outline h-10 w-full rounded-full text-[14px] font-medium text-ink">
                  Continue with GitHub
                </button>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
            <label className="block text-[13px] text-ink-2">
              Title
              <input required minLength={2} maxLength={80} value={form.title} onChange={set('title')} className={field} placeholder="My Ferris-themed terminal" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-[13px] text-ink-2">
                Your name
                <input required maxLength={60} value={form.author_name} onChange={set('author_name')} className={field} placeholder="Ada" />
              </label>
              <label className="block text-[13px] text-ink-2">
                Category
                <select value={form.category} onChange={set('category')} className={field}>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block text-[13px] text-ink-2">
              What is it?
              <textarea maxLength={400} rows={3} value={form.description} onChange={set('description')} className={field} placeholder="A sentence or two about it." />
            </label>
            <div className="text-[13px] text-ink-2">
              Preview
              <label className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-[12px] border border-dashed border-line-strong p-3 hover:bg-well">
                {file ? (
                  file.type.startsWith('video/') ? (
                    <video src={preview} muted autoPlay loop playsInline className="h-14 w-20 rounded-[8px] object-cover" />
                  ) : (
                    <img src={preview} alt="" className="h-14 w-20 rounded-[8px] object-cover" />
                  )
                ) : (
                  <span className="grid h-14 w-20 place-items-center rounded-[8px] bg-well text-[20px] text-ink-3">+</span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-ink">{file ? file.name : remote ? 'Image or video, up to 25 MB' : 'Image, up to 1.5 MB'}</span>
                  <span className="block text-[12px] text-ink-3">PNG, JPG, WebP, GIF{remote ? ', MP4, WebM or MOV' : ''}</span>
                </span>
                <input type="file" accept={remote ? 'image/*,video/mp4,video/webm,video/quicktime' : 'image/*'} className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </label>
              {!file && (
                <input value={form.media_url} onChange={set('media_url')} className={field} placeholder="…or paste an https:// link to an image or video" inputMode="url" />
              )}
            </div>
            <label className="block text-[13px] text-ink-2">
              Link <span className="text-ink-3">(optional)</span>
              <input value={form.link} onChange={set('link')} className={field} placeholder="https://" inputMode="url" />
            </label>
            {error && <p className="text-[13px] text-[#e5484d]">{error}</p>}
            <button type="submit" disabled={busy} className="surface surface-primary mt-1 h-10 rounded-full text-[14px] font-medium text-white disabled:opacity-60">
              {busy ? 'Submitting…' : remote ? 'Submit for review' : 'Add to my showcase'}
            </button>
            {remote && user && (
              <p className="text-center text-[12px] text-ink-3">
                Signed in as {user.email} ·{' '}
                <button
                  type="button"
                  className="underline underline-offset-2 hover:text-ink"
                  onClick={async () => {
                    await backend.signOut();
                    onUser(null);
                  }}
                >
                  Sign out
                </button>
              </p>
            )}
          </form>
        )}
        {needsSignIn && error && <p className="mt-3 text-[13px] text-[#e5484d]">{error}</p>}
      </div>
    </div>
  );
};

/* ───────────────────────── View ───────────────────────── */

interface ShowcaseProps {
  openId: string | null;
  onOpen: (id: string | null) => void;
  submitOpen: boolean;
  onSubmitOpen: (open: boolean) => void;
  onToast: (message: string, sub?: string) => void;
}

export const Showcase: React.FC<ShowcaseProps> = ({ openId, onOpen, submitOpen, onSubmitOpen, onToast }) => {
  const [works, setWorks] = useState<Work[] | null>(null);
  const [error, setError] = useState('');
  const [views, setViews] = useState<Record<string, number>>({});
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let live = true;
    backend.getUser().then((u) => live && setUser(u));
    backend
      .listWorks()
      .then((list) => {
        if (!live) return;
        setWorks(list);
        if (backend.sharedViews) backend.getViews(list.map((w) => `work:${w.id}`)).then((v) => live && setViews(v));
      })
      .catch((e) => live && setError(e instanceof Error ? e.message : 'Could not load the showcase.'));
    return () => {
      live = false;
    };
  }, []);

  const open = works?.find((w) => w.id === openId) ?? null;

  useEffect(() => {
    if (!open) return;
    const key = `work:${open.id}`;
    viewOnce(key).then((n) => n != null && backend.sharedViews && setViews((v) => ({ ...v, [key]: n })));
  }, [open]);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-ink-3">
          {works ? `${works.length} works` : 'Loading…'}
          {backend.mode === 'local' && ' · community uploads open once the database is connected'}
        </p>
        <button type="button" onClick={() => onSubmitOpen(true)} className="surface surface-primary h-8 rounded-full px-4 text-[13px] font-medium text-white">
          Submit your work
        </button>
      </div>

      {error ? (
        <p className="rounded-sheet border border-dashed border-line-strong py-16 text-center text-[14px] text-ink-3">{error}</p>
      ) : works ? (
        <Masonry
          items={works}
          getKey={(w) => w.id}
          getRatio={(w) => RATIO_BY_CATEGORY[w.category] ?? 1.1}
          renderItem={(w, { index, width, ratio }) => (
            <WorkCard work={w} index={index} width={width} ratio={ratio} views={backend.sharedViews ? views[`work:${w.id}`] : undefined} onOpen={(x) => onOpen(x.id)} />
          )}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-[18px] bg-well" />
          ))}
        </div>
      )}

      {open && works && (
        <WorkDetail
          work={open}
          works={works}
          views={backend.sharedViews ? views[`work:${open.id}`] ?? null : null}
          onSelect={(w) => onOpen(w.id)}
          onClose={() => onOpen(null)}
          onCopied={(m) => onToast(m, 'Copied to clipboard')}
        />
      )}

      {submitOpen && (
        <SubmitWork
          user={user}
          onUser={setUser}
          onClose={() => onSubmitOpen(false)}
          onSubmitted={(w) => {
            setWorks((list) => [w, ...(list ?? [])]);
            onSubmitOpen(false);
            onToast(
              backend.mode === 'supabase' ? 'Submitted for review' : `Added ${w.title}`,
              backend.mode === 'supabase' ? `It goes live on ${BRAND.name} once approved` : 'Saved in this browser'
            );
          }}
        />
      )}
    </>
  );
};

export default Showcase;
