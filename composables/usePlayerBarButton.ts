import { onScopeDispose, watch, type Ref } from 'vue';

const BUTTON_ID = 'ytm-comments-injected-button';
const STYLE_ID = 'ytm-comments-injected-style';

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" aria-hidden="true" style="pointer-events:none;display:inherit;width:100%;height:100%"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/></svg>`;

function findMenuSibling(): { parent: HTMLElement; after: HTMLElement } | null {
  const playerBar = document.querySelector('ytmusic-player-bar');
  if (!playerBar) return null;
  const menu = playerBar.querySelector(
    '.middle-controls-buttons > ytmusic-menu-renderer',
  ) as HTMLElement | null;
  if (!menu || !menu.parentElement) return null;
  return { parent: menu.parentElement, after: menu };
}

function ensureGlobalStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    yt-button-shape#${BUTTON_ID} {
      position: relative;
      margin-left: 8px;
    }
    yt-button-shape#${BUTTON_ID}.ytm-active::after {
      content: '';
      position: absolute;
      bottom: 4px;
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

function createButton(onClick: () => void): HTMLElement {
  const shape = document.createElement('yt-button-shape');
  shape.id = BUTTON_ID;
  shape.className = 'style-scope ytmusic-menu-renderer';

  shape.innerHTML = `
    <button
      class="ytSpecButtonShapeNextHost ytSpecButtonShapeNextText ytSpecButtonShapeNextMono ytSpecButtonShapeNextSizeM ytSpecButtonShapeNextIconButton ytSpecButtonShapeNextEnableBackdropFilterExperiment"
      title="Comments"
      aria-label="Comments"
      aria-pressed="false"
      type="button"
    >
      <div aria-hidden="true" class="ytSpecButtonShapeNextIcon">
        <span class="ytIconWrapperHost" style="width: 24px; height: 24px;">
          <span class="yt-icon-shape ytSpecIconShapeHost">
            <div style="width: 100%; height: 100%; display: block; fill: currentcolor;">
              ${ICON_SVG}
            </div>
          </span>
        </span>
      </div>
      <yt-touch-feedback-shape aria-hidden="true" class="ytSpecTouchFeedbackShapeHost ytSpecTouchFeedbackShapeTouchResponse">
        <div class="ytSpecTouchFeedbackShapeStroke"></div>
        <div class="ytSpecTouchFeedbackShapeFill"></div>
      </yt-touch-feedback-shape>
    </button>
  `;

  const btn = shape.querySelector('button')!;
  btn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClick();
  });

  return shape;
}

function applyActive(host: HTMLElement | null, active: boolean) {
  if (!host) return;
  host.classList.toggle('ytm-active', active);
  const btn = host.querySelector('button');
  btn?.setAttribute('aria-pressed', String(active));
}

function applyVisibility(host: HTMLElement | null, visible: boolean) {
  if (!host) return;
  host.style.display = visible ? '' : 'none';
}

export function usePlayerBarButton(
  active: Ref<boolean>,
  visible: Ref<boolean>,
  onClick: () => void,
) {
  let observer: MutationObserver | null = null;

  function inject(): HTMLElement | null {
    const existing = document.getElementById(BUTTON_ID);
    if (existing) return existing;
    const anchor = findMenuSibling();
    if (!anchor) return null;
    ensureGlobalStyle();
    const host = createButton(onClick);
    anchor.after.insertAdjacentElement('beforebegin', host);
    applyActive(host, active.value);
    applyVisibility(host, visible.value);
    return host;
  }

  inject();

  observer = new MutationObserver(() => {
    if (!document.getElementById(BUTTON_ID)) {
      const host = inject();
      if (host) {
        applyActive(host, active.value);
        applyVisibility(host, visible.value);
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  watch(
    active,
    (v) => applyActive(document.getElementById(BUTTON_ID), v),
    { immediate: true },
  );
  watch(
    visible,
    (v) => applyVisibility(document.getElementById(BUTTON_ID), v),
    { immediate: true },
  );

  onScopeDispose(() => {
    observer?.disconnect();
    document.getElementById(BUTTON_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();
  });
}
