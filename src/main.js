// 这里是关键！我们像写普通前端项目一样引入 snapdom
// 打包时，Vite 会把这个库的源码直接塞进最终的脚本里
import snapdom from '@zumer/snapdom';

(function() {
    'use strict';

    // 注意：GM_addStyle 等函数在 vite-plugin-monkey 里会自动处理
    GM_addStyle(`
        article[data-testid="tweet"] [role="group"] { display: flex !important; justify-content: space-between !important; width: 100% !important; }
        article[data-testid="tweet"] [role="group"] > div { flex: 1 !important; display: flex !important; align-items: center !important; justify-content: center !important; margin: 0 !important; max-width: none !important; }
        .tweet-to-image-btn-container { display: flex; align-items: center; justify-content: center; margin-left: auto !important; min-width: 36px; height: 36px; }
        .tweet-to-image-btn { cursor: pointer; padding: 8px; border-radius: 50%; transition: background-color 0.2s; display: flex; align-items: center; justify-content: center; color: rgb(113, 118, 123); }
        .tweet-to-image-btn:hover { background-color: rgba(29, 155, 240, 0.1); color: rgba(29, 155, 240); }
        .tweet-to-image-btn.loading { cursor: not-allowed; color: #ccc; }
        .tweet-to-image-btn svg { width: 20px; height: 20px; fill: currentColor; }
        
        /* 引用推文容器 */
        .quoted-tweet-container { border: 1px solid #cfd9de !important; border-radius: 12px !important; margin-top: 12px !important; padding: 12px !important; display: flex !important; flex-direction: column !important; gap: 8px !important; background-color: #ffffff !important; box-shadow: none !important; width: auto !important; }
        .quoted-tweet-header { display: flex !important; align-items: flex-start !important; flex-wrap: nowrap !important; }
        .quoted-tweet-avatar { width: 20px !important; height: 20px !important; border-radius: 50% !important; margin-right: 6px !important; flex-shrink: 0 !important; }
        .quoted-tweet-user-info { display: flex !important; flex-direction: column !important; justify-content: center !important; font-size: 15px !important; line-height: 1.4 !important; min-width: 0 !important; }
        
        /* 核心修复：强制文字换行和布局 */
        .quoted-tweet-user-info strong { font-weight: 700 !important; color: #0f1419 !important; white-space: normal !important; word-break: break-word !important; display: block !important; }
        .quoted-tweet-user-info span.user-handle { color: #536471 !important; font-weight: 400 !important; font-size: 14px !important; white-space: normal !important; word-break: break-all !important; display: block !important; margin-top: 2px !important; }
        
        .tweet-time-nowrap { white-space: nowrap !important; }
        .quoted-tweet-text { font-size: 15px !important; line-height: 1.5 !important; color: #0f1419 !important; margin-top: 4px !important; white-space: pre-wrap !important; overflow-wrap: break-word !important; word-break: break-word !important; }
        .quoted-tweet-images { display: flex !important; flex-direction: column !important; gap: 2px !important; margin-top: 8px !important; border-radius: 12px !important; overflow: hidden !important; border: 1px solid #cfd9de !important; }
        .quoted-tweet-images img { width: 100% !important; display: block !important; }
        img.emoji-unified { height: 1.2em !important; width: 1.2em !important; margin: 0 0.1em !important; vertical-align: -0.2em !important; display: inline-block !important; background-color: transparent !important; }
        .thread-line { position: absolute; left: 47px; top: 72px; width: 2px; bottom: 0; background-color: #cfd9de; z-index: 0; }
    `);

    const downloadIconSVG = `<svg viewBox="0 0 24 24"><g><path d="M3 19.5c0 .83.67 1.5 1.5 1.5h15c.83 0 1.5-.67 1.5-1.5v-6.5h-2v6.5h-15v-6.5h-2v6.5zM10.46 13.07l-3.54-3.54-1.42 1.42L12 17.41l6.5-6.46-1.42-1.42-3.54 3.54V3h-2v10.07z"></path></g></svg>`;

    function fetchImageAsDataURL(url) {
        return new Promise((resolve) => {
            if (url.startsWith('data:')) return resolve(url);
            const requestParams = {
                method: 'GET', url: url, responseType: 'blob',
                onload: (res) => {
                    if (res.status !== 200) return resolve(url);
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = () => resolve(url);
                    reader.readAsDataURL(res.response);
                },
                onerror: () => resolve(url)
            };
            if (typeof GM !== 'undefined' && typeof GM.xmlHttpRequest === 'function') GM.xmlHttpRequest(requestParams);
            else if (typeof GM_xmlhttprequest === 'function') GM_xmlhttprequest(requestParams);
            else resolve(url);
        });
    }

    function getHighResImageUrl(src) {
        try {
            const url = new URL(src);
            if (url.hostname === 'pbs.twimg.com' && url.pathname.startsWith('/media/')) {
                url.searchParams.set('name', 'orig');
                return url.href;
            }
            return src;
        } catch (e) { return src; }
    }

    async function handleGenerateClick(event) {
        event.preventDefault(); event.stopPropagation();
        const button = event.currentTarget;
        if (button.classList.contains('loading')) return;
        const currentTweet = button.closest('article[data-testid="tweet"]');
        if (!currentTweet) return;

        button.style.opacity = '0.5'; button.classList.add('loading');

        try {
            const tweetElementsToProcess = [];
            const currentCell = currentTweet.closest('div[data-testid="cellInnerDiv"]');
            const isDetailPage = window.location.pathname.includes('/status/');

            if (currentCell && isDetailPage) {
                let prevCell = currentCell.previousElementSibling;
                let count = 0;
                const parents = [];
                while (prevCell && count < 50) {
                    const parentTweet = prevCell.querySelector('article[data-testid="tweet"]');
                    if (parentTweet && (prevCell.querySelector('.r-1canivw') || prevCell.querySelector('.r-1rnoaur') || isDetailPage)) {
                          parents.unshift(parentTweet);
                    } else {
                          if (!isDetailPage) break;
                          if (!parentTweet && prevCell.offsetHeight > 50) break;
                    }
                    prevCell = prevCell.previousElementSibling;
                    count++;
                }
                tweetElementsToProcess.push(...parents);
            }
            tweetElementsToProcess.push(currentTweet);

            const tweetsData = [];
            for (let i = 0; i < tweetElementsToProcess.length; i++) {
                const isMain = isDetailPage && (i === tweetElementsToProcess.length - 1);
                tweetsData.push(extractTweetData(tweetElementsToProcess[i], isMain));
            }

            const validData = tweetsData.filter(d => d !== null);
            if (validData.length === 0) throw new Error("数据提取失败");

            const canvasContainer = await createMultiTweetCanvas(validData, isDetailPage);
            document.body.appendChild(canvasContainer);
            await new Promise(r => setTimeout(r, 800));

            const snap = await snapdom(canvasContainer, {
                scale: 3,
                useProxy: false
            });
            const imgElement = await snap.toPng();
            const dataUrl = imgElement.src;

            const link = document.createElement('a');
            link.download = `${validData[validData.length-1].handle.replace('@','')}-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
            document.body.removeChild(canvasContainer);
        } catch (err) {
            console.error('生成出错:', err);
            alert('生成失败，请按F12查看控制台。');
        } finally {
            setTimeout(() => { if (button) { button.style.opacity = '1'; button.classList.remove('loading'); } }, 1000);
        }
    }

    function cleanTextNode(node) {
        if (!node) return null;
        const clonedNode = node.cloneNode(true);
        clonedNode.querySelectorAll('a[href*="/i/timeline/explore_modes"], a[href*="/translate"]').forEach(el => el.remove());
        const junkTexts = ['显示更多', '顯示更多', 'Show more', '翻译推文', '翻譯推文', 'Translate post'];
        clonedNode.querySelectorAll('a, span[role="button"], div[role="button"], button, span').forEach(el => {
            if (junkTexts.includes(el.textContent.trim())) el.remove();
        });
        return clonedNode;
    }

    function extractTweetData(tweetElement, isDetailPageMain = false) {
        try {
            const quotedTweetWrapper = tweetElement.querySelector('[data-testid="card.wrapper"], div[role="link"][tabindex="0"]');
            let time = '', views = '';

            if (isDetailPageMain) {
                const infoRow = tweetElement.querySelector('a[href*="/status/"] time')?.closest('div[dir="ltr"]')?.parentElement;
                if (infoRow) {
                     time = infoRow.querySelector('time')?.textContent || '';
                     const allSpans = infoRow.querySelectorAll('span');
                     for (let span of allSpans) {
                         const text = span.textContent.trim();
                         if (/^[\d,.]/.test(text) && (text.includes('查看') || text.includes('Views'))) {
                             views = text; break;
                         }
                     }
                }
            }

            if (!time) {
                 const userNameDiv = tweetElement.querySelector('[data-testid="User-Name"]');
                 let headerRow = userNameDiv?.parentElement;
                 if (headerRow && !headerRow.querySelector('time')) headerRow = headerRow.parentElement;
                 if (headerRow) time = headerRow.querySelector('time')?.textContent || '';
            }

            if (!time) {
                 const allTimes = Array.from(tweetElement.querySelectorAll('time'))
                      .filter(t => !quotedTweetWrapper || !quotedTweetWrapper.contains(t));
                 if (allTimes.length > 0) time = allTimes[0].textContent;
            }

            const avatar = tweetElement.querySelector('[data-testid="Tweet-User-Avatar"] img')?.getAttribute('src') || '';
            const nameNode = tweetElement.querySelector('[data-testid="User-Name"] a div:first-child')?.cloneNode(true) || tweetElement.querySelector('[data-testid="User-Name"]')?.cloneNode(true);
            let handle = '';
            const handleElement = Array.from(tweetElement.querySelectorAll('[data-testid="User-Name"] span')).find(el => el.textContent.trim().startsWith('@'));
            if (handleElement) handle = handleElement.textContent.trim();
            const tweetTextNode = cleanTextNode(tweetElement.querySelector('[data-testid="tweetText"]'));
            const mainImages = Array.from(tweetElement.querySelectorAll('[data-testid="tweetPhoto"] img'))
                .filter(img => !quotedTweetWrapper || !quotedTweetWrapper.contains(img))
                .map(img => getHighResImageUrl(img.src));

            let quotedTweetData = null;
            if (quotedTweetWrapper) {
                const qUserInfo = quotedTweetWrapper.querySelector('[data-testid="User-Name"]');
                const qAvatar = quotedTweetWrapper.querySelector('img[src*="/profile_images/"]')?.src || '';
                let qNameNode = qUserInfo?.firstChild?.cloneNode(true);
                if (!qNameNode || qNameNode.textContent.trim() === '') qNameNode = qUserInfo?.querySelector('div[dir="auto"]')?.cloneNode(true);
                let qHandle = '';
                const qHandleEl = Array.from(quotedTweetWrapper.querySelectorAll('[data-testid="User-Name"] span')).find(el => el.textContent.trim().startsWith('@'));
                if (qHandleEl) qHandle = qHandleEl.textContent.trim();
                let qTime = quotedTweetWrapper.querySelector('time')?.textContent || '';
                let qTextNode = cleanTextNode(quotedTweetWrapper.querySelector('[data-testid="tweetText"]'));
                 if (!qTextNode) {
                     const potentialText = quotedTweetWrapper.querySelector('div[dir="auto"]');
                     if (potentialText && !potentialText.closest('[data-testid="User-Name"]')) qTextNode = cleanTextNode(potentialText);
                 }
                const qImages = Array.from(quotedTweetWrapper.querySelectorAll('img[src*="/media/"]')).map(img => getHighResImageUrl(img.src));
                if (qNameNode || qImages.length > 0) {
                    quotedTweetData = { avatar: qAvatar, nameNode: qNameNode, handle: qHandle, time: qTime, tweetTextNode: qTextNode, images: qImages };
                }
            }
            return { avatar, nameNode, handle, time, views, tweetTextNode, images: mainImages, quotedTweetData };
        } catch (e) { console.error("Extract failed", e); return null; }
    }

    async function createMultiTweetCanvas(tweetsData, isDetailPage) {
        const mainContainer = document.createElement('div');
        mainContainer.style.cssText = `position: absolute; left: -9999px; top: 0; width: 650px; background-color: #ffffff; font-family: TwitterChirp, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;`;
        for (let i = 0; i < tweetsData.length; i++) {
            const hasThreadLine = i < tweetsData.length - 1;
            mainContainer.appendChild(await renderSingleTweet(tweetsData[i], isDetailPage && i === tweetsData.length - 1, hasThreadLine));
        }
        await processEmojis(mainContainer);
        return mainContainer;
    }

    // --- 修改重点：重写布局逻辑 ---
    async function renderSingleTweet(data, isFocused, hasThreadLine) {
        const container = document.createElement('div');
        container.style.position = 'relative';
        container.style.cssText = `position: relative; padding: ${isFocused ? '20px 24px' : '16px 24px 0px 24px'}; background-color: #ffffff; border-bottom: 1px solid #eff3f4;`;

        if (hasThreadLine) {
            const line = document.createElement('div');
            line.className = 'thread-line';
            line.style.left = isFocused ? '47px' : '39px';
            line.style.top = isFocused ? '72px' : '64px';
            container.appendChild(line);
        }

        const header = document.createElement('div');
        header.style.cssText = 'display: flex; align-items: flex-start; margin-bottom: 12px; position: relative; z-index: 1; flex-wrap: nowrap;';
        header.innerHTML = `<img src="${data.avatar}" crossorigin="anonymous" style="width: 48px; height: 48px; border-radius: 50%; margin-right: 12px; background-color: #fff; flex-shrink: 0;">`;
        
        const userInfo = document.createElement('div');
        userInfo.style.cssText = "display: flex; flex-direction: column; flex: 1; min-width: 0;";

        const topRow = document.createElement('div');
        // 关键修改：取消 align-items: center，改为 flex-start 或 block
        // 实际上，我们直接把名字作为一个块级元素处理，不再把名字和 Handle 强行放在一个 flex row 里（除了非 Focus 模式）
        topRow.style.cssText = "display: block; width: 100%;";
        
        const nameStrong = document.createElement('strong');
        // 关键修改：使用 block 布局，防止 Flexbox 压缩换行
        nameStrong.style.cssText = "font-size: 16px; color: #0f1419; margin-right: 4px; display: inline; white-space: normal; word-break: break-word; line-height: 1.3;";
        
        // ★★★ 核心修复：深度清理样式，将 div 转为 inline ★★★
        const cleanStyles = (node) => {
             if (node.nodeType === 1) {
                 // 强制重置样式，确保它是流式布局的一部分
                 node.style.whiteSpace = 'normal';
                 node.style.textOverflow = 'clip';
                 node.style.overflow = 'visible';
                 node.style.minWidth = '0';
                 node.style.maxWidth = 'none';
                 node.style.width = 'auto';
                 node.style.height = 'auto';
                 node.style.position = 'static';
                 // 这一步最重要：推特名字里常常有 div，会导致强制换行或 flex 错位，这里强制改成 inline
                 node.style.display = 'inline'; 
                 
                 // 处理图片/表情，让它们垂直对齐
                 if (node.tagName === 'IMG') {
                     node.style.display = 'inline-block';
                     node.style.verticalAlign = 'text-bottom';
                     node.style.position = 'relative';
                     node.style.top = '2px';
                 }
             }
             if (node.childNodes) {
                 node.childNodes.forEach(child => cleanStyles(child));
             }
        };

        if (data.nameNode) {
            cleanStyles(data.nameNode);
            nameStrong.appendChild(data.nameNode);
        }
        topRow.appendChild(nameStrong);

        if (!isFocused && data.time) {
             const handleAndTime = document.createElement('span');
             handleAndTime.style.cssText = "font-size: 15px; color: #536471; white-space: normal; word-break: break-all; margin-left: 4px;";
             handleAndTime.innerHTML = `${data.handle} · ${data.time}`;
             topRow.appendChild(handleAndTime);
             userInfo.appendChild(topRow);
        } else {
            userInfo.appendChild(topRow);
            const handleSpan = document.createElement('div');
            // 这里的 margin-top 确保了名字换行后，handle 即使被挤下去也有点间距，且绝对在名字下方
            handleSpan.style.cssText = "font-size: 15px; color: #536471; line-height: 1.2; white-space: normal; word-break: break-all; margin-top: 2px;";
            handleSpan.textContent = data.handle;
            userInfo.appendChild(handleSpan);
        }
        header.appendChild(userInfo);
        container.appendChild(header);

        const contentWrapper = document.createElement('div');
        contentWrapper.style.cssText = "margin-left: 60px;";

        if (data.tweetTextNode && data.tweetTextNode.textContent.trim()) {
            const content = data.tweetTextNode;
            const fontSize = isFocused ? '22px' : '16px';
            content.style.cssText = `font-size: ${fontSize}; line-height: 1.4; color: #0f1419; margin-bottom: 12px; white-space: pre-wrap; overflow-wrap: break-word;`;
            content.querySelectorAll('a').forEach(a => a.style.color = '#1d9bf0');
            contentWrapper.appendChild(content);
        }

        if (data.images.length > 0) {
            const imgStack = document.createElement('div');
            imgStack.style.cssText = 'display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px;';
            data.images.forEach(src => {
                const img = document.createElement('img');
                img.src = src; img.crossOrigin = 'anonymous';
                img.style.cssText = "width: 100%; border-radius: 16px; border: 1px solid #cfd9de;";
                imgStack.appendChild(img);
            });
            contentWrapper.appendChild(imgStack);
        }

        if (data.quotedTweetData) {
            const qData = data.quotedTweetData;
            const qDiv = document.createElement('div');
            qDiv.className = 'quoted-tweet-container';
            qDiv.style.marginBottom = '12px';
            qDiv.innerHTML = `<div class="quoted-tweet-header"><img src="${qData.avatar}" class="quoted-tweet-avatar" crossorigin="anonymous"><div class="quoted-tweet-user-info"></div></div>`;
            const qUserInfoDiv = qDiv.querySelector('.quoted-tweet-user-info');
            
            const qNameStrong = document.createElement('strong');
            // 引用推文名字同样处理
            qNameStrong.style.cssText = "display: inline; white-space: normal; word-break: break-word; line-height: 1.3;";
            if (qData.nameNode) {
                cleanStyles(qData.nameNode);
                qNameStrong.appendChild(qData.nameNode);
            }
            qUserInfoDiv.appendChild(qNameStrong);

            const qHandleSpan = document.createElement('span');
            qHandleSpan.className = 'user-handle';
            qHandleSpan.textContent = qData.handle;
            // 引用推文里 handle 通常紧跟名字或换行
            qHandleSpan.style.cssText = "display: block; margin-top: 2px; font-weight: 400; color: #536471;";
            qUserInfoDiv.appendChild(qHandleSpan);

            if (qData.time) {
                const qTimeSpan = document.createElement('span');
                qTimeSpan.className = 'user-handle tweet-time-nowrap';
                qTimeSpan.style.cssText = "display: inline-block; margin-top: 2px; color: #536471;";
                qTimeSpan.textContent = ` · ${qData.time}`;
                // 这里的处理稍微简单点，通常引用推文时间不长
                qUserInfoDiv.appendChild(qTimeSpan);
            }

            if (qData.tweetTextNode && qData.tweetTextNode.textContent.trim()) {
                const qContent = qData.tweetTextNode;
                qContent.className = 'quoted-tweet-text';
                qContent.querySelectorAll('a').forEach(a => a.style.color = '#1d9bf0');
                qDiv.appendChild(qContent);
            }
            if (data.quotedTweetData.images.length > 0) {
                const qImages = document.createElement('div');
                qImages.className = 'quoted-tweet-images';
                data.quotedTweetData.images.forEach(src => {
                    const img = document.createElement('img');
                    img.src = src; img.crossOrigin = 'anonymous';
                    qImages.appendChild(img);
                });
                qDiv.appendChild(qImages);
            }
            contentWrapper.appendChild(qDiv);
        }

        if (isFocused && data.time) {
            const footer = document.createElement('div');
            footer.style.cssText = "margin-top: 16px; border-top: 1px solid #eff3f4; padding-top: 16px; color: #536471; font-size: 15px;";
            let footerText = data.time;
            if (data.views) footerText += ` · ${data.views}`;
            footer.textContent = footerText;
             container.appendChild(contentWrapper);
             container.appendChild(footer);
        } else {
             contentWrapper.style.paddingBottom = '16px';
             container.appendChild(contentWrapper);
        }

        return container;
    }

    async function processEmojis(container) {
        const baseTwemojiUrl = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/';
        container.querySelectorAll('img').forEach(img => {
            const match = img.src.match(/\/emoji\/v2\/svg\/([a-f0-9\-]+)\.svg/i);
            if (match && match[1]) {
                img.src = `${baseTwemojiUrl}${match[1]}.png`;
                img.className = 'emoji-unified';
                img.removeAttribute('style');
            }
        });
        try { twemoji.parse(container, { folder: '72x72', ext: '.png', base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/', className: 'emoji-unified' }); } catch (e) {}
        const emojiImages = Array.from(container.querySelectorAll('img.emoji-unified'));
        await Promise.all(emojiImages.map(img => fetchImageAsDataURL(img.src).then(url => img.src = url).catch(e => console.error(e))));
        const otherImages = Array.from(container.querySelectorAll('img:not(.emoji-unified)'));
        await Promise.all(otherImages.map(img => new Promise(resolve => { if (img.complete) return resolve(); img.onload = img.onerror = resolve; })));
    }

    function injectButton(node) {
        if (!node) return;
        const actionGroup = node.querySelector('[role="group"]');
        if (!actionGroup || actionGroup.querySelector('.tweet-to-image-btn-container')) return;

        if (window.location.pathname.includes('/status/')) {
            const userInfo = node.querySelector('[data-testid="User-Name"]')?.parentElement;
            const time = node.querySelector('time');
            if (userInfo && time && userInfo.contains(time)) return;
        }

        const container = document.createElement('div');
        container.className = 'tweet-to-image-btn-container';
        container.innerHTML = `<div class="tweet-to-image-btn" title="生成推文长图">${downloadIconSVG}</div>`;
        container.firstChild.addEventListener('click', handleGenerateClick);
        actionGroup.appendChild(container);
    }

    const observer = new MutationObserver(muts => muts.forEach(m => m.addedNodes.forEach(n => {
        if (n.nodeType === 1) {
            if (n.matches('article[data-testid="tweet"]')) injectButton(n);
            n.querySelectorAll('article[data-testid="tweet"]').forEach(injectButton);
        }
    })));
    observer.observe(document.body, { childList: true, subtree: true });
    setInterval(() => document.querySelectorAll('article[data-testid="tweet"]').forEach(injectButton), 1500);
    console.log('Twitter to Image Generator (Bundled snapdom version) loaded!');
})();