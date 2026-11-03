interface SavedProperty {
  value: string;
  priority: string;
}

interface DocumentLock {
  count: number;
  overflowX: SavedProperty;
  overflowY: SavedProperty;
  padding: SavedProperty;
  appliedOverflowX: SavedProperty;
  appliedOverflowY: SavedProperty;
  appliedPadding?: SavedProperty;
}

const locks = new WeakMap<Document, DocumentLock>();

/** Native dialogs provide inertness; this owns only the document scroll styles. */
export function lockDialogScroll(document: Document): () => void {
  const root = document.documentElement;
  let lock = locks.get(document);
  if (lock) {
    lock.count++;
  } else {
    lock = {
      count: 1,
      overflowX: { value: root.style.getPropertyValue('overflow-x'), priority: root.style.getPropertyPriority('overflow-x') },
      overflowY: { value: root.style.getPropertyValue('overflow-y'), priority: root.style.getPropertyPriority('overflow-y') },
      padding: { value: root.style.getPropertyValue('padding-inline-end'), priority: root.style.getPropertyPriority('padding-inline-end') },
      appliedOverflowX: { value: '', priority: '' },
      appliedOverflowY: { value: '', priority: '' },
    };
    locks.set(document, lock);
    const browser = document.defaultView;
    const gap = browser ? Math.max(0, browser.innerWidth - root.clientWidth) : 0;
    if (gap > 0 && browser) {
      const padding = Number.parseFloat(browser.getComputedStyle(root).paddingInlineEnd) || 0;
      root.style.setProperty('padding-inline-end', `${padding + gap}px`);
      lock.appliedPadding = read('padding-inline-end');
    }
    root.style.setProperty('overflow', 'hidden');
    lock.appliedOverflowX = read('overflow-x');
    lock.appliedOverflowY = read('overflow-y');
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    const current = locks.get(document);
    if (!current || --current.count > 0) return;
    // Do not overwrite styles deliberately changed by the host while locked.
    if (owns('overflow-x', current.appliedOverflowX)) restore('overflow-x', current.overflowX);
    if (owns('overflow-y', current.appliedOverflowY)) restore('overflow-y', current.overflowY);
    if (current.appliedPadding && owns('padding-inline-end', current.appliedPadding)) {
      restore('padding-inline-end', current.padding);
    }
    locks.delete(document);
  };

  function read(name: string): SavedProperty {
    return { value: root.style.getPropertyValue(name), priority: root.style.getPropertyPriority(name) };
  }

  function owns(name: string, applied: SavedProperty) {
    const property = read(name);
    return property.value === applied.value && property.priority === applied.priority;
  }

  function restore(name: string, property: SavedProperty) {
    if (property.value) root.style.setProperty(name, property.value, property.priority);
    else root.style.removeProperty(name);
  }
}
