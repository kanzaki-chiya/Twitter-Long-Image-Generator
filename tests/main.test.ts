// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  appendLongImageButton,
  assertCanvasWithinLimit,
  cleanTextNode,
  collectThreadTweetElements,
  createMultiTweetCanvas,
  extractTweetData,
  findMainTextNode,
  findQuotedTweetWrapper,
  findTweetActionGroup,
  getFocusedTweetIndex,
  getHighResImageUrl,
  getPageLanguage,
  isComposerCell,
  isConversationBreak,
  processEmojis,
  isLikelyQuotedTweet,
  isUsefulText,
  waitForRenderReady,
} from '../src/main';

type TweetFixtureOptions = {
  id: string;
  handle: string;
  text?: string;
  connector?: boolean;
  images?: string[];
  actions?: string[];
};

function makeTweet(options: TweetFixtureOptions): {
  cell: HTMLDivElement;
  article: HTMLElement;
} {
  const cell = document.createElement('div');
  cell.dataset.testid = 'cellInnerDiv';
  if (options.connector) cell.className = 'r-1canivw';

  const article = document.createElement('article');
  article.dataset.testid = 'tweet';
  article.innerHTML = `
    <div data-testid="User-Name">
      <a href="https://x.com/${options.handle}"><div><span>显示名称</span></div></a>
      <span>@${options.handle}</span>
    </div>
    <a href="https://x.com/${options.handle}/status/${options.id}"><time>Jan 1</time></a>
    <div data-testid="tweetText" lang="zh">${options.text ?? ''}</div>
  `;
  const actionGroup = document.createElement('div');
  actionGroup.setAttribute('role', 'group');
  actionGroup.innerHTML = (options.actions ?? ['Reply', 'Repost', 'Like'])
    .map((label) => `<button aria-label="${label}"></button>`)
    .join('');
  article.appendChild(actionGroup);

  for (const source of options.images ?? []) {
    const photo = document.createElement('div');
    photo.dataset.testid = 'tweetPhoto';
    const image = document.createElement('img');
    image.src = source;
    photo.appendChild(image);
    article.appendChild(photo);
  }

  cell.appendChild(article);
  return { cell, article };
}

beforeEach(() => {
  document.body.innerHTML = '';
  document.documentElement.lang = 'zh';
  history.replaceState(null, '', '/');
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => callback(0));
});

describe('推文内容提取', () => {
  it('保留普通文字、纯数字、单字和单个符号', () => {
    expect(isUsefulText('正常文字')).toBe(true);
    expect(isUsefulText('123')).toBe(true);
    expect(isUsefulText('中')).toBe(true);
    expect(isUsefulText('!')).toBe(true);
    expect(isUsefulText('Show more')).toBe(false);
  });

  it('保留正常正文，只删除精确匹配的更多和翻译控件', () => {
    const node = document.createElement('div');
    node.innerHTML = '正文里的显示更多文字<button>显示更多</button><a href="/translate">Translate Tweet</a>';
    const cleaned = cleanTextNode(node);
    expect(cleaned?.textContent).toContain('正文里的显示更多文字');
    expect(cleaned?.textContent).not.toContain('Translate Tweet');
  });

  it('读取一张和多张图片并切换到原图地址', () => {
    const { article } = makeTweet({
      id: '1',
      handle: 'writer',
      text: '图片推文',
      images: [
        'https://pbs.twimg.com/media/one.jpg?name=small',
        'https://pbs.twimg.com/media/two.jpg?name=large',
      ],
    });
    const data = extractTweetData(article);
    expect(data?.images).toHaveLength(2);
    expect(data?.images.every((source) => source.includes('name=orig'))).toBe(true);
  });

  it('读取表情正文，并把旧版表情 SVG 转到 PNG 地址', async () => {
    const { article } = makeTweet({ id: '2', handle: 'emoji', text: '😀' });
    const text = findMainTextNode(article, null);
    expect(text?.textContent).toBe('😀');

    const container = document.createElement('div');
    const image = document.createElement('img');
    image.src = 'https://abs-0.twimg.com/emoji/v2/svg/1f600.svg';
    container.appendChild(image);
    await processEmojis(container);
    expect(image.src).toContain('/72x72/1f600.png');
  });

  it('从每条推文自己的操作区读取并显示互动数据', async () => {
    const first = makeTweet({
      id: '20',
      handle: 'first',
      text: '第一条',
      actions: [
        '12 回复。回复',
        '3 转发。转发',
        '4.5万 喜欢。喜欢',
        '0 书签',
        '1.2亿 浏览量',
      ],
    });
    const second = makeTweet({
      id: '21',
      handle: 'second',
      text: '第二条',
      actions: ['7 Replies. Reply', '8 Reposts. Repost', '9,001 Likes. Like'],
    });

    const firstData = extractTweetData(first.article);
    const secondData = extractTweetData(second.article);
    expect(firstData?.engagements).toEqual({
      replies: '12',
      reposts: '3',
      likes: '4.5万',
      bookmarks: '0',
      views: '1.2亿',
    });
    expect(secondData?.engagements).toEqual({
      replies: '7',
      reposts: '8',
      likes: '9,001',
    });

    const canvas = await createMultiTweetCanvas([firstData!, secondData!], false);
    const rows = canvas.querySelectorAll('.twitter-long-image-metrics');
    expect(rows).toHaveLength(2);
    expect(rows[0].querySelectorAll('svg')).toHaveLength(4);
    expect(rows[0].querySelector('[data-metric="replies"]')?.textContent).toBe('12');
    expect(rows[0].querySelector('[data-metric="reposts"]')?.textContent).toBe('3');
    expect(rows[0].querySelector('[data-metric="likes"]')?.textContent).toBe('4.5万');
    expect(rows[0].querySelector('[data-metric="likes"] path')?.getAttribute('d')).toContain(
      '8.379 7.67',
    );
    expect(rows[0].querySelector('[data-metric="views"]')?.textContent).toBe('1.2亿');
    expect(rows[0].textContent).not.toMatch(/评论|转发|点赞|浏览/);
    expect(rows[1].querySelector('[data-metric="likes"]')?.textContent).toBe('9,001');
    expect(rows[1].querySelector('[data-metric="views"]')?.textContent).toBe('0');
  });

  it('繁体详情页使用独立操作区，日期和观看量只显示一次', async () => {
    document.documentElement.lang = 'zh-TW';
    const { article } = makeTweet({
      id: '22',
      handle: 'detail',
      text: '详情正文',
    });
    document.body.appendChild(article);
    Object.defineProperty(article, 'getBoundingClientRect', {
      value: () => ({ bottom: 200 } as DOMRect),
    });
    const detailActions = document.createElement('div');
    detailActions.setAttribute('role', 'group');
    detailActions.setAttribute(
      'aria-label',
      '1 則回覆、2 次轉發、3 個喜歡、27 個書籤、4K 次觀看',
    );
    detailActions.innerHTML = `
      <button aria-label="1 則回覆。回覆"></button>
      <button aria-label="2 次轉發。轉發"></button>
      <button aria-label="3 個喜歡。喜歡"></button>
      <button aria-label="書籤"></button>
      <a aria-label="4K 次查看。查看貼文分析"></a>
    `;
    Object.defineProperty(detailActions, 'getBoundingClientRect', {
      value: () => ({ width: 420, height: 40, top: 210 } as DOMRect),
    });
    document.body.appendChild(detailActions);

    const data = extractTweetData(article, true);
    expect(data?.engagements).toEqual({
      replies: '1',
      reposts: '2',
      likes: '3',
      bookmarks: '27',
      views: '4K',
    });
    const canvas = await createMultiTweetCanvas([data!], true);
    const metrics = canvas.querySelector('.twitter-long-image-metrics');
    expect(metrics?.querySelector('.twitter-long-image-metrics-time')?.textContent).toBe(
      'Jan 1',
    );
    expect(metrics?.querySelectorAll('svg')).toHaveLength(4);
    expect(metrics?.querySelector('[data-metric="replies"]')?.textContent).toBe('1');
    expect(metrics?.querySelector('[data-metric="reposts"]')?.textContent).toBe('2');
    expect(metrics?.querySelector('[data-metric="likes"]')?.textContent).toBe('3');
    expect(metrics?.querySelector('[data-metric="views"]')?.textContent).toBe('4K');
    expect(metrics?.textContent).not.toMatch(/回覆|轉發|喜歡|觀看/);
    expect(canvas.textContent?.match(/4K/g)).toHaveLength(1);
  });
});

function makeComposerCell(): HTMLDivElement {
  const cell = document.createElement('div');
  cell.dataset.testid = 'cellInnerDiv';
  cell.innerHTML = `
    <div data-testid="tweetTextarea_0">發佈你的回覆</div>
    <div data-testid="toolBar"></div>
  `;
  return cell;
}

function makeDiscoverMoreCell(): HTMLDivElement {
  const cell = document.createElement('div');
  cell.dataset.testid = 'cellInnerDiv';
  cell.innerHTML = '<h2>Discover more</h2>';
  return cell;
}

describe('连续推文和引用推文', () => {
  it('详情页收集整段可见对话，不限制同一作者', () => {
    history.replaceState(null, '', '/writer/status/3');
    const first = makeTweet({ id: '1', handle: 'writer', text: '第一条', connector: true });
    const second = makeTweet({ id: '2', handle: 'writer', text: '第二条', connector: true });
    const main = makeTweet({ id: '3', handle: 'writer', text: '第三条' });
    document.body.append(first.cell, second.cell, main.cell);

    expect(collectThreadTweetElements(main.article, true)).toEqual([
      first.article,
      second.article,
      main.article,
    ]);
  });

  it('详情页把不同作者的回复也收进同一条对话链', () => {
    history.replaceState(null, '', '/teortaxesTex/status/10');
    const parent = makeTweet({
      id: '10',
      handle: 'teortaxesTex',
      text: 'You fools need to stop using it',
      connector: true,
    });
    const reply = makeTweet({
      id: '11',
      handle: 'flrande',
      text: 'Calm down bro, I know more DS employees than you',
    });
    document.body.append(parent.cell, reply.cell);

    expect(collectThreadTweetElements(reply.article, true)).toEqual([
      parent.article,
      reply.article,
    ]);
    expect(collectThreadTweetElements(parent.article, true)).toEqual([parent.article]);
  });

  it('点回复时只带上这条回复的父推，不带上中间无关回复', () => {
    history.replaceState(null, '', '/flrande/status/20');
    const original = makeTweet({
      id: '20',
      handle: 'flrande',
      text: '似曾相识，为了保证质量给模型塞一堆特调数据',
    });
    const sibling = makeTweet({
      id: '21',
      handle: 'teortaxesTex',
      text: 'You fools need to stop using it',
    });
    const later = makeTweet({
      id: '22',
      handle: 'flrande',
      text: 'Calm down bro, I know more DS employees than you',
    });
    document.body.append(original.cell, sibling.cell, later.cell);

    expect(collectThreadTweetElements(sibling.article, true)).toEqual([
      original.article,
      sibling.article,
    ]);
    expect(collectThreadTweetElements(original.article, true)).toEqual([original.article]);
    expect(collectThreadTweetElements(later.article, true)).toEqual([
      original.article,
      later.article,
    ]);
  });

  it('点普通回复时只收原推和这一条，不收中间旁支', () => {
    history.replaceState(null, '', '/arkuy99/status/100');
    const original = makeTweet({ id: '100', handle: 'arkuy99', text: '原推' });
    const sibling = makeTweet({ id: '101', handle: 'ashfold', text: '旁支回复' });
    const ad = makeTweet({ id: '102', handle: 'XBusiness', text: '广告' });
    const reply = makeTweet({ id: '104', handle: 'ps_urine', text: '原生，安装包40MB左右' });
    document.body.append(original.cell, sibling.cell, ad.cell, reply.cell);

    expect(collectThreadTweetElements(reply.article, true)).toEqual([
      original.article,
      reply.article,
    ]);
  });

  it('点回复中的回复时带上原推、直接父回复和这一条', () => {
    history.replaceState(null, '', '/arkuy99/status/100');
    const original = makeTweet({ id: '100', handle: 'arkuy99', text: '原推' });
    const sansi = makeTweet({ id: '103', handle: '3an3i', text: '看看这个' });
    const parent = makeTweet({
      id: '105',
      handle: 'jiax031010',
      text: '20M是因为discord最大上传改成了20吗',
      connector: true,
    });
    const nested = makeTweet({
      id: '106',
      handle: 'arkuy99',
      text: '被你发现了 便于分发',
    });
    document.body.append(original.cell, sansi.cell, parent.cell, nested.cell);

    expect(collectThreadTweetElements(nested.article, true)).toEqual([
      original.article,
      parent.article,
      nested.article,
    ]);
    expect(collectThreadTweetElements(parent.article, true)).toEqual([
      original.article,
      parent.article,
    ]);
    expect(collectThreadTweetElements(sansi.article, true)).toEqual([
      original.article,
      sansi.article,
    ]);
  });

  it('页面把祖先倒序插在 DOM 里时，仍按屏幕从上到下输出', () => {
    history.replaceState(null, '', '/cillian/status/2');
    const original = makeTweet({
      id: '1',
      handle: 'arkuy99',
      text: '我需要一个 macOS native 的 markdown',
      connector: true,
    });
    const parent = makeTweet({
      id: '2',
      handle: 'CillianArcher',
      text: '@grok 上吧',
      connector: true,
    });
    const reply = makeTweet({
      id: '3',
      handle: 'grok',
      text: '现成的就有，MDViewer Lite',
    });
    document.body.append(parent.cell, original.cell, reply.cell);
    Object.defineProperty(original.cell, 'getBoundingClientRect', {
      value: () => ({ top: 0, bottom: 80 } as DOMRect),
    });
    Object.defineProperty(parent.cell, 'getBoundingClientRect', {
      value: () => ({ top: 80, bottom: 160 } as DOMRect),
    });
    Object.defineProperty(reply.cell, 'getBoundingClientRect', {
      value: () => ({ top: 160, bottom: 240 } as DOMRect),
    });

    expect(collectThreadTweetElements(reply.article, true)).toEqual([
      original.article,
      parent.article,
      reply.article,
    ]);
  });

  it('即使祖先在 DOM 里是倒序，也按推文时间从旧到新排', () => {
    history.replaceState(null, '', '/CillianArcher/status/200');
    const original = makeTweet({
      id: '100',
      handle: 'arkuy99',
      text: '我需要一个 macOS native 的 markdown',
      connector: true,
    });
    const parent = makeTweet({
      id: '200',
      handle: 'CillianArcher',
      text: '@grok 上吧',
      connector: true,
    });
    const reply = makeTweet({
      id: '300',
      handle: 'grok',
      text: '现成的就有，MDViewer Lite',
    });
    document.body.append(parent.cell, original.cell, reply.cell);

    expect(collectThreadTweetElements(reply.article, true)).toEqual([
      original.article,
      parent.article,
      reply.article,
    ]);
  });

  it('点回复的回复的回复时，沿父子链一直收到原推', () => {
    history.replaceState(null, '', '/arkuy99/status/100');
    const original = makeTweet({ id: '100', handle: 'arkuy99', text: '原推' });
    const sibling = makeTweet({ id: '101', handle: '3an3i', text: '旁支' });
    const level1 = makeTweet({
      id: '110',
      handle: 'jiax031010',
      text: '一级回复',
      connector: true,
    });
    const level2 = makeTweet({
      id: '111',
      handle: 'other',
      text: '回复的回复',
      connector: true,
    });
    const level3 = makeTweet({
      id: '112',
      handle: 'arkuy99',
      text: '回复的回复的回复',
    });
    document.body.append(
      original.cell,
      sibling.cell,
      level1.cell,
      level2.cell,
      level3.cell,
    );

    expect(collectThreadTweetElements(level3.article, true)).toEqual([
      original.article,
      level1.article,
      level2.article,
      level3.article,
    ]);
    expect(collectThreadTweetElements(level2.article, true)).toEqual([
      original.article,
      level1.article,
      level2.article,
    ]);
    expect(collectThreadTweetElements(sibling.article, true)).toEqual([
      original.article,
      sibling.article,
    ]);
  });

  it('详情页会跳过中间的回复输入框，直接接到原推', () => {
    history.replaceState(null, '', '/flrande/status/20');
    const original = makeTweet({
      id: '20',
      handle: 'flrande',
      text: '似曾相识，为了保证质量给模型塞一堆特调数据',
    });
    const firstReply = makeTweet({
      id: '21',
      handle: 'teortaxesTex',
      text: 'You fools need to stop using it',
    });
    const composer = makeComposerCell();
    const secondReply = makeTweet({
      id: '22',
      handle: 'flrande',
      text: 'Calm down bro, I know more DS employees than you',
    });
    document.body.append(original.cell, firstReply.cell, composer, secondReply.cell);

    expect(isComposerCell(composer)).toBe(true);
    expect(collectThreadTweetElements(secondReply.article, true)).toEqual([
      original.article,
      secondReply.article,
    ]);
  });

  it('遇到 Discover more 一类分区后停止，不把推荐内容收进对话链', () => {
    history.replaceState(null, '', '/writer/status/1');
    const conversation = makeTweet({ id: '1', handle: 'writer', text: '对话正文' });
    const reply = makeTweet({ id: '2', handle: 'other', text: '回复' });
    const discover = makeDiscoverMoreCell();
    const suggested = makeTweet({ id: '9', handle: 'random', text: '推荐推文' });
    document.body.append(conversation.cell, reply.cell, discover, suggested.cell);

    expect(isConversationBreak(discover)).toBe(true);
    expect(collectThreadTweetElements(reply.article, true)).toEqual([
      conversation.article,
      reply.article,
    ]);
    expect(collectThreadTweetElements(conversation.article, true)).toEqual([
      conversation.article,
    ]);
  });

  it('非详情页只导出当前这一条', () => {
    const first = makeTweet({ id: '1', handle: 'writer', text: '第一条', connector: true });
    const main = makeTweet({ id: '3', handle: 'writer', text: '当前内容' });
    document.body.append(first.cell, main.cell);

    expect(collectThreadTweetElements(main.article, false)).toEqual([main.article]);
  });

  it('主栏里隔了一层包装节点也能收集完整对话', () => {
    history.replaceState(null, '', '/teortaxesTex/status/40');
    const column = document.createElement('div');
    column.dataset.testid = 'primaryColumn';
    const parent = makeTweet({
      id: '40',
      handle: 'teortaxesTex',
      text: 'You fools need to stop using it',
      connector: true,
    });
    const reply = makeTweet({
      id: '41',
      handle: 'flrande',
      text: 'Calm down bro',
    });
    const wrapA = document.createElement('div');
    const wrapB = document.createElement('div');
    wrapA.appendChild(parent.cell);
    wrapB.appendChild(reply.cell);
    column.append(wrapA, wrapB);
    document.body.appendChild(column);

    expect(collectThreadTweetElements(reply.article, true)).toEqual([
      parent.article,
      reply.article,
    ]);
  });

  it('引用推文只接受带作者、状态链接和正文或图片的卡片', () => {
    const ordinaryCard = document.createElement('div');
    ordinaryCard.dataset.testid = 'card.wrapper';
    ordinaryCard.setAttribute('role', 'link');
    ordinaryCard.setAttribute('tabindex', '0');
    ordinaryCard.innerHTML = '<a href="https://example.com">普通链接图片卡片</a><img src="https://pbs.twimg.com/media/card.jpg">';
    expect(isLikelyQuotedTweet(ordinaryCard)).toBe(false);

    const quote = document.createElement('div');
    quote.dataset.testid = 'card.wrapper';
    quote.setAttribute('role', 'link');
    quote.setAttribute('tabindex', '0');
    quote.innerHTML = `
      <div data-testid="User-Name"><a href="https://x.com/quoted"><div><span>被引用用户</span></div></a><span>@quoted</span></div>
      <a href="https://x.com/quoted/status/88"><time>Feb 2</time></a>
      <div data-testid="tweetText">被引用正文</div>
    `;
    expect(isLikelyQuotedTweet(quote)).toBe(true);

    const outer = document.createElement('article');
    outer.dataset.testid = 'tweet';
    outer.append(quote);
    expect(findQuotedTweetWrapper(outer)).toBe(quote);
  });

  it('父推和回复之间画头像连线，焦点在点到的那条回复', async () => {
    const parent = makeTweet({
      id: '30',
      handle: '3an3i',
      text: '看看这个',
      connector: true,
    });
    const reply = makeTweet({
      id: '31',
      handle: 'arkuy99',
      text: '刚下载看了 webview',
    });
    document.body.append(parent.cell, reply.cell);

    expect(getFocusedTweetIndex([parent.article, reply.article], reply.article, parent.article)).toBe(
      1,
    );

    const parentData = extractTweetData(parent.article);
    const replyData = extractTweetData(reply.article, true);
    const canvas = await createMultiTweetCanvas([parentData!, replyData!], true, 1);
    const items = canvas.querySelectorAll('.twitter-long-image-item');
    expect(items).toHaveLength(2);
    expect(items[0].classList.contains('is-focused')).toBe(false);
    expect(items[1].classList.contains('is-focused')).toBe(true);
    expect(items[0].querySelector('.twitter-long-image-thread-line')).not.toBeNull();
    expect(items[1].querySelector('.twitter-long-image-thread-line')).toBeNull();
    expect(
      items[1].querySelector('.twitter-long-image-metrics-time')?.textContent,
    ).toBe('Jan 1');
    expect(items[0].querySelector('.twitter-long-image-metrics-time')).toBeNull();
    expect(items[1].querySelectorAll('.twitter-long-image-metric svg')).toHaveLength(4);
  });
});

describe('按钮和导出边界', () => {
  it('下载按钮单独占一列，加在分享后面，原有按钮顺序不变', () => {
    const { article } = makeTweet({ id: '6', handle: 'writer', text: '按钮位置' });
    const group = findTweetActionGroup(article);
    expect(group).not.toBeNull();
    group!.innerHTML = `
      <div class="flex-grow reply"><button class="native-reply" aria-label="10 Replies. Reply"><svg class="native-icon" viewBox="0 0 24 24"><path d="M1"></path></svg><span>10</span></button></div>
      <div class="flex-grow repost"><button aria-label="Repost"></button></div>
      <div class="flex-grow like"><button aria-label="Like"></button></div>
      <div class="flex-grow views"><button aria-label="Views"></button></div>
      <div class="bookmark"><button aria-label="Bookmark"></button></div>
      <div class="share"><button class="native-share" aria-label="Share"><svg class="native-icon" viewBox="0 0 24 24"><path d="M1"></path></svg><span>10</span></button></div>
    `;
    appendLongImageButton(group, article);
    const children = Array.from(group!.children);
    expect(children.map((child) => child.className)).toEqual([
      'flex-grow reply',
      'flex-grow repost',
      'flex-grow like',
      'flex-grow views',
      'bookmark',
      'share',
      'share twitter-long-image-button-container',
    ]);
    const download = group!.querySelector(':scope > .twitter-long-image-button-container .twitter-long-image-button');
    expect(download).not.toBeNull();
    expect(
      group!.querySelector('.share:not(.twitter-long-image-button-container) .twitter-long-image-button'),
    ).toBeNull();
    expect(download?.classList.contains('native-share')).toBe(true);
    expect(download?.querySelector('svg')?.classList.contains('native-icon')).toBe(true);
    expect(download?.textContent?.trim()).toBe('');
    expect(download?.querySelector('span')).toBeNull();
  });

  it('详情页没有观看按钮时，下载按钮也单独占最后一列', () => {
    const { article } = makeTweet({ id: '7', handle: 'writer', text: '详情操作栏' });
    const group = findTweetActionGroup(article);
    expect(group).not.toBeNull();
    group!.innerHTML = `
      <div class="reply"><button aria-label="Reply"></button></div>
      <div class="repost"><button aria-label="Repost"></button></div>
      <div class="like"><button aria-label="Like"></button></div>
      <div class="bookmark"><button aria-label="Bookmark"></button></div>
      <div class="share"><button aria-label="Share"></button></div>
    `;
    appendLongImageButton(group, article);
    expect(group!.children).toHaveLength(6);
    expect(group!.lastElementChild?.classList.contains('twitter-long-image-button-container')).toBe(true);
    expect(
      group!.querySelector('.share:not(.twitter-long-image-button-container) .twitter-long-image-button'),
    ).toBeNull();
  });

  it('找不到明确操作区时返回空，不挂到最后一个相似区域', () => {
    const { article } = makeTweet({ id: '4', handle: 'writer', text: '按钮测试' });
    const groups = article.querySelectorAll('[role="group"]');
    groups[0].innerHTML = '<button aria-label="More"></button>';
    expect(findTweetActionGroup(article)).toBeNull();
  });

  it('图片失败时返回失败角色，超长内容抛出清楚提示', async () => {
    const container = document.createElement('div');
    const image = document.createElement('img');
    image.dataset.captureRole = 'media';
    Object.defineProperty(image, 'complete', { configurable: true, value: true });
    Object.defineProperty(image, 'naturalWidth', { configurable: true, value: 0 });
    container.appendChild(image);
    expect(await waitForRenderReady(container)).toEqual(['media']);

    const tooLong = document.createElement('div');
    Object.defineProperty(tooLong, 'scrollWidth', { configurable: true, value: 650 });
    Object.defineProperty(tooLong, 'scrollHeight', { configurable: true, value: 100_000 });
    tooLong.getBoundingClientRect = () =>
      ({ width: 650, height: 100_000 } as DOMRect);
    expect(() => assertCanvasWithinLimit(tooLong)).toThrow('连续推文太长');
  });

  it('中文和英文页面都提供对应的语言判断', () => {
    document.documentElement.lang = 'zh-CN';
    expect(getPageLanguage(document)).toBe('zh');
    document.documentElement.lang = 'en';
    expect(getPageLanguage(document)).toBe('en');
  });

  it('缺少正文时不伪造可导出的推文数据', () => {
    const { article } = makeTweet({ id: '5', handle: 'empty', text: '' });
    expect(extractTweetData(article)).toBeNull();
    expect(getHighResImageUrl('https://pbs.twimg.com/media/a.jpg?name=small')).toContain(
      'name=orig',
    );
  });
});
