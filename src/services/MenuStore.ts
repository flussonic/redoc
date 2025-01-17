import { action, observable, makeObservable } from 'mobx';
import { DISCRIMINATOR_SEPARATOR, PROPERTY_SEPARATOR, RESPONSE_POSTFIX } from '../constants';
import { querySelector } from '../utils/dom';
import {
  escapeHTMLAttrChars,
  flattenByProp,
  SECURITY_SCHEMES_SECTION_PREFIX,
  getLocationHash,
} from '../utils';

import { history as historyInst, HistoryService } from './HistoryService';
import { GROUP_DEPTH } from './MenuBuilder';

import type { SpecStore } from './models';
import type { ScrollService } from './ScrollService';
import type { IMenuItem } from './types';

/** Generic interface for MenuItems */

export const SECTION_ATTR = 'data-section-id';

/**
 * Stores all side-menu related information
 */
export class MenuStore {
  /**
   * Statically try update scroll position
   * Used before hydrating from server-side rendered html to scroll page faster
   */
  static updateOnHistory(id: string = historyInst.currentId, scroll: ScrollService) {
    if (!id) {
      return;
    }
    scroll.scrollIntoViewBySelector(`[${SECTION_ATTR}="${escapeHTMLAttrChars(id)}"]`);
  }

  /**
   * active item absolute index (when flattened). -1 means nothing is selected
   */
  @observable
  activeItemIdx: number = -1;

  @observable
  highlightedItemHash: string = '';

  /**
   * whether sidebar with menu is opened or not
   */
  @observable
  sideBarOpened: boolean = false;

  items: IMenuItem[];
  flatItems: IMenuItem[];

  /**
   * cached flattened menu items to support absolute indexing
   */
  private _unsubscribe: () => void;
  private _hashUnsubscribe: () => void;

  /**
   *
   * @param spec [SpecStore](#SpecStore) which contains page content structure
   * @param scroll scroll service instance used by this menu
   */
  constructor(spec: SpecStore, public scroll: ScrollService, public history: HistoryService) {
    makeObservable(this);

    this.items = spec.contentItems;

    this.flatItems = flattenByProp(this.items || [], 'items');
    this.flatItems.forEach((item, idx) => (item.absoluteIdx = idx));

    this.subscribe();

    this.highlightedItemHash = getLocationHash();
  }

  subscribe() {
    this._unsubscribe = this.scroll.subscribe(this.updateOnScroll);
    this._hashUnsubscribe = this.history.subscribe(this.updateOnHistory);
  }

  @action
  toggleSidebar() {
    this.sideBarOpened = this.sideBarOpened ? false : true;
  }

  @action
  closeSidebar() {
    this.sideBarOpened = false;
  }

  /**
   * update active items on scroll
   * @param isScrolledDown whether last scroll was downside
   */
  updateOnScroll = (isScrolledDown: boolean): void => {
    const step = isScrolledDown ? 1 : -1;
    let itemIdx = this.activeItemIdx;
    while (true) {
      if (itemIdx === -1 && !isScrolledDown) {
        break;
      }

      if (itemIdx >= this.flatItems.length - 1 && isScrolledDown) {
        break;
      }

      if (isScrolledDown) {
        const el = this.getElementAtOrFirstChild(itemIdx + 1);
        if (this.scroll.isElementBellow(el)) {
          break;
        }
      } else {
        const el = this.getElementAt(itemIdx);
        if (this.scroll.isElementAbove(el)) {
          break;
        }
      }
      itemIdx += step;
    }

    this.activate(this.flatItems[itemIdx], true, true);
  };

  /**
   * update active items on hash change
   * @param id current hash
   */
  updateOnHistory = (id: string = this.history.currentId) => {
    if (!id) {
      return;
    }
    let item: IMenuItem | undefined;

    item = this.flatItems.find(i => i.id === id);

    if (item) {
      this.activateAndScroll(item, false);
    } else {
      if (id.startsWith(SECURITY_SCHEMES_SECTION_PREFIX)) {
        item = this.flatItems.find(i => SECURITY_SCHEMES_SECTION_PREFIX.startsWith(i.id));
        this.activateAndScroll(item, false);
      }
      this.scroll.scrollIntoViewBySelector(`[${SECTION_ATTR}="${escapeHTMLAttrChars(id)}"]`);
    }
  };

  /**
   * get section/operation DOM Node related to the item or null if it doesn't exist
   * @param idx item absolute index
   */
  getElementAt(idx: number): Element | null {
    const item = this.flatItems[idx];
    return (item && querySelector(`[${SECTION_ATTR}="${escapeHTMLAttrChars(item.id)}"]`)) || null;
  }

  /**
   * get section/operation DOM Node related to the item or if it is group item, returns first item of the group
   * @param idx item absolute index
   */
  getElementAtOrFirstChild(idx: number): Element | null {
    let item = this.flatItems[idx];
    if (item && item.type === 'group') {
      item = item.items[0];
    }
    return (item && querySelector(`[${SECTION_ATTR}="${escapeHTMLAttrChars(item.id)}"]`)) || null;
  }

  /**
   * current active item
   */
  get activeItem(): IMenuItem {
    return this.flatItems[this.activeItemIdx] || undefined;
  }

  getItemById = (id: string) => {
    return this.flatItems.find(item => item.id === id);
  };

  /**
   * activate menu item
   * @param item item to activate
   * @param updateLocation [true] whether to update location
   * @param rewriteHistory [false] whether to rewrite browser history (do not create new entry)
   */
  @action
  activate(
    item: IMenuItem | undefined,
    updateLocation: boolean = true,
    rewriteHistory: boolean = false,
  ) {
    const locationId = getLocationHash();
    // remove `|${property}`
    const locationIdWithoutProperty = locationId.split(PROPERTY_SEPARATOR)[0];
    // remove `#${discriminator}`
    const clearLocationId = locationIdWithoutProperty.split(DISCRIMINATOR_SEPARATOR)[0];

    if ((this.activeItem && this.activeItem.id) === (item && item.id)) {
      return;
    }

    if (item && item.type === 'group') {
      return;
    }

    this.deactivate(this.activeItem);
    if (!item) {
      this.activeItemIdx = -1;
      this.history.replace('', rewriteHistory);
      return;
    }

    // do not allow activating group items
    // TODO: control over options
    if (item.depth <= GROUP_DEPTH) {
      return;
    }

    this.activeItemIdx = item.absoluteIdx!;
    const itemIdResponse = `${this.activeItem?.id}${RESPONSE_POSTFIX}`;
    const isSameLocation =
      clearLocationId === this.activeItem?.id || clearLocationId === itemIdResponse;
    if (updateLocation && !isSameLocation) {
      this.history.replace(encodeURI(item.id), rewriteHistory);
    }

    item.activate();
    item.expand();
  }

  /**
   * makes item and all the parents not active
   * @param item item to deactivate
   */
  deactivate(item: IMenuItem | undefined) {
    if (item === undefined) {
      return;
    }
    item.deactivate();
    while (item !== undefined) {
      item.collapse();
      item = item.parent;
    }
  }

  /**
   * activate menu item and scroll to it
   * @see MenuStore.activate
   */
  @action.bound
  activateAndScroll(
    item: IMenuItem | undefined,
    updateLocation?: boolean,
    rewriteHistory?: boolean,
  ) {
    // item here can be a copy from search results so find corresponding item from menu
    const menuItem = (item && this.getItemById(item.id)) || item;
    this.activate(menuItem, updateLocation, rewriteHistory);
    this.scrollToActive();
    if (!menuItem || !menuItem.items.length) {
      this.closeSidebar();
    }
  }

  /**
   * scrolls to active section
   */
  scrollToActive(): void {
    this.scroll.scrollIntoView(this.getElementAt(this.activeItemIdx));
  }

  dispose() {
    this._unsubscribe();
    this._hashUnsubscribe();
  }

  @action
  setHighlightedItemHash(hash: string) {
    this.highlightedItemHash = hash;
  }
}
