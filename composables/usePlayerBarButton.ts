import { onScopeDispose, watch, type Ref } from 'vue';
import { t } from '@/lib/i18n';

const BUTTON_ID = 'ytm-comments-injected-button';
const STYLE_ID = 'ytm-comments-injected-style';

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" aria-hidden="true" style="pointer-events:none;display:inherit;width:100%;height:100%"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM7 7h10v2H7zm0 4h7v2H7z"/></svg>`;

/**
 * YT Music ships (at least) two player bars, rolled out per account:
 *
 * - "wiz": `ytmusic-miniplayer`, centered transport, like/dislike pill,
 *   volume and ⋮ menu on the right. Introduced in 2026.
 * - "legacy": `ytmusic-player-bar`, like/dislike/⋮ next to the track title.
 *
 * Each layout says where our button goes and which YouTube button classes
 * make it look native.
 */
interface Layout {
  name: string;
  /** Returns the element our button must be inserted before. */
  findAnchor(): HTMLElement | null;
  buttonClasses: string;
  feedbackClasses: string;
  /** Icon size in px, matching the native buttons next to ours. */
  iconSize: number;
}

const LAYOUTS: Layout[] = [
  {
    name: 'wiz',
    findAnchor: () =>
      document.querySelector<HTMLElement>(
        'ytmusic-miniplayer .ytMusicMiniPlayerRightSection > .ytMusicMiniPlayerVolumeWrapper',
      ) ??
      document.querySelector<HTMLElement>(
        'ytmusic-miniplayer .ytMusicMiniPlayerRightSection > .ytMusicMiniPlayerMenuButton',
      ),
    buttonClasses:
      'ytSpecButtonShapeNextHost ytSpecButtonShapeNextTonal ytSpecButtonShapeNextOverlay ytSpecButtonShapeNextSizeS ytSpecButtonShapeNextIconButton ytSpecButtonShapeNextEnableBackdropFilterExperiment',
    feedbackClasses: 'ytSpecTouchFeedbackShapeHost ytSpecTouchFeedbackShapeOverlayTouchResponse',
    iconSize: 16,
  },
  {
    name: 'legacy',
    findAnchor: () =>
      document.querySelector<HTMLElement>(
        'ytmusic-player-bar .middle-controls-buttons > ytmusic-menu-renderer',
      ),
    buttonClasses:
      'ytSpecButtonShapeNextHost ytSpecButtonShapeNextText ytSpecButtonShapeNextMono ytSpecButtonShapeNextSizeM ytSpecButtonShapeNextIconButton ytSpecButtonShapeNextEnableBackdropFilterExperiment',
    feedbackClasses: 'ytSpecTouchFeedbackShapeHost ytSpecTouchFeedbackShapeTouchResponse',
    iconSize: 24,
  },
];

function findPlacement(): { layout: Layout; anchor: HTMLElement } | null {
  for (const layout of LAYOUTS) {
    const anchor = layout.findAnchor();
    if (anchor?.parentElement) return { layout, anchor };
  }
  return null;
}

function ensureGlobalStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${BUTTON_ID} {
      position: relative;
      display: inline-flex;
      align-items: center;
    }
    #${BUTTON_ID}[data-layout="legacy"] { margin-left: 8px; }
    #${BUTTON_ID}[hidden] { display: none !important; }
    #${BUTTON_ID}.ytm-comments-active button { color: #fff; }
    #${BUTTON_ID}.ytm-comments-active::after {
      content: '';
      position: absolute;
      bottom: -3px;
      left: 50%;
      transform: translateX(-50%);
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background-color: currentColor;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
}

function createButton(layout: Layout, onClick: () => void): HTMLElement {
  // A plain div wrapper: custom elements like <yt-button-shape> get
  // re-rendered by YouTube's framework and lose our content.
  const host = document.createElement('div');
  host.id = BUTTON_ID;
  host.dataset.layout = layout.name;
  const label = t('commentsButton');

  host.innerHTML = `
    <button class="${layout.buttonClasses}" type="button" aria-pressed="false">
      <div aria-hidden="true" class="ytSpecButtonShapeNextIcon">
        <span class="ytIconWrapperHost" style="width: ${layout.iconSize}px; height: ${layout.iconSize}px;">
          <span class="yt-icon-shape ytSpecIconShapeHost">
            <div style="width: 100%; height: 100%; display: block; fill: currentcolor;">${ICON_SVG}</div>
          </span>
        </span>
      </div>
      <yt-touch-feedback-shape aria-hidden="true" class="${layout.feedbackClasses}">
        <div class="ytSpecTouchFeedbackShapeStroke"></div>
        <div class="ytSpecTouchFeedbackShapeFill"></div>
      </yt-touch-feedback-shape>
    </button>
  `;

  const btn = host.querySelector('button')!;
  btn.title = label;
  btn.setAttribute('aria-label', label);
  btn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClick();
  });
  return host;
}

function applyState(host: HTMLElement | null, active: boolean, visible: boolean) {
  if (!host) return;
  host.classList.toggle('ytm-comments-active', active);
  host.hidden = !visible;
  host.querySelector('button')?.setAttribute('aria-pressed', String(active));
}

export function usePlayerBarButton(
  active: Ref<boolean>,
  visible: Ref<boolean>,
  onClick: () => void,
) {
  let scheduled = false;

  /** Inserts the button, or moves it if YouTube swapped player bars. */
  function sync() {
    scheduled = false;
    const placement = findPlacement();
    const existing = document.getElementById(BUTTON_ID);
    if (!placement) return;
    const { layout, anchor } = placement;
    if (existing && existing.dataset.layout === layout.name && existing.nextElementSibling === anchor) {
      return;
    }
    existing?.remove();
    ensureGlobalStyle();
    const host = createButton(layout, onClick);
    anchor.parentElement!.insertBefore(host, anchor);
    applyState(host, active.value, visible.value);
  }

  // YT Music mutates the DOM constantly; batch checks to one per frame.
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(sync);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  sync();

  watch(
    [active, visible],
    ([a, v]) => applyState(document.getElementById(BUTTON_ID), a, v),
    { immediate: true },
  );

  onScopeDispose(() => {
    observer.disconnect();
    document.getElementById(BUTTON_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();
  });
}

/** Height of whichever player bar is on screen, for positioning the drawer. */
export function playerBarHeight(): number {
  const bar =
    document.getElementById(BUTTON_ID)?.closest('ytmusic-miniplayer, ytmusic-player-bar') ??
    document.querySelector('ytmusic-player-bar');
  const rect = bar?.getBoundingClientRect();
  if (!rect || rect.height === 0) return 72;
  return Math.max(0, Math.round(window.innerHeight - rect.top));
}
