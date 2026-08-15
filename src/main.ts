import { snapdom } from '@zumer/snapdom';
import './style.css';

const TWEET_SELECTOR = 'article[data-testid="tweet"]';
const CELL_SELECTOR = 'div[data-testid="cellInnerDiv"]';
const STATUS_ID_PATTERN = /\/status\/(\d+)/;
const EXPORT_SCALE = 3;
const MAX_CANVAS_SIDE = 32_767;
const MAX_CANVAS_PIXELS = 268_000_000;
const MAX_THREAD_TWEETS = 50;
const IMAGE_WAIT_TIMEOUT = 2_000;

const JUNK_TEXTS: Record<string, true> = {
  '显示更多': true,
  'Show more': true,
  '翻译帖子': true,
  '翻译推文': true,
  'Translate post': true,
  'Translate Tweet': true,
};

const ACTION_PATTERNS = [
  /reply|评论|評論|回复|回覆/i,
  /retweet|repost|转发|轉發/i,
  /like|点赞|點讚|喜欢|喜歡/i,
  /bookmark|书签|書籤/i,
  /share|分享/i,
  /analytics|views?|查看|浏览|瀏覽|觀看/i,
];

const DOWNLOAD_ICON_PATH =
  '<g><path d="M3 19.5c0 .83.67 1.5 1.5 1.5h15c.83 0 1.5-.67 1.5-1.5v-6.5h-2v6.5h-15v-6.5h-2v6.5zM10.46 13.07l-3.54-3.54-1.42 1.42L12 17.41l6.5-6.46-1.42-1.42-3.54 3.54V3h-2v10.07z"></path></g>';

const DOWNLOAD_ICON_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true">${DOWNLOAD_ICON_PATH}</svg>`;

type PageLanguage = 'zh' | 'en';

type GMResponse = {
  status: number;
  response: Blob;
};

type GMRequest = {
  method: 'GET';
  url: string;
  responseType: 'blob';
  onload: (response: GMResponse) => void;
  onerror: () => void;
};

type RuntimeGlobals = typeof globalThis & {
  GM?: {
    xmlHttpRequest?: (request: GMRequest) => void;
  };
  GM_xmlhttpRequest?: (request: GMRequest) => void;
  twemoji?: {
    parse: (node: Element, options?: Record<string, string>) => void;
  };
};

type UserNode = Element | null;

type QuotedTweetData = {
  avatar: string;
  nameNode: UserNode;
  handle: string;
  time: string;
  tweetTextNode: Element | null;
  images: string[];
};

export type EngagementKind = 'replies' | 'reposts' | 'likes' | 'bookmarks' | 'views';
export type EngagementMap = Partial<Record<EngagementKind, string>>;

type TweetData = {
  avatar: string;
  nameNode: UserNode;
  handle: string;
  time: string;
  engagements: EngagementMap;
  tweetTextNode: Element | null;
  images: string[];
  quotedTweetData: QuotedTweetData | null;
};

const VISIBLE_ENGAGEMENT_KINDS = ['replies', 'reposts', 'likes', 'views'] as const;

const ENGAGEMENT_ICON_SVGS: Record<(typeof VISIBLE_ENGAGEMENT_KINDS)[number], string> = {
  replies:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1.751 10c0-4.42 3.584-8.01 8.005-8.01h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"></path></svg>',
  reposts:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"></path></svg>',
  likes:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><g><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path></g></svg>',
  views:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z"></path></svg>',
};

const ENGAGEMENT_PATTERNS: Record<EngagementKind, RegExp> = {
  replies: /repl(?:y|ies)|评论|評論|回复|回覆/i,
  reposts: /retweets?|reposts?|转发|轉發/i,
  likes: /likes?|点赞|點讚|喜欢|喜歡/i,
  bookmarks: /bookmarks?|书签|書籤/i,
  views: /analytics|views?|查看|浏览|瀏覽|觀看/i,
};

const runtime = globalThis as RuntimeGlobals;
const buttonOwners = new WeakMap<HTMLButtonElement, HTMLElement>();
let scanTimer: number | null = null;
let observerStarted = false;

export function normalizeText(value: unknown): string {
  return String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isUsefulText(text: unknown): boolean {
  const value = normalizeText(text);
  return value.length > 0 && !JUNK_TEXTS[value];
}

export function getPageLanguage(doc?: Document): PageLanguage {
  const declaredLanguage = doc?.documentElement?.lang || '';
  const browserLanguage =
    typeof navigator === 'undefined' ? '' : navigator.language || '';
  return /^(zh|cmn)(?:-|$)/i.test(declaredLanguage || browserLanguage)
    ? 'zh'
    : 'en';
}

export function getCurrentStatusId(pathname?: string): string | null {
  const currentPath =
    pathname ?? (typeof window === 'undefined' ? '' : window.location.pathname);
  return currentPath.match(STATUS_ID_PATTERN)?.[1] ?? null;
}

export function cleanTextNode(node: Element | null): Element | null {
  if (!node) return null;

  const clonedNode = node.cloneNode(true) as Element;
  clonedNode
    .querySelectorAll('a[href*="/i/timeline/explore_modes"], a[href*="/translate"]')
    .forEach((element) => element.remove());

  clonedNode.querySelectorAll('a, button, [role="button"]').forEach((element) => {
    if (JUNK_TEXTS[normalizeText(element.textContent)]) element.remove();
  });

  return clonedNode;
}

function getStatusIdFromHref(href: string): string | null {
  try {
    const base =
      typeof document === 'undefined' ? 'https://x.com/' : document.baseURI;
    return new URL(href, base).pathname.match(STATUS_ID_PATTERN)?.[1] ?? null;
  } catch {
    return href.match(STATUS_ID_PATTERN)?.[1] ?? null;
  }
}

function getOwnStatusIds(tweetElement: HTMLElement): string[] {
  const ids = new Set<string>();
  tweetElement.querySelectorAll<HTMLAnchorElement>('a[href*="/status/"]').forEach((link) => {
    if (link.closest(TWEET_SELECTOR) !== tweetElement) return;
    const id = getStatusIdFromHref(link.href || link.getAttribute('href') || '');
    if (id) ids.add(id);
  });
  return [...ids];
}

export function getTweetOwnStatusId(tweetElement: HTMLElement): string | null {
  const quoted = findQuotedTweetWrapper(tweetElement);
  const handle = getTweetHandle(tweetElement).replace(/^@/, '').toLowerCase();
  const ownIds: string[] = [];
  const otherIds: string[] = [];
  tweetElement.querySelectorAll<HTMLAnchorElement>('a[href*="/status/"]').forEach((link) => {
    if (link.closest(TWEET_SELECTOR) !== tweetElement) return;
    if (quoted?.contains(link)) return;
    const href = link.href || link.getAttribute('href') || '';
    const id = getStatusIdFromHref(href);
    if (!id) return;
    try {
      const path = new URL(href, 'https://x.com/').pathname.toLowerCase();
      if (handle && path.includes(`/${handle}/status/`)) {
        ownIds.push(id);
        return;
      }
    } catch {
      // keep as fallback id
    }
    otherIds.push(id);
  });
  return ownIds[0] || otherIds[0] || null;
}

export function compareSnowflakeId(left: string, right: string): number {
  if (left.length !== right.length) return left.length - right.length;
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function sortTweetsByTime(tweets: HTMLElement[]): HTMLElement[] {
  return [...tweets].sort((left, right) => {
    const leftId = getTweetOwnStatusId(left);
    const rightId = getTweetOwnStatusId(right);
    if (leftId && rightId) return compareSnowflakeId(leftId, rightId);
    if (leftId) return -1;
    if (rightId) return 1;
    const leftCell = left.closest(CELL_SELECTOR) || left;
    const rightCell = right.closest(CELL_SELECTOR) || right;
    return compareCellsTopToBottom(leftCell, rightCell);
  });
}

function getTweetHandle(tweetElement: HTMLElement): string {
  const handleElement = Array.from(
    tweetElement.querySelectorAll('[data-testid="User-Name"] span'),
  ).find((element) => /^@\S+/.test(normalizeText(element.textContent)));
  return normalizeText(handleElement?.textContent);
}

function getTweetCellArticle(cell: Element): HTMLElement | null {
  return (
    Array.from(cell.querySelectorAll<HTMLElement>(TWEET_SELECTOR)).find(
      (article) => article.closest(CELL_SELECTOR) === cell,
    ) ?? null
  );
}

function isVisibleElement(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function articleHasStatusId(article: HTMLElement, statusId: string): boolean {
  return getOwnStatusIds(article).includes(statusId);
}

export function findDetailMainTweet(root: ParentNode = document): HTMLElement | null {
  const statusId = getCurrentStatusId();
  if (!statusId) return null;

  const matches = Array.from(
    root.querySelectorAll<HTMLElement>(TWEET_SELECTOR),
  ).filter((article) => articleHasStatusId(article, statusId));
  if (matches.length === 1) return matches[0];

  const visibleMatches = matches.filter(isVisibleElement);
  if (visibleMatches.length === 1) return visibleMatches[0];

  const topLevelMatches = matches.filter(
    (article) => !matches.some((other) => other !== article && other.contains(article)),
  );
  return topLevelMatches.length === 1 ? topLevelMatches[0] : null;
}

function hasReplyingToMarker(tweetElement: HTMLElement): boolean {
  const values = [
    tweetElement.textContent || '',
    ...Array.from(tweetElement.querySelectorAll('[aria-label], [data-testid]')).flatMap(
      (element) => [
        element.getAttribute('aria-label') || '',
        element.getAttribute('data-testid') || '',
      ],
    ),
  ];
  return values.some((value) => /replying to|回复给|回复至|回覆給|回覆至/i.test(value));
}

function hasThreadConnector(cell: Element): boolean {
  if (
    cell.matches('.r-1canivw, .r-1rnoaur, [data-testid="tweetThreadLine"], [data-testid="thread-line"]') ||
    cell.querySelector(
      '.r-1canivw, .r-1rnoaur, [data-testid="tweetThreadLine"], [data-testid="thread-line"]',
    )
  ) {
    return true;
  }

  if (typeof getComputedStyle !== 'function') return false;
  for (const element of Array.from(cell.querySelectorAll<HTMLElement>('*')).slice(0, 300)) {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const width = rect.width || Number.parseFloat(style.width) || 0;
    const height = rect.height || Number.parseFloat(style.height) || 0;
    const borderWidth = Number.parseFloat(style.borderLeftWidth) || 0;
    if (height >= 32 && ((width > 0 && width <= 4) || borderWidth >= 1)) return true;
  }
  return false;
}

const CONVERSATION_BREAK_PATTERN =
  /discover more|who to follow|发现更多|發現更多|推荐关注|推薦關注|推薦跟隨|相关用户|相關使用者|relevant people|more tweets|更多贴文|更多貼文/i;

export function isComposerCell(cell: Element): boolean {
  if (cell.querySelector('[data-testid="tweetTextarea_0"], [data-testid="toolBar"]')) {
    return true;
  }
  return /post your reply|发布你的回复|發佈你的回覆|发布回复|發佈回覆/i.test(
    normalizeText(cell.textContent),
  );
}

export function isConversationBreak(cell: Element): boolean {
  if (getTweetCellArticle(cell) || isComposerCell(cell)) return false;
  const labeled = [
    cell.textContent || '',
    ...Array.from(cell.querySelectorAll('[data-testid], [aria-label], h1, h2')).map(
      (element) =>
        [
          element.getAttribute('data-testid') || '',
          element.getAttribute('aria-label') || '',
          element.textContent || '',
        ].join(' '),
    ),
  ].join(' ');
  return CONVERSATION_BREAK_PATTERN.test(normalizeText(labeled));
}

export function isConnectedConversation(
  parentTweet: HTMLElement,
  childTweet: HTMLElement,
): boolean {
  const parentCell = parentTweet.closest(CELL_SELECTOR);
  if (parentCell && hasThreadConnector(parentCell)) return true;
  if (hasReplyingToMarker(childTweet)) return true;

  const parentIds = new Set(getOwnStatusIds(parentTweet));
  return Array.from(childTweet.querySelectorAll<HTMLAnchorElement>('a[href*="/status/"]')).some(
    (link) => {
      if (link.closest(TWEET_SELECTOR) !== childTweet) return false;
      const id = getStatusIdFromHref(link.href || link.getAttribute('href') || '');
      return Boolean(id && parentIds.has(id));
    },
  );
}

export function isThreadCandidate(
  candidate: HTMLElement,
  nextTweet: HTMLElement,
): boolean {
  return isConnectedConversation(candidate, nextTweet);
}

function compareCellsTopToBottom(left: Element, right: Element): number {
  const topLeft = left.getBoundingClientRect().top;
  const topRight = right.getBoundingClientRect().top;
  if (topLeft !== topRight) return topLeft - topRight;
  if (left === right) return 0;
  return left.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}

function getConversationCells(currentTweet: HTMLElement): Element[] {
  const currentCell = currentTweet.closest(CELL_SELECTOR);
  if (!currentCell) return [];

  const root =
    currentCell.closest('[data-testid="primaryColumn"]') ||
    currentCell.closest('[aria-label*="Timeline"]') ||
    currentCell.closest('section') ||
    currentCell.parentElement;
  if (!root) return [currentCell];

  const cells = Array.from(root.querySelectorAll(CELL_SELECTOR)).filter((cell) => {
    const nestedParent = cell.parentElement?.closest(CELL_SELECTOR);
    return !nestedParent;
  });
  if (cells.length === 0) return [currentCell];
  return cells.sort(compareCellsTopToBottom);
}

function collectConversationPath(
  fromTweet: HTMLElement,
  mainTweet: HTMLElement | null,
): HTMLElement[] {
  const cells = getConversationCells(fromTweet);
  const fromCell = fromTweet.closest(CELL_SELECTOR);
  const startIndex = fromCell ? cells.indexOf(fromCell) : -1;
  if (startIndex < 0) {
    return mainTweet && mainTweet !== fromTweet ? [mainTweet, fromTweet] : [fromTweet];
  }

  const collected = [fromTweet];
  let nextTweet = fromTweet;
  for (let index = startIndex - 1; index >= 0 && collected.length < MAX_THREAD_TWEETS; index -= 1) {
    const cell = cells[index];
    if (isConversationBreak(cell)) break;
    if (isComposerCell(cell)) continue;
    const tweet = getTweetCellArticle(cell);
    if (!tweet) continue;
    if (mainTweet && tweet === mainTweet) {
      collected.unshift(tweet);
      nextTweet = tweet;
      continue;
    }
    if (!isConnectedConversation(tweet, nextTweet)) break;
    collected.unshift(tweet);
    nextTweet = tweet;
  }

  if (mainTweet && !collected.includes(mainTweet)) collected.unshift(mainTweet);
  return sortTweetsByTime(collected);
}

export function collectThreadTweetElements(
  currentTweet: HTMLElement,
  isDetailPage: boolean,
): HTMLElement[] {
  if (!isDetailPage) return [currentTweet];
  return collectConversationPath(currentTweet, findDetailMainTweet());
}

export function isLikelyQuotedTweet(wrapper: Element): boolean {
  const hasUser = Boolean(wrapper.querySelector('[data-testid="User-Name"]'));
  const hasStatusLink = Array.from(
    wrapper.querySelectorAll<HTMLAnchorElement>('a[href*="/status/"]'),
  ).some((link) => Boolean(getStatusIdFromHref(link.href || link.getAttribute('href') || '')));
  const hasText = Boolean(
    wrapper.querySelector('[data-testid="tweetText"], [data-testid="noteTweetText"]'),
  );
  const hasMedia = Boolean(wrapper.querySelector('img[src*="/media/"]'));
  return hasUser && hasStatusLink && (hasText || hasMedia);
}

export function findQuotedTweetWrapper(tweetElement: HTMLElement): Element | null {
  const candidates = Array.from(
    tweetElement.querySelectorAll(
      '[data-testid="card.wrapper"], div[role="link"][tabindex="0"]',
    ),
  );
  return (
    candidates.find(
      (candidate) =>
        isLikelyQuotedTweet(candidate) &&
        !candidates.some(
          (other) => other !== candidate && other.contains(candidate) && isLikelyQuotedTweet(other),
        ),
    ) ?? null
  );
}

function isMainTextCandidate(node: Element, quotedTweetWrapper: Element | null): boolean {
  if (quotedTweetWrapper?.contains(node)) return false;
  if (
    node.closest(
      '[data-testid="User-Name"], [data-testid="Tweet-User-Avatar"], [role="group"], time, [data-testid="tweetPhoto"], [data-testid="videoPlayer"], [data-testid="placementTracking"], [data-testid="card.wrapper"], [data-testid="videoComponent"]',
    )
  ) {
    return false;
  }
  return isUsefulText(node.textContent);
}

export function findMainTextNode(
  tweetElement: HTMLElement,
  quotedTweetWrapper: Element | null,
): Element | null {
  const directSelectors = [
    '[data-testid="tweetText"]',
    '[data-testid="noteTweetText"]',
    '[data-testid="NoteTweet"]',
  ];
  for (const selector of directSelectors) {
    const directText = Array.from(tweetElement.querySelectorAll(selector)).find(
      (element) => !quotedTweetWrapper?.contains(element) && isUsefulText(element.textContent),
    );
    if (directText) return cleanTextNode(directText);
  }

  const candidates = Array.from(
    tweetElement.querySelectorAll('div[lang], span[lang], div[dir="auto"], span[dir="auto"]'),
  ).filter((element) => isMainTextCandidate(element, quotedTweetWrapper));
  const uniqueCandidates = candidates.filter(
    (element, index) => !candidates.some((other, otherIndex) => otherIndex < index && other.contains(element)),
  );

  if (uniqueCandidates.length === 0) return null;
  if (uniqueCandidates.length === 1) return cleanTextNode(uniqueCandidates[0]);

  const wrapper = document.createElement('div');
  const seenTexts: string[] = [];
  for (const candidate of uniqueCandidates) {
    const text = normalizeText(candidate.textContent);
    if (seenTexts.some((seen) => seen.includes(text) || text.includes(seen))) continue;
    seenTexts.push(text);

    const cloned = cleanTextNode(candidate);
    if (!cloned || !isUsefulText(cloned.textContent)) continue;
    cloned.classList.add('twitter-long-image-combined-text');
    wrapper.appendChild(cloned);
  }
  return wrapper.childNodes.length > 0 ? wrapper : null;
}

function getUserNameNode(tweetElement: HTMLElement): UserNode {
  const userName = tweetElement.querySelector('[data-testid="User-Name"]');
  const nameAnchor = userName?.querySelector('a');
  const nameNode =
    nameAnchor?.querySelector('div')?.firstElementChild ||
    nameAnchor?.firstElementChild ||
    userName?.firstElementChild;
  return (nameNode?.cloneNode(true) as Element | undefined) ?? null;
}

function getTimeText(tweetElement: HTMLElement, excluded: Element | null): string {
  return (
    Array.from(tweetElement.querySelectorAll('time')).find(
      (time) => !excluded?.contains(time),
    )?.textContent?.trim() || ''
  );
}

function getViewsText(tweetElement: HTMLElement, excluded: Element | null): string {
  const candidates = Array.from(tweetElement.querySelectorAll('span, a')).filter(
    (element) => !excluded?.contains(element),
  );
  return (
    candidates
      .map((element) => normalizeText(element.textContent))
      .find(
        (text) =>
          text.length <= 80 &&
          /\d/.test(text) &&
          /views?|查看|浏览量|浏览|瀏覽量|瀏覽|觀看/i.test(text),
      ) || ''
  );
}

function getEngagementValue(text: string): string {
  return (
    normalizeText(text)
      .match(/\d[\d,.]*\s*(?:万|萬|亿|億|[KMB])?/i)?.[0]
      ?.replace(/\s+/g, '') || ''
  );
}

function getLabeledEngagementValue(text: string, pattern: RegExp): string {
  const match = normalizeText(text).match(
    new RegExp(
      `(\\d[\\d,.]*\\s*(?:万|萬|亿|億|[KMB])?)(?:\\s*(?:則|次|個|个))?\\s*(?:${pattern.source})`,
      'i',
    ),
  );
  return match?.[1]?.replace(/\s+/g, '') || '';
}

function getEngagementLabel(kind: EngagementKind, source: string): string {
  const pageLanguage =
    typeof document === 'undefined' ? '' : document.documentElement.lang;
  const traditional =
    /(?:^|-)Hant(?:-|$)|^zh-(?:TW|HK|MO)(?:-|$)/i.test(pageLanguage) ||
    /評論|回覆|轉發|點讚|喜歡|書籤|瀏覽|觀看/.test(source);
  const chinese =
    traditional ||
    /评论|回复|转发|点赞|喜欢|书签|浏览|查看/.test(source);
  if (!chinese) {
    return {
      replies: 'Replies',
      reposts: 'Reposts',
      likes: 'Likes',
      bookmarks: 'Bookmarks',
      views: 'Views',
    }[kind];
  }
  return (traditional
    ? {
        replies: '回覆',
        reposts: '轉發',
        likes: '喜歡',
        bookmarks: '書籤',
        views: '觀看',
      }
    : {
        replies: '评论',
        reposts: '转发',
        likes: '点赞',
        bookmarks: '书签',
        views: '浏览',
      })[kind];
}

function findDetailActionGroup(tweetElement: HTMLElement): HTMLElement | null {
  const mainBottom = tweetElement.getBoundingClientRect().bottom;
  const actionBars = Array.from(
    document.querySelectorAll<HTMLElement>('[role="group"]'),
  ).filter((group) => {
    if (group.closest(TWEET_SELECTOR)) return false;
    const rect = group.getBoundingClientRect();
    if (rect.width < 240 || rect.height < 24) return false;
    if (mainBottom > 0 && Math.abs(rect.top - mainBottom) > 260) return false;
    return getActionGroupScore(group) >= 2;
  });
  actionBars.sort(
    (left, right) =>
      Math.abs(left.getBoundingClientRect().top - mainBottom) -
      Math.abs(right.getBoundingClientRect().top - mainBottom),
  );
  return actionBars[0] || null;
}

function getTweetEngagements(
  tweetElement: HTMLElement,
  excluded: Element | null,
  isDetailPageMain: boolean,
): EngagementMap {
  const groups = [
    findTweetActionGroup(tweetElement, excluded),
    isDetailPageMain ? findDetailActionGroup(tweetElement) : null,
  ].filter((group): group is HTMLElement => group !== null);
  const ariaTexts = groups.flatMap((group) =>
    Array.from(group.querySelectorAll('[aria-label]')).map(
      (element) => element.getAttribute('aria-label') || '',
    ),
  );
  const result: EngagementMap = {};

  for (const kind of Object.keys(ENGAGEMENT_PATTERNS) as EngagementKind[]) {
    const pattern = ENGAGEMENT_PATTERNS[kind];
    let source = ariaTexts.find(
      (text) => pattern.test(text) && getEngagementValue(text),
    );
    if (!source) {
      source = groups
        .flatMap((group) =>
          Array.from(
            group.querySelectorAll<HTMLElement>(
              'button, a, [role="button"], [data-testid]',
            ),
          ),
        )
        .map((element) =>
          normalizeText(
            [
              element.getAttribute('aria-label'),
              element.getAttribute('data-testid'),
              element.textContent,
            ]
              .filter(Boolean)
              .join(' '),
          ),
        )
        .find((text) => pattern.test(text) && getEngagementValue(text));
    }
    let value = getEngagementValue(source || '');
    if (!value) {
      for (const group of groups) {
        const groupLabel = group.getAttribute('aria-label') || '';
        const groupValue = getLabeledEngagementValue(groupLabel, pattern);
        if (!groupValue) continue;
        source = groupLabel;
        value = groupValue;
        break;
      }
    }
    if (!value && kind === 'views' && isDetailPageMain) {
      source = getViewsText(tweetElement, excluded);
      value = getEngagementValue(source);
    }
    if (value) result[kind] = value;
  }
  return result;
}

export function getHighResImageUrl(source: string): string {
  if (!source) return '';
  try {
    const base = typeof document === 'undefined' ? 'https://x.com/' : document.baseURI;
    const url = new URL(source, base);
    if (url.hostname === 'pbs.twimg.com' && url.pathname.startsWith('/media/')) {
      url.searchParams.set('name', 'orig');
    }
    return url.href;
  } catch {
    return source;
  }
}

function getTweetImages(tweetElement: HTMLElement, excluded: Element | null): string[] {
  return Array.from(tweetElement.querySelectorAll<HTMLImageElement>('[data-testid="tweetPhoto"] img'))
    .filter((image) => !excluded?.contains(image))
    .map((image) => getHighResImageUrl(image.currentSrc || image.src))
    .filter(Boolean);
}

function getQuotedTweetData(wrapper: Element): QuotedTweetData | null {
  const userInfo = wrapper.querySelector('[data-testid="User-Name"]');
  const handleElement = Array.from(
    wrapper.querySelectorAll('[data-testid="User-Name"] span'),
  ).find((element) => /^@\S+/.test(normalizeText(element.textContent)));
  const nameAnchor = userInfo?.querySelector('a');
  const nameNode =
    (nameAnchor?.querySelector('div')?.firstElementChild?.cloneNode(true) as Element | undefined) ||
    (nameAnchor?.firstElementChild?.cloneNode(true) as Element | undefined) ||
    null;
  const tweetTextNode = findMainTextNode(wrapper as HTMLElement, null);
  const images = Array.from(wrapper.querySelectorAll<HTMLImageElement>('img[src*="/media/"]'))
    .map((image) => getHighResImageUrl(image.currentSrc || image.src))
    .filter(Boolean);

  if (!nameNode && !tweetTextNode && images.length === 0) return null;
  return {
    avatar: wrapper.querySelector<HTMLImageElement>('img[src*="/profile_images/"]')?.src || '',
    nameNode,
    handle: normalizeText(handleElement?.textContent),
    time: wrapper.querySelector('time')?.textContent?.trim() || '',
    tweetTextNode,
    images,
  };
}

export function extractTweetData(
  tweetElement: HTMLElement,
  isDetailPageMain = false,
): TweetData | null {
  try {
    const quotedTweetWrapper = findQuotedTweetWrapper(tweetElement);
    const tweetTextNode = findMainTextNode(tweetElement, quotedTweetWrapper);
    const images = getTweetImages(tweetElement, quotedTweetWrapper);
    const quotedTweetData = quotedTweetWrapper
      ? getQuotedTweetData(quotedTweetWrapper)
      : null;
    const hasContent = Boolean(
      (tweetTextNode && isUsefulText(tweetTextNode.textContent)) ||
        images.length > 0 ||
        quotedTweetData,
    );
    if (!hasContent) return null;

    return {
      avatar: tweetElement.querySelector<HTMLImageElement>(
        '[data-testid="Tweet-User-Avatar"] img',
      )?.src || '',
      nameNode: getUserNameNode(tweetElement),
      handle: getTweetHandle(tweetElement),
      time: getTimeText(tweetElement, quotedTweetWrapper),
      engagements: getTweetEngagements(
        tweetElement,
        quotedTweetWrapper,
        isDetailPageMain,
      ),
      tweetTextNode,
      images,
      quotedTweetData,
    };
  } catch (error) {
    console.error('Failed to read tweet:', error);
    return null;
  }
}

export function fetchImageAsDataURL(url: string): Promise<string> {
  if (!url || url.startsWith('data:')) return Promise.resolve(url);

  const { promise, resolve } = Promise.withResolvers<string>();
  const request: GMRequest = {
    method: 'GET',
    url,
    responseType: 'blob',
    onload: (response) => {
      if (response.status < 200 || response.status >= 300 || !response.response) {
        resolve(url);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () =>
        resolve(typeof reader.result === 'string' ? reader.result : url);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(response.response);
    },
    onerror: () => resolve(url),
  };

  try {
    if (typeof runtime.GM?.xmlHttpRequest === 'function') {
      runtime.GM.xmlHttpRequest(request);
    } else if (typeof runtime.GM_xmlhttpRequest === 'function') {
      runtime.GM_xmlhttpRequest(request);
    } else {
      resolve(url);
    }
  } catch {
    resolve(url);
  }
  return promise;
}

export async function processEmojis(container: HTMLElement): Promise<void> {
  const emojiSvgPattern = /\/emoji\/v2\/svg\/([a-f0-9-]+)\.svg/i;
  container.querySelectorAll<HTMLImageElement>('img').forEach((image) => {
    const match = image.src.match(emojiSvgPattern);
    if (!match?.[1]) return;
    image.src = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${match[1]}.png`;
    image.className = 'twitter-long-image-emoji';
  });

  try {
    runtime.twemoji?.parse(container, {
      folder: '72x72',
      ext: '.png',
      base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/',
      className: 'twitter-long-image-emoji',
    });
  } catch (error) {
    console.warn('Emoji conversion skipped:', error);
  }

  const emojiImages = Array.from(
    container.querySelectorAll<HTMLImageElement>('img.twitter-long-image-emoji'),
  );
  await Promise.all(
    emojiImages.map(async (image) => {
      image.dataset.captureRole = 'emoji';
      image.src = await fetchImageAsDataURL(image.src);
    }),
  );
}

function cleanClonedNodeStyles(node: Node): void {
  if (node instanceof Element) {
    node.removeAttribute('style');
    node.removeAttribute('class');
    node.removeAttribute('data-testid');
    node.removeAttribute('role');
    node.removeAttribute('tabindex');
    node.removeAttribute('aria-label');
    node.classList.add('twitter-long-image-inline-node');
  }
  node.childNodes.forEach(cleanClonedNodeStyles);
}

function createCaptureImage(
  source: string,
  className: string,
  captureRole: string,
): HTMLImageElement | null {
  if (!source) return null;
  const image = document.createElement('img');
  image.src = source;
  image.crossOrigin = 'anonymous';
  image.className = className;
  image.dataset.captureRole = captureRole;
  return image;
}

async function renderSingleTweet(
  data: TweetData,
  isFocused: boolean,
  hasThreadLine: boolean,
): Promise<HTMLElement> {
  const container = document.createElement('section');
  container.className = `twitter-long-image-item${isFocused ? ' is-focused' : ''}`;

  if (hasThreadLine) {
    const line = document.createElement('div');
    line.className = 'twitter-long-image-thread-line';
    container.appendChild(line);
  }

  const header = document.createElement('header');
  header.className = 'twitter-long-image-header';
  const avatar = createCaptureImage(data.avatar, 'twitter-long-image-avatar', 'avatar');
  if (avatar) header.appendChild(avatar);

  const userInfo = document.createElement('div');
  userInfo.className = 'twitter-long-image-user-info';
  const topRow = document.createElement('div');
  topRow.className = 'twitter-long-image-top-row';

  const nameStrong = document.createElement('strong');
  nameStrong.className = 'twitter-long-image-name';
  if (data.nameNode) {
    cleanClonedNodeStyles(data.nameNode);
    nameStrong.appendChild(data.nameNode);
  }
  topRow.appendChild(nameStrong);

  if (!isFocused) {
    const handleAndTime = document.createElement('span');
    handleAndTime.className = 'twitter-long-image-handle-and-time';
    handleAndTime.textContent = [data.handle, data.time].filter(Boolean).join(' · ');
    if (handleAndTime.textContent) topRow.appendChild(handleAndTime);
    userInfo.appendChild(topRow);
  } else {
    userInfo.appendChild(topRow);
    if (data.handle) {
      const handle = document.createElement('div');
      handle.className = 'twitter-long-image-handle';
      handle.textContent = data.handle;
      userInfo.appendChild(handle);
    }
  }
  header.appendChild(userInfo);
  container.appendChild(header);

  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'twitter-long-image-content';

  if (data.tweetTextNode && isUsefulText(data.tweetTextNode.textContent)) {
    data.tweetTextNode.classList.add('twitter-long-image-text');
    contentWrapper.appendChild(data.tweetTextNode);
  }

  if (data.images.length > 0) {
    const imageStack = document.createElement('div');
    imageStack.className = 'twitter-long-image-media';
    data.images.forEach((source) => {
      const image = createCaptureImage(source, 'twitter-long-image-media-image', 'media');
      if (image) imageStack.appendChild(image);
    });
    if (imageStack.childElementCount > 0) contentWrapper.appendChild(imageStack);
  }

  if (data.quotedTweetData) {
    const quote = data.quotedTweetData;
    const quoteContainer = document.createElement('div');
    quoteContainer.className = 'twitter-long-image-quote';

    const quoteHeader = document.createElement('div');
    quoteHeader.className = 'twitter-long-image-quote-header';
    const quoteAvatar = createCaptureImage(
      quote.avatar,
      'twitter-long-image-quote-avatar',
      'quote-avatar',
    );
    if (quoteAvatar) quoteHeader.appendChild(quoteAvatar);

    const quoteUserInfo = document.createElement('div');
    quoteUserInfo.className = 'twitter-long-image-quote-user-info';
    const quoteName = document.createElement('strong');
    quoteName.className = 'twitter-long-image-quote-name';
    if (quote.nameNode) {
      cleanClonedNodeStyles(quote.nameNode);
      quoteName.appendChild(quote.nameNode);
    }
    quoteUserInfo.appendChild(quoteName);

    if (quote.handle) {
      const quoteHandle = document.createElement('span');
      quoteHandle.className = 'twitter-long-image-quote-handle';
      quoteHandle.textContent = quote.handle;
      quoteUserInfo.appendChild(quoteHandle);
    }
    if (quote.time) {
      const quoteTime = document.createElement('span');
      quoteTime.className = 'twitter-long-image-quote-time';
      quoteTime.textContent = ` · ${quote.time}`;
      quoteUserInfo.appendChild(quoteTime);
    }
    quoteHeader.appendChild(quoteUserInfo);
    quoteContainer.appendChild(quoteHeader);

    if (quote.tweetTextNode && isUsefulText(quote.tweetTextNode.textContent)) {
      quote.tweetTextNode.classList.add('twitter-long-image-quote-text');
      quoteContainer.appendChild(quote.tweetTextNode);
    }
    if (quote.images.length > 0) {
      const quoteImages = document.createElement('div');
      quoteImages.className = 'twitter-long-image-quote-images';
      quote.images.forEach((source) => {
        const image = createCaptureImage(source, 'twitter-long-image-quote-image', 'quote-media');
        if (image) quoteImages.appendChild(image);
      });
      if (quoteImages.childElementCount > 0) quoteContainer.appendChild(quoteImages);
    }
    contentWrapper.appendChild(quoteContainer);
  }

  container.appendChild(contentWrapper);
  container.appendChild(renderMetricsRow(data, isFocused));
  return container;
}

function createMetricElement(kind: (typeof VISIBLE_ENGAGEMENT_KINDS)[number], value: string): HTMLElement {
  const item = document.createElement('span');
  item.className = 'twitter-long-image-metric';
  item.dataset.metric = kind;
  item.setAttribute('aria-label', `${getEngagementLabel(kind, '')} ${value}`);
  item.innerHTML = ENGAGEMENT_ICON_SVGS[kind];
  const count = document.createElement('span');
  count.className = 'twitter-long-image-metric-count';
  count.textContent = value;
  item.appendChild(count);
  return item;
}

export function renderMetricsRow(data: TweetData, isFocused: boolean): HTMLElement {
  const row = document.createElement('div');
  row.className = 'twitter-long-image-metrics';
  if (isFocused && data.time) {
    const time = document.createElement('span');
    time.className = 'twitter-long-image-metrics-time';
    time.textContent = data.time;
    row.appendChild(time);
  }
  for (const kind of VISIBLE_ENGAGEMENT_KINDS) {
    row.appendChild(createMetricElement(kind, data.engagements[kind] || '0'));
  }
  return row;
}

export function getFocusedTweetIndex(
  tweetElements: HTMLElement[],
  currentTweet: HTMLElement,
  mainTweet: HTMLElement | null,
): number {
  const currentIndex = tweetElements.indexOf(currentTweet);
  if (currentIndex >= 0) return currentIndex;
  if (mainTweet) {
    const mainIndex = tweetElements.indexOf(mainTweet);
    if (mainIndex >= 0) return mainIndex;
  }
  return Math.max(tweetElements.length - 1, 0);
}

export async function createMultiTweetCanvas(
  tweetsData: TweetData[],
  isDetailPage: boolean,
  focusedIndex = isDetailPage ? tweetsData.length - 1 : -1,
): Promise<HTMLElement> {
  const mainContainer = document.createElement('div');
  mainContainer.className = 'twitter-long-image-capture';
  for (let index = 0; index < tweetsData.length; index += 1) {
    const isFocused = index === focusedIndex;
    const hasThreadLine = tweetsData.length > 1 && index < tweetsData.length - 1;
    mainContainer.appendChild(
      await renderSingleTweet(tweetsData[index], isFocused, hasThreadLine),
    );
  }
  await processEmojis(mainContainer);
  return mainContainer;
}

async function waitForFonts(): Promise<void> {
  if (!document.fonts?.ready) return;
  const { promise, resolve } = Promise.withResolvers<void>();
  window.setTimeout(resolve, 1_200);
  await Promise.race([document.fonts.ready.catch(() => undefined), promise]);
}

function waitForImage(image: HTMLImageElement): Promise<boolean> {
  const { promise, resolve } = Promise.withResolvers<boolean>();
  let settled = false;
  const finish = (loaded: boolean) => {
    if (settled) return;
    settled = true;
    window.clearTimeout(timeout);
    image.removeEventListener('load', onLoad);
    image.removeEventListener('error', onError);
    resolve(loaded);
  };
  const onLoad = () => finish(true);
  const onError = () => finish(false);
  const timeout = window.setTimeout(
    () => finish(image.complete && image.naturalWidth > 0),
    IMAGE_WAIT_TIMEOUT,
  );

  if (image.complete) {
    finish(image.naturalWidth > 0 || image.src.startsWith('data:'));
  } else {
    image.addEventListener('load', onLoad, { once: true });
    image.addEventListener('error', onError, { once: true });
  }
  return promise;
}

export async function waitForRenderReady(container: HTMLElement): Promise<string[]> {
  await waitForFonts();
  const images = Array.from(container.querySelectorAll<HTMLImageElement>('img'));
  const results = await Promise.all(images.map(waitForImage));
  const { promise, resolve } = Promise.withResolvers<void>();
  window.requestAnimationFrame(() =>
    window.requestAnimationFrame(() => resolve()),
  );
  await promise;

  return images
    .filter((_, index) => !results[index])
    .map((image) => image.dataset.captureRole || 'image');
}

export function getCaptureDimensions(
  element: HTMLElement,
  scale = EXPORT_SCALE,
): { width: number; height: number; pixels: number } {
  const rect = element.getBoundingClientRect();
  const cssWidth = Math.max(rect.width, element.scrollWidth || 0);
  const cssHeight = Math.max(rect.height, element.scrollHeight || 0);
  const width = Math.ceil(cssWidth * scale);
  const height = Math.ceil(cssHeight * scale);
  return { width, height, pixels: width * height };
}

export function assertCanvasWithinLimit(
  element: HTMLElement,
  scale = EXPORT_SCALE,
): void {
  const dimensions = getCaptureDimensions(element, scale);
  if (
    dimensions.width <= 0 ||
    dimensions.height <= 0 ||
    dimensions.width > MAX_CANVAS_SIDE ||
    dimensions.height > MAX_CANVAS_SIDE ||
    dimensions.pixels > MAX_CANVAS_PIXELS
  ) {
    throw new UserVisibleError(
      '连续推文太长，超过浏览器图片尺寸上限。请分段生成。',
      'This thread is too long for the browser image limit. Generate it in parts.',
    );
  }
}

class UserVisibleError extends Error {
  constructor(
    readonly zhMessage: string,
    readonly enMessage: string,
  ) {
    super(zhMessage);
    this.name = 'UserVisibleError';
  }
}

function setButtonBusy(button: HTMLButtonElement, isBusy: boolean): void {
  const language = getPageLanguage(document);
  const labels =
    language === 'zh'
      ? {
          ready: '生成推文长图',
          busy: '正在生成推文长图',
          readyTitle: '生成推文长图',
          busyTitle: '正在生成推文长图…',
        }
      : {
          ready: 'Generate long image',
          busy: 'Generating long image',
          readyTitle: 'Generate long image',
          busyTitle: 'Generating long image…',
        };
  button.classList.toggle('is-loading', isBusy);
  button.disabled = isBusy;
  button.setAttribute('aria-busy', String(isBusy));
  button.setAttribute('aria-label', isBusy ? labels.busy : labels.ready);
  button.title = isBusy ? labels.busyTitle : labels.readyTitle;
}

function getErrorMessage(error: unknown, language: PageLanguage): string {
  if (error instanceof UserVisibleError) {
    return language === 'zh' ? error.zhMessage : error.enMessage;
  }
  return language === 'zh'
    ? '生成失败：请确认推文内容和图片已经加载完整后再试。'
    : 'Generation failed. Make sure the post and its images are fully loaded, then try again.';
}

export function safeFileName(text: string): string {
  const cleaned = String(text || 'tweet')
    .replace(/^@/, '')
    .replace(/[\\/:*?"<>|]/g, '_')
    .trim();
  return cleaned || 'tweet';
}

function resolveTweetForButton(button: HTMLButtonElement): HTMLElement | null {
  return button.closest<HTMLElement>(TWEET_SELECTOR) || buttonOwners.get(button) || null;
}

export async function handleGenerateClick(event: Event): Promise<void> {
  event.preventDefault();
  event.stopPropagation();

  const button = event.currentTarget;
  if (!(button instanceof HTMLButtonElement) || button.classList.contains('is-loading')) return;

  const currentTweet = resolveTweetForButton(button);
  if (!currentTweet) return;

  setButtonBusy(button, true);
  const language = getPageLanguage(document);
  const isDetailPage = window.location.pathname.includes('/status/');
  let canvasContainer: HTMLElement | null = null;

  try {
    const tweetElements = collectThreadTweetElements(currentTweet, isDetailPage);
    const mainTweet = isDetailPage ? findDetailMainTweet() : null;
    const extracted = tweetElements
      .map((tweet) => ({
        tweet,
        data: extractTweetData(tweet, Boolean(mainTweet && tweet === mainTweet)),
      }))
      .filter((item): item is { tweet: HTMLElement; data: TweetData } => item.data !== null);
    const tweetsData = extracted.map((item) => item.data);
    if (tweetsData.length === 0) {
      throw new UserVisibleError(
        '未读取到推文内容，请等页面加载完成后重试。',
        'No post content was found. Wait for the page to finish loading and try again.',
      );
    }
    const focusedIndex = isDetailPage
      ? getFocusedTweetIndex(
          extracted.map((item) => item.tweet),
          currentTweet,
          mainTweet,
        )
      : -1;

    canvasContainer = await createMultiTweetCanvas(tweetsData, isDetailPage, focusedIndex);
    document.body.appendChild(canvasContainer);
    const failedImages = await waitForRenderReady(canvasContainer);
    if (failedImages.length > 0) {
      throw new UserVisibleError(
        '有图片加载失败，请确认图片已经加载完成后再试。',
        'Some images failed to load. Make sure the images are fully loaded and try again.',
      );
    }
    assertCanvasWithinLimit(canvasContainer);

    const capture = await snapdom(canvasContainer, {
      scale: EXPORT_SCALE,
      embedFonts: true,
      backgroundColor: '#ffffff',
    });
    const image = await capture.toPng();
    const dataUrl = image.src;
    if (!dataUrl) {
      throw new UserVisibleError(
        '没有生成有效图片，请稍后重试。',
        'No valid image was produced. Please try again later.',
      );
    }

    const fileTweet = tweetsData[focusedIndex >= 0 ? focusedIndex : tweetsData.length - 1];
    const link = document.createElement('a');
    link.download = `${safeFileName(fileTweet.handle)}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('推文长图生成失败:', error);
    const message = getErrorMessage(error, language);
    if (typeof window.alert === 'function') window.alert(message);
  } finally {
    canvasContainer?.remove();
    window.setTimeout(() => setButtonBusy(button, false), 500);
  }
}

function getActionGroupScore(group: Element): number {
  const values = [
    ...Array.from(group.querySelectorAll('[data-testid]')).map(
      (element) => element.getAttribute('data-testid') || '',
    ),
    ...Array.from(group.querySelectorAll('[aria-label]')).map(
      (element) => element.getAttribute('aria-label') || '',
    ),
  ];
  const text = values.join(' ');
  return ACTION_PATTERNS.reduce(
    (score, pattern) => score + (pattern.test(text) ? 1 : 0),
    0,
  );
}

export function findTweetActionGroup(
  node: HTMLElement,
  excluded: Element | null = null,
): HTMLElement | null {
  const candidates = Array.from(node.querySelectorAll<HTMLElement>('[role="group"]'))
    .filter(
      (group) =>
        group.closest(TWEET_SELECTOR) === node && !excluded?.contains(group),
    )
    .map((group) => ({ group, score: getActionGroupScore(group) }))
    .filter(({ score }) => score >= 2);

  candidates.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    return (
      right.group.getBoundingClientRect().top - left.group.getBoundingClientRect().top
    );
  });
  return candidates[0]?.group || null;
}

function getNativeActionItems(actionGroup: HTMLElement): HTMLElement[] {
  return Array.from(actionGroup.children).filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement &&
      !child.classList.contains('twitter-long-image-button-container'),
  );
}

function stripClonedCounts(button: HTMLElement): void {
  button
    .querySelectorAll('span, [data-testid*="count" i], [data-testid*="Count"]')
    .forEach((element) => {
      if (!element.querySelector('svg')) element.remove();
    });
  const visit = (node: Node): void => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        if (normalizeText(child.textContent)) child.remove();
        return;
      }
      visit(child);
    });
  };
  visit(button);
}

function createDownloadButton(
  nativeButton: HTMLElement | null,
  ownerTweet: HTMLElement,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = nativeButton?.className || '';
  button.classList.add('twitter-long-image-button');
  if (!nativeButton) button.classList.add('is-fallback');

  if (nativeButton) {
    button.innerHTML = nativeButton.innerHTML;
    button
      .querySelectorAll('[data-testid], [aria-label], [href], [role]')
      .forEach((element) => {
        element.removeAttribute('data-testid');
        element.removeAttribute('aria-label');
        element.removeAttribute('href');
        element.removeAttribute('role');
      });
    const svg = button.querySelector('svg');
    if (svg) svg.innerHTML = DOWNLOAD_ICON_PATH;
    else button.innerHTML = DOWNLOAD_ICON_SVG;
    stripClonedCounts(button);
  } else {
    button.innerHTML = DOWNLOAD_ICON_SVG;
  }

  buttonOwners.set(button, ownerTweet);
  setButtonBusy(button, false);
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    void handleGenerateClick(event);
  });
  button.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopPropagation();
    void handleGenerateClick(event);
  });
  return button;
}

export function appendLongImageButton(
  actionGroup: HTMLElement | null,
  ownerTweet: HTMLElement,
): void {
  if (!actionGroup) return;
  const existingButton = actionGroup.querySelector<HTMLButtonElement>(
    '.twitter-long-image-button',
  );
  if (existingButton) {
    buttonOwners.set(existingButton, ownerTweet);
    return;
  }

  const nativeItems = getNativeActionItems(actionGroup);
  const layoutSource = nativeItems[nativeItems.length - 1] || nativeItems[0] || null;
  const nativeButton =
    layoutSource?.querySelector<HTMLElement>('button, a[role="button"], [role="button"]') ||
    null;

  const container = document.createElement('div');
  if (layoutSource) container.className = layoutSource.className;
  container.classList.add('twitter-long-image-button-container');
  container.appendChild(createDownloadButton(nativeButton, ownerTweet));
  actionGroup.appendChild(container);
}

function injectButton(tweetElement: HTMLElement): void {
  appendLongImageButton(findTweetActionGroup(tweetElement), tweetElement);
}

function scanDetailActionBars(): void {
  if (!window.location.pathname.includes('/status/')) return;
  const mainTweet = findDetailMainTweet();
  if (!mainTweet) return;
  appendLongImageButton(findDetailActionGroup(mainTweet), mainTweet);
}

function scanTweets(): void {
  document.querySelectorAll<HTMLElement>(TWEET_SELECTOR).forEach(injectButton);
  scanDetailActionBars();
}

function scheduleScan(): void {
  if (scanTimer !== null) return;
  scanTimer = window.setTimeout(() => {
    scanTimer = null;
    scanTweets();
  }, 250);
}

function startObserver(): void {
  if (observerStarted || !document.body) return;
  observerStarted = true;
  const observer = new MutationObserver((mutations) => {
    if (
      mutations.some(
        (mutation) =>
          mutation.type === 'childList' ||
          (mutation.type === 'attributes' &&
            ['data-testid', 'aria-label', 'href'].includes(mutation.attributeName || '')),
      )
    ) {
      scheduleScan();
    }
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-testid', 'aria-label', 'href'],
  });
  window.addEventListener('popstate', scheduleScan);
  scanTweets();
}

export function install(): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const state = window as Window & {
    __twitterLongImageGeneratorInstalled?: boolean;
  };
  if (state.__twitterLongImageGeneratorInstalled) return;
  state.__twitterLongImageGeneratorInstalled = true;

  if (document.body) {
    startObserver();
  } else {
    document.addEventListener('DOMContentLoaded', startObserver, { once: true });
  }
}

if (typeof document !== 'undefined' && import.meta.env.MODE !== 'test') install();
