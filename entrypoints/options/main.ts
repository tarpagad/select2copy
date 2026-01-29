import './style.css';

type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

// Define storage types
interface StorageData {
  key?: 'ctrl' | 'shift' | 'alt';
  position?: Position;
  background?: string;
  ignoredDomains?: string[];
}

const keySelect = document.getElementById('keySelect') as HTMLSelectElement;
const positionSelect = document.getElementById('positionSelect') as HTMLSelectElement;
const bgColor = document.getElementById('bgColor') as HTMLInputElement;
const bgOpacity = document.getElementById('bgOpacity') as HTMLInputElement;
const preview = document.getElementById('preview') as HTMLDivElement;
const domainInput = document.getElementById('domainInput') as HTMLInputElement;
const addDomainBtn = document.getElementById('addDomainBtn') as HTMLButtonElement;
const domainList = document.getElementById('domainList') as HTMLUListElement;

function rgbaFromHex(hex: string, pct: number) {
  if (!hex) return `rgba(0,0,0,${pct})`;
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${pct})`;
}

async function save() {
  const key = keySelect.value as 'ctrl' | 'shift' | 'alt';
  const position = positionSelect.value as Position;
  const hex = bgColor.value || '#000000';
  const opacity = Number(bgOpacity.value) / 100;
  const background = rgbaFromHex(hex, opacity);
  const ignoredDomains = Array.from(domainList.querySelectorAll('li')).map(
    (li) => li.textContent?.replace('Remove', '').trim() || ''
  ).filter(Boolean);
  try {
    await browser.storage.local.set<StorageData>({ key, position, background, ignoredDomains });
  } catch (e) {
    // ignore
  }
  applyPreview(background);
}

function applyPreview(background: string) {
  preview.style.background = background;
}

function renderDomainList(domains: string[]) {
  domainList.innerHTML = '';
  domains.forEach((domain) => {
    const li = document.createElement('li');
    li.style.cssText = 'padding:6px;background:#f0f0f0;margin:4px 0;border-radius:4px;display:flex;justify-content:space-between;align-items:center;';
    const span = document.createElement('span');
    span.textContent = domain;
    const btn = document.createElement('button');
    btn.textContent = 'Remove';
    btn.style.cssText = 'padding:4px 8px;font-size:12px;cursor:pointer;';
    btn.onclick = () => {
      li.remove();
      save();
    };
    li.appendChild(span);
    li.appendChild(btn);
    domainList.appendChild(li);
  });
}

async function load() {
  try {
    const stored = await browser.storage.local.get<StorageData>();
    const key = stored.key || 'ctrl';
    const position = stored.position || 'bottom-right';
    const background = stored.background || 'rgba(0,0,0,0.78)';
    const ignoredDomains = stored.ignoredDomains || [];
    keySelect.value = key;
    positionSelect.value = position;
    renderDomainList(ignoredDomains);

    // try to parse background to hex + opacity for inputs
    const m = /rgba?\((\d+),(\d+),(\d+),?(\d?.?\d+)?\)/.exec(background);
    if (m) {
      const r = Number(m[1]);
      const g = Number(m[2]);
      const b = Number(m[3]);
      const a = m[4] ? Number(m[4]) : 1;
      bgColor.value = `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
      bgOpacity.value = String(Math.round(a * 100));
    } else {
      bgColor.value = '#000000';
      bgOpacity.value = '78';
    }
    applyPreview(background);
  } catch (e) {
    // ignore
  }
}

function wire() {
  keySelect.addEventListener('change', save);
  positionSelect.addEventListener('change', save);
  bgColor.addEventListener('input', save);
  bgOpacity.addEventListener('input', save);
  addDomainBtn.addEventListener('click', async () => {
    const domain = domainInput.value.trim();
    if (!domain) return;
    const existingDomains = Array.from(domainList.querySelectorAll('li')).map(
      (li) => li.textContent?.replace('Remove', '').trim() || ''
    ).filter(Boolean);
    if (!existingDomains.includes(domain)) {
      existingDomains.push(domain);
      renderDomainList(existingDomains);
      await save();
      domainInput.value = '';
    }
  });
  domainInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addDomainBtn.click();
  });
}

wire();
load();
