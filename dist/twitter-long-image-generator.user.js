// ==UserScript==
// @name         X/Twitter 推文长图生成优化版
// @namespace    http://tampermonkey.net/
// @version      1.9.13
// @author       kanzaki-chiya
// @description  将推文转换为高清长图，支持对话链导出，并优化生成稳定性。
// @license      MIT
// @homepage     https://github.com/kanzaki-chiya/Twitter-Long-Image-Generator#readme
// @homepageURL  https://github.com/kanzaki-chiya/Twitter-Long-Image-Generator#readme
// @source       https://github.com/kanzaki-chiya/Twitter-Long-Image-Generator.git
// @supportURL   https://github.com/kanzaki-chiya/Twitter-Long-Image-Generator/issues
// @match        *://*.twitter.com/*
// @match        *://*.x.com/*
// @require      https://cdn.jsdelivr.net/npm/twemoji@14.0.2/dist/twemoji.min.js
// @connect      cdn.jsdelivr.net
// @connect      abs-0.twimg.com
// @connect      *.twimg.com
// @connect      pbs.twimg.com
// @grant        GM.xmlHttpRequest
// @grant        GM_addStyle
// ==/UserScript==

(function() {
	"use strict";
	var s = new Set();
	var _css = async (t) => {
		if (s.has(t)) return;
		s.add(t);
		((c) => {
			if (typeof GM_addStyle === "function") GM_addStyle(c);
			else (document.head || document.documentElement).appendChild(document.createElement("style")).append(c);
		})(t);
	};
	var Oo = Object.defineProperty;
	var tt = (t, e, n) => () => {
		if (n) throw n[0];
		try {
			return t && (e = t(t = 0)), e;
		} catch (r) {
			throw n = [r], r;
		}
	};
	var qt = (t, e) => {
		for (var n in e) Oo(t, n, {
			get: e[n],
			enumerable: !0
		});
	};
	function Rn(t) {
		if (t === !0) return "soft";
		if (t === !1) return "disabled";
		if (typeof t == "string") {
			let e = t.toLowerCase().trim();
			if (e === "auto") return "auto";
			if (e === "full") return "full";
			if (e === "soft" || e === "disabled") return e;
		}
		return "soft";
	}
	function le(t = "soft") {
		switch (t) {
			case "auto":
				x.session.styleMap = new Map(), x.session.nodeMap = new Map();
				return;
			case "soft":
				x.session.styleMap = new Map(), x.session.nodeMap = new Map(), x.session.styleCache = new WeakMap();
				return;
			case "full": return;
			case "disabled":
				x.session.styleMap = new Map(), x.session.nodeMap = new Map(), x.session.styleCache = new WeakMap(), x.computedStyle = new WeakMap(), x.measureHints = new WeakMap(), x.baseStyle = new j(50), x.defaultStyle = new j(30), x.image = new j(100), x.background = new j(100), x.resource = new j(150), x.compress = new j(50), x.font = new Set();
				return;
			default:
				x.session.styleMap = new Map(), x.session.nodeMap = new Map(), x.session.styleCache = new WeakMap();
				return;
		}
	}
	var j;
	var x;
	var J = tt(() => {
		"use strict";
		j = class extends Map {
			constructor(e = 100, ...n) {
				super(...n), this._maxSize = e;
			}
			set(e, n) {
				if (this.size >= this._maxSize && !this.has(e)) {
					let r = this.keys().next().value;
					r !== void 0 && this.delete(r);
				}
				return super.set(e, n);
			}
		}, x = {
			image: new j(100),
			background: new j(100),
			resource: new j(150),
			defaultStyle: new j(30),
			baseStyle: new j(50),
			compress: new j(50),
			computedStyle: new WeakMap(),
			measureHints: new WeakMap(),
			burstAdvice: new WeakMap(),
			warnedReconcile: !1,
			font: new Set(),
			session: {
				styleMap: new Map(),
				styleCache: new WeakMap(),
				nodeMap: new Map()
			}
		};
	});
	function kt(t) {
		let e = t.match(/url\((['"]?)(.*?)(\1)\)/);
		if (!e) return null;
		let n = e[2].trim();
		return n.startsWith("#") ? null : n;
	}
	function Xt(t, e = 1) {
		let n = t.match(/^\s*-?(?:webkit-)?image-set\(([\s\S]*)\)\s*$/i);
		if (!n) return null;
		let r = [];
		for (let s of n[1].split(",")) {
			let i = s.match(/url\((['"]?)(.*?)(\1)\)/);
			if (!i) continue;
			let a = s.match(/type\(\s*["']([^"']+)["']\s*\)/i);
			if (a && !Bo.test(a[1].trim())) continue;
			let c = s.match(/(\d+(?:\.\d+)?)\s*(x|dpi|dppx)/i), f = 1;
			if (c) {
				let l = parseFloat(c[1]);
				f = /dpi/i.test(c[2]) ? l / 96 : l;
			}
			r.push({
				url: i[2].trim(),
				dppx: f
			});
		}
		return r.length ? (r.sort((s, i) => s.dppx - i.dppx), (r.find((s) => s.dppx >= e) || r[r.length - 1]).url) : null;
	}
	function Oe(t) {
		if (!t || t === "none") return "";
		let e = t.replace(/translate[XY]?\([^)]*\)/g, "");
		return e = e.replace(/matrix\(([^)]+)\)/g, (n, r) => {
			let o = r.split(",").map((s) => s.trim());
			return o.length !== 6 ? `matrix(${r})` : (o[4] = "0", o[5] = "0", `matrix(${o.join(", ")})`);
		}), e = e.replace(/matrix3d\(([^)]+)\)/g, (n, r) => {
			let o = r.split(",").map((s) => s.trim());
			return o.length !== 16 ? `matrix3d(${r})` : (o[12] = "0", o[13] = "0", `matrix3d(${o.join(", ")})`);
		}), e.trim().replace(/\s{2,}/g, " ");
	}
	function mt(t) {
		if (/%[0-9A-Fa-f]{2}/.test(t)) return t;
		try {
			return encodeURI(t);
		} catch {
			return t;
		}
	}
	function Be(t, e) {
		if (!t || /^(data|blob|about|#)/i.test(t.trim())) return t;
		try {
			let n = e || typeof document < "u" && (document.baseURI || document.location?.href) || "http://localhost/";
			return new URL(t, n).href;
		} catch {
			return t;
		}
	}
	var Bo;
	var Gt = tt(() => {
		"use strict";
		Bo = /^image\/(jpeg|jpg|png|gif|webp|avif|apng|svg\+xml|bmp|x-icon|vnd\.microsoft\.icon)\s*(;|$)/i;
	});
	function Uo(t = "[snapDOM]", { ttlMs: e = 3e5, maxEntries: n = 12 } = {}) {
		let r = new Map(), o = 0;
		function s(i, a, c) {
			if (o >= n) return;
			let f = Date.now();
			(r.get(a) || 0) > f || (r.set(a, f + e), o++, i === "warn" && console && console.warn ? console.warn(`${t} ${c}`) : console && console.error && console.error(`${t} ${c}`));
		}
		return {
			warnOnce(i, a) {
				s("warn", i, a);
			},
			errorOnce(i, a) {
				s("error", i, a);
			},
			reset() {
				r.clear(), o = 0;
			}
		};
	}
	function Do(t) {
		return /^data:|^blob:|^about:blank$/i.test(t);
	}
	function Ho(t, e) {
		try {
			let n = typeof location < "u" && location.href ? location.href : "http://localhost/", r = e.includes("{url}") ? e.split("{url}")[0] : e, o = new URL(r || ".", n), s = new URL(t, n);
			if (s.origin === o.origin) return !0;
			let i = s.searchParams;
			if (i && (i.has("url") || i.has("target"))) return !0;
		} catch {}
		return !1;
	}
	function zo(t, e) {
		if (!e || Do(t) || Ho(t, e)) return !1;
		try {
			let n = typeof location < "u" && location.href ? location.href : "http://localhost/", r = new URL(t, n);
			return typeof location < "u" ? r.origin !== location.origin : !0;
		} catch {
			return !!e;
		}
	}
	function Vo(t, e) {
		if (!e) return t;
		if (e.includes("{url}")) return e.replace("{urlRaw}", mt(t)).replace("{url}", encodeURIComponent(t));
		if (/[?&]url=?$/.test(e)) return `${e}${encodeURIComponent(t)}`;
		if (e.endsWith("?")) return `${e}url=${encodeURIComponent(t)}`;
		if (e.endsWith("/")) return `${e}${mt(t)}`;
		return `${e}${e.includes("?") ? "&" : "?"}url=${encodeURIComponent(t)}`;
	}
	function Ln(t) {
		return new Promise((e, n) => {
			let r = new FileReader();
			r.onload = () => e(String(r.result || "")), r.onerror = () => n(new Error("read_failed")), r.readAsDataURL(t);
		});
	}
	function jo(t, e) {
		return [
			e.as || "blob",
			e.timeout ?? 3e3,
			e.useProxy || "",
			e.errorTTL ?? 8e3,
			t
		].join("|");
	}
	async function z(t, e = {}) {
		let n = e.as ?? "blob", r = e.timeout ?? 3e3, o = e.useProxy || "", s = e.errorTTL ?? 8e3, i = e.headers || {}, a = !!e.silent;
		if (/^data:/i.test(t)) try {
			if (n === "text") return {
				ok: !0,
				data: String(t),
				status: 200,
				url: t,
				fromCache: !1
			};
			if (n === "dataURL") return {
				ok: !0,
				data: String(t),
				status: 200,
				url: t,
				fromCache: !1,
				mime: String(t).slice(5).split(";")[0] || ""
			};
			let [, g = "", y = ""] = String(t).match(/^data:([^,]*),(.*)$/) || [], S = /;base64/i.test(g) ? atob(y) : decodeURIComponent(y), w = new Uint8Array([...S].map((C) => C.charCodeAt(0))), v = new Blob([w], { type: (g || "").split(";")[0] || "" });
			return {
				ok: !0,
				data: v,
				status: 200,
				url: t,
				fromCache: !1,
				mime: v.type || ""
			};
		} catch {
			return {
				ok: !1,
				data: null,
				status: 0,
				url: t,
				fromCache: !1,
				reason: "special_url_error"
			};
		}
		if (/^blob:/i.test(t)) try {
			let g = await fetch(t);
			if (!g.ok) return {
				ok: !1,
				data: null,
				status: g.status,
				url: t,
				fromCache: !1,
				reason: "http_error"
			};
			let y = await g.blob(), b = y.type || g.headers.get("content-type") || "";
			return n === "dataURL" ? {
				ok: !0,
				data: await Ln(y),
				status: g.status,
				url: t,
				fromCache: !1,
				mime: b
			} : n === "text" ? {
				ok: !0,
				data: await y.text(),
				status: g.status,
				url: t,
				fromCache: !1,
				mime: b
			} : {
				ok: !0,
				data: y,
				status: g.status,
				url: t,
				fromCache: !1,
				mime: b
			};
		} catch {
			return {
				ok: !1,
				data: null,
				status: 0,
				url: t,
				fromCache: !1,
				reason: "network"
			};
		}
		if (/^about:blank$/i.test(t)) return n === "dataURL" ? {
			ok: !0,
			data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==",
			status: 200,
			url: t,
			fromCache: !1,
			mime: "image/png"
		} : {
			ok: !0,
			data: n === "text" ? "" : new Blob([]),
			status: 200,
			url: t,
			fromCache: !1
		};
		let c = jo(t, {
			as: n,
			timeout: r,
			useProxy: o,
			errorTTL: s
		}), f = fe.get(c);
		if (f && f.until > Date.now()) return {
			...f.result,
			fromCache: !0
		};
		f && fe.delete(c);
		let l = Ue.get(c);
		if (l) return l;
		let d = zo(t, o) ? Vo(t, o) : t, u = e.credentials;
		if (!u) try {
			let g = typeof location < "u" && location.href ? location.href : "http://localhost/", y = new URL(t, g);
			u = typeof location < "u" && y.origin === location.origin ? "include" : "omit";
		} catch {
			u = "omit";
		}
		let p = new AbortController(), h = setTimeout(() => p.abort("timeout"), r), m = (async () => {
			try {
				let g = await fetch(d, {
					signal: p.signal,
					credentials: u,
					headers: i
				});
				if (!g.ok) {
					let S = {
						ok: !1,
						data: null,
						status: g.status,
						url: d,
						fromCache: !1,
						reason: "http_error"
					};
					if (s > 0 && fe.set(c, {
						until: Date.now() + s,
						result: S
					}), !a) {
						let w = `${g.status} ${g.statusText || ""}`.trim();
						Tn.warnOnce(`http:${g.status}:${n}:${new URL(t, location?.href ?? "http://localhost/").origin}`, `HTTP error ${w} while fetching ${n} ${t}`);
					}
					return e.onError && e.onError(S), S;
				}
				if (n === "text") return {
					ok: !0,
					data: await g.text(),
					status: g.status,
					url: d,
					fromCache: !1
				};
				let y = await g.blob(), b = y.type || g.headers.get("content-type") || "";
				return n === "dataURL" ? {
					ok: !0,
					data: await Ln(y),
					status: g.status,
					url: d,
					fromCache: !1,
					mime: b
				} : {
					ok: !0,
					data: y,
					status: g.status,
					url: d,
					fromCache: !1,
					mime: b
				};
			} catch (g) {
				let y = g && typeof g == "object" && "name" in g && g.name === "AbortError" ? String(g.message || "").includes("timeout") ? "timeout" : "abort" : "network", b = {
					ok: !1,
					data: null,
					status: 0,
					url: d,
					fromCache: !1,
					reason: y
				};
				if (!/^blob:/i.test(t) && s > 0 && fe.set(c, {
					until: Date.now() + s,
					result: b
				}), !a) {
					let S = `${y}:${n}:${new URL(t, location?.href ?? "http://localhost/").origin}`, w = y === "timeout" ? `Timeout after ${r}ms. Consider increasing timeout or using a proxy for ${t}` : y === "abort" ? `Request aborted while fetching ${n} ${t}` : `Network/CORS issue while fetching ${n} ${t}. A proxy may be required`;
					Tn.errorOnce(S, w);
				}
				return e.onError && e.onError(b), b;
			} finally {
				clearTimeout(h), Ue.delete(c);
			}
		})();
		return Ue.set(c, m), m;
	}
	var Tn;
	var Ue;
	var fe;
	var ht = tt(() => {
		"use strict";
		Gt();
		Tn = Uo("[snapDOM]", {
			ttlMs: 18e4,
			maxEntries: 10
		}), Ue = new Map(), fe = new Map();
	});
	async function Mt(t, e = {}) {
		if (/^((repeating-)?(linear|radial|conic)-gradient)\(/i.test(t) || t.trim() === "none") return t;
		let r = Xt(t, typeof devicePixelRatio < "u" && devicePixelRatio || 1) ?? kt(t);
		if (!r) return t;
		let s = mt(Be(r)), i = (e.useProxy || "") + "|" + s;
		if (x.background.has(i)) {
			let a = x.background.get(i);
			return a ? `url("${a}")` : "none";
		}
		try {
			let a = await z(s, {
				as: "dataURL",
				useProxy: e.useProxy
			});
			return a.ok ? (x.background.set(i, a.data), `url("${a.data}")`) : (x.background.set(i, null), "none");
		} catch {
			return x.background.set(i, null), "none";
		}
	}
	var Pn = tt(() => {
		"use strict";
		J();
		Gt();
		ht();
	});
	function pe(t) {
		if (t = String(t).toLowerCase(), de.has(t)) {
			let s = {};
			return x.defaultStyle.set(t, s), s;
		}
		if (x.defaultStyle.has(t)) return x.defaultStyle.get(t);
		let e = document.getElementById("snapdom-sandbox");
		e || (e = document.createElement("div"), e.id = "snapdom-sandbox", e.setAttribute("data-snapdom-sandbox", "true"), e.setAttribute("aria-hidden", "true"), e.style.position = "absolute", e.style.left = "-9999px", e.style.top = "-9999px", e.style.width = "0px", e.style.height = "0px", e.style.overflow = "hidden", document.body.appendChild(e));
		let n = document.createElement(t);
		n.style.all = "initial", e.appendChild(n);
		let r = getComputedStyle(n), o = {};
		for (let s of r) {
			if (Yt(s)) continue;
			o[s] = r.getPropertyValue(s);
		}
		return e.removeChild(n), x.defaultStyle.set(t, o), o;
	}
	function Yt(t) {
		let e = Nn.get(t);
		if (e === void 0) {
			let n = String(t).toLowerCase();
			e = Yo.has(n) || Go.test(n) || Xo.test(n), Nn.set(t, e);
		}
		return e;
	}
	function me(t, e) {
		return !Jo.has(t) && (e === "inline" || Ko.has(t) || Qo.has(t));
	}
	function It(t, e, n = !0, r = !1) {
		if (e = String(e || "").toLowerCase(), de.has(e)) return "";
		let o = [], s = pe(e), i = (t.display || "").toLowerCase(), a = i === "inline", c = me(e, i), f = t["text-wrap-mode"] || t["white-space"] || "", l = c && n && !a && (f === "nowrap" || f === "pre"), d = c && n && !l, u = !1;
		for (let p in t) {
			if (Yt(p)) continue;
			let h = t[p];
			if (d) {
				if (Zo.has(p)) continue;
				if (ti.has(p)) {
					h && h !== s[p] && (o.push(`${p}:${h}`), h !== "auto" && (u = !0));
					continue;
				}
			}
			if (h && h !== s[p]) {
				if (!l && (p === "width" || p === "inline-size") && h.endsWith("px") && h.includes(".")) {
					let m = parseFloat(h);
					if (Number.isFinite(m)) {
						o.push(`${p}:${Math.ceil(m * 16) / 16}px`);
						continue;
					}
				}
				o.push(`${p}:${h}`);
			}
		}
		if (d && !a && !r && !u) {
			let p = t.width;
			p && p !== "auto" && p !== s.width && o.push(`min-width:${p}`);
		}
		return o.sort(), o.join(";");
	}
	function He(t) {
		let e = new Set();
		return t.nodeType !== Node.ELEMENT_NODE && t.nodeType !== Node.DOCUMENT_FRAGMENT_NODE ? [] : (t.tagName && e.add(t.tagName.toLowerCase()), typeof t.querySelectorAll == "function" && t.querySelectorAll("*").forEach((n) => e.add(n.tagName.toLowerCase())), Array.from(e));
	}
	function ze(t) {
		let e = new Map();
		for (let r of t) {
			let o = pe(r);
			if (!o) continue;
			let s = Object.entries(o).map(([i, a]) => `${i}:${a};`).sort().join("");
			s && (e.has(s) || e.set(s, []), e.get(s).push(r));
		}
		let n = "";
		for (let [r, o] of e.entries()) n += `${o.join(",")} { ${r} }
`;
		return n;
	}
	function Ve(t) {
		let e = Array.from(new Set(t.values())).filter(Boolean).sort(), n = new Map(), r = 1;
		for (let o of e) n.set(o, `c${r++}`);
		return n;
	}
	function ei(t) {
		try {
			let e = t?.ownerDocument;
			if (!e) return typeof window < "u" ? window : null;
			let n = e.defaultView;
			if (n && typeof n.getComputedStyle == "function") return n;
			if (typeof window < "u" && window.frames) for (let r = 0; r < window.frames.length; r++) try {
				if (window.frames[r]?.document === e) return window.frames[r];
			} catch {}
		} catch {}
		return typeof window < "u" ? window : null;
	}
	function L(t, e = null) {
		let n = () => {
			let s = {
				length: 0,
				getPropertyValue: () => "",
				item: () => ""
			};
			return s[Symbol.iterator] = function* () {}, s;
		};
		if (t?.nodeType !== 1) {
			let s = typeof window < "u" ? window : null;
			if (s && typeof s.getComputedStyle == "function") try {
				return s.getComputedStyle(t, e) || n();
			} catch {
				return n();
			}
			return n();
		}
		let r = x.computedStyle.get(t);
		r || (r = new Map(), x.computedStyle.set(t, r));
		let o = r.get(e);
		if (!o) {
			let s = ei(t), i = null;
			try {
				i = s && typeof s.getComputedStyle == "function" ? s.getComputedStyle(t, e) : null;
			} catch {}
			if (!i && typeof window < "u" && typeof window.getComputedStyle == "function") try {
				t.ownerDocument === document && (i = window.getComputedStyle(t, e));
			} catch {}
			o = i || n(), r.set(e, o);
		}
		return o;
	}
	function he(t) {
		let e = {};
		for (let n of t) e[n] = t.getPropertyValue(n);
		for (let n of ni) {
			let r = e[`border-${n}-style`], o = e[`border-${n}-width`];
			(r === "none" || r === "hidden" || o === "0px") && (delete e[`border-${n}-style`], delete e[`border-${n}-width`], delete e[`border-${n}-color`]);
		}
		return e;
	}
	function _t(t) {
		let e = [], n = 0, r = 0;
		for (let o = 0; o < t.length; o++) {
			let s = t[o];
			s === "(" && n++, s === ")" && n--, s === "," && n === 0 && (e.push(t.slice(r, o).trim()), r = o + 1);
		}
		return e.push(t.slice(r).trim()), e;
	}
	var ue;
	var de;
	var Xo;
	var Go;
	var Yo;
	var Nn;
	var Ko;
	var Qo;
	var Jo;
	var Zo;
	var ti;
	var ni;
	var Kt = tt(() => {
		"use strict";
		J();
		ue = new Set([
			"meta",
			"script",
			"noscript",
			"title",
			"link",
			"template"
		]), de = new Set([
			"meta",
			"link",
			"style",
			"title",
			"noscript",
			"script",
			"template",
			"g",
			"defs",
			"use",
			"marker",
			"mask",
			"clipPath",
			"pattern",
			"path",
			"polygon",
			"polyline",
			"line",
			"circle",
			"ellipse",
			"rect",
			"filter",
			"lineargradient",
			"radialgradient",
			"stop"
		]);
		Xo = /(?:^|-)(animation|transition)(?:-|$)/i, Go = /^(--.+|view-timeline|scroll-timeline|animation-trigger|offset-|position-try|app-region|interactivity|overlay|view-transition|-webkit-locale|-webkit-user-(?:drag|modify)|-webkit-tap-highlight-color|-webkit-text-security)$/i, Yo = new Set([
			"cursor",
			"pointer-events",
			"touch-action",
			"user-select",
			"print-color-adjust",
			"speak",
			"reading-flow",
			"reading-order",
			"anchor-name",
			"anchor-scope",
			"container-name",
			"container-type",
			"timeline-scope",
			"zoom",
			"stroke-color"
		]), Nn = new Map();
		Ko = new Set([
			"span",
			"small",
			"em",
			"strong",
			"b",
			"i",
			"u",
			"s",
			"code",
			"cite",
			"mark",
			"sub",
			"sup"
		]), Qo = new Set([
			"table",
			"thead",
			"tbody",
			"tfoot",
			"tr",
			"td",
			"th"
		]), Jo = new Set([
			"img",
			"video",
			"canvas",
			"svg",
			"iframe",
			"embed",
			"object",
			"input",
			"textarea",
			"select"
		]), Zo = new Set([
			"width",
			"max-width",
			"inline-size",
			"max-inline-size"
		]), ti = new Set(["min-width", "min-inline-size"]);
		ni = [
			"top",
			"right",
			"bottom",
			"left"
		];
	});
	function Et(t, { fast: e = !1 } = {}) {
		if (e) return t();
		"requestIdleCallback" in window ? requestIdleCallback(t, { timeout: 50 }) : setTimeout(t, 1);
	}
	function je() {
		if (typeof navigator > "u") return !1;
		if (navigator.userAgentData) return navigator.userAgentData.platform === "iOS";
		let t = navigator.userAgent || "", e = /iPhone|iPad|iPod/.test(t), n = navigator.maxTouchPoints > 2 && /Macintosh/.test(t);
		return e || n;
	}
	function q() {
		if (typeof navigator > "u") return !1;
		let t = navigator.userAgent || "", e = t.toLowerCase(), n = e.includes("safari") && !e.includes("chrome") && !e.includes("crios") && !e.includes("fxios") && !e.includes("android"), r = /applewebkit/i.test(t), o = /mobile/i.test(t), s = !/safari/i.test(t), i = r && o && s, a = /(micromessenger|wxwork|wecom|windowswechat|macwechat)/i.test(t), c = /(baiduboxapp|baidubrowser|baidusearch|baiduboxlite)/i.test(e), f = /ipad|iphone|ipod/.test(e) && r;
		return n || i || a || c || f;
	}
	function In() {
		if (typeof navigator > "u") return !1;
		let t = (navigator.userAgent || "").toLowerCase();
		return t.includes("firefox") || t.includes("fxios");
	}
	var Wt = tt(() => {
		"use strict";
	});
	function _(t, e, n) {
		let r = t && typeof t == "object" && (t.options || t);
		r && r.debug && (n !== void 0 ? console.warn("[snapdom]", e, n) : console.warn("[snapdom]", e));
	}
	var qe = tt(() => {
		"use strict";
	});
	var et = tt(() => {
		"use strict";
		Pn();
		Kt();
		Wt();
		Gt();
		qe();
	});
	var Co = {};
	qt(Co, {
		decodeSvgFromDataURL: () => Le,
		encodeSvgToDataURL: () => Pe,
		fixSafariShadows: () => Ne,
		toCanvas: () => Ft
	});
	function sa(t) {
		try {
			let e = t.match(/<svg\b[^>]*>/i);
			if (!e) return t;
			let n = e[0], r = parseFloat((n.match(/\bwidth="([\d.]+)/i) || [])[1]), o = parseFloat((n.match(/\bheight="([\d.]+)/i) || [])[1]);
			if (!Number.isFinite(r) || !Number.isFinite(o) || r <= 0 || o <= 0) return t;
			let s = Math.min(1, gt / r, gt / o, Math.sqrt(hn / (r * o)));
			if (s >= 1) return t;
			let i = Math.max(1, Math.floor(r * s)), a = Math.max(1, Math.floor(o * s));
			return console.warn(`[snapDOM] Capture ${Math.round(r)}\xD7${Math.round(o)}px exceeds the browser image-decode limit (${gt}px/side); downscaling to ${i}\xD7${a}px. Lower \`scale\` or set \`width\`/\`height\` to control output size.`), t.replace(n, n.replace(/(\bwidth=")[\d.]+/i, `$1${i}`).replace(/(\bheight=")[\d.]+/i, `$1${a}`));
		} catch {
			return t;
		}
	}
	function aa(t) {
		return typeof t == "string" && /^data:image\/svg\+xml/i.test(t);
	}
	function Le(t) {
		let e = t.indexOf(",");
		return e >= 0 ? decodeURIComponent(t.slice(e + 1)) : "";
	}
	function ca(t) {
		let e = t.indexOf(",");
		if (e < 0) return "";
		let n = t.slice(e + 1, e + 1201).replace(/%[0-9A-Fa-f]?$/, "");
		try {
			return decodeURIComponent(n);
		} catch {
			return "";
		}
	}
	function Pe(t) {
		return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(t)}`;
	}
	function So(t) {
		let e = [], n = "", r = 0;
		for (let o = 0; o < t.length; o++) {
			let s = t[o];
			s === "(" && r++, s === ")" && (r = Math.max(0, r - 1)), s === ";" && r === 0 ? (e.push(n), n = "") : n += s;
		}
		return n.trim() && e.push(n), e.map((o) => o.trim()).filter(Boolean);
	}
	function la(t) {
		let e = [], n = "", r = 0;
		for (let s = 0; s < t.length; s++) {
			let i = t[s];
			i === "(" && r++, i === ")" && (r = Math.max(0, r - 1)), i === "," && r === 0 ? (e.push(n.trim()), n = "") : n += i;
		}
		n.trim() && e.push(n.trim());
		let o = [];
		for (let s of e) {
			if (/\binset\b/i.test(s)) continue;
			let [a = "0px", c = "0px", f = "0px"] = s.match(/-?\d+(?:\.\d+)?px/gi) || [];
			f = `${parseFloat(f) / 2}px`;
			let l = s.replace(/-?\d+(?:\.\d+)?px/gi, "").replace(/\binset\b/gi, "").trim().replace(/\s{2,}/g, " "), d = !!l && l !== ",";
			o.push(`drop-shadow(${a} ${c} ${f}${d ? ` ${l}` : ""})`);
		}
		return o.join(" ");
	}
	function vo(t) {
		let e = So(t), n = null, r = null, o = null, s = [];
		for (let a of e) {
			let c = a.indexOf(":");
			if (c < 0) continue;
			let f = a.slice(0, c).trim().toLowerCase(), l = a.slice(c + 1).trim();
			f === "box-shadow" ? o = l : f === "filter" ? n = l : f === "-webkit-filter" ? r = l : s.push([f, l]);
		}
		if (o) {
			let a = la(o);
			a && (n = n ? `${n} ${a}` : a, r = r ? `${r} ${a}` : a);
		}
		let i = [...s];
		return n && i.push(["filter", n]), r && i.push(["-webkit-filter", r]), i.map(([a, c]) => `${a}:${c}`).join(";");
	}
	function fa(t) {
		return t.replace(/([^{}]+)\{([^}]*)\}/g, (e, n, r) => `${n}{${vo(r)}}`);
	}
	function ua(t) {
		return t = t.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (e, n) => e.replace(n, fa(n))), t = t.replace(/style=(['"])([\s\S]*?)\1/gi, (e, n, r) => `style=${n}${vo(r)}${n}`), t;
	}
	function da() {
		return Te || (Te = (async () => {
			try {
				let t = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"8\" height=\"20\"><foreignObject width=\"8\" height=\"20\"><div xmlns=\"http://www.w3.org/1999/xhtml\" style=\"width:4px;height:4px;margin-top:8px;background:#000;box-shadow:0 8px 0 0 #000\"></div></foreignObject></svg>", e = new Image();
				e.decoding = "sync", e.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(t)}`, await e.decode();
				let n = document.createElement("canvas");
				n.width = 8, n.height = 20;
				let r = n.getContext("2d", { willReadFrequently: !0 });
				r.drawImage(e, 0, 0);
				let o = r.getImageData(2, 18, 1, 1).data[3] > 128, s = r.getImageData(2, 2, 1, 1).data[3] > 128;
				return {
					native: o || s,
					flippedY: s && !o
				};
			} catch {
				return {
					native: !1,
					flippedY: !1
				};
			}
		})(), Te);
	}
	function pa(t) {
		let e = [], n = 0, r = 0;
		for (let o = 0; o < t.length; o++) {
			let s = t[o];
			s === "(" ? n++ : s === ")" ? n = Math.max(0, n - 1) : s === "," && n === 0 && (e.push(t.slice(r, o)), r = o + 1);
		}
		return e.push(t.slice(r)), e.map((o) => {
			let s = 0, i = 0, a = "", c = 0;
			for (; c < o.length;) {
				let f = o[c];
				if (f === "(" ? s++ : f === ")" && (s = Math.max(0, s - 1)), s === 0 && (c === 0 || o[c - 1] === " ")) {
					let l = /^-?\d*\.?\d+px/.exec(o.slice(c));
					if (l) {
						i++, a += i === 2 ? `${-parseFloat(l[0])}px` : l[0], c += l[0].length;
						continue;
					}
				}
				a += f, c++;
			}
			return a;
		}).join(",");
	}
	function ma(t, e) {
		let n = (r) => So(r).map((o) => {
			let s = o.indexOf(":");
			if (s < 0) return o;
			let i = o.slice(0, s).trim().toLowerCase();
			return i === "text-shadow" || e && i === "box-shadow" ? `${i}:${pa(o.slice(s + 1))}` : o;
		}).join(";");
		return t = t.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (r, o) => r.replace(o, o.replace(/([^{}]+)\{([^}]*)\}/g, (s, i, a) => `${i}{${n(a)}}`))), t = t.replace(/style=(['"])([\s\S]*?)\1/gi, (r, o, s) => `style=${o}${n(s)}${o}`), t;
	}
	async function Ne(t) {
		if (!/(?:box-shadow|text-shadow)\s*:[^;"}]*px/i.test(t)) return {
			svg: t,
			naturalOnly: !1
		};
		let { native: n, flippedY: r } = await da();
		try {
			let o = t;
			return n || (o = ua(o)), r && (o = ma(o, n)), {
				svg: o,
				naturalOnly: !0
			};
		} catch {
			return {
				svg: t,
				naturalOnly: !0
			};
		}
	}
	async function ha(t, e) {
		t.setAttribute("data-snapdom-internal", ""), t.style.cssText = "position:fixed;left:-99999px;top:-99999px;pointer-events:none", document.body.appendChild(t);
		try {
			let n = document.createElement("canvas");
			n.width = 16, n.height = 16;
			let r = () => new Promise((i) => {
				requestAnimationFrame(i), setTimeout(i, 50);
			}), o = n.getContext("2d", { willReadFrequently: !0 });
			if (!o) {
				await r(), await r();
				return;
			}
			let s = performance.now() + (e ? 600 : 150);
			for (;;) {
				o.clearRect(0, 0, 16, 16);
				try {
					o.drawImage(t, 0, 0, 16, 16);
				} catch {
					return;
				}
				let i = o.getImageData(0, 0, 16, 16).data, a = !1;
				for (let c = 3; c < i.length; c += 4) if (i[c] > 0) {
					a = !0;
					break;
				}
				if (a || performance.now() > s) return;
				await r();
			}
		} finally {
			try {
				t.remove();
			} catch {}
		}
	}
	async function Ft(t, e) {
		let { width: n, height: r, scale: o = 1, dpr: s = 1, meta: i = {}, backgroundColor: a } = e, c = t, f = !1, l = !1;
		if (aa(t)) {
			let k = (ca(t).match(/<svg\b[^>]*>/i) || [])[0] || "", R = parseFloat((k.match(/\bwidth="([\d.]+)/i) || [])[1]), $ = parseFloat((k.match(/\bheight="([\d.]+)/i) || [])[1]), T = Number.isFinite(R) && Number.isFinite($) && R > 0 && $ > 0 && Math.min(1, gt / R, gt / $, Math.sqrt(hn / (R * $))) < 1;
			if (T || q()) try {
				let O = Le(t);
				if (q()) {
					let W = await Ne(O);
					O = W.svg, f = W.naturalOnly, l = /@font-face|data:image\//i.test(O);
				}
				T && (O = sa(O)), c = Pe(O);
			} catch {
				c = t;
			}
		}
		let d = new Image();
		d.loading = "eager", d.decoding = "sync", d.crossOrigin = "anonymous", d.src = c, await d.decode(), q() && await ha(d, l);
		let u = d.naturalWidth, p = d.naturalHeight, h = Number.isFinite(i.vbW) ? i.vbW : Number.isFinite(i.w0) ? i.w0 : u, m = Number.isFinite(i.vbH) ? i.vbH : Number.isFinite(i.h0) ? i.h0 : p, g, y, b = Number.isFinite(n), S = Number.isFinite(r);
		if (b && S) g = Math.max(1, n), y = Math.max(1, r);
		else if (b) {
			let k = n / Math.max(1, h);
			g = n, y = m * k;
		} else if (S) {
			let k = r / Math.max(1, m);
			y = r, g = h * k;
		} else g = u, y = p;
		g = g * o, y = y * o;
		let w = g * s, v = y * s, C = Math.max(w / gt, v / gt, Math.sqrt(w * v / hn));
		C > 1 && (console.warn(`[snapDOM] Output ${Math.round(w)}\xD7${Math.round(v)}px exceeds the browser canvas limit (${gt}px/side); downscaling. Lower \`scale\`/\`dpr\` or set \`width\`/\`height\`.`), g /= C, y /= C);
		let M = document.createElement("canvas");
		M.width = g * s, M.height = y * s, M.style.width = `${g}px`, M.style.height = `${y}px`;
		let A = M.getContext("2d");
		if (s !== 1 && A.scale(s, s), a && (A.save(), A.fillStyle = a, A.fillRect(0, 0, g, y), A.restore()), f && (Math.round(g * s) !== u || Math.round(y * s) !== p)) {
			let k = document.createElement("canvas");
			k.width = u, k.height = p, k.getContext("2d").drawImage(d, 0, 0), A.drawImage(k, 0, 0, g, y);
		} else A.drawImage(d, 0, 0, g, y);
		return M;
	}
	var gt;
	var hn;
	var Te;
	var Vt = tt(() => {
		"use strict";
		Wt();
		gt = 16384, hn = 268435456;
		Te = null;
	});
	var Ie = {};
	qt(Ie, { rasterize: () => gn });
	async function gn(t, e) {
		let n = await Ft(t, e), r = await new Promise((s) => {
			let i = () => s(n.toDataURL(`image/${e.format}`, e.quality));
			try {
				n.toBlob((a) => {
					if (!a) return i();
					let c = new FileReader();
					c.onload = () => s(String(c.result || "")), c.onerror = i, c.readAsDataURL(a);
				}, `image/${e.format}`, e.quality);
			} catch {
				i();
			}
		}), o = new Image();
		return o.src = r, await o.decode(), o.style.width = `${n.width / e.dpr}px`, o.style.height = `${n.height / e.dpr}px`, o;
	}
	var ie = tt(() => {
		"use strict";
		Vt();
	});
	var yn = {};
	qt(yn, {
		toImg: () => ga,
		toSvg: () => ga
	});
	async function ga(t, e) {
		let { scale: n = 1, width: r, height: o, meta: s = {} } = e, i = Number.isFinite(r), a = Number.isFinite(o), c = Number.isFinite(n) && n !== 1 || i || a;
		if (q() && c) try {
			let { svg: l } = await Ne(Le(t)), d = (l.match(/<svg\b[^>]*>/i) || [])[0] || "", u = parseFloat((d.match(/\bwidth="([\d.]+)/i) || [])[1]), p = parseFloat((d.match(/\bheight="([\d.]+)/i) || [])[1]);
			if (!Number.isFinite(u) || !Number.isFinite(p)) throw new Error("svg without dimensions");
			let h = Number.isFinite(s.vbW) ? s.vbW : Number.isFinite(s.w0) ? s.w0 : u, m = Number.isFinite(s.vbH) ? s.vbH : Number.isFinite(s.h0) ? s.h0 : p, g, y;
			i && a ? (g = r, y = o) : i ? (g = r, y = Math.round(m * (r / Math.max(1, h)))) : a ? (y = o, g = Math.round(h * (o / Math.max(1, m)))) : (g = Math.round(u * n), y = Math.round(p * n));
			let b = l.replace(/width="[^"]*"/, `width="${g}"`).replace(/height="[^"]*"/, `height="${y}"`), S = new Image();
			return S.decoding = "sync", S.loading = "eager", S.src = Pe(b), await S.decode(), S.style.width = `${g}px`, S.style.height = `${y}px`, S;
		} catch (l) {
			return _(e, "safari vector toImg failed, falling back to PNG", l), gn(t, {
				...e,
				format: "png",
				quality: 1,
				meta: s
			});
		}
		let f = new Image();
		if (f.decoding = "sync", f.loading = "eager", f.src = t, await f.decode(), i && a) f.style.width = `${r}px`, f.style.height = `${o}px`;
		else if (i) {
			let l = Number.isFinite(s.vbW) ? s.vbW : Number.isFinite(s.w0) ? s.w0 : f.naturalWidth, d = Number.isFinite(s.vbH) ? s.vbH : Number.isFinite(s.h0) ? s.h0 : f.naturalHeight, u = r / Math.max(1, l);
			f.style.width = `${r}px`, f.style.height = `${Math.round(d * u)}px`;
		} else if (a) {
			let l = Number.isFinite(s.vbW) ? s.vbW : Number.isFinite(s.w0) ? s.w0 : f.naturalWidth, d = Number.isFinite(s.vbH) ? s.vbH : Number.isFinite(s.h0) ? s.h0 : f.naturalHeight, u = o / Math.max(1, d);
			f.style.height = `${o}px`, f.style.width = `${Math.round(l * u)}px`;
		} else {
			let l = Math.round(f.naturalWidth * n), d = Math.round(f.naturalHeight * n);
			if (f.style.width = `${l}px`, f.style.height = `${d}px`, typeof t == "string" && t.startsWith("data:image/svg+xml")) try {
				let p = decodeURIComponent(t.split(",")[1]).replace(/width="[^"]*"/, `width="${l}"`).replace(/height="[^"]*"/, `height="${d}"`);
				t = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(p)}`, f.src = t;
			} catch (u) {
				_(e, "SVG width/height patch in toImg failed", u);
			}
		}
		return f;
	}
	var bn = tt(() => {
		"use strict";
		et();
		ie();
		Vt();
	});
	var Ao = {};
	qt(Ao, { toBlob: () => wn });
	async function wn(t, e) {
		let n = e.type;
		if (n === "svg") {
			let o = decodeURIComponent(t.split(",")[1]);
			return new Blob([o], { type: "image/svg+xml" });
		}
		let r = await Ft(t, e);
		return new Promise((o) => r.toBlob((s) => o(s), `image/${n}`, e.quality));
	}
	var xn = tt(() => {
		"use strict";
		Vt();
	});
	var Mo = {};
	qt(Mo, { download: () => ya });
	async function ko(t, e) {
		let n = new File([t], e, { type: t.type });
		if (!navigator.canShare?.({ files: [n] })) return !1;
		try {
			await navigator.share({
				files: [n],
				title: e
			});
		} catch (r) {
			if (r.name !== "AbortError") return !1;
		}
		return !0;
	}
	async function ya(t, e) {
		let n = new Set([
			"png",
			"jpeg",
			"jpg",
			"webp",
			"svg"
		]), r = (e?.type || "").toLowerCase(), o = n.has(r) ? r : "", s = (e?.format || o || "").toLowerCase(), i = s === "jpg" ? "jpeg" : s || "png", a = e?.filename || `snapdom.${i}`, c = {
			...e || {},
			format: i,
			type: i
		};
		c.dpr = 1;
		let f = je();
		if (i === "svg") {
			let u = await wn(t, {
				...c,
				type: "svg"
			});
			if (f && await ko(u, a)) return;
			let p = URL.createObjectURL(u), h = document.createElement("a");
			h.href = p, h.download = a, document.body.appendChild(h), h.click(), URL.revokeObjectURL(p), h.remove();
			return;
		}
		let l = await Ft(t, c);
		if (f) {
			let u = `image/${i}`, p = await new Promise((h) => l.toBlob(h, u, e?.quality));
			if (p && await ko(p, a)) return;
		}
		let d = document.createElement("a");
		d.href = l.toDataURL(`image/${i}`, e?.quality), d.download = a, document.body.appendChild(d), d.click(), d.remove();
	}
	var Eo = tt(() => {
		"use strict";
		xn();
		Vt();
		Wt();
	});
	et();
	et();
	J();
	var Ge = new WeakMap();
	var Qt = new Map();
	var ri = 2e3;
	var ye = 0;
	function ge() {
		ye++, Qt.size > ri && Qt.clear();
	}
	var oi = "[data-snapdom-sandbox],[data-snapdom-internal],[data-snapdom]";
	function Xe(t) {
		let e = t && (t.nodeType === 1 ? t : t.parentElement);
		return !!(e && e.closest && e.closest(oi));
	}
	function Ye(t) {
		for (let e of t) if (!Xe(e.target)) {
			if (e.type === "childList") {
				let n = !0;
				for (let r of e.addedNodes) if (!Xe(r)) {
					n = !1;
					break;
				}
				if (n) {
					for (let r of e.removedNodes) if (!Xe(r)) {
						n = !1;
						break;
					}
				}
				if (n) continue;
			}
			return !0;
		}
		return !1;
	}
	var _n = !1;
	function ii(t = document.documentElement) {
		if (_n) return;
		_n = !0;
		let e = (n) => {
			Ye(n) && ge();
		};
		try {
			new MutationObserver(e).observe(t, {
				subtree: !0,
				childList: !0,
				characterData: !0,
				attributes: !0
			});
		} catch {}
		try {
			new MutationObserver(e).observe(document.head, {
				subtree: !0,
				childList: !0,
				characterData: !0,
				attributes: !0
			});
		} catch {}
		try {
			let n = document.fonts;
			n && (n.addEventListener?.("loadingdone", ge), n.ready?.then(() => ge()).catch(() => {}));
		} catch {}
	}
	var si = [
		"mask",
		"mask-image",
		"-webkit-mask",
		"-webkit-mask-image",
		"mask-source",
		"mask-box-image-source",
		"mask-border-source",
		"-webkit-mask-box-image-source",
		"border-image",
		"border-image-source"
	];
	function Ke(t) {
		let e = Ge.get(t);
		if (e && e.epoch === ye) {
			let n = e.snapshot && e.snapshot.__needsBgInline;
			if (n !== void 0) return n;
		}
		return !0;
	}
	function ai(t, e = {}) {
		let n = {}, r = t.getPropertyValue("visibility"), o = e.excludeStyleProps;
		for (let u = 0; u < t.length; u++) {
			let p = t[u];
			if (Yt(p) || o && (o instanceof RegExp && o.test(p) || typeof o == "function" && o(p))) continue;
			let h = t.getPropertyValue(p);
			(p === "background-image" || p === "content") && h.includes("url(") && !h.includes("data:") && (h = "none"), n[p] = h;
		}
		for (let u of [
			"text-decoration-line",
			"text-decoration-color",
			"text-decoration-style",
			"text-decoration-thickness",
			"text-underline-offset",
			"text-decoration-skip-ink"
		]) if (!n[u]) try {
			let p = t.getPropertyValue(u);
			p && (n[u] = p);
		} catch {}
		for (let u of [
			"-webkit-text-stroke",
			"-webkit-text-stroke-width",
			"-webkit-text-stroke-color",
			"paint-order"
		]) if (!n[u]) try {
			let p = t.getPropertyValue(u);
			p && (n[u] = p);
		} catch {}
		if (e.embedFonts) {
			for (let p of [
				"font-feature-settings",
				"font-variation-settings",
				"font-kerning",
				"font-variant",
				"font-variant-ligatures",
				"font-optical-sizing"
			]) if (!n[p]) try {
				let h = t.getPropertyValue(p);
				h && (n[p] = h);
			} catch {}
		}
		r === "hidden" && (n.opacity = "0");
		try {
			(n["content-visibility"] || t.getPropertyValue("content-visibility")) === "hidden" && (n.visibility = "hidden");
		} catch {}
		let a = !1;
		{
			let u = t.getPropertyValue("background-image");
			if (u && u !== "none" && (a = !0), !a) {
				let p = t.getPropertyValue("background-color");
				p && p !== "rgba(0, 0, 0, 0)" && p !== "transparent" && (a = !0);
			}
			if (!a) for (let p of si) {
				let h = t.getPropertyValue(p);
				if (h && h !== "none") {
					a = !0;
					break;
				}
			}
			if (!a) {
				let p = t.getPropertyValue("background");
				p && /url\s*\(/i.test(p) && (a = !0);
			}
		}
		Object.defineProperty(n, "__needsBgInline", {
			value: a,
			enumerable: !1
		});
		let c = parseFloat(t.getPropertyValue("border-top-width") || 0) || 0, f = parseFloat(t.getPropertyValue("border-right-width") || 0) || 0, l = parseFloat(t.getPropertyValue("border-bottom-width") || 0) || 0, d = parseFloat(t.getPropertyValue("border-left-width") || 0) || 0;
		if (c === 0 && f === 0 && l === 0 && d === 0) {
			let u = (t.getPropertyValue("border-image-source") || "").trim(), p = u && u !== "none";
			for (let m of [
				"border",
				"border-top",
				"border-right",
				"border-bottom",
				"border-left",
				"border-width",
				"border-style",
				"border-color",
				"border-top-width",
				"border-top-style",
				"border-top-color",
				"border-right-width",
				"border-right-style",
				"border-right-color",
				"border-bottom-width",
				"border-bottom-style",
				"border-bottom-color",
				"border-left-width",
				"border-left-style",
				"border-left-color",
				"border-block",
				"border-block-width",
				"border-block-style",
				"border-block-color",
				"border-inline",
				"border-inline-width",
				"border-inline-style",
				"border-inline-color"
			]) delete n[m];
			p || (n.border = "none");
		}
		return n;
	}
	function ci(t) {
		for (let e = t.firstChild; e; e = e.nextSibling) {
			if (e.nodeType === 3 && /\S/.test(e.nodeValue || "")) return !0;
			if (e.nodeType === 1) {
				let n = L(e).position;
				if (n !== "absolute" && n !== "fixed") return !0;
			}
		}
		return !1;
	}
	var Wn = new WeakMap();
	function li(t) {
		let e = Wn.get(t);
		return e || (e = Object.entries(t).sort((r, o) => r[0] < o[0] ? -1 : r[0] > o[0] ? 1 : 0).map(([r, o]) => `${r}:${o}`).join(";"), Wn.set(t, e), e);
	}
	function fi(t, e = null, n = {}) {
		let r = Ge.get(t), o = !!(n && n.embedFonts), s = n && n.excludeStyleProps || null;
		if (r && r.epoch === ye && r.embedFonts === o && r.excludeStyleProps === s) return r.snapshot;
		let i = e || getComputedStyle(t), a = ai(i, n);
		return gi(t, i, a), Ge.set(t, {
			epoch: ye,
			snapshot: a,
			embedFonts: o,
			excludeStyleProps: s
		}), a;
	}
	function ui(t, e) {
		return t && t.session && t.persist ? t : t && (t.styleMap || t.styleCache || t.nodeMap) ? {
			session: t,
			persist: {
				snapshotKeyCache: Qt,
				defaultStyle: x.defaultStyle,
				baseStyle: x.baseStyle,
				image: x.image,
				resource: x.resource,
				background: x.background,
				font: x.font
			},
			options: e || {}
		} : {
			session: x.session,
			persist: {
				snapshotKeyCache: Qt,
				defaultStyle: x.defaultStyle,
				baseStyle: x.baseStyle,
				image: x.image,
				resource: x.resource,
				background: x.background,
				font: x.font
			},
			options: t || e || {}
		};
	}
	function di(t, e, n) {
		if (!(!t.style || t.style.length === 0)) for (let r = 0; r < t.style.length; r++) {
			let o = t.style[r], s = n.getPropertyValue(o);
			s && e.style.setProperty(o, s);
		}
	}
	async function nt(t, e, n, r) {
		if (t.tagName === "STYLE") return;
		let o = ui(n, r), s = o.options && o.options.cache || "auto";
		s !== "disabled" && ii(document.documentElement), s === "disabled" && !o.session.__bumpedForDisabled && (ge(), Qt.clear(), o.session.__bumpedForDisabled = !0);
		let { session: i, persist: a } = o;
		if (!i.styleCache.has(t)) {
			let g = null;
			try {
				g = getComputedStyle(t);
			} catch {}
			i.styleCache.set(t, g || getComputedStyle(document.documentElement));
		}
		let c = i.styleCache.get(t);
		t.getAttribute?.("style") && di(t, e, c);
		let f = c.getPropertyValue("animation-name");
		e && e.style && f && f !== "none" && e.style.setProperty("animation", "none", "important");
		let l = fi(t, c, o.options), d = On(t);
		if (d) {
			let g = c.getPropertyValue("min-width");
			(!g || g === "auto" || g === "0px") && (l["min-width"] = "0px");
		}
		let u = t.tagName?.toLowerCase() || "div", p = li(l), h = !0;
		if (me(u, (l.display || "").toLowerCase())) {
			h = ci(t), p = `${p}|${u}${h ? "|c" : ""}${d ? "|f" : ""}`;
			let g = l["text-wrap-mode"] || l["white-space"] || "";
			h && g !== "nowrap" && g !== "pre" && (i.reconcileRisk = (i.reconcileRisk || 0) + 1);
		}
		let m = a.snapshotKeyCache.get(p);
		m === void 0 && (m = It(l, u, h, d), a.snapshotKeyCache.set(p, m)), i.styleMap.set(e, m);
	}
	function pi(t) {
		return t instanceof HTMLImageElement || t instanceof HTMLCanvasElement || t instanceof HTMLVideoElement || t instanceof HTMLIFrameElement || t instanceof SVGElement || t instanceof HTMLObjectElement || t instanceof HTMLEmbedElement;
	}
	function mi(t) {
		return t.backgroundImage && t.backgroundImage !== "none" || t.backgroundColor && t.backgroundColor !== "rgba(0, 0, 0, 0)" && t.backgroundColor !== "transparent" || (parseFloat(t.borderTopWidth) || 0) > 0 || (parseFloat(t.borderBottomWidth) || 0) > 0 || (parseFloat(t.paddingTop) || 0) > 0 || (parseFloat(t.paddingBottom) || 0) > 0 ? !0 : (t.overflowBlock || t.overflowY || "visible") !== "visible";
	}
	function On(t) {
		let e = t.parentElement;
		if (!e) return !1;
		let n = L(e).display || "";
		return n.includes("flex") || n.includes("grid");
	}
	function hi(t) {
		for (let r = t.firstChild; r; r = r.nextSibling) if (r.nodeType === 3 && /\S/.test(r.nodeValue)) return !0;
		let e = t.firstElementChild, n = t.lastElementChild;
		if (e && e.tagName === "BR" || n && n.tagName === "BR") return !0;
		for (let r = t.firstElementChild; r; r = r.nextElementSibling) {
			let o = L(r);
			if (o.display === "none") continue;
			let s = o.position;
			if (s !== "absolute" && s !== "fixed") return !0;
		}
		return !1;
	}
	function gi(t, e, n) {
		if (t instanceof HTMLElement && t.style && t.style.height) return;
		let r = t.tagName && t.tagName.toLowerCase();
		if (!r || ![
			"div",
			"section",
			"article",
			"main",
			"aside",
			"header",
			"footer",
			"nav"
		].includes(r)) return;
		let s = parseFloat(e.height);
		if (Number.isFinite(s) && t.scrollHeight > 0 && Math.abs(s - t.scrollHeight) > 2 || e.aspectRatio && e.aspectRatio !== "none" && e.aspectRatio !== "auto") return;
		let a = e.display || "";
		if (a.includes("flex") || a.includes("grid") || pi(t)) return;
		let c = e.position;
		if (c === "absolute" || c === "fixed" || c === "sticky" || e.transform !== "none" || mi(e) || On(t)) return;
		let f = e.overflowX || e.overflow || "visible", l = e.overflowY || e.overflow || "visible";
		if (f !== "visible" || l !== "visible") return;
		let d = e.clip;
		d && d !== "auto" && d !== "rect(auto, auto, auto, auto)" || e.visibility === "hidden" || e.opacity === "0" || hi(t) && (delete n.height, delete n["block-size"]);
	}
	Kt();
	var Un = [
		"fill",
		"stroke",
		"color",
		"background-color",
		"stop-color"
	];
	var yi = new Set([
		"symbol",
		"defs",
		"pattern",
		"marker",
		"linearGradient",
		"radialGradient",
		"filter"
	]);
	function be(t) {
		let e = t;
		for (; e && e.nodeType === 1;) {
			if (e.namespaceURI === "http://www.w3.org/2000/svg") {
				if (e.localName === "mask" || e.localName === "clipPath") return !1;
				if (yi.has(e.localName)) return !0;
			}
			e = e.parentNode;
		}
		return !1;
	}
	var Bn = new Map();
	function bi(t, e) {
		let n = e + "::" + t.toLowerCase(), r = Bn.get(n);
		if (r) return r;
		let o = document, s = e === "http://www.w3.org/2000/svg" ? o.createElementNS(e, t) : o.createElement(t), i = o.createElement("div");
		i.setAttribute("data-snapdom-internal", ""), i.style.cssText = "position:absolute;left:-99999px;top:-99999px;contain:strict;display:block;", i.appendChild(s), o.documentElement.appendChild(i);
		let a = getComputedStyle(s), c = {};
		for (let f of Un) c[f] = a.getPropertyValue(f) || "";
		return i.remove(), Bn.set(n, c), c;
	}
	function Dn(t, e) {
		if (t?.nodeType !== 1 || e?.nodeType !== 1 || be(t)) return;
		let n = t.getAttribute?.("style"), r = !!(n && n.includes("var("));
		if (!r && t.attributes?.length) {
			let s = t.attributes;
			for (let i = 0; i < s.length; i++) {
				let a = s[i];
				if (a && typeof a.value == "string" && a.value.includes("var(")) {
					r = !0;
					break;
				}
			}
		}
		let o = null;
		if (r) try {
			o = getComputedStyle(t);
		} catch {}
		if (r) {
			let s = t.style;
			if (s && s.length) {
				let i = new Set();
				for (let a = 0; a < s.length; a++) {
					let c = s[a];
					if (i.has(c)) continue;
					i.add(c);
					let f = s.getPropertyValue(c);
					if (!f || !f.includes("var(")) continue;
					let l = o && o.getPropertyValue(c);
					if (l) try {
						e.style.setProperty(c, l.trim(), s.getPropertyPriority(c));
					} catch {}
				}
			}
		}
		if (r && t.attributes?.length) {
			let s = t.attributes;
			for (let i = 0; i < s.length; i++) {
				let a = s[i];
				if (!a || typeof a.value != "string" || !a.value.includes("var(")) continue;
				let c = a.name, f = o && o.getPropertyValue(c);
				if (f) try {
					e.style.setProperty(c, f.trim());
				} catch {}
			}
		}
		if (!r) {
			if (!o) try {
				o = getComputedStyle(t);
			} catch {
				o = null;
			}
			if (!o) return;
			let s = t.namespaceURI || "html", i = bi(t.tagName, s);
			for (let a of Un) {
				let c = o.getPropertyValue(a) || "", f = i[a] || "";
				if (c && c !== f) try {
					e.style.setProperty(a, c.trim());
				} catch {}
			}
		}
	}
	et();
	et();
	J();
	ht();
	ht();
	function $t(t) {
		return !!(!t || t.startsWith("data:") || t.startsWith("blob:") || /^data:image\/(gif|png|svg)/.test(t) && t.length < 200);
	}
	var Hn = "img[data-src], img[data-lazy-src], img[data-original], img[data-hi-res-src], img[data-srcset], img[data-lazy-srcset]";
	function wi(t, e) {
		return !t || t?.nodeType !== 1 ? !1 : t.matches?.("picture") || t.querySelector("picture") ? !0 : e ? !!(t.matches?.(Hn) || t.querySelector(Hn)) : !1;
	}
	var xi = /^image\/(jpeg|jpg|png|gif|webp|avif|apng|svg\+xml|bmp|x-icon|vnd\.microsoft\.icon)\s*(;|$)/i;
	function Ot(t, e) {
		if (!t) return null;
		let n = 0;
		try {
			n = e ? e.getBoundingClientRect().width || e.width : 0;
		} catch {}
		n || (n = window.innerWidth || 1e3);
		let r = [];
		for (let s of t.split(",")) {
			let i = s.trim().split(/\s+/);
			if (!i[0]) continue;
			let a = i[1] || "", c = 1;
			/^\d*\.?\d+x$/i.test(a) ? c = parseFloat(a) : /^\d+w$/i.test(a) && (c = parseInt(a, 10) / n), r.push({
				url: i[0],
				d: c
			});
		}
		if (!r.length) return null;
		r.sort((s, i) => s.d - i.d);
		let o = window.devicePixelRatio || 1;
		return (r.find((s) => s.d >= o) || r[r.length - 1]).url;
	}
	function Qe(t, e) {
		let n = t.currentSrc || "";
		if (n && !$t(n)) return n;
		let r = e.querySelectorAll("source[srcset]"), o = null;
		for (let s of r) {
			let i = s.getAttribute("srcset");
			if (!i || $t(i)) continue;
			let a = s.getAttribute("type");
			if (a && !xi.test(a.trim())) continue;
			let c = s.getAttribute("media");
			if (c) try {
				if (window.matchMedia(c).matches) return Ot(i, t);
			} catch {}
			o || (o = Ot(i, t));
		}
		return o;
	}
	function Si(t) {
		let e = [
			t.getAttribute("data-src"),
			t.getAttribute("data-lazy-src"),
			t.getAttribute("data-original"),
			t.getAttribute("data-hi-res-src")
		];
		for (let r of e) if (r && !$t(r)) return r;
		let n = t.getAttribute("data-srcset") || t.getAttribute("data-lazy-srcset");
		if (n) {
			let r = n.split(",")[0].trim().split(/\s+/)[0];
			if (r && !$t(r)) return r;
		}
		return null;
	}
	function vi(t = {}) {
		let e = t.pictureResolver && typeof t.pictureResolver == "object" ? t.pictureResolver : {};
		return {
			timeout: e.timeout ?? 5e3,
			concurrency: e.concurrency ?? 4,
			resolveLazySrc: e.resolveLazySrc !== !1,
			silent: e.silent ?? !1,
			useProxy: typeof t.useProxy == "string" ? t.useProxy : ""
		};
	}
	async function zn(t, e = {}) {
		if (!t || t?.nodeType !== 1 || e.resolvePicturePlaceholders === !1) return null;
		let { timeout: n, concurrency: r, resolveLazySrc: o, silent: s, useProxy: i } = vi(e);
		if (!wi(t, o)) return null;
		let a = [], c = [];
		async function f(u) {
			let p = await z(u, {
				as: "dataURL",
				timeout: n,
				useProxy: i,
				silent: !0
			});
			return p.ok ? p.data : null;
		}
		async function l(u) {
			for (let p = 0; p < u.length; p += r) {
				let h = u.slice(p, p + r);
				await Promise.allSettled(h.map((m) => m()));
			}
		}
		let d = Array.from(t.querySelectorAll("picture"));
		t.matches?.("picture") && d.unshift(t);
		for (let u of d) {
			let p = u.querySelector("img");
			if (!p) continue;
			if (!$t(p.getAttribute("src") || "")) continue;
			let m = Qe(p, u);
			m && c.push(async () => {
				let g = await f(m);
				if (!g) {
					s || console.warn(`[snapdom:picture-resolver] Failed to fetch: ${m.slice(0, 60)}`);
					return;
				}
				let y = p.getAttribute("src"), b = p.getAttribute("srcset"), S = p.getAttribute("sizes"), w = [];
				p.src = g, p.setAttribute("src", g), p.removeAttribute("srcset"), p.removeAttribute("sizes");
				let v = u.querySelectorAll("source");
				for (let C of v) w.push({
					el: C,
					parent: C.parentElement,
					next: C.nextSibling
				}), C.remove();
				a.push(() => {
					y !== null ? p.setAttribute("src", y) : p.removeAttribute("src"), b !== null && p.setAttribute("srcset", b), S !== null && p.setAttribute("sizes", S);
					for (let { el: C, parent: M, next: A } of w) M && M.insertBefore(C, A);
				});
			});
		}
		if (o) {
			let u = Array.from(t.querySelectorAll("img"));
			t.localName === "img" && u.unshift(t);
			for (let p of u) {
				if (p.closest("picture") && $t(p.getAttribute("src") || "")) continue;
				let h = p.getAttribute("src") || "", m = Si(p);
				m && $t(h) && c.push(async () => {
					let g = await f(m);
					if (!g) return;
					let y = p.getAttribute("src");
					p.src = g, p.setAttribute("src", g), p.removeAttribute("srcset"), p.removeAttribute("sizes"), a.push(() => {
						y !== null ? p.setAttribute("src", y) : p.removeAttribute("src");
					});
				});
			}
		}
		return c.length === 0 ? null : (await l(c), async function() {
			for (let p of a) try {
				p();
			} catch {}
		});
	}
	function Se(t, e, n) {
		return n ? Promise.all(t.map((r) => new Promise((o) => e(r, o)))) : Promise.all(t.map((r) => new Promise((o) => {
			function s() {
				Et((i) => {
					(i && typeof i.timeRemaining == "function" ? i.timeRemaining() > 0 : !0) ? e(r, o) : s();
				}, { fast: n });
			}
			s();
		})));
	}
	function Ci(t) {
		return t = t.trim(), !t || /:not\(\s*\[data-sd-slotted\]\s*\)\s*$/.test(t) ? t : `${t}:not([data-sd-slotted])`;
	}
	function Ai(t, e, n = !0) {
		return t.split(",").map((r) => r.trim()).filter(Boolean).map((r) => {
			if (r.startsWith(":where(") || r.startsWith("@")) return r;
			return `:where(${e} ${n ? Ci(r) : r})`;
		}).join(", ");
	}
	function jn(t, e) {
		return t ? (t = t.replace(/:host\(([^)]+)\)/g, (n, r) => `:where(${e}:is(${r.trim()}))`), t = t.replace(/:host\b/g, `:where(${e})`), t = t.replace(/:host-context\(([^)]+)\)/g, (n, r) => `:where(:where(${r.trim()}) ${e})`), t = t.replace(/::slotted\(([^)]+)\)/g, (n, r) => `:where(${e} ${r.trim()})`), t = t.replace(/(^|})(\s*)([^@}{]+){/g, (n, r, o, s) => {
			return `${r}${o}${Ai(s, e, !0)}{`;
		}), t) : "";
	}
	function qn(t) {
		return t.shadowScopeSeq = (t.shadowScopeSeq || 0) + 1, `s${t.shadowScopeSeq}`;
	}
	function Xn(t) {
		let e = "";
		try {
			t.querySelectorAll("style").forEach((r) => {
				e += (r.textContent || "") + `
`;
			});
			let n = t.adoptedStyleSheets || [];
			for (let r of n) try {
				if (r && r.cssRules) for (let o of r.cssRules) e += o.cssText + `
`;
			} catch {}
		} catch {}
		return e;
	}
	function Gn(t, e, n) {
		if (!e) return;
		let r = document.createElement("style");
		r.setAttribute("data-sd", n), r.textContent = e, t.insertBefore(r, t.firstChild || null);
	}
	function Yn(t, e) {
		try {
			let n = null, r = L(t).content;
			if (r && r.includes("url(")) {
				let i = r.match(/url\(["']?([^"')]+)["']?\)/);
				i && (n = i[1]);
			}
			let o = t.closest?.("picture"), s = n || (o ? Qe(t, o) : t.currentSrc) || t.src || Ot(t.getAttribute("srcset"), t) || "";
			if (!s) return;
			e.setAttribute("src", s), e.removeAttribute("srcset"), e.removeAttribute("sizes"), e.loading = "eager", e.decoding = "sync";
		} catch {}
	}
	function Kn(t) {
		let e = new Set();
		if (!t) return e;
		let n = /var\(\s*(--[A-Za-z0-9_-]+)\b/g, r;
		for (; r = n.exec(t);) e.add(r[1]);
		return e;
	}
	function ki(t, e) {
		try {
			let r = getComputedStyle(t).getPropertyValue(e).trim();
			if (r) return r;
		} catch {}
		try {
			let r = getComputedStyle(document.documentElement).getPropertyValue(e).trim();
			if (r) return r;
		} catch {}
		return "";
	}
	function Qn(t, e, n) {
		let r = [];
		for (let o of e) {
			let s = ki(t, o);
			s && r.push(`${o}: ${s};`);
		}
		return r.length ? `${n}{${r.join("")}}
` : "";
	}
	function Jn(t) {
		t && (t.nodeType === Node.ELEMENT_NODE && t.setAttribute("data-sd-slotted", ""), t.querySelectorAll && t.querySelectorAll("*").forEach((e) => e.setAttribute("data-sd-slotted", "")));
	}
	async function Mi(t, e = 3) {
		let n = () => {
			try {
				return t.contentDocument || t.contentWindow?.document || null;
			} catch {
				return null;
			}
		}, r = n(), o = 0;
		for (; o < e && (!r || !r.body && !r.documentElement);) await new Promise((s) => setTimeout(s, 0)), r = n(), o++;
		return r && (r.body || r.documentElement) ? r : null;
	}
	function Ei(t) {
		let e = t.getBoundingClientRect(), n = 0, r = 0, o = 0, s = 0;
		try {
			let c = getComputedStyle(t);
			n = parseFloat(c.borderLeftWidth) || 0, r = parseFloat(c.borderRightWidth) || 0, o = parseFloat(c.borderTopWidth) || 0, s = parseFloat(c.borderBottomWidth) || 0;
		} catch {}
		return {
			contentWidth: Math.max(0, Math.round(e.width - (n + r))),
			contentHeight: Math.max(0, Math.round(e.height - (o + s))),
			rect: e
		};
	}
	function it(t) {
		let e = 0, n = 0;
		if (t.offsetWidth > 0 && (e = t.offsetWidth), t.offsetHeight > 0 && (n = t.offsetHeight), e === 0 || n === 0) try {
			let r = getComputedStyle(t);
			if (e === 0) {
				let o = parseFloat(r.width);
				!isNaN(o) && o > 0 && (e = o);
			}
			if (n === 0) {
				let o = parseFloat(r.height);
				!isNaN(o) && o > 0 && (n = o);
			}
		} catch {}
		if (e === 0 || n === 0) try {
			if (e === 0) {
				let r = parseFloat(t.getAttribute("width"));
				!isNaN(r) && r > 0 && (e = r);
			}
			if (n === 0) {
				let r = parseFloat(t.getAttribute("height"));
				!isNaN(r) && r > 0 && (n = r);
			}
		} catch {}
		if ((e === 0 || n === 0) && (t.naturalWidth || t.naturalHeight)) try {
			e === 0 && t.naturalWidth > 0 && (e = t.naturalWidth), n === 0 && t.naturalHeight > 0 && (n = t.naturalHeight);
		} catch {}
		return {
			width: e,
			height: n
		};
	}
	function $i(t, e, n) {
		let r = t.defaultView, o = r ? r.scrollX : 0, s = r ? r.scrollY : 0, i = t.body ? t.body.scrollLeft : 0, a = t.body ? t.body.scrollTop : 0, c = t.documentElement ? t.documentElement.scrollLeft : 0, f = t.documentElement ? t.documentElement.scrollTop : 0, l = 0, d = 0, u = 0, p = 0;
		try {
			let m = r && t.body ? r.getComputedStyle(t.body) : null;
			m && (l = (parseFloat(m.marginTop) || 0) + (parseFloat(m.paddingTop) || 0), d = (parseFloat(m.marginRight) || 0) + (parseFloat(m.paddingRight) || 0), u = (parseFloat(m.marginBottom) || 0) + (parseFloat(m.paddingBottom) || 0), p = (parseFloat(m.marginLeft) || 0) + (parseFloat(m.paddingLeft) || 0));
		} catch {}
		try {
			t.documentElement.setAttribute("data-sd-pinned", "");
		} catch {}
		let h = t.createElement("style");
		return h.setAttribute("data-sd-iframe-pin", ""), h.textContent = `html {margin: 0 !important;padding: 0 !important;width: ${e}px !important;height: ${n}px !important;min-width: ${e}px !important;min-height: ${n}px !important;box-sizing: border-box !important;overflow: hidden !important;background-clip: border-box !important;}body {margin: 0 !important;padding: ${l}px ${d}px ${u}px ${p}px !important;width: ${e}px !important;height: ${n}px !important;min-width: ${e}px !important;min-height: ${n}px !important;box-sizing: border-box !important;overflow: hidden !important;background-clip: border-box !important;}`, (t.head || t.documentElement).appendChild(h), () => {
			try {
				h.remove();
			} catch {}
			try {
				t.documentElement.removeAttribute("data-sd-pinned");
			} catch {}
			try {
				r && typeof r.scrollTo == "function" && r.scrollTo(o, s), t.body && (t.body.scrollLeft = i, t.body.scrollTop = a), t.documentElement && (t.documentElement.scrollLeft = c, t.documentElement.scrollTop = f);
			} catch {}
		};
	}
	async function Zn(t, e, n) {
		let r = await Mi(t, 3);
		if (!r) throw new Error("iframe document not accessible/ready");
		let { contentWidth: o, contentHeight: s, rect: i } = Ei(t), a = n?.snap;
		if (!a && typeof window < "u" && window.snapdom && (a = window.snapdom), !a || typeof a.toPng != "function") throw new Error("[snapdom] iframe capture requires snapdom.toPng. Use snapdom(el) or pass options.snap. With ESM, assign window.snapdom = snapdom after import if using iframes.");
		let c = {
			...n,
			scale: 1,
			clip: null
		}, f = $i(r, o, s), l = x.session.nodeMap, d = x.session.styleMap, u = x.session.styleCache, p;
		try {
			p = await a.toPng(r.documentElement, c);
		} finally {
			f(), x.session.nodeMap = l, x.session.styleMap = d, x.session.styleCache = u;
		}
		p.style.display = "block", p.style.width = `${o}px`, p.style.height = `${s}px`;
		let h = document.createElement("div");
		return e.nodeMap.set(h, t), nt(t, h, e, n), h.style.overflow = "hidden", h.style.display = "block", h.style.width || (h.style.width = `${Math.round(i.width)}px`), h.style.height || (h.style.height = `${Math.round(i.height)}px`), h.appendChild(p), h;
	}
	function tr(t) {
		let { width: e, height: n } = it(t), r = t.getBoundingClientRect(), o;
		try {
			o = window.getComputedStyle(t);
		} catch {}
		let s = o ? parseFloat(o.width) : NaN, i = o ? parseFloat(o.height) : NaN, a = Math.round(e || r.width || 0), c = Math.round(n || r.height || 0), f = Number.isFinite(s) && s > 0 ? Math.round(s) : Math.max(12, a || 16), l = Number.isFinite(i) && i > 0 ? Math.round(i) : Math.max(12, c || 16), d = (t.type || "text").toLowerCase() === "checkbox", u = !!t.checked, p = !!t.indeterminate, m = Math.max(Math.min(f, l), 12), g = "middle";
		try {
			o && o.verticalAlign && (g = o.verticalAlign);
		} catch {}
		let y = document.createElement("div");
		y.setAttribute("data-snapdom-input-replacement", t.type || "checkbox"), y.style.cssText = `display:inline-block;width:${m}px;height:${m}px;vertical-align:${g};flex-shrink:0;line-height:0;`;
		let b = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		b.setAttribute("width", String(m)), b.setAttribute("height", String(m)), b.setAttribute("viewBox", `0 0 ${m} ${m}`), y.appendChild(b);
		function S() {
			let w = "#0a6ed1";
			try {
				o && (w = o.accentColor || o.color || w);
			} catch {}
			let v = 2, C = v / 2, M = m - v;
			if (b.innerHTML = "", d) {
				let A = document.createElementNS("http://www.w3.org/2000/svg", "rect");
				if (A.setAttribute("x", String(C)), A.setAttribute("y", String(C)), A.setAttribute("width", String(M)), A.setAttribute("height", String(M)), A.setAttribute("rx", "2"), A.setAttribute("ry", "2"), A.setAttribute("fill", u ? w : "none"), A.setAttribute("stroke", w), A.setAttribute("stroke-width", String(v)), b.appendChild(A), u) {
					let k = document.createElementNS("http://www.w3.org/2000/svg", "path");
					k.setAttribute("d", `M 3 ${m / 2} L ${m / 2 - 1} ${m - C - 2} L ${m - C - 2} 3`), k.setAttribute("stroke", "white"), k.setAttribute("stroke-width", String(Math.max(1.5, v))), k.setAttribute("fill", "none"), k.setAttribute("stroke-linecap", "round"), k.setAttribute("stroke-linejoin", "round"), b.appendChild(k);
				} else if (p) {
					let k = document.createElementNS("http://www.w3.org/2000/svg", "rect"), R = Math.max(6, M - 4);
					k.setAttribute("x", String((m - R) / 2)), k.setAttribute("y", String((m - v) / 2)), k.setAttribute("width", String(R)), k.setAttribute("height", String(v)), k.setAttribute("fill", w), k.setAttribute("rx", "1"), b.appendChild(k);
				}
			} else {
				let A = document.createElementNS("http://www.w3.org/2000/svg", "circle");
				if (A.setAttribute("cx", String(m / 2)), A.setAttribute("cy", String(m / 2)), A.setAttribute("r", String((m - v) / 2)), A.setAttribute("fill", u ? w : "none"), A.setAttribute("stroke", w), A.setAttribute("stroke-width", String(v)), b.appendChild(A), u) {
					let k = document.createElementNS("http://www.w3.org/2000/svg", "circle"), R = Math.max(2, (m - 4) * .35);
					k.setAttribute("cx", String(m / 2)), k.setAttribute("cy", String(m / 2)), k.setAttribute("r", String(R)), k.setAttribute("fill", "white"), b.appendChild(k);
				}
			}
			y.style.setProperty("width", `${m}px`, "important"), y.style.setProperty("height", `${m}px`, "important"), y.style.setProperty("min-width", `${m}px`, "important"), y.style.setProperty("min-height", `${m}px`, "important");
		}
		return S(), {
			el: y,
			applyVisual: S
		};
	}
	var Jt = new j(80);
	async function Zt(t) {
		if (x.resource?.has(t)) return x.resource.get(t);
		if (Jt.has(t)) return Jt.get(t);
		let e = (async () => {
			let n = await z(t, {
				as: "dataURL",
				silent: !0
			});
			if (!n.ok || typeof n.data != "string") throw new Error(`[snapDOM] Failed to read blob URL: ${t}`);
			return x.resource?.set(t, n.data), n.data;
		})();
		Jt.set(t, e);
		try {
			let n = await e;
			return Jt.set(t, n), n;
		} catch (n) {
			throw Jt.delete(t), n;
		}
	}
	var Fi = /\bblob:[^)"'\s]+/g;
	async function Vn(t) {
		if (!t || t.indexOf("blob:") === -1) return t;
		let e = Array.from(new Set(t.match(Fi) || []));
		if (e.length === 0) return t;
		let n = t;
		for (let r of e) try {
			let o = await Zt(r);
			n = n.split(r).join(o);
		} catch {}
		return n;
	}
	function we(t) {
		return typeof t == "string" && t.startsWith("blob:");
	}
	function Ri(t) {
		return (t || "").split(",").map((e) => e.trim()).filter(Boolean).map((e) => {
			let n = e.match(/^(\S+)(\s+.+)?$/);
			return n ? {
				url: n[1],
				desc: n[2] || ""
			} : null;
		}).filter(Boolean);
	}
	function Ti(t) {
		return t.map((e) => e.desc ? `${e.url} ${e.desc.trim()}` : e.url).join(", ");
	}
	function xe(t, e) {
		let n = t.querySelectorAll ? Array.from(t.querySelectorAll(e)) : [];
		return t.matches?.(e) && n.unshift(t), n;
	}
	async function er(t, e = null) {
		if (!t) return;
		let n = e, r = xe(t, "img");
		for (let c of r) try {
			let l = c.getAttribute("src") || c.currentSrc || "";
			if (we(l)) {
				let u = await Zt(l);
				c.setAttribute("src", u);
			}
			let d = c.getAttribute("srcset");
			if (d && d.includes("blob:")) {
				let u = Ri(d), p = !1;
				for (let h of u) if (we(h.url)) try {
					h.url = await Zt(h.url), p = !0;
				} catch (m) {
					_(n, "blobUrlToDataUrl for srcset item failed", m);
				}
				p && c.setAttribute("srcset", Ti(u));
			}
		} catch (f) {
			_(n, "resolveBlobUrls for img failed", f);
		}
		let o = xe(t, "image");
		for (let c of o) try {
			let f = "http://www.w3.org/1999/xlink", l = c.getAttribute("href") || c.getAttributeNS?.(f, "href");
			if (we(l)) {
				let d = await Zt(l);
				c.setAttribute("href", d), c.removeAttributeNS?.(f, "href");
			}
		} catch (f) {
			_(n, "resolveBlobUrls for SVG image href failed", f);
		}
		let s = xe(t, "[style*='blob:']");
		for (let c of s) try {
			let f = c.getAttribute("style");
			if (f && f.includes("blob:")) {
				let l = await Vn(f);
				c.setAttribute("style", l);
			}
		} catch (f) {
			_(n, "replaceBlobUrls in inline style failed", f);
		}
		let i = t.querySelectorAll ? t.querySelectorAll("style") : [];
		for (let c of i) try {
			let f = c.textContent || "";
			f.includes("blob:") && (c.textContent = await Vn(f));
		} catch (f) {
			_(n, "replaceBlobUrls in style tag failed", f);
		}
		for (let c of ["poster"]) {
			let f = xe(t, `[${c}^='blob:']`);
			for (let l of f) try {
				let d = l.getAttribute(c);
				we(d) && l.setAttribute(c, await Zt(d));
			} catch (d) {
				_(n, `resolveBlobUrls for ${c} failed`, d);
			}
		}
	}
	Wt();
	var Ze = new Map();
	var nr = new Set(["IFRAME"]);
	function Ce(t, e) {
		Ze.set(String(t).toUpperCase(), e);
	}
	function Je(t) {
		let { width: e, height: n } = it(t), r = e, o = n;
		if (!r || !o) {
			let i = t.getBoundingClientRect();
			r = r || i.width || 0, o = o || i.height || 0;
		}
		let s = document.createElement("div");
		return s.style.cssText = `display:inline-block;width:${r}px;height:${o}px;visibility:hidden;`, s;
	}
	var ve = 200;
	var Li = new Set([
		"img",
		"canvas",
		"video",
		"iframe",
		"object",
		"embed"
	]);
	function rr(t, e) {
		return t.right >= e.left - ve && t.left <= e.right + ve && t.bottom >= e.top - ve && t.top <= e.bottom + ve;
	}
	function Pi(t, e) {
		if (t === e.root) return !1;
		let n;
		try {
			n = t.getBoundingClientRect();
		} catch {
			return !1;
		}
		if (n.width === 0 && n.height === 0) return !1;
		let r = L(t);
		if (r.display === "inline" && !Li.has((t.localName || "").toLowerCase())) return !1;
		let o = e.rect, s = t.scrollWidth || 0, i = t.scrollHeight || 0, a = {
			left: r.direction === "rtl" ? Math.min(n.left, n.right - s) : n.left,
			top: n.top,
			right: Math.max(n.right, n.left + s),
			bottom: Math.max(n.bottom, n.top + i)
		}, c = r.writingMode || "";
		if ((c.startsWith("vertical") || c.startsWith("sideways")) && (a.top = Math.min(n.top, n.bottom - i), a.left = Math.min(a.left, n.right - s)), rr(a, o)) return !1;
		let f = (t.ownerDocument || document).createTreeWalker(t, NodeFilter.SHOW_ELEMENT);
		for (; f.nextNode();) {
			let l = f.currentNode.getBoundingClientRect();
			if ((l.width > 0 || l.height > 0) && rr(l, o)) return !1;
		}
		return !0;
	}
	function Ni(t, e, n) {
		let r = t.cloneNode(!1);
		t.tagName === "IMG" && (r.removeAttribute("src"), r.removeAttribute("srcset"), r.removeAttribute("sizes")), nt(t, r, e, n);
		let { width: o, height: s } = it(t);
		return o > 0 && (r.style.width = `${o}px`, r.style.minWidth = `${o}px`, r.style.maxWidth = `${o}px`), s > 0 && (r.style.height = `${s}px`, r.style.minHeight = `${s}px`, r.style.maxHeight = `${s}px`), r.style.visibility = "hidden", r.style.overflow = "hidden", r.style.boxSizing = "border-box", r;
	}
	async function te(t, e, n) {
		if (!t) throw new Error("Invalid node");
		let r = new Set(), o = null, s = null;
		if (t.nodeType === Node.ELEMENT_NODE) {
			let l = (t.localName || t.tagName || "").toLowerCase();
			if (t.id === "snapdom-sandbox" || t.hasAttribute("data-snapdom-sandbox") || ue.has(l)) return null;
			if (l === "foreignobject" && t.parentElement?.closest?.("foreignObject")) return _(e, "Nested <foreignObject> skipped (SVG spec limitation — not rendered by browsers)"), null;
			if (l === "source" && t.parentElement?.localName === "picture") return null;
		}
		if (t.nodeType === Node.TEXT_NODE || t.nodeType !== Node.ELEMENT_NODE) return t.cloneNode(!0);
		if (t.getAttribute("data-capture") === "exclude") {
			if (n.excludeMode === "hide") return Je(t);
			if (n.excludeMode === "remove") return null;
		}
		if (n.exclude && Array.isArray(n.exclude)) for (let l of n.exclude) try {
			if (t.matches?.(l)) {
				if (n.excludeMode === "hide") return Je(t);
				if (n.excludeMode === "remove") return null;
			}
		} catch (d) {
			console.warn(`Invalid selector in exclude option: ${l}`, d);
		}
		if (typeof n.filter == "function") try {
			if (!n.filter(t)) {
				if (n.filterMode === "hide") return Je(t);
				if (n.filterMode === "remove") return null;
			}
		} catch (l) {
			console.warn("Error in filter function:", l);
		}
		if (e.clip && Pi(t, e.clip)) return Ni(t, e, n);
		if (n.__resolveNodeHooks) for (let l of n.__resolveNodeHooks) {
			let d;
			try {
				d = await l(t, n);
			} catch (u) {
				_(e, "resolveNode plugin hook failed", u);
			}
			if (d === null) return null;
			if (d instanceof Node) return d.nodeType === Node.ELEMENT_NODE && (e.nodeMap.set(d, t), nt(t, d, e, n)), d;
		}
		{
			let l = nr.has(t.tagName) && Ze.get(t.tagName);
			if (l) {
				let d = await l(t, e, n);
				if (d !== void 0) return d;
			}
		}
		if (t.getAttribute("data-capture") === "placeholder") {
			let l = t.cloneNode(!1);
			e.nodeMap.set(l, t), nt(t, l, e, n);
			let d = document.createElement("div");
			return d.textContent = t.getAttribute("data-placeholder-text") || "", d.style.cssText = "color:#666;font-size:12px;text-align:center;line-height:1.4;padding:0.5em;box-sizing:border-box;", l.appendChild(d), l;
		}
		{
			let l = !nr.has(t.tagName) && Ze.get(t.tagName);
			if (l) {
				let d = await l(t, e, n);
				if (d !== void 0) return d;
			}
		}
		let i;
		try {
			if (i = t.cloneNode(!1), i.attributes?.length) try {
				for (let l of i.attributes) /[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFE\uFFFF]/.test(l.value) && i.setAttribute(l.name, l.value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFE\uFFFF]/g, ""));
			} catch {}
			if (Dn(t, i), e.nodeMap.set(i, t), t.tagName === "IMG") {
				Yn(t, i);
				try {
					let { width: l, height: d } = it(t), u = Math.round(l || 0), p = Math.round(d || 0);
					u && (i.dataset.snapdomWidth = String(u)), p && (i.dataset.snapdomHeight = String(p));
				} catch (l) {
					_(e, "getUnscaledDimensions for IMG failed", l);
				}
				try {
					let l = t.getAttribute("style") || "", d = window.getComputedStyle(t), u = (S) => {
						let w = l.match(new RegExp(`${S}\\s*:\\s*([^;]+)`, "i")), v = w ? w[1].trim() : d.getPropertyValue(S);
						return /%|auto/i.test(String(v || ""));
					}, p = parseInt(i.dataset.snapdomWidth || "0", 10), h = parseInt(i.dataset.snapdomHeight || "0", 10), m = u("width") || !p, g = u("height") || !h;
					m && p && (i.style.width = `${p}px`), g && h && (i.style.height = `${h}px`);
					let y = d.getPropertyValue("object-fit"), b = d.getPropertyValue("object-position");
					y && y !== "fill" ? (i.style.objectFit = y, b && (i.style.objectPosition = b)) : (p && (i.style.minWidth = `${p}px`), h && (i.style.minHeight = `${h}px`));
				} catch (l) {
					_(e, "IMG dimension freeze failed", l);
				}
			}
		} catch (l) {
			throw console.error("[Snapdom] Failed to clone node:", t, l), l;
		}
		let a = null;
		if (t instanceof HTMLTextAreaElement) {
			let { width: l, height: d } = it(t), u = l || t.getBoundingClientRect().width || 0, p = d || t.getBoundingClientRect().height || 0;
			u && (i.style.width = `${u}px`), p && (i.style.height = `${p}px`);
		}
		if (t instanceof HTMLInputElement) {
			let l = (t.type || "text").toLowerCase();
			if ((l === "checkbox" || l === "radio") && In()) {
				let { el: u, applyVisual: p } = tr(t);
				e.nodeMap.set(u, t), a = p, i = u;
			} else i.value = t.value, i.setAttribute("value", t.value), t.checked !== void 0 && (i.checked = t.checked, t.checked && i.setAttribute("checked", ""), t.indeterminate && (i.indeterminate = t.indeterminate));
		}
		if ((t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) && !t.value && t.placeholder) try {
			let l = window.getComputedStyle(t, "::placeholder"), d = l && l.color;
			if (d && d !== "rgba(0, 0, 0, 0)") {
				let u = "snapdom-ph-" + (Math.random() * 1e6 | 0);
				i.classList.add(u);
				let p = document.createElement("style");
				p.textContent = `.${u}::placeholder{color:${d}!important;opacity:${l.opacity || "1"}!important;-webkit-text-fill-color:${d}!important;}`, i.prepend(p);
			}
		} catch {}
		if (t instanceof HTMLSelectElement && (o = t.value), t instanceof HTMLTextAreaElement && (s = t.value), t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement) {
			t.disabled && i.setAttribute("disabled", ""), t.required && i.setAttribute("required", ""), t.readOnly && i.setAttribute("readonly", "");
			let l = t;
			l.min !== void 0 && l.min !== "" && i.setAttribute("min", l.min), l.max !== void 0 && l.max !== "" && i.setAttribute("max", l.max), l.pattern !== void 0 && l.pattern !== "" && i.setAttribute("pattern", l.pattern);
			let d = t.getAttribute("aria-invalid");
			d !== null && i.setAttribute("aria-invalid", d);
		}
		if (be(t) || nt(t, i, e, n), a && a(), t instanceof SVGElement && !be(t)) {
			let l = [
				"fill",
				"stroke",
				"stroke-width",
				"stroke-dasharray",
				"stroke-dashoffset",
				"stroke-linecap",
				"stroke-linejoin",
				"stroke-miterlimit",
				"opacity",
				"fill-opacity",
				"stroke-opacity",
				"fill-rule",
				"clip-rule",
				"marker",
				"marker-start",
				"marker-mid",
				"marker-end",
				"visibility",
				"display"
			];
			try {
				let d = window.getComputedStyle(t);
				for (let u of l) {
					let p = d.getPropertyValue(u);
					p && i.style.setProperty(u, p);
				}
			} catch {}
		}
		if (t.shadowRoot) {
			let y = function(w, v) {
				if (w.nodeType === Node.ELEMENT_NODE && w.tagName === "STYLE") return v(null);
				te(w, e, n).then((C) => {
					v(C || null);
				}).catch(() => {
					v(null);
				});
			};
			var c = y;
			try {
				let w = t.shadowRoot.querySelectorAll("slot");
				for (let v of w) {
					let C = [];
					try {
						C = v.assignedNodes?.({ flatten: !0 }) || v.assignedNodes?.() || [];
					} catch {
						C = v.assignedNodes?.() || [];
					}
					for (let M of C) r.add(M);
				}
			} catch {}
			let l = qn(e), d = `[data-sd="${l}"]`;
			try {
				i.setAttribute("data-sd", l);
			} catch {}
			let u = Xn(t.shadowRoot), p = jn(u, d), m = Qn(t, Kn(u), d);
			Gn(i, m + p, l);
			let g = document.createDocumentFragment(), b = await Se(Array.from(t.shadowRoot.childNodes), y, n.fast);
			g.append(...b.filter((w) => !!w)), i.appendChild(g);
		}
		if (t.tagName === "SLOT") {
			let p = function(g, y) {
				te(g, e, n).then((b) => {
					b && Jn(b), y(b || null);
				}).catch(() => {
					y(null);
				});
			};
			var c = p;
			let l = t.assignedNodes?.({ flatten: !0 }) || [], d = l.length > 0 ? l : Array.from(t.childNodes), u = document.createDocumentFragment(), h = await Se(Array.from(d), p, n.fast);
			return u.append(...h.filter((g) => !!g)), u;
		}
		function c(l, d) {
			if (r.has(l)) return d(null);
			te(l, e, n).then((u) => {
				d(u || null);
			}).catch(() => {
				d(null);
			});
		}
		let f = await Se(Array.from(t.childNodes), c, n.fast);
		if (i.append(...f.filter((l) => !!l)), o !== null && i instanceof HTMLSelectElement) {
			i.value = o;
			for (let l of i.options) l.value === o ? l.setAttribute("selected", "") : l.removeAttribute("selected");
		}
		return s !== null && i instanceof HTMLTextAreaElement && (i.textContent = s), i;
	}
	async function Ii(t, e, n) {
		let r = !1;
		try {
			r = !!(t.contentDocument || t.contentWindow?.document);
		} catch (o) {
			_(e, "iframe same-origin probe failed", o);
		}
		if (r) try {
			return await Zn(t, e, n);
		} catch (o) {
			console.warn("[SnapDOM] iframe rasterization failed, fallback:", o);
		}
		if (r || console.warn("[snapdom] cross-origin <iframe> skipped (cannot access content). Use options.placeholders to show a placeholder instead.", t), n.placeholders) {
			let { width: o, height: s } = it(t), i = document.createElement("div");
			return i.style.cssText = `width:${o}px;height:${s}px;background-image:repeating-linear-gradient(45deg,#ddd,#ddd 5px,#f9f9f9 5px,#f9f9f9 10px);display:flex;align-items:center;justify-content:center;font-size:12px;color:#555;border:1px solid #aaa;`, nt(t, i, e, n), i;
		} else {
			let { width: o, height: s } = it(t), i = document.createElement("div");
			return i.style.cssText = `display:inline-block;width:${o}px;height:${s}px;visibility:hidden;`, nt(t, i, e, n), i;
		}
	}
	async function _i(t, e, n) {
		let r = "";
		try {
			let a = t.getContext("2d", { willReadFrequently: !0 });
			try {
				a && a.getImageData(0, 0, 1, 1);
			} catch {}
			if (q() && await new Promise((c) => requestAnimationFrame(c)), r = t.toDataURL("image/png"), !r || r === "data:,") {
				try {
					a && a.getImageData(0, 0, 1, 1);
				} catch {}
				if (await new Promise((c) => requestAnimationFrame(c)), r = t.toDataURL("image/png"), !r || r === "data:,") {
					let c = document.createElement("canvas");
					c.width = t.width, c.height = t.height;
					let f = c.getContext("2d");
					f && (f.drawImage(t, 0, 0), r = c.toDataURL("image/png"));
				}
			}
		} catch (a) {
			_(e, "Canvas toDataURL failed, using empty/fallback", a);
		}
		let o = document.createElement("img");
		try {
			o.decoding = "sync", o.loading = "eager";
		} catch (a) {
			_(e, "img decoding/loading hints failed", a);
		}
		r && (o.src = r), o.width = t.width, o.height = t.height;
		let { width: s, height: i } = it(t);
		return s > 0 && (o.style.width = `${s}px`), i > 0 && (o.style.height = `${i}px`), e.nodeMap.set(o, t), nt(t, o, e, n), o;
	}
	async function Wi(t, e, n) {
		let r = "";
		try {
			let a = document.createElement("canvas");
			a.width = t.videoWidth || t.offsetWidth || 320, a.height = t.videoHeight || t.offsetHeight || 240;
			let c = a.getContext("2d");
			c && (c.drawImage(t, 0, 0, a.width, a.height), r = a.toDataURL("image/png"), (!r || r === "data:,") && (r = ""));
		} catch (a) {
			_(e, "Video frame capture failed, using poster fallback", a);
		}
		let o = document.createElement("img");
		try {
			o.decoding = "sync", o.loading = "eager";
		} catch {}
		r ? o.src = r : t.poster && (o.src = t.poster), o.width = t.videoWidth || t.offsetWidth || 0, o.height = t.videoHeight || t.offsetHeight || 0;
		let { width: s, height: i } = it(t);
		return s > 0 && (o.style.width = `${s}px`), i > 0 && (o.style.height = `${i}px`), o.style.objectFit = "contain", e.nodeMap.set(o, t), nt(t, o, e, n), o;
	}
	async function Oi(t, e, n) {
		if (!t.controls) return;
		let { width: r, height: o } = it(t), s = Math.round(r || t.offsetWidth || 300), i = Math.round(o || t.offsetHeight || 54), a = i / 2, c = Math.max(4, i * .16), f = i * .34, l = s - i * .34, d = f + c + i * .55, u = Math.max(0, l - i * .7 - d), p = Math.max(9, Math.round(i * .24)), h = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${i}" viewBox="0 0 ${s} ${i}"><rect width="${s}" height="${i}" rx="${Math.min(i / 2, 10)}" fill="#f1f3f4"/><path d="M ${f} ${a - c} L ${f + c} ${a} L ${f} ${a + c} Z" fill="#5f6368"/><rect x="${d}" y="${a - 1.5}" width="${u}" height="3" rx="1.5" fill="#bdc1c6"/><circle cx="${d}" cy="${a}" r="${Math.max(3, i * .09)}" fill="#5f6368"/><text x="${l}" y="${a}" fill="#5f6368" font-family="sans-serif" font-size="${p}" text-anchor="end" dominant-baseline="central">0:00</text></svg>`, m = document.createElement("img");
		try {
			m.decoding = "sync", m.loading = "eager";
		} catch {}
		return m.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(h)}`, m.width = s, m.height = i, m.style.width = `${s}px`, m.style.height = `${i}px`, e.nodeMap.set(m, t), nt(t, m, e, n), m;
	}
	Ce("IFRAME", Ii);
	Ce("CANVAS", _i);
	Ce("VIDEO", Wi);
	Ce("AUDIO", Oi);
	et();
	Gt();
	Kt();
	J();
	J();
	var Bi = [
		/font\s*awesome/i,
		/material\s*icons/i,
		/ionicons/i,
		/glyphicons/i,
		/feather/i,
		/bootstrap\s*icons/i,
		/remix\s*icons/i,
		/heroicons/i,
		/layui/i,
		/lucide/i
	];
	var Bt = Object.assign({
		materialIconsFilled: "https://fonts.gstatic.com/s/materialicons/v48/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2",
		materialIconsOutlined: "https://fonts.gstatic.com/s/materialiconsoutlined/v110/gok-H7zzDkdnRel8-DQ6KAXJ69wP1tGnf4ZGhUcel5euIg.woff2",
		materialIconsRound: "https://fonts.gstatic.com/s/materialiconsround/v109/LDItaoyNOAY6Uewc665JcIzCKsKc_M9flwmPq_HTTw.woff2",
		materialIconsSharp: "https://fonts.gstatic.com/s/materialiconssharp/v110/oPWQ_lt5nv4pWNJpghLP75WiFR4kLh3kvmvRImcycg.woff2"
	}, typeof window < "u" && window.__SNAPDOM_ICON_FONTS__ || {});
	var sr = [];
	var or = new Set();
	function Ui(t) {
		return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	}
	function ar(t) {
		let e = Array.isArray(t) ? t : [t];
		for (let n of e) {
			let r;
			if (n instanceof RegExp) r = n;
			else if (typeof n == "string") r = new RegExp(Ui(n), "i");
			else {
				console.warn("[snapdom] Ignored invalid iconFont value:", n);
				continue;
			}
			let o = `${r.source}/${r.flags}`;
			or.has(o) || (or.add(o), sr.push(r));
		}
	}
	function st(t) {
		let e = typeof t == "string" ? t : "", n = [...Bi, ...sr];
		for (let r of n) if (r instanceof RegExp && r.test(e)) return !0;
		return !!(/icon/i.test(e) || /glyph/i.test(e) || /symbols/i.test(e) || /feather/i.test(e) || /fontawesome/i.test(e));
	}
	function Di(t = "") {
		let e = String(t).toLowerCase();
		return /\bmaterial\s*icons\b/.test(e) || /\bmaterial\s*symbols\b/.test(e);
	}
	var ir = new Map();
	function Hi(t = "") {
		let e = Object.create(null), n = String(t || ""), r = /['"]?\s*([A-Za-z]{3,4})\s*['"]?\s*([+-]?\d+(?:\.\d+)?)\s*/g, o;
		for (; o = r.exec(n);) e[o[1].toUpperCase()] = Number(o[2]);
		return e;
	}
	async function zi(t, e, n) {
		let r = String(t || ""), o = r.toLowerCase(), s = String(e || "").toLowerCase();
		if (/\bmaterial\s*icons\b/.test(o) && !/\bsymbols\b/.test(o)) return {
			familyForMeasure: r,
			familyForCanvas: r
		};
		if (!/\bmaterial\s*symbols\b/.test(o)) return {
			familyForMeasure: r,
			familyForCanvas: r
		};
		let a = n && (n.FILL ?? n.fill), c = "outlined";
		/\brounded\b/.test(s) || /\bround\b/.test(s) ? c = "rounded" : /\bsharp\b/.test(s) ? c = "sharp" : /\boutlined\b/.test(s) && (c = "outlined");
		let f = a === 1, l = null;
		if (f && (c === "outlined" && Bt.materialIconsFilled ? l = {
			url: Bt.materialIconsFilled,
			alias: "snapdom-mi-filled"
		} : c === "rounded" && Bt.materialIconsRound ? l = {
			url: Bt.materialIconsRound,
			alias: "snapdom-mi-round"
		} : c === "sharp" && Bt.materialIconsSharp && (l = {
			url: Bt.materialIconsSharp,
			alias: "snapdom-mi-sharp"
		})), !l) return {
			familyForMeasure: r,
			familyForCanvas: r
		};
		if (!ir.has(l.alias)) try {
			let u = new FontFace(l.alias, `url(${l.url})`, {
				style: "normal",
				weight: "400"
			});
			document.fonts.add(u), await u.load(), ir.set(l.alias, !0);
		} catch {
			return {
				familyForMeasure: r,
				familyForCanvas: r
			};
		}
		let d = `"${l.alias}"`;
		return {
			familyForMeasure: d,
			familyForCanvas: d
		};
	}
	async function Vi(t = "Material Icons", e = 24) {
		try {
			await Promise.all([document.fonts.load(`400 ${e}px "${String(t).replace(/["']/g, "")}"`), document.fonts.ready]);
		} catch {}
	}
	function ji(t) {
		let e = t.getPropertyValue("-webkit-text-fill-color")?.trim() || "", n = /^transparent$/i.test(e) || /rgba?\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)/i.test(e);
		if (e && !n && e.toLowerCase() !== "currentcolor") return e;
		let r = t.color?.trim();
		return r && r !== "inherit" ? r : "#000";
	}
	async function qi(t, { family: e = "Material Icons", weight: n = "normal", fontSize: r = 32, color: o = "#000", variation: s = "", className: i = "" } = {}) {
		let a = String(e || "").replace(/^['"]+|['"]+$/g, ""), c = window.devicePixelRatio || 1, { familyForMeasure: l, familyForCanvas: d } = await zi(a, i, Hi(s));
		await Vi(d.replace(/^["']+|["']+$/g, ""), r);
		let u = document.createElement("span");
		u.setAttribute("data-snapdom-internal", ""), u.textContent = t, u.style.position = "absolute", u.style.visibility = "hidden", u.style.left = "-99999px", u.style.whiteSpace = "nowrap", u.style.fontFamily = l, u.style.fontWeight = String(n || "normal"), u.style.fontSize = `${r}px`, u.style.lineHeight = "1", u.style.margin = "0", u.style.padding = "0", u.style.fontFeatureSettings = "'liga' 1", u.style.fontVariantLigatures = "normal", u.style.color = o, document.body.appendChild(u);
		let p = u.getBoundingClientRect(), h = Math.max(1, Math.ceil(p.width)), m = Math.max(1, Math.ceil(p.height));
		document.body.removeChild(u);
		let g = document.createElement("canvas");
		g.width = h * c, g.height = m * c;
		let y = g.getContext("2d");
		y.scale(c, c), y.font = `${n ? `${n} ` : ""}${r}px ${d}`, y.textAlign = "left", y.textBaseline = "top", y.fillStyle = o;
		try {
			y.fontKerning = "normal";
		} catch {}
		return y.fillText(t, 0, 0), {
			dataUrl: g.toDataURL(),
			width: h,
			height: m
		};
	}
	async function cr(t, e, n = x.session.nodeMap) {
		if (t?.nodeType !== 1) return 0;
		let r = ".material-icons, [class*=\"material-symbols\"]", o = Array.from(t.querySelectorAll(r)).filter((a) => a && a.textContent && a.textContent.trim());
		if (t.matches?.(r) && t.textContent && t.textContent.trim() && o.unshift(t), o.length === 0) return 0;
		let s = e?.nodeType === 1 ? Array.from(e.querySelectorAll(r)).filter((a) => a && a.textContent && a.textContent.trim()) : [];
		e?.nodeType === 1 && e.matches?.(r) && e.textContent && e.textContent.trim() && s.unshift(e);
		let i = 0;
		for (let a = 0; a < o.length; a++) {
			let c = o[a], f = n && n.get(c) || s[a] || null;
			try {
				let l = getComputedStyle(f || c), d = l.fontFamily || "Material Icons";
				if (!Di(d)) continue;
				let u = (f || c).textContent.trim();
				if (!u) continue;
				let p = parseInt(l.fontSize, 10) || 24, { dataUrl: b, width: S, height: w } = await qi(u, {
					family: d,
					weight: l.fontWeight && l.fontWeight !== "normal" ? l.fontWeight : "normal",
					fontSize: p,
					color: ji(l),
					variation: l.fontVariationSettings && l.fontVariationSettings !== "normal" ? l.fontVariationSettings : "",
					className: (f || c).className || ""
				});
				c.textContent = "";
				let v = c.ownerDocument.createElement("img");
				v.src = b, v.alt = u, v.style.height = `${p}px`, v.style.width = `${Math.max(1, Math.round(S / w * p))}px`, v.style.objectFit = "contain", v.style.verticalAlign = getComputedStyle(c).verticalAlign || "baseline", c.appendChild(v), i++;
			} catch {}
		}
		return i;
	}
	ht();
	async function dr(t, e, n, r = 32, o = "#000") {
		e = e.replace(/^['"]+|['"]+$/g, "");
		let s = window.devicePixelRatio || 1;
		try {
			await document.fonts.ready;
		} catch {}
		let i = document.createElement("span");
		i.setAttribute("data-snapdom-internal", ""), i.textContent = t, i.style.position = "absolute", i.style.visibility = "hidden", i.style.fontFamily = `"${e}"`, i.style.fontWeight = n || "normal", i.style.fontSize = `${r}px`, i.style.lineHeight = "1", i.style.whiteSpace = "nowrap", i.style.padding = "0", i.style.margin = "0", document.body.appendChild(i);
		let a = i.getBoundingClientRect(), c = Math.ceil(a.width), f = Math.ceil(a.height);
		document.body.removeChild(i);
		let l = document.createElement("canvas");
		l.width = Math.max(1, c * s), l.height = Math.max(1, f * s);
		let d = l.getContext("2d");
		return d.scale(s, s), d.font = n ? `${n} ${r}px "${e}"` : `${r}px "${e}"`, d.textAlign = "left", d.textBaseline = "top", d.fillStyle = o, d.fillText(t, 0, 0), {
			dataUrl: l.toDataURL(),
			width: c,
			height: f
		};
	}
	var pr = new Set([
		"serif",
		"sans-serif",
		"monospace",
		"cursive",
		"fantasy",
		"system-ui",
		"emoji",
		"math",
		"fangsong",
		"ui-serif",
		"ui-sans-serif",
		"ui-monospace",
		"ui-rounded"
	]);
	var Xi = [
		"katex",
		"mathjax",
		"mathml"
	];
	function en(t) {
		if (!t) return "";
		for (let e of t.split(",")) {
			let n = e.trim().replace(/^['"]+|['"]+$/g, "");
			if (n && !pr.has(n.toLowerCase())) return n;
		}
		return "";
	}
	function Gi(t) {
		if (!t) return [];
		let e = [];
		for (let n of t.split(",")) {
			let r = n.trim().replace(/^['"]+|['"]+$/g, "");
			r && (pr.has(r.toLowerCase()) || e.push(r));
		}
		return e;
	}
	function Ae(t) {
		let e = String(t ?? "400").trim().toLowerCase();
		if (e === "normal") return 400;
		if (e === "bold") return 700;
		let n = parseInt(e, 10);
		return Number.isFinite(n) ? Math.min(900, Math.max(100, n)) : 400;
	}
	function ke(t) {
		let e = String(t ?? "normal").trim().toLowerCase();
		return e.startsWith("italic") ? "italic" : e.startsWith("oblique") ? "oblique" : "normal";
	}
	function Yi(t) {
		let e = String(t ?? "100%").match(/(\d+(?:\.\d+)?)\s*%/);
		return e ? Math.max(50, Math.min(200, parseFloat(e[1]))) : 100;
	}
	function Ki(t) {
		let e = String(t || "400").trim(), n = e.match(/^(\d{2,3})\s+(\d{2,3})$/);
		if (n) {
			let o = Ae(n[1]), s = Ae(n[2]);
			return {
				min: Math.min(o, s),
				max: Math.max(o, s)
			};
		}
		let r = Ae(e);
		return {
			min: r,
			max: r
		};
	}
	function Qi(t) {
		let e = String(t || "normal").trim().toLowerCase();
		return e === "italic" ? { kind: "italic" } : e.startsWith("oblique") ? { kind: "oblique" } : { kind: "normal" };
	}
	function Ji(t) {
		let e = String(t || "100%").trim(), n = e.match(/(\d+(?:\.\d+)?)\s*%\s+(\d+(?:\.\d+)?)\s*%/);
		if (n) {
			let s = parseFloat(n[1]), i = parseFloat(n[2]);
			return {
				min: Math.min(s, i),
				max: Math.max(s, i)
			};
		}
		let r = e.match(/(\d+(?:\.\d+)?)\s*%/), o = r ? parseFloat(r[1]) : 100;
		return {
			min: o,
			max: o
		};
	}
	function Zi(t) {
		return !t || typeof t != "string" ? "" : t.replace(/\s+(variable|vf|v[0-9]+)$/i, "").trim().toLowerCase().replace(/\s+/g, "-");
	}
	function ts(t, e, n = []) {
		if (!t) return !1;
		try {
			let r = new URL(t, location.href);
			if (r.origin === location.origin) return !0;
			let s = r.host.toLowerCase();
			if ([
				"fonts.googleapis.com",
				"fonts.gstatic.com",
				"use.typekit.net",
				"p.typekit.net",
				"kit.fontawesome.com",
				"use.fontawesome.com",
				"cdn.jsdelivr.net",
				"unpkg.com",
				"cdnjs.cloudflare.com",
				"esm.sh"
			].some((c) => s.endsWith(c)) || n.some((c) => s === c.toLowerCase() || s.endsWith("." + c.toLowerCase()))) return !0;
			let a = (r.pathname + r.search).toLowerCase();
			if (/\bfont(s)?\b/.test(a) || /\.woff2?(\b|$)/.test(a) || Xi.some((c) => a.includes(c))) return !0;
			for (let c of e) {
				let f = c.toLowerCase().replace(/\s+/g, "+"), l = c.toLowerCase().replace(/\s+/g, "-"), d = Zi(c);
				if (a.includes(f) || a.includes(l) || d && a.includes(d)) return !0;
			}
			return !1;
		} catch {
			return !1;
		}
	}
	function es(t) {
		let e = new Set();
		for (let n of t || []) {
			let r = String(n).split("__")[0]?.trim();
			r && e.add(r);
		}
		return e;
	}
	function lr(t, e) {
		return t && t.replace(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/g, (n, r, o) => {
			let s = (o || "").trim();
			if (!s || /^data:|^blob:|^https?:|^file:|^about:/i.test(s)) return n;
			let i = s;
			try {
				i = new URL(s, e || location.href).href;
			} catch {}
			return `url("${i}")`;
		});
	}
	var tn = /@import\s+(?:url\(\s*(['"]?)([^)"']+)\1\s*\)|(['"])([^"']+)\3)([^;]*);/g;
	var Me = 4;
	async function ns(t, e, n) {
		if (!t) return t;
		let r = new Set();
		function o(a, c) {
			try {
				return new URL(a, c || location.href).href;
			} catch {
				return a;
			}
		}
		async function s(a, c, f = 0) {
			if (f > Me) return console.warn(`[snapDOM] @import depth exceeded (${Me}) at ${c}`), a;
			let l = "", d = 0, u;
			for (; u = tn.exec(a);) {
				l += a.slice(d, u.index), d = tn.lastIndex;
				let h = o((u[2] || u[4] || "").trim(), c);
				if (r.has(h)) {
					console.warn(`[snapDOM] Skipping circular @import: ${h}`);
					continue;
				}
				r.add(h);
				let m = "";
				try {
					let g = await z(h, {
						as: "text",
						useProxy: n,
						silent: !0
					});
					g.ok && typeof g.data == "string" && (m = g.data);
				} catch {}
				m ? (m = lr(m, h), m = await s(m, h, f + 1), l += `
/* inlined: ${h} */
${m}
`) : l += u[0];
			}
			return l += a.slice(d), l;
		}
		let i = lr(t, e || location.href);
		return i = await s(i, e || location.href, 0), i;
	}
	var mr = /url\((["']?)([^"')]+)\1\)/g;
	var rs = /@font-face[^{}]*\{[^}]*\}/g;
	function rt(t, e, n = "") {
		return (t.match(new RegExp(`${e}\\s*:\\s*([^;}]+)[;}]`, "i"))?.[1] || n).trim();
	}
	function hr(t) {
		if (!t) return [];
		let e = [], n = t.split(",").map((r) => r.trim()).filter(Boolean);
		for (let r of n) {
			let o = r.match(/^U\+([0-9A-Fa-f?]+)(?:-([0-9A-Fa-f?]+))?$/);
			if (!o) continue;
			let s = o[1], i = o[2], a = (c) => {
				if (!c.includes("?")) return parseInt(c, 16);
				return [parseInt(c.replace(/\?/g, "0"), 16), parseInt(c.replace(/\?/g, "F"), 16)];
			};
			if (i) {
				let c = a(s), f = a(i), l = Array.isArray(c) ? c[0] : c, d = Array.isArray(f) ? f[1] : f;
				e.push([Math.min(l, d), Math.max(l, d)]);
			} else {
				let c = a(s);
				Array.isArray(c) ? e.push([c[0], c[1]]) : e.push([c, c]);
			}
		}
		return e;
	}
	function gr(t, e) {
		if (!e.length || !t || t.size === 0) return !0;
		for (let n of t) for (let [r, o] of e) if (n >= r && n <= o) return !0;
		return !1;
	}
	function nn(t, e) {
		let n = [];
		if (!t) return n;
		for (let r of t.matchAll(mr)) {
			let o = (r[2] || "").trim();
			if (!(!o || o.startsWith("data:"))) {
				if (!/^https?:/i.test(o)) try {
					o = new URL(o, e || location.href).href;
				} catch {}
				n.push(o);
			}
		}
		return n;
	}
	async function yr(t, e, n = "") {
		let r = t;
		for (let o of t.matchAll(mr)) {
			let s = kt(o[0]);
			if (!s) continue;
			let i = s;
			if (!i.startsWith("http") && !i.startsWith("data:")) try {
				i = new URL(i, e || location.href).href;
			} catch {}
			if (!st(i)) {
				if (x.resource?.has(i)) {
					x.font?.add(i), r = r.replace(o[0], `url(${x.resource.get(i)})`);
					continue;
				}
				try {
					let a = await z(i, {
						as: "dataURL",
						useProxy: n,
						silent: !0
					});
					if (a.ok && typeof a.data == "string") {
						let c = a.data;
						x.resource?.set(i, c), x.font?.add(i), r = r.replace(o[0], `url(${c})`);
					}
				} catch {
					console.warn("[snapDOM] Failed to fetch font resource:", i);
				}
			}
		}
		return r;
	}
	function os(t) {
		if (!t.length) return null;
		let e = (a, c) => t.some(([f, l]) => !(l < a || f > c)), n = e(0, 255) || e(305, 305), r = e(256, 591) || e(7680, 7935), o = e(880, 1023), s = e(1024, 1279);
		return e(7840, 7929) || e(258, 259) || e(416, 417) || e(431, 432) ? "vietnamese" : s ? "cyrillic" : o ? "greek" : r ? "latin-ext" : n ? "latin" : null;
	}
	function fr(t = {}) {
		let e = new Set((t.families || []).map((o) => String(o).toLowerCase())), n = new Set((t.domains || []).map((o) => String(o).toLowerCase())), r = new Set((t.subsets || []).map((o) => String(o).toLowerCase()));
		return (o, s) => {
			if (e.size && e.has(o.family.toLowerCase())) return !0;
			if (n.size) for (let i of o.srcUrls) try {
				if (n.has(new URL(i).host.toLowerCase())) return !0;
			} catch {}
			if (r.size) {
				let i = os(s);
				if (i && r.has(i)) return !0;
			}
			return !1;
		};
	}
	function is(t) {
		if (!t) return t;
		let e = /@font-face[^{}]*\{[^}]*\}/gi, n = new Set(), r = [];
		for (let s of t.match(e) || []) {
			let a = en(rt(s, "font-family")), c = rt(s, "font-weight", "400"), f = rt(s, "font-style", "normal"), l = rt(s, "font-stretch", "100%"), d = rt(s, "unicode-range"), u = rt(s, "src"), p = nn(u, location.href), h = p.length ? p.map((g) => String(g).toLowerCase()).sort().join("|") : u.toLowerCase(), m = [
				String(a || "").toLowerCase(),
				c,
				f,
				l,
				d.toLowerCase(),
				h
			].join("|");
			n.has(m) || (n.add(m), r.push(s));
		}
		if (r.length === 0) return t;
		let o = 0;
		return t.replace(e, () => r[o++] || "");
	}
	var ur = new WeakMap();
	var ss = 0;
	function as(t) {
		let e = ur.get(t);
		return e === void 0 && (e = ss++, ur.set(t, e)), e;
	}
	function cs(t, e, n, r, o, s) {
		return `fonts-embed-css::req=${Array.from(t || []).sort().join("|")}::ex=${e ? JSON.stringify({
			families: (e.families || []).map((u) => String(u).toLowerCase()).sort(),
			domains: (e.domains || []).map((u) => String(u).toLowerCase()).sort(),
			subsets: (e.subsets || []).map((u) => String(u).toLowerCase()).sort()
		}) : ""}::lf=${(n || []).map((u) => `${(u.family || "").toLowerCase()}::${u.weight || "normal"}::${u.style || "normal"}::${u.src || ""}`).sort().join("|")}::px=${r || ""}::fd=${(o || []).map((u) => String(u).toLowerCase()).sort().join("|")}::doc=${as(s || document)}`;
	}
	async function br(t, e, n, r) {
		let o;
		try {
			o = t.cssRules || [];
		} catch {
			return;
		}
		let s = (i, a) => {
			try {
				return new URL(i, a || location.href).href;
			} catch {
				return i;
			}
		};
		for (let i of o) {
			if (i.type === CSSRule.IMPORT_RULE && i.styleSheet) {
				let a = i.href ? s(i.href, e) : e;
				if (r.depth >= Me) {
					console.warn(`[snapDOM] CSSOM import depth exceeded (${Me}) at ${a}`);
					continue;
				}
				if (a && r.visitedSheets.has(a)) {
					console.warn(`[snapDOM] Skipping circular CSSOM import: ${a}`);
					continue;
				}
				a && r.visitedSheets.add(a);
				let c = {
					...r,
					depth: (r.depth || 0) + 1
				};
				await br(i.styleSheet, a, n, c);
				continue;
			}
			if (i.type === CSSRule.FONT_FACE_RULE) {
				let c = en((i.style.getPropertyValue("font-family") || "").trim());
				if (!c || st(c)) continue;
				let f = (i.style.getPropertyValue("font-weight") || "400").trim(), l = (i.style.getPropertyValue("font-style") || "normal").trim(), d = (i.style.getPropertyValue("font-stretch") || "100%").trim(), u = (i.style.getPropertyValue("src") || "").trim(), p = (i.style.getPropertyValue("unicode-range") || "").trim();
				if (!r.faceMatchesRequired(c, l, f, d)) continue;
				let h = hr(p);
				if (!gr(r.usedCodepoints, h)) continue;
				let m = {
					family: c,
					weightSpec: f,
					styleSpec: l,
					stretchSpec: d,
					unicodeRange: p,
					srcRaw: u,
					srcUrls: nn(u, e || location.href),
					href: e || location.href
				};
				if (r.simpleExcluder && r.simpleExcluder(m, h)) continue;
				if (/url\(/i.test(u)) await n(`@font-face{font-family:${c};src:${await yr(u, e || location.href, r.useProxy)};font-style:${l};font-weight:${f};font-stretch:${d};${p ? `unicode-range:${p};` : ""}}`);
				else await n(`@font-face{font-family:${c};src:${u};font-style:${l};font-weight:${f};font-stretch:${d};${p ? `unicode-range:${p};` : ""}}`);
			}
		}
	}
	async function Ee({ required: t, usedCodepoints: e, exclude: n = void 0, localFonts: r = [], useProxy: o = "", fontStylesheetDomains: s = [], doc: i = document } = {}) {
		t instanceof Set || (t = new Set()), e instanceof Set || (e = new Set());
		let a = new Map();
		for (let b of t) {
			let [S, w, v, C] = String(b).split("__");
			if (!S) continue;
			let M = S.toLowerCase(), A = a.get(M) || [];
			A.push({
				w: parseInt(w, 10),
				s: v,
				st: parseInt(C, 10)
			}), a.set(M, A);
		}
		function c(b, S, w, v) {
			let C = String(b).toLowerCase();
			if (!a.has(C)) return !1;
			let M = a.get(C), A = Ki(w), k = Qi(S), R = Ji(v), $ = A.min !== A.max, T = A.min, O = (F) => k.kind === "normal" && F === "normal" || k.kind !== "normal" && (F === "italic" || F === "oblique"), W = !1;
			for (let F of M) {
				let I = $ ? F.w >= A.min && F.w <= A.max : F.w === T, ot = O(ke(F.s)), N = F.st >= R.min && F.st <= R.max;
				if (I && ot && N) {
					W = !0;
					break;
				}
			}
			if (W) return !0;
			if (!$) for (let F of M) {
				let I = O(ke(F.s)), ot = F.st >= R.min && F.st <= R.max;
				if (Math.abs(T - F.w) <= 300 && I && ot) return !0;
			}
			if (!$ && k.kind === "normal" && M.some((I) => ke(I.s) !== "normal")) for (let I of M) {
				let ot = Math.abs(T - I.w) <= 300, N = I.st >= R.min && I.st <= R.max;
				if (ot && N) return !0;
			}
			return !1;
		}
		let f = fr(n), l = cs(t, n, r, o, s, i);
		if (x.resource?.has(l)) return x.resource.get(l);
		let d = es(t), u = [], p = tn;
		for (let b of i.querySelectorAll("style")) {
			let S = b.textContent || "";
			for (let w of S.matchAll(p)) {
				let v = (w[2] || w[4] || "").trim();
				if (!v || st(v)) continue;
				i.querySelector(`link[rel="stylesheet"][href="${v}"]`) || u.push(v);
			}
		}
		let h = [];
		u.length && await Promise.all(u.map((b) => new Promise((S) => {
			if (i.querySelector(`link[rel="stylesheet"][href="${b}"]`)) return S(null);
			let w = i.createElement("link");
			w.rel = "stylesheet", w.href = b, w.setAttribute("data-snapdom", "injected-import"), w.onload = () => S(w), w.onerror = () => S(null), i.head.appendChild(w), h.push(w);
		})));
		let m = "", g = Array.from(i.querySelectorAll("link[rel=\"stylesheet\"]")).filter((b) => !!b.href);
		for (let b of h) try {
			b.remove();
		} catch {}
		for (let b of g) try {
			if (st(b.href)) continue;
			let S = "", w = !1;
			try {
				w = new URL(b.href, location.href).origin === location.origin;
			} catch {}
			if (!w) {
				let C = Array.isArray(s) ? s : [];
				if (!ts(b.href, d, C)) continue;
			}
			if (w) {
				let C = Array.from(i.styleSheets).find((M) => M.href === b.href);
				if (C) try {
					let M = C.cssRules || [];
					S = Array.from(M).map((A) => A.cssText).join("");
				} catch {}
			}
			if (!S) {
				let C = await z(b.href, {
					as: "text",
					useProxy: o
				});
				if (C?.ok && typeof C.data == "string" && (S = C.data), st(b.href)) continue;
			}
			S = await ns(S, b.href, o);
			let v = "";
			for (let C of S.match(rs) || []) {
				let A = en(rt(C, "font-family"));
				if (!A || st(A)) continue;
				let k = rt(C, "font-weight", "400"), R = rt(C, "font-style", "normal"), $ = rt(C, "font-stretch", "100%"), T = rt(C, "unicode-range"), O = rt(C, "src"), W = nn(O, b.href);
				if (!c(A, R, k, $)) continue;
				let F = hr(T);
				if (!gr(e, F)) continue;
				let I = {
					family: A,
					weightSpec: k,
					styleSpec: R,
					stretchSpec: $,
					unicodeRange: T,
					srcRaw: O,
					srcUrls: W,
					href: b.href
				};
				if (n && f(I, F)) continue;
				let ot = /url\(/i.test(O) ? await yr(C, b.href, o) : C;
				v += ot;
			}
			v.trim() && (m += v);
		} catch {
			console.warn("[snapDOM] Failed to process stylesheet:", b.href);
		}
		let y = {
			requiredIndex: a,
			usedCodepoints: e,
			faceMatchesRequired: c,
			simpleExcluder: n ? fr(n) : null,
			useProxy: o,
			visitedSheets: new Set(),
			depth: 0
		};
		for (let b of i.styleSheets) if (!(b.href && g.some((S) => S.href === b.href))) try {
			let S = b.href || location.origin + "/";
			S && y.visitedSheets.add(S), await br(b, S, async (w) => {
				m += w;
			}, y);
		} catch {}
		try {
			for (let b of i.fonts || []) {
				if (!b || !b.family || b.status !== "loaded" || !b._snapdomSrc) continue;
				let S = String(b.family).replace(/^['"]+|['"]+$/g, "");
				if (st(S) || !a.has(S.toLowerCase()) || n?.families && n.families.some((v) => String(v).toLowerCase() === S.toLowerCase())) continue;
				let w = b._snapdomSrc;
				if (!String(w).startsWith("data:")) {
					if (x.resource?.has(b._snapdomSrc)) w = x.resource.get(b._snapdomSrc), x.font?.add(b._snapdomSrc);
					else if (!x.font?.has(b._snapdomSrc)) try {
						let v = await z(b._snapdomSrc, {
							as: "dataURL",
							useProxy: o,
							silent: !0
						});
						if (v.ok && typeof v.data == "string") w = v.data, x.resource?.set(b._snapdomSrc, w), x.font?.add(b._snapdomSrc);
						else continue;
					} catch {
						console.warn("[snapDOM] Failed to fetch dynamic font src:", b._snapdomSrc);
						continue;
					}
				}
				m += `@font-face{font-family:'${S}';src:url(${w});font-style:${b.style || "normal"};font-weight:${b.weight || "normal"};}`;
			}
		} catch {}
		for (let b of r) {
			if (!b || typeof b != "object") continue;
			let S = String(b.family || "").replace(/^['"]+|['"]+$/g, "");
			if (!S || st(S) || !a.has(S.toLowerCase()) || n?.families && n.families.some((k) => String(k).toLowerCase() === S.toLowerCase())) continue;
			let w = b.weight != null ? String(b.weight) : "normal", v = b.style != null ? String(b.style) : "normal", C = b.stretchPct != null ? `${b.stretchPct}%` : "100%", M = String(b.src || ""), A = M;
			if (!A.startsWith("data:")) {
				if (x.resource?.has(M)) A = x.resource.get(M), x.font?.add(M);
				else if (!x.font?.has(M)) try {
					let k = await z(M, {
						as: "dataURL",
						useProxy: o,
						silent: !0
					});
					if (k.ok && typeof k.data == "string") A = k.data, x.resource?.set(M, A), x.font?.add(M);
					else continue;
				} catch {
					console.warn("[snapDOM] Failed to fetch localFonts src:", M);
					continue;
				}
			}
			m += `@font-face{font-family:'${S}';src:url(${A});font-style:${v};font-weight:${w};font-stretch:${C};}`;
		}
		return m && (m = is(m), x.resource?.set(l, m)), m;
	}
	function ee(t, e) {
		let n = new Set(), r = new Set();
		if (!t) return {
			required: n,
			usedCodepoints: r
		};
		let o = (c) => {
			if (c) for (let f of c) r.add(f.codePointAt(0));
		}, s = (c) => {
			let f = Gi(c.fontFamily);
			if (f.length) for (let l of f) n.add(`${l}__${Ae(c.fontWeight)}__${ke(c.fontStyle)}__${Yi(c.fontStretch)}`);
		}, i = (c) => {
			s(L(c));
			for (let f of ["::before", "::after"]) {
				let l = L(c, f), d = l && l.content;
				if (!(!d || d === "none" || d === "normal")) if (s(l), /^["']/.test(d)) o(d.slice(1, -1));
				else {
					let u = d.match(/\\[0-9A-Fa-f]{1,6}/g);
					if (u) for (let p of u) try {
						r.add(parseInt(p.slice(1), 16));
					} catch {}
				}
			}
		};
		i(t);
		let a = document.createTreeWalker(t, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null);
		for (; a.nextNode();) {
			let c = a.currentNode;
			if (c.nodeType === Node.TEXT_NODE) {
				if (e && c.parentElement && !e(c.parentElement)) continue;
				o(c.nodeValue || "");
			} else {
				if (e && !e(c)) continue;
				i(c);
			}
		}
		return {
			required: n,
			usedCodepoints: r
		};
	}
	function wr(t, e) {
		return ee(t, e).required;
	}
	async function Ut(t, e = 2, n = document) {
		try {
			await n.fonts.ready;
		} catch {}
		let r = Array.from(t || []).filter(Boolean);
		if (r.length === 0) return;
		let o = () => {
			let s = n.createElement("div");
			s.setAttribute("data-snapdom-internal", ""), s.style.cssText = "position:absolute!important;left:-9999px!important;top:0!important;opacity:0!important;pointer-events:none!important;contain:layout size style;";
			for (let i of r) {
				let a = n.createElement("span");
				a.textContent = "AaBbGg1234ÁÉÍÓÚçñ—∞", a.style.fontFamily = `"${i}"`, a.style.fontWeight = "700", a.style.fontStyle = "italic", a.style.fontSize = "32px", a.style.lineHeight = "1", a.style.whiteSpace = "nowrap", a.style.margin = "0", a.style.padding = "0", s.appendChild(a);
			}
			n.body.appendChild(s), s.offsetWidth, n.body.removeChild(s);
		};
		for (let s = 0; s < Math.max(1, e); s++) o(), await new Promise((i) => requestAnimationFrame(() => requestAnimationFrame(i)));
	}
	function Cr(t) {
		return /\bcounter\s*\(|\bcounters\s*\(/.test(t || "");
	}
	function xr(t, e = !1) {
		let n = "", r = Math.max(1, t);
		for (; r > 0;) r--, n = String.fromCharCode(97 + r % 26) + n, r = Math.floor(r / 26);
		return e ? n.toUpperCase() : n;
	}
	function Sr(t, e = !0) {
		let n = [
			[1e3, "M"],
			[900, "CM"],
			[500, "D"],
			[400, "CD"],
			[100, "C"],
			[90, "XC"],
			[50, "L"],
			[40, "XL"],
			[10, "X"],
			[9, "IX"],
			[5, "V"],
			[4, "IV"],
			[1, "I"]
		], r = Math.max(1, Math.min(3999, t)), o = "";
		for (let [s, i] of n) for (; r >= s;) o += i, r -= s;
		return e ? o : o.toLowerCase();
	}
	function vr(t, e) {
		switch ((e || "decimal").toLowerCase()) {
			case "decimal": return String(t);
			case "decimal-leading-zero": {
				let n = Math.abs(t);
				return (t < 0 ? "-" : "") + (n < 10 ? "0" : "") + String(n);
			}
			case "lower-alpha": return xr(t, !1);
			case "upper-alpha": return xr(t, !0);
			case "lower-roman": return Sr(t, !1);
			case "upper-roman": return Sr(t, !0);
			default: return String(t);
		}
	}
	function Ar(t) {
		let e = new WeakMap(), n = t instanceof Document ? t.documentElement : t, r = (f) => f && f.tagName === "LI", o = (f) => {
			let l = 0, d = f?.parentElement;
			if (!d) return 0;
			for (let u of d.children) {
				if (u === f) break;
				u.tagName === "LI" && l++;
			}
			return l;
		}, s = (f) => {
			let l = new Map();
			for (let [d, u] of f) l.set(d, u.slice());
			return l;
		}, i = (f, l, d) => {
			let u = s(f), p;
			try {
				p = d.style?.counterReset || getComputedStyle(d).counterReset;
			} catch {}
			if (p && p !== "none") for (let g of p.split(",")) {
				let y = g.trim().split(/\s+/), b = y[0], S = Number.isFinite(Number(y[1])) ? Number(y[1]) : 0;
				if (!b) continue;
				let w = l.get(b);
				if (w && w.length) {
					let v = w.slice();
					v.push(S), u.set(b, v);
				} else u.set(b, [S]);
			}
			let h;
			try {
				h = d.style?.counterSet || getComputedStyle(d).counterSet;
			} catch {}
			if (h && h !== "none") for (let g of h.split(",")) {
				let y = g.trim().split(/\s+/), b = y[0], S = Number.isFinite(Number(y[1])) ? Number(y[1]) : 0;
				if (!b) continue;
				let w = u.get(b) || [];
				w.length === 0 && w.push(0), w[w.length - 1] = S, u.set(b, w);
			}
			let m;
			try {
				m = d.style?.counterIncrement || getComputedStyle(d).counterIncrement;
			} catch {}
			if (m && m !== "none") for (let g of m.split(",")) {
				let y = g.trim().split(/\s+/), b = y[0], S = Number.isFinite(Number(y[1])) ? Number(y[1]) : 1;
				if (!b) continue;
				let w = u.get(b) || [];
				w.length === 0 && w.push(0), w[w.length - 1] += S, u.set(b, w);
			}
			try {
				if (getComputedStyle(d).display === "list-item" && r(d)) {
					let y = d.parentElement, b = 1;
					if (y && y.tagName === "OL") {
						let w = y.getAttribute("start"), v = Number.isFinite(Number(w)) ? Number(w) : 1, C = o(d), M = d.getAttribute("value");
						b = Number.isFinite(Number(M)) ? Number(M) : v + C;
					} else b = 1 + o(d);
					let S = u.get("list-item") || [];
					S.length === 0 && S.push(0), S[S.length - 1] = b, u.set("list-item", S);
				}
			} catch {}
			return u;
		}, a = (f, l, d) => {
			let u = i(d, l, f);
			e.set(f, u);
			let p = u;
			for (let m of f.children) p = a(m, u, p);
			let h = new Map();
			for (let [m, g] of d) {
				let y = g.length, b = p.get(m);
				h.set(m, b && b.length ? b.slice(0, y) : g.slice());
			}
			for (let [m, g] of p) !h.has(m) && g.length && !l.has(m) && h.set(m, g.slice(0, 1));
			return h;
		}, c = new Map();
		return a(n, c, c), {
			get(f, l) {
				let d = e.get(f)?.get(l);
				return d && d.length ? d[d.length - 1] : 0;
			},
			getStack(f, l) {
				let d = e.get(f)?.get(l);
				return d ? d.slice() : [];
			}
		};
	}
	function kr(t, e, n) {
		if (!t || t === "none") return t;
		try {
			return t.replace(/\b(counter|counters)\s*\(([^)]+)\)/g, (o, s, i) => {
				let a = String(i).split(",").map((c) => c.trim());
				if (s === "counter") {
					let c = a[0]?.replace(/^["']|["']$/g, ""), f = (a[1] || "decimal").toLowerCase();
					return vr(n.get(e, c), f);
				} else {
					let c = a[0]?.replace(/^["']|["']$/g, ""), f = a[1]?.replace(/^["']|["']$/g, "") ?? "", l = (a[2] || "decimal").toLowerCase(), d = n.getStack(e, c);
					return d.length ? d.map((p) => vr(p, l)).join(f) : "";
				}
			});
		} catch {
			return "- ";
		}
	}
	ht();
	var Dt = new WeakMap();
	var Mr = 1e3;
	function ls(t, e) {
		let n = Rr(t);
		return e ? (e.__pseudoPreflightFp !== n && (e.__pseudoPreflight = $r(t, n), e.__pseudoPreflightFp = n), !!e.__pseudoPreflight) : $r(t, n);
	}
	function rn(t) {
		try {
			return t && t.cssRules ? t.cssRules : null;
		} catch {
			return null;
		}
	}
	function Rr(t) {
		let e = t.querySelectorAll("style,link[rel~=\"stylesheet\"]"), n = `n:${e.length}|`, r = 0;
		for (let s = 0; s < e.length; s++) {
			let i = e[s];
			if (i.tagName === "STYLE") {
				let a = i.textContent ? i.textContent.length : 0;
				n += `S${a}|`;
				let c = i.sheet, f = c ? rn(c) : null;
				f && (r += f.length);
			} else {
				let a = i.getAttribute("href") || "", c = i.getAttribute("media") || "all";
				n += `L${a}|m:${c}|`;
				let f = i.sheet, l = f ? rn(f) : null;
				l && (r += l.length);
			}
		}
		let o = t.adoptedStyleSheets;
		return n += `ass:${Array.isArray(o) ? o.length : 0}|tr:${r}`, n;
	}
	function Er(t, e, n) {
		let r = rn(t);
		if (!r) return !1;
		for (let o = 0; o < r.length; o++) {
			if (n.budget <= 0) return !1;
			let s = r[o], i = s && s.cssText ? s.cssText : "";
			n.budget--;
			for (let a of e) if (i.includes(a)) return !0;
			if (s && s.cssRules && s.cssRules.length) for (let a = 0; a < s.cssRules.length && n.budget > 0; a++) {
				let c = s.cssRules[a], f = c && c.cssText ? c.cssText : "";
				n.budget--;
				for (let l of e) if (f.includes(l)) return !0;
			}
			if (n.budget <= 0) return !1;
		}
		return !1;
	}
	function $r(t = document, e = Rr(t)) {
		let n = Dt.get(t);
		if (n && n.fingerprint === e) return n.result;
		let r = [
			"::before",
			"::after",
			"::first-letter",
			":before",
			":after",
			":first-letter",
			"counter(",
			"counters(",
			"counter-increment",
			"counter-reset"
		], o = t.querySelectorAll("style");
		for (let i = 0; i < o.length; i++) {
			let a = o[i].textContent || "";
			for (let c of r) if (a.includes(c)) return Dt.set(t, {
				fingerprint: e,
				result: !0
			}), !0;
		}
		let s = t.adoptedStyleSheets;
		if (Array.isArray(s) && s.length) {
			let i = { budget: Mr };
			try {
				for (let a of s) if (Er(a, r, i)) return Dt.set(t, {
					fingerprint: e,
					result: !0
				}), !0;
			} catch {}
		}
		{
			let i = t.querySelectorAll("style,link[rel~=\"stylesheet\"]"), a = { budget: Mr };
			for (let c = 0; c < i.length && a.budget > 0; c++) {
				let f = i[c], l = null;
				if (f.tagName, l = f.sheet || null, l && Er(l, r, a)) return Dt.set(t, {
					fingerprint: e,
					result: !0
				}), !0;
			}
		}
		return t.querySelector("[style*=\"counter(\"], [style*=\"counters(\"]") ? (Dt.set(t, {
			fingerprint: e,
			result: !0
		}), !0) : (Dt.set(t, {
			fingerprint: e,
			result: !1
		}), !1);
	}
	function Fr(t) {
		for (let e of [
			"Top",
			"Right",
			"Bottom",
			"Left"
		]) {
			let n = parseFloat(t[`border${e}Width`]) || 0, r = t[`border${e}Style`];
			if (n > 0 && r && r !== "none" && r !== "hidden") return !0;
		}
		return !1;
	}
	function fs(t, e) {
		let n = null, r = () => {
			if (!n) try {
				n = Ar(t);
			} catch (o) {
				_(e, "buildCounterContext failed", o), n = {
					get: () => 0,
					getStack: () => []
				};
			}
			return n;
		};
		return {
			get(o, s) {
				return r().get(o, s);
			},
			getStack(o, s) {
				return r().getStack(o, s);
			}
		};
	}
	function us(t) {
		let e = !1;
		for (let n = 0; n < t.length; n++) {
			let r = t[n];
			if (r === "\"") e = !e;
			else if (r === "/" && !e) return t.slice(0, n).trim();
		}
		return t;
	}
	function ds(t) {
		if (!t) return "";
		let e = [], n = /"([^"]*)"/g, r = 0, o;
		for (; o = n.exec(t);) {
			let i = t.slice(r, o.index).trim();
			i && e.push(i), e.push(o[1]), r = n.lastIndex;
		}
		let s = t.slice(r).trim();
		return s && e.push(s), e.join("");
	}
	function on(t, e, n) {
		let r = t.parentElement, o = r && n ? n.get(r) : null;
		return o ? {
			get(s, i) {
				let a = e.get(s, i), c = o.get(i);
				return typeof c == "number" ? Math.max(a, c) : a;
			},
			getStack(s, i) {
				let a = e.getStack(s, i);
				if (!a.length) return a;
				let c = o.get(i);
				if (typeof c == "number") {
					let f = a.slice();
					return f[f.length - 1] = Math.max(f[f.length - 1], c), f;
				}
				return a;
			}
		} : e;
	}
	function sn(t, e, n) {
		let r = new Map();
		function o(f) {
			let l = [];
			if (!f || f === "none") return l;
			for (let d of String(f).split(",")) {
				let u = d.trim().split(/\s+/), p = u[0], h = Number.isFinite(Number(u[1])) ? Number(u[1]) : void 0;
				p && l.push({
					name: p,
					num: h
				});
			}
			return l;
		}
		let s = o(e?.counterReset), i = o(e?.counterSet), a = o(e?.counterIncrement);
		function c(f) {
			if (r.has(f)) return r.get(f).slice();
			let l = n.getStack(t, f);
			l = l.length ? l.slice() : [];
			let d = s.find((h) => h.name === f);
			if (d) {
				let h = Number.isFinite(d.num) ? d.num : 0;
				l = l.length ? [...l, h] : [h];
			}
			let u = i.find((h) => h.name === f);
			if (u) {
				let h = Number.isFinite(u.num) ? u.num : 0;
				l.length === 0 && (l = [0]), l[l.length - 1] = h;
			}
			let p = a.find((h) => h.name === f);
			if (p) {
				let h = Number.isFinite(p.num) ? p.num : 1;
				l.length === 0 && (l = [0]), l[l.length - 1] += h;
			}
			return r.set(f, l.slice()), l;
		}
		return {
			get(f, l) {
				let d = c(l);
				return d.length ? d[d.length - 1] : 0;
			},
			getStack(f, l) {
				return c(l);
			},
			__incs: a
		};
	}
	function ps(t, e, n, r) {
		let o;
		try {
			o = L(t, e);
		} catch {}
		let s = o?.content;
		if (!s || s === "none" || s === "normal") return {
			text: "",
			incs: []
		};
		s = us(s);
		let i = on(t, n, r), a = sn(t, o, i);
		return {
			text: ds(Cr(s) ? kr(s, t, a) : s),
			incs: a.__incs || []
		};
	}
	async function $e(t, e, n, r) {
		if (t?.nodeType !== 1 || e?.nodeType !== 1 || t.tagName === "TEXTAREA") return;
		if (!ls(t.ownerDocument || document, n)) return;
		n.__siblingCounters || (n.__siblingCounters = new WeakMap()), n.__counterCtx || (n.__counterCtx = fs(t.ownerDocument || document, n));
		let s = n.__counterCtx;
		for (let a of [
			"::before",
			"::after",
			"::first-letter"
		]) try {
			let c = L(t, a);
			if (!c || c.content === "none" && c.backgroundImage === "none" && c.backgroundColor === "transparent" && !Fr(c) && (!c.transform || c.transform === "none") && c.display === "inline") continue;
			if (a === "::first-letter") {
				let P = L(t), B = (P?.display || "").toLowerCase();
				if (B.includes("flex") || B.includes("grid")) continue;
				let U = (ft) => c[ft] !== P[ft] && (parseFloat(c[ft]) || 0) !== 0;
				if (!(c.color !== P.color || c.fontSize !== P.fontSize || c.fontWeight !== P.fontWeight || c.fontFamily !== P.fontFamily || c.fontStyle !== P.fontStyle || c.textTransform !== P.textTransform || c.float !== P.float && c.float !== "none" || U("paddingTop") || U("paddingRight") || U("paddingBottom") || U("paddingLeft") || U("marginTop") || U("marginRight") || U("marginBottom") || U("marginLeft"))) continue;
				let Y = Array.from(e.childNodes).find((ft) => ft.nodeType === Node.TEXT_NODE && ft.textContent?.trim().length > 0);
				if (!Y) continue;
				let ct = Y.textContent, lt = ct.match(/^([^\p{L}\p{N}\s]*[\p{L}\p{N}](?:['’])?)/u)?.[0], Tt = ct.slice(lt?.length || 0);
				if (!lt || /[\uD800-\uDFFF]/.test(lt)) continue;
				let Z = document.createElement("span");
				Z.textContent = lt, Z.dataset.snapdomPseudo = "::first-letter";
				let Pt = It(he(c), "span");
				n.styleMap.set(Z, Pt);
				let vt = document.createTextNode(Tt);
				e.replaceChild(vt, Y), e.insertBefore(Z, vt);
				continue;
			}
			let l = c.content ?? "", d = l === "" || l === "none" || l === "normal", { text: u, incs: p } = ps(t, a, s, n.__siblingCounters), h = c.backgroundImage, m = c.backgroundColor, g = c.fontFamily, y = parseInt(c.fontSize) || 32, b = parseInt(c.fontWeight) || !1, S = c.color || "#000", w = c.transform, v = st(g), C = !d && u !== "", M = h && h !== "none", A = m && m !== "transparent" && m !== "rgba(0, 0, 0, 0)", k = Fr(c), R = w && w !== "none", $ = l !== "none" && l !== "normal", T = $ && ((parseFloat(c.width) || 0) > 0 || (parseFloat(c.height) || 0) > 0), O = $ && c.boxShadow && c.boxShadow !== "none", W = $ && c.outlineStyle && c.outlineStyle !== "none" && (parseFloat(c.outlineWidth) || 0) > 0;
			if (!(C || M || A || k || R || T || O || W)) {
				if (p && p.length && t.parentElement) {
					let P = n.__siblingCounters.get(t.parentElement) || new Map();
					for (let { name: B } of p) {
						if (!B) continue;
						let U = on(t, s, n.__siblingCounters), Y = sn(t, L(t, a), U).get(t, B);
						P.set(B, Y);
					}
					n.__siblingCounters.set(t.parentElement, P);
				}
				continue;
			}
			let I = u.startsWith("url(") || /^-?(?:webkit-)?image-set\(/i.test(u), ot = !1;
			if (C && !v && u.length > 1 && !I) {
				let P = L(t), B = parseFloat(P.fontSize) || 16, U = parseFloat(P.lineHeight);
				Number.isFinite(U) || (U = B * 1.5), t.getBoundingClientRect().height < U * 1.6 && (e.style.whiteSpace = "nowrap", ot = !0);
			}
			let N = document.createElement("span");
			N.dataset.snapdomPseudo = a, N.style.pointerEvents = "none", ot && (N.style.whiteSpace = "nowrap");
			let yt = he(c), Rt = (L(t).display || "").toLowerCase(), bt = Rt.includes("flex") || Rt.includes("grid");
			if (bt) {
				let P = yt["min-width"];
				(!P || P === "auto" || P === "0px") && (yt["min-width"] = "0px");
			}
			let wt = It(yt, "span", C, bt);
			if (n.styleMap.set(N, wt), v && u && u.length === 1) {
				let { dataUrl: P, width: B, height: U } = await dr(u, g, b, y, S), V = document.createElement("img");
				V.src = P, V.style = `height:${y}px;width:${B / U * y}px;object-fit:contain;`, N.appendChild(V), e.dataset.snapdomHasIcon = "true";
			} else if (u && I) {
				let P = Xt(u, typeof devicePixelRatio < "u" && devicePixelRatio || 1) ?? kt(u);
				if (P?.trim()) try {
					let B = await z(mt(P), {
						as: "dataURL",
						useProxy: r.useProxy
					});
					if (B?.ok && typeof B.data == "string") {
						let U = document.createElement("img");
						U.src = B.data, U.style = `width:${y}px;height:auto;object-fit:contain;`, N.appendChild(U);
					}
				} catch (B) {
					console.error(`[snapdom] Error in pseudo ${a} for`, t, B);
				}
			} else !v && C && (N.textContent = u);
			N.style.backgroundImage = "none", "maskImage" in N.style && (N.style.maskImage = "none"), "webkitMaskImage" in N.style && (N.style.webkitMaskImage = "none");
			try {
				N.style.backgroundRepeat = c.backgroundRepeat, N.style.backgroundSize = c.backgroundSize, c.backgroundPositionX && c.backgroundPositionY ? (N.style.backgroundPositionX = c.backgroundPositionX, N.style.backgroundPositionY = c.backgroundPositionY) : N.style.backgroundPosition = c.backgroundPosition, N.style.backgroundOrigin = c.backgroundOrigin, N.style.backgroundClip = c.backgroundClip, N.style.backgroundAttachment = c.backgroundAttachment, N.style.backgroundBlendMode = c.backgroundBlendMode;
			} catch {}
			if (M) try {
				let P = _t(h), B = await Promise.all(P.map(Mt));
				N.style.backgroundImage = B.join(", ");
			} catch (P) {
				console.warn(`[snapdom] Failed to inline background-image for ${a}`, P);
			}
			A && (N.style.backgroundColor = m);
			let ut = N.childNodes.length > 0 || N.textContent?.trim() !== "" || M || A || k || R || T || O || W;
			if (p && p.length && t.parentElement) {
				let P = n.__siblingCounters.get(t.parentElement) || new Map(), B = on(t, s, n.__siblingCounters), U = sn(t, L(t, a), B);
				for (let { name: V } of p) {
					if (!V) continue;
					let Y = U.get(t, V);
					P.set(V, Y);
				}
				n.__siblingCounters.set(t.parentElement, P);
			}
			if (!ut) continue;
			a === "::before" ? (e.dataset.snapdomHasBefore = "1", e.insertBefore(N, e.firstChild)) : (e.dataset.snapdomHasAfter = "1", e.appendChild(N));
		} catch (c) {
			console.warn(`[snapdom] Failed to capture ${a} for`, t, c);
		}
		let i = Array.from(e.children).filter((a) => !a.dataset.snapdomPseudo);
		if (n.nodeMap) for (let a of i) {
			let c = n.nodeMap.get(a);
			c?.nodeType === 1 && await $e(c, a, n, r);
		}
		else {
			let a = Array.from(t.children);
			for (let c = 0; c < Math.min(a.length, i.length); c++) await $e(a[c], i[c], n, r);
		}
	}
	function Tr(t, e) {
		if (!t || t?.nodeType !== 1) return;
		let n = t.ownerDocument || document, r = e || n, o = t instanceof SVGSVGElement ? [t] : Array.from(t.querySelectorAll("svg"));
		if (o.length === 0) return;
		let s = /url\(\s*#([^)]+)\)/g, i = [
			"fill",
			"stroke",
			"filter",
			"clip-path",
			"mask",
			"marker",
			"marker-start",
			"marker-mid",
			"marker-end"
		], a = (w) => window.CSS && CSS.escape ? CSS.escape(w) : w.replace(/[^a-zA-Z0-9_-]/g, "\\$&"), c = "http://www.w3.org/1999/xlink", f = (w) => {
			if (!w || !w.getAttribute) return null;
			let v = w.getAttribute("href") || w.getAttribute("xlink:href") || (typeof w.getAttributeNS == "function" ? w.getAttributeNS(c, "href") : null);
			if (v) return v;
			let C = w.attributes;
			if (!C) return null;
			for (let M = 0; M < C.length; M++) {
				let A = C[M];
				if (!A || !A.name) continue;
				if (A.name === "href") return A.value;
				let k = A.name.indexOf(":");
				if (k !== -1 && A.name.slice(k + 1) === "href") return A.value;
			}
			return null;
		}, l = new Set(Array.from(t.querySelectorAll("[id]")).map((w) => w.id)), d = new Set(), u = !1, p = (w, v = null) => {
			if (!w) return;
			s.lastIndex = 0;
			let C;
			for (; C = s.exec(w);) {
				u = !0;
				let M = (C[1] || "").trim();
				M && (l.has(M) || (d.add(M), v && !v.has(M) && v.add(M)));
			}
		}, h = (w) => {
			let v = w.querySelectorAll("use");
			for (let A of v) {
				let k = f(A);
				if (!k || !k.startsWith("#")) continue;
				u = !0;
				let R = k.slice(1).trim();
				R && !l.has(R) && d.add(R);
			}
			let C = "*[style*=\"url(\"],*[fill^=\"url(\"], *[stroke^=\"url(\"],*[filter^=\"url(\"],*[clip-path^=\"url(\"],*[mask^=\"url(\"],*[marker^=\"url(\"],*[marker-start^=\"url(\"],*[marker-mid^=\"url(\"],*[marker-end^=\"url(\"]";
			p(w.getAttribute("style") || "");
			for (let A of i) p(w.getAttribute(A));
			let M = w.querySelectorAll(C);
			for (let A of M) {
				p(A.getAttribute("style") || "");
				for (let k of i) p(A.getAttribute(k));
			}
		};
		for (let w of o) h(w);
		if (!u) return;
		let m = t.querySelector("svg.inline-defs-container");
		m || (m = n.createElementNS("http://www.w3.org/2000/svg", "svg"), m.classList.add("inline-defs-container"), m.setAttribute("aria-hidden", "true"), m.setAttribute("style", "position:absolute;width:0;height:0;overflow:hidden"), t.insertBefore(m, t.firstChild || null));
		let g = m.querySelector("defs") || null, y = (w) => {
			if (!w || l.has(w)) return null;
			let v = a(w), C = (M) => {
				let A = r.querySelector(M);
				return A && !t.contains(A) ? A : null;
			};
			return C(`svg defs > *#${v}`) || C(`svg > symbol#${v}`) || C(`*#${v}`);
		};
		if (!d.size) return;
		let b = new Set(d), S = new Set();
		for (; b.size;) {
			let w = b.values().next().value;
			if (b.delete(w), !w || l.has(w) || S.has(w)) continue;
			let v = y(w);
			if (!v) {
				S.add(w);
				continue;
			}
			g || (g = n.createElementNS("http://www.w3.org/2000/svg", "defs"), m.appendChild(g));
			let C = v.cloneNode(!0);
			C.id || C.setAttribute("id", w), g.appendChild(C), S.add(w), l.add(w);
			let M = [C, ...C.querySelectorAll("*")];
			for (let A of M) {
				let k = f(A);
				if (k && k.startsWith("#")) {
					let $ = k.slice(1).trim();
					$ && !l.has($) && !S.has($) && b.add($);
				}
				let R = A.getAttribute?.("style") || "";
				R && p(R, b);
				for (let $ of i) {
					let T = A.getAttribute?.($);
					T && p(T, b);
				}
			}
		}
	}
	J();
	function Lr(t) {
		let e = getComputedStyle(t), n = e.outlineStyle, r = e.outlineWidth, o = e.borderStyle, s = e.borderWidth;
		if (n !== "none" && parseFloat(r) > 0 && (o === "none" || parseFloat(s) === 0)) {
			let c = t.style.border;
			return t.style.border = `${r} solid transparent`, () => {
				t.style.border = c;
			};
		}
		return () => {};
	}
	function Pr(t) {
		let e = [];
		try {
			let n = t.querySelectorAll("*");
			for (let r of n) {
				if (!(r instanceof HTMLElement)) continue;
				let o = r.style.contentVisibility || "", s = getComputedStyle(r), i = s.contentVisibility || s.getPropertyValue("content-visibility") || "";
				(i === "auto" || i === "hidden") && (e.push({
					el: r,
					original: o
				}), r.style.contentVisibility = "visible");
			}
			if (t instanceof HTMLElement) {
				let r = getComputedStyle(t), o = r.contentVisibility || r.getPropertyValue("content-visibility") || "";
				(o === "auto" || o === "hidden") && (e.push({
					el: t,
					original: t.style.contentVisibility || ""
				}), t.style.contentVisibility = "visible");
			}
		} catch {}
		return () => {
			for (let { el: n, original: r } of e) try {
				n.style.contentVisibility = r;
			} catch {}
		};
	}
	et();
	Kt();
	function Nr(t) {
		return _r(t.boxShadow);
	}
	function Ir(t) {
		return _r(t.textShadow);
	}
	function _r(t) {
		if (!t || t === "none") return {
			top: 0,
			right: 0,
			bottom: 0,
			left: 0
		};
		let e = [], n = "", r = 0;
		for (let c = 0; c < t.length; c++) {
			let f = t[c];
			f === "(" ? r++ : f === ")" && (r = Math.max(0, r - 1)), f === "," && r === 0 ? (e.push(n), n = "") : n += f;
		}
		n.trim() && e.push(n);
		let o = 0, s = 0, i = 0, a = 0;
		for (let c of e) {
			if (/\binset\b/i.test(c)) continue;
			let f = c.match(/-?\d+(\.\d+)?px/g)?.map((g) => parseFloat(g)) || [];
			if (f.length < 2) continue;
			let [l, d, u = 0, p = 0] = f, h = Math.abs(l) + u + p, m = Math.abs(d) + u + p;
			s = Math.max(s, h + Math.max(l, 0)), a = Math.max(a, h + Math.max(-l, 0)), i = Math.max(i, m + Math.max(d, 0)), o = Math.max(o, m + Math.max(-d, 0));
		}
		return {
			top: Math.ceil(o),
			right: Math.ceil(s),
			bottom: Math.ceil(i),
			left: Math.ceil(a)
		};
	}
	function Wr(t) {
		let e = t.filter && t.filter !== "none" ? t.filter : t.webkitFilter || "", n = /blur\(\s*([0-9.]+)px\s*\)/gi, r = 0, o;
		for (; o = n.exec(e);) r += parseFloat(o[1]) || 0;
		let s = Math.ceil(r);
		return {
			top: s,
			right: s,
			bottom: s,
			left: s
		};
	}
	function Or(t) {
		if ((t.outlineStyle || "none") === "none") return {
			top: 0,
			right: 0,
			bottom: 0,
			left: 0
		};
		let e = Math.ceil(parseFloat(t.outlineWidth || "0") || 0), n = parseFloat(t.outlineOffset || "0") || 0, r = e + Math.max(0, Math.ceil(n));
		return {
			top: r,
			right: r,
			bottom: r,
			left: r
		};
	}
	function Br(t) {
		let e = `${t.filter || ""} ${t.webkitFilter || ""}`.trim();
		if (!e || e === "none") return {
			bleed: {
				top: 0,
				right: 0,
				bottom: 0,
				left: 0
			},
			has: !1
		};
		let n = e.match(/drop-shadow\((?:[^()]|\([^()]*\))*\)/gi) || [], r = 0, o = 0, s = 0, i = 0, a = !1;
		for (let c of n) {
			a = !0;
			let [l = 0, d = 0, u = 0] = c.match(/-?\d+(?:\.\d+)?px/gi)?.map((m) => parseFloat(m)) || [], p = Math.abs(l) + u, h = Math.abs(d) + u;
			o = Math.max(o, p + Math.max(l, 0)), i = Math.max(i, p + Math.max(-l, 0)), s = Math.max(s, h + Math.max(d, 0)), r = Math.max(r, h + Math.max(-d, 0));
		}
		return {
			bleed: {
				top: E(r),
				right: E(o),
				bottom: E(s),
				left: E(i)
			},
			has: a
		};
	}
	function Ur(t, e) {
		if (!t || !e || !e.style) return null;
		let n = getComputedStyle(t);
		try {
			e.style.transformOrigin = "0 0";
		} catch {}
		try {
			"translate" in e.style && (e.style.translate = "none"), "rotate" in e.style && (e.style.rotate = "none");
		} catch {}
		let r = n.transform || "none";
		if (!r || r === "none") {
			let a = null;
			try {
				a = zt(t).scale;
			} catch {}
			try {
				e.style.transform = "none";
			} catch {}
			if (!a) return {
				a: 1,
				b: 0,
				c: 0,
				d: 1
			};
			let c = a.trim().split(/\s+/).map(parseFloat), f = Number.isFinite(c[0]) ? c[0] : 1;
			return {
				a: f,
				b: 0,
				c: 0,
				d: Number.isFinite(c[1]) ? c[1] : f
			};
		}
		function o(a, c, f, l) {
			let d = Math.sqrt(a * a + c * c) || 0, u = 0, p = 0;
			if (d > 0) {
				let h = a / d, m = c / d;
				u = h * f + m * l;
				let g = f - h * u, y = l - m * u;
				p = Math.sqrt(g * g + y * y) || 0, p > 0 ? u = u / p : u = 0;
			}
			return {
				a: d,
				b: 0,
				c: u * p,
				d: p
			};
		}
		let s = r.match(/^matrix\(\s*([^)]+)\)$/i);
		if (s) {
			let a = s[1].split(",").map((c) => parseFloat(c.trim()));
			if (a.length === 6 && a.every(Number.isFinite)) {
				let [c, f, l, d] = a, u = o(c, f, l, d);
				try {
					e.style.transform = `matrix(${u.a}, ${u.b}, ${u.c}, ${u.d}, 0, 0)`;
				} catch {}
				return u;
			}
		}
		let i = r.match(/^matrix3d\(\s*([^)]+)\)$/i);
		if (i) {
			let a = i[1].split(",").map((c) => parseFloat(c.trim()));
			if (a.length === 16 && a.every(Number.isFinite)) {
				let c = a[0], f = a[1], l = a[4], d = a[5], u = o(c, f, l, d);
				try {
					e.style.transform = `matrix(${u.a}, ${u.b}, ${u.c}, ${u.d}, 0, 0)`;
				} catch {}
				return u;
			}
		}
		try {
			let a = new DOMMatrix(r), c = o(a.a, a.b, a.c, a.d);
			try {
				e.style.transform = `matrix(${c.a}, ${c.b}, ${c.c}, ${c.d}, 0, 0)`;
			} catch {}
			return c;
		} catch {
			return null;
		}
	}
	function Ht(t, e, n, r, o) {
		let s = n.a, i = n.b, a = n.c, c = n.d, f = n.e || 0, l = n.f || 0;
		function d(y, b) {
			let S = y - r, w = b - o, v = s * S + a * w, C = i * S + c * w;
			return v += r + f, C += o + l, [v, C];
		}
		let u = [
			d(0, 0),
			d(t, 0),
			d(0, e),
			d(t, e)
		], p = 1 / 0, h = 1 / 0, m = -1 / 0, g = -1 / 0;
		for (let [y, b] of u) y < p && (p = y), b < h && (h = b), y > m && (m = y), b > g && (g = b);
		return {
			minX: p,
			minY: h,
			maxX: m,
			maxY: g,
			width: m - p,
			height: g - h
		};
	}
	function ne(t, e, n) {
		let r = (t.transformOrigin || "0 0").trim().split(/\s+/), [o, s] = [r[0] || "0", r[1] || "0"], i = (a, c) => {
			let f = a.toLowerCase();
			return f === "left" || f === "top" ? 0 : f === "center" ? c / 2 : f === "right" || f === "bottom" ? c : f.endsWith("px") ? parseFloat(f) || 0 : f.endsWith("%") ? (parseFloat(f) || 0) * c / 100 : /^-?\d+(\.\d+)?$/.test(f) && parseFloat(f) || 0;
		};
		return {
			ox: i(o, e),
			oy: i(s, n)
		};
	}
	function zt(t) {
		let e = {
			rotate: "0deg",
			scale: null,
			translate: null
		}, n = typeof t.computedStyleMap == "function" ? t.computedStyleMap() : null;
		if (n) {
			let o = (c) => {
				try {
					return typeof n.has == "function" && !n.has(c) || typeof n.get != "function" ? null : n.get(c);
				} catch {
					return null;
				}
			}, s = o("rotate");
			if (s) if (s.angle) {
				let c = s.angle;
				e.rotate = c.unit === "rad" ? c.value * 180 / Math.PI + "deg" : c.value + c.unit;
			} else s.unit ? e.rotate = s.unit === "rad" ? s.value * 180 / Math.PI + "deg" : s.value + s.unit : e.rotate = String(s);
			else {
				let c = getComputedStyle(t);
				e.rotate = c.rotate && c.rotate !== "none" ? c.rotate : "0deg";
			}
			let i = o("scale");
			if (i) {
				let c = "x" in i && i.x?.value != null ? i.x.value : Array.isArray(i) ? i[0]?.value : Number(i) || 1;
				e.scale = `${c} ${"y" in i && i.y?.value != null ? i.y.value : Array.isArray(i) ? i[1]?.value : c}`;
			} else {
				let c = getComputedStyle(t);
				e.scale = c.scale && c.scale !== "none" ? c.scale : null;
			}
			let a = o("translate");
			if (a) {
				let c = "x" in a && "value" in a.x ? a.x.value : Array.isArray(a) ? a[0]?.value : 0, f = "y" in a && "value" in a.y ? a.y.value : Array.isArray(a) ? a[1]?.value : 0;
				e.translate = `${c}${"x" in a && a.x?.unit ? a.x.unit : "px"} ${f}${"y" in a && a.y?.unit ? a.y.unit : "px"}`;
			} else {
				let c = getComputedStyle(t);
				e.translate = c.translate && c.translate !== "none" ? c.translate : null;
			}
			return e;
		}
		let r = getComputedStyle(t);
		return e.rotate = r.rotate && r.rotate !== "none" ? r.rotate : "0deg", e.scale = r.scale && r.scale !== "none" ? r.scale : null, e.translate = r.translate && r.translate !== "none" ? r.translate : null, e;
	}
	var an = null;
	function ms() {
		if (an) return an;
		let t = document.createElement("div");
		return t.id = "snapdom-measure-slot", t.setAttribute("aria-hidden", "true"), Object.assign(t.style, {
			position: "absolute",
			left: "-99999px",
			top: "0px",
			width: "0px",
			height: "0px",
			overflow: "hidden",
			opacity: "0",
			pointerEvents: "none",
			contain: "size layout style"
		}), document.documentElement.appendChild(t), an = t, t;
	}
	function Dr(t) {
		let e = ms(), n = document.createElement("div");
		n.style.transformOrigin = "0 0", t.baseTransform && (n.style.transform = t.baseTransform), t.rotate && (n.style.rotate = t.rotate), t.scale && (n.style.scale = t.scale), t.translate && (n.style.translate = t.translate), e.appendChild(n);
		let r = hs(n);
		return e.removeChild(n), r;
	}
	function Hr(t) {
		let e = L(t), n = e.transform || "none";
		if (n !== "none" && !/^matrix\(\s*1\s*,\s*0\s*,\s*0\s*,\s*1\s*,\s*0\s*,\s*0\s*\)$/i.test(n)) return !0;
		let o = e.rotate && e.rotate !== "none" && e.rotate !== "0deg", s = e.scale && e.scale !== "none" && e.scale !== "1", i = e.translate && e.translate !== "none" && e.translate !== "0px 0px";
		return !!(o || s || i);
	}
	function hs(t) {
		let e = getComputedStyle(t).transform;
		if (!e || e === "none") return new DOMMatrix();
		try {
			return new DOMMatrix(e);
		} catch {
			return new WebKitCSSMatrix(e);
		}
	}
	function Fe(t, e) {
		if (!e) return null;
		let n = t.ownerDocument || document, r = n.defaultView || window, o, s, i, a;
		if (e === "viewport") o = 0, s = 0, i = n.documentElement?.clientWidth || r.innerWidth, a = n.documentElement?.clientHeight || r.innerHeight;
		else if (typeof e == "object") o = (Number(e.x) || 0) - (r.scrollX || 0), s = (Number(e.y) || 0) - (r.scrollY || 0), i = Number(e.width), a = Number(e.height);
		else return null;
		return i > 0 && a > 0 ? {
			left: o,
			top: s,
			width: i,
			height: a,
			right: o + i,
			bottom: s + a
		} : null;
	}
	function cn(t) {
		if (t.parentElement) return t.parentElement;
		let e = t.getRootNode && t.getRootNode();
		return e instanceof ShadowRoot ? e.host : null;
	}
	function gs(t, e) {
		for (let n = e; n; n = cn(n)) if (n === t) return !0;
		return !1;
	}
	function ys(t, e) {
		for (let n = cn(t); n && n !== e && n?.nodeType === 1; n = cn(n)) {
			let r = L(n);
			if (r.position !== "static" || r.transform && r.transform !== "none" || r.filter && r.filter !== "none" || r.backdropFilter && r.backdropFilter !== "none" || r.perspective && r.perspective !== "none" || /transform|perspective|filter/.test(r.willChange || "") || /layout|paint|strict|content/.test(r.contain || "")) return n;
		}
		return null;
	}
	function fn(t, e) {
		try {
			let n = new DOMMatrix();
			if (e && e.rotate && e.rotate !== "0deg" && (n = n.multiply(new DOMMatrix(`rotate(${e.rotate})`))), e && e.scale) {
				let r = String(e.scale).trim().split(/\s+/).filter(Boolean);
				r.length && r.every((o) => Number.isFinite(Number(o))) && (n = n.multiply(new DOMMatrix(`scale(${r.join(",")})`)));
			}
			return t && (n = n.multiply(new DOMMatrix(t))), n;
		} catch {
			return null;
		}
	}
	function Xr(t, e, n, r, o) {
		let s = t.getBoundingClientRect();
		e instanceof HTMLElement && L(t).position === "static" && (e.style.position = "relative");
		let i = [];
		for (let [a, c] of n) {
			if (!(a instanceof HTMLElement) || c?.nodeType !== 1 || c === t || !gs(t, c)) continue;
			let f = r.get(c) || L(c), l = f.position;
			if (l !== "fixed" && l !== "sticky" && l !== "-webkit-sticky" || a.style.position === "absolute") continue;
			let d = c.getBoundingClientRect();
			if (!(d.width > 0 && d.height > 0)) continue;
			let u = f.transform && f.transform !== "none" ? f.transform : "", p = zt(c), h = !!(u || p.rotate !== "0deg" || p.scale || p.translate), m = h ? fn(u, p) : null, g = !m || !m.is2D || m.a === 1 && m.b === 0 && m.c === 0 && m.d === 1, y = d.width, b = d.height;
			g || (y = c.offsetWidth || d.width, b = c.offsetHeight || d.height);
			let S = c.getRootNode && c.getRootNode() instanceof ShadowRoot, w = s, v = t.clientLeft || 0, C = t.clientTop || 0;
			if (S) {
				let $ = ys(c, t);
				$ && (w = $.getBoundingClientRect(), v = $.clientLeft || 0, C = $.clientTop || 0);
			}
			let M = d.left - w.left - v, A = d.top - w.top - C;
			if (h) if (a.style.translate = "none", a.style.rotate = "none", a.style.scale = "none", g) a.style.transform = "none";
			else {
				a.style.transform = `matrix(${m.a},${m.b},${m.c},${m.d},0,0)`;
				let { ox: $, oy: T } = ne(f, y, b), O = Ht(y, b, {
					a: m.a,
					b: m.b,
					c: m.c,
					d: m.d,
					e: 0,
					f: 0
				}, $, T);
				M -= O.minX, A -= O.minY;
			}
			if (l !== "fixed") {
				let $ = a.cloneNode(!1);
				$.setAttribute("data-snap-ph", "1"), $.style.position = "static", $.style.visibility = "hidden", $.style.width = `${y}px`, $.style.height = `${b}px`, $.style.boxSizing = "border-box", a.parentElement?.insertBefore($, a);
			}
			let k = y + 2, R = b;
			o && (Math.abs(A - o.y) < .5 && (A -= 1, R += 1), Math.abs(M - o.x) < .5 && (M -= 1, k += 1)), a.style.position = "absolute", a.style.left = `${M}px`, a.style.top = `${A}px`, a.style.right = "auto", a.style.bottom = "auto", a.style.margin = "0", a.style.width = `${k}px`, a.style.height = `${R}px`, a.style.boxSizing = "border-box", S || i.push(a);
		}
		for (let a of i) e.appendChild(a);
	}
	function Gr(t, e, n = {}) {
		if (!t || !e || !e.style) return;
		let r = getComputedStyle(t);
		try {
			e.style.boxShadow = "none";
		} catch (i) {
			_(n, "stripRootShadows boxShadow", i);
		}
		try {
			e.style.textShadow = "none";
		} catch (i) {
			_(n, "stripRootShadows textShadow", i);
		}
		try {
			e.style.outline = "none";
		} catch (i) {
			_(n, "stripRootShadows outline", i);
		}
		let s = (r.filter || "").replace(/\bdrop-shadow\((?:[^()]|\([^()]*\))*\)\s*/gi, "").trim().replace(/\s+/g, " ");
		try {
			e.style.filter = s.length ? s : "none";
		} catch (i) {
			_(n, "stripRootShadows filter", i);
		}
	}
	function zr(t) {
		let e = t.display || "";
		if (e.includes("flex") || e.includes("grid") || e.startsWith("table") || e === "inline-block" || e === "flow-root" || t.position === "absolute" || t.position === "fixed" || t.float && t.float !== "none") return !0;
		let n = t.overflowX || t.overflow || "visible", r = t.overflowY || t.overflow || "visible";
		return !!(n !== "visible" || r !== "visible" || t.contain && /\b(layout|content|paint|strict)\b/.test(t.contain));
	}
	function bs(t, e) {
		let n = Array.from(t.childNodes), r = e === "top" ? n : n.reverse();
		for (let o of r) {
			if (o.nodeType === Node.TEXT_NODE) {
				if (/\S/.test(o.textContent || "")) return null;
				continue;
			}
			if (o.nodeType !== Node.ELEMENT_NODE) continue;
			let s = getComputedStyle(o), i = String(s.display || "");
			if (!(i === "none" || i === "contents") && !(s.position === "absolute" || s.position === "fixed")) return s.float && s.float !== "none" || i.startsWith("inline") ? null : o;
		}
		return null;
	}
	function Yr(t, e, n) {
		if (!t || !e || !e.style) return;
		let r = getComputedStyle(t);
		if (!zr(r)) for (let o of ["top", "bottom"]) {
			let s = o === "top" ? "Top" : "Bottom";
			if ((parseFloat(r[`border${s}Width`]) || 0) > 0 || (parseFloat(r[`padding${s}`]) || 0) > 0) continue;
			let i = t, a = e;
			for (; i && a;) {
				let c = bs(i, o);
				if (!c) break;
				let f = n ? Array.from(a.children).find((u) => n.get(u) === c) || null : a.children[Array.from(i.children).indexOf(c)] || null, l = getComputedStyle(c), d = parseFloat(l[`margin${s}`]) || 0;
				if (f && f.style && d > 0 && (f.style[`margin${s}`] = "0px"), zr(l) || (parseFloat(l[`border${s}Width`]) || 0) > 0 || (parseFloat(l[`padding${s}`]) || 0) > 0) break;
				i = c, a = f;
			}
		}
	}
	function ws(t) {
		let e = document.createTreeWalker(t, NodeFilter.SHOW_COMMENT), n = [];
		for (; e.nextNode();) n.push(e.currentNode);
		for (let r of n) r.remove();
	}
	function xs(t, e = {}) {
		let { stripFrameworkDirectives: n = !0 } = e, r = new Set(["xml", "xlink"]), o = document.createTreeWalker(t, NodeFilter.SHOW_ELEMENT);
		for (; o.nextNode();) {
			let s = o.currentNode;
			for (let i of Array.from(s.attributes)) {
				let a = i.name;
				if (a.startsWith("*")) {
					s.removeAttribute(a);
					continue;
				}
				if (a.includes("@")) {
					s.removeAttribute(a);
					continue;
				}
				if (a.includes(":")) {
					let c = a.split(":", 1)[0];
					if (!r.has(c)) {
						s.removeAttribute(a);
						continue;
					}
				}
				if (n && (a.startsWith("x-") || a.startsWith("v-") || a.startsWith(":") || a.startsWith("on:") || a.startsWith("bind:") || a.startsWith("let:") || a.startsWith("class:"))) {
					s.removeAttribute(a);
					continue;
				}
			}
		}
	}
	var Vr = /[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFE\uFFFF]/g;
	function Ss(t) {
		if (!t) return;
		let e = (o) => {
			if (o.nodeType === Node.ELEMENT_NODE) {
				if (o.attributes) for (let s of Array.from(o.attributes)) {
					let i = s.value.replace(Vr, "");
					if (i !== s.value) try {
						o.setAttribute(s.name, i);
					} catch {}
				}
			} else if (o.nodeType === Node.TEXT_NODE || o.nodeType === Node.CDATA_SECTION_NODE) {
				let s = o.data.replace(Vr, "");
				s !== o.data && (o.data = s);
			}
		};
		e(t);
		let n = document.createTreeWalker(t, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT), r;
		for (; r = n.nextNode();) e(r);
	}
	function Kr(t, e = {}) {
		t && (xs(t, e), ws(t), Ss(t));
	}
	function vs(t) {
		try {
			let e = t.getAttribute?.("style") || "";
			return /\b(height|width|block-size|inline-size)\s*:/.test(e);
		} catch {
			return !1;
		}
	}
	function Cs(t) {
		return t instanceof HTMLImageElement || t instanceof HTMLCanvasElement || t instanceof HTMLVideoElement || t instanceof HTMLIFrameElement || t instanceof SVGElement || t instanceof HTMLObjectElement || t instanceof HTMLEmbedElement;
	}
	function As(t, e) {
		if (t?.nodeType !== 1 || vs(t) || Cs(t)) return !1;
		let n = e.position;
		if (n === "absolute" || n === "fixed" || n === "sticky") return !1;
		let r = e.display || "";
		return !(r.includes("flex") || r.includes("grid") || r.startsWith("table") || e.transform && e.transform !== "none");
	}
	function Qr(t, e, n = new Map()) {
		function r(o, s) {
			if (o?.nodeType !== 1 || s?.nodeType !== 1) return;
			let i = o.childElementCount > s.childElementCount, a = n.get(o) || getComputedStyle(o);
			if (n.has(o) || n.set(o, a), i && As(o, a)) {
				s.style.height || (s.style.height = "auto"), s.style.width || (s.style.width = "auto"), s.style.removeProperty("block-size"), s.style.removeProperty("inline-size"), s.style.minHeight || (s.style.minHeight = "0"), s.style.minWidth || (s.style.minWidth = "0"), s.style.maxHeight || (s.style.maxHeight = "none"), s.style.maxWidth || (s.style.maxWidth = "none");
				let l = a.overflowY || a.overflowBlock || "visible", d = a.overflowX || a.overflowInline || "visible";
				(l !== "visible" || d !== "visible") && (s.style.overflow = "visible");
			}
			let c = Array.from(o.children), f = Array.from(s.children);
			for (let l = 0; l < Math.min(c.length, f.length); l++) r(c[l], f[l]);
		}
		r(t, e);
	}
	function ks(t) {
		let e = getComputedStyle(t);
		return !(e.display === "none" || e.position === "absolute" || e.position === "fixed");
	}
	function Ms(t, e) {
		if (t?.nodeType !== 1) return !1;
		if (t.getAttribute("data-capture") === "exclude" && e?.excludeMode === "remove") return !0;
		if (Array.isArray(e?.exclude)) for (let n of e.exclude) try {
			if (t.matches(n)) return e.excludeMode === "remove";
		} catch (r) {
			_(e, "exclude selector match failed", r);
		}
		if (typeof e?.filter == "function" && e.filterMode === "remove") try {
			if (!e.filter(t)) return !0;
		} catch (n) {
			_(e, "filter function failed", n);
		}
		return !1;
	}
	function Jr(t, e) {
		let n = getComputedStyle(t), r = t.getBoundingClientRect(), o = 1 / 0, s = -1 / 0, i = !1, a = Array.from(t.children);
		for (let p of a) {
			if (Ms(p, e) || !ks(p)) continue;
			let h = p.getBoundingClientRect(), m = h.top - r.top, g = h.bottom - r.top;
			g <= m || (m < o && (o = m), g > s && (s = g), i = !0);
		}
		let c = i ? Math.max(0, s - o) : 0, f = parseFloat(n.borderTopWidth) || 0, l = parseFloat(n.borderBottomWidth) || 0, d = parseFloat(n.paddingTop) || 0, u = parseFloat(n.paddingBottom) || 0;
		return f + l + d + u + c;
	}
	var E = (t, e = 3) => Number.isFinite(t) ? Math.round(t * 10 ** e) / 10 ** e : t;
	var jr = .75;
	function Zr(t, e, n, r, o, s) {
		let i = t.ownerDocument || document, a = t.getBoundingClientRect(), c = o > 0 && a.width > 0 ? a.width / o : 1, f = s > 0 && a.height > 0 ? a.height / s : 1;
		if (Math.abs(c - f) > .02) return 0;
		let l = i.createElement("div");
		l.setAttribute("data-snapdom-internal", ""), l.style.cssText = "position:absolute!important;left:-9999px!important;top:0!important;width:" + o + "px!important;overflow:visible!important;visibility:hidden!important;";
		let d = l.attachShadow({ mode: "open" }), u = i.createElement("style");
		u.textContent = n, d.appendChild(u);
		let p = e.cloneNode(!0);
		d.appendChild(p), i.body.appendChild(l);
		let h = 0;
		try {
			let m = (g, y) => {
				let b = g.children, S = y.children, w = Math.min(b.length, S.length);
				for (let v = 0; v < w; v++) {
					let C = b[v], M = S[v], A = r.get(C);
					if (A?.nodeType === 1 && C instanceof HTMLElement && A.isConnected) {
						let k = A.getBoundingClientRect();
						if (k.width > 0 && k.height > 0) {
							let R = M.getBoundingClientRect(), $ = R.width - k.width / c, T = R.height - k.height / f;
							(Math.abs($) > jr || Math.abs(T) > jr) && (C.style.boxSizing = "border-box", C.style.width = `${E(k.width / c)}px`, C.style.height = `${E(k.height / f)}px`, h++);
						}
					}
					m(C, M);
				}
			};
			m(e, p);
		} finally {
			l.remove();
		}
		return h;
	}
	var Es = /::-webkit-scrollbar(-[a-z]+)?\b/i;
	function ln(t, e = new Set()) {
		let n = "";
		if (!t) return n;
		for (let r = 0; r < t.length; r++) {
			let o = t[r];
			try {
				if (o.type === CSSRule.IMPORT_RULE && o.styleSheet) {
					n += ln(o.styleSheet.cssRules, e);
					continue;
				}
				if (o.type === CSSRule.MEDIA_RULE && o.cssRules) {
					let s = ln(o.cssRules, e);
					s && (n += `@media ${o.conditionText}{${s}}`);
					continue;
				}
				if (o.type === CSSRule.STYLE_RULE) {
					let s = o.selectorText || "";
					if (Es.test(s)) {
						let i = o.cssText;
						i && !e.has(i) && (e.add(i), n += i);
					}
				}
			} catch {}
		}
		return n;
	}
	var qr = new WeakMap();
	function $s(t) {
		let e = "";
		for (let n of t.styleSheets) {
			let r = -1;
			try {
				r = n.cssRules ? n.cssRules.length : -1;
			} catch {}
			e += (n.href || "inline") + ":" + r + "|";
		}
		return e;
	}
	function to(t) {
		if (!t || !t.styleSheets) return "";
		let e = $s(t), n = qr.get(t);
		if (n && n.fp === e) return n.css;
		let r = new Set(), o = "";
		for (let s of Array.from(t.styleSheets)) try {
			let i = s.cssRules;
			i && (o += ln(i, r));
		} catch {}
		return qr.set(t, {
			fp: e,
			css: o
		}), o;
	}
	async function eo(t, e = {}) {
		let n = e.__session || x.session, r = {
			styleMap: n.styleMap,
			styleCache: n.styleCache,
			nodeMap: n.nodeMap,
			options: e
		}, o = null;
		if (e.clip) {
			let u = Fe(t, e.clip);
			if (u) {
				r.clip = {
					rect: u,
					root: t
				};
				let p = t.getBoundingClientRect();
				o = {
					x: u.left - p.left,
					y: u.top - p.top,
					width: u.width,
					height: u.height
				};
			}
		}
		let s, i = "", a = "", c = Lr(t), f = r.clip ? () => {} : Pr(t);
		try {
			s = await te(t, r, e);
		} catch (u) {
			throw console.warn("deepClone failed:", u), u;
		} finally {
			f(), c();
		}
		try {
			Tr(s);
		} catch (u) {
			console.warn("inlineExternal defs or symbol failed:", u);
		}
		try {
			await $e(t, s, r, e);
		} catch (u) {
			console.warn("inlinePseudoElements failed:", u);
		}
		await er(s, r);
		try {
			let u = s.querySelectorAll("style[data-sd]");
			for (let p of u) a += p.textContent || "", p.remove();
		} catch (u) {
			_(r, "Failed to extract shadow CSS from style[data-sd]", u);
		}
		let l = Ve(r.styleMap);
		i = Array.from(l.entries()).map(([u, p]) => `.${p}{${u}}`).join(""), i = a + "[data-snapdom-has-after]::after,[data-snapdom-has-before]::before{content:none!important;display:none!important}" + i;
		for (let [u, p] of r.styleMap.entries()) {
			if (u.tagName === "STYLE") continue;
			if (u.getRootNode && u.getRootNode() instanceof ShadowRoot) {
				u.setAttribute("style", p.replace(/;/g, "; "));
				continue;
			}
			let h = l.get(p);
			h && u.classList.add(h);
			let m = u.style?.backgroundImage, g = u.dataset?.snapdomHasIcon;
			m && m !== "none" && (u.style.backgroundImage = m), g && (u.style.verticalAlign = "middle", u.style.display = "inline");
		}
		if ((r.clip || t.scrollTop || t.scrollLeft) && s?.nodeType === 1) try {
			let u = r.clip && o ? {
				x: o.x,
				y: o.y
			} : {
				x: 0,
				y: 0
			};
			Xr(t, s, r.nodeMap, r.styleCache, u);
		} catch (u) {
			_(r, "freezeViewportPositioned failed", u);
		}
		for (let [u, p] of r.nodeMap.entries()) {
			if (r.clip && p === t) continue;
			let h = p.scrollLeft, m = p.scrollTop;
			if ((h || m) && u?.nodeType === 1 && u.namespaceURI === "http://www.w3.org/1999/xhtml") {
				u.style.overflow = "hidden", u.style.scrollbarWidth = "none", u.style.msOverflowStyle = "none";
				try {
					let b = u.querySelectorAll("*");
					for (let S of b) {
						if (S.nodeType !== 1 || S.namespaceURI !== "http://www.w3.org/1999/xhtml") continue;
						let w = S.style.position;
						if (w === "fixed" || w === "absolute") {
							let v = parseFloat(S.style.top) || 0, C = parseFloat(S.style.left) || 0;
							S.style.top = `${v + m}px`, S.style.left = `${C + h}px`, w === "fixed" && (S.style.position = "absolute");
						}
					}
				} catch {}
				let y = document.createElement("div");
				for (y.style.all = "unset", y.style.transform = `translate(${-h}px, ${-m}px)`, y.style.willChange = "transform", y.style.display = "inline-block", y.style.width = "100%"; u.firstChild;) y.appendChild(u.firstChild);
				u.appendChild(y);
			}
		}
		if (t === r.nodeMap.get(s)) {
			let u = r.styleCache.get(t) || L(t);
			r.styleCache.set(t, u);
			let p = Oe(u.transform);
			s.style.margin = "0", s.style.top = "auto", s.style.left = "auto", s.style.right = "auto", s.style.bottom = "auto", s.style.animation = "none", s.style.transition = "none", s.style.willChange = "auto", s.style.float = "none", s.style.clear = "none", s.style.transform = p || "";
		}
		for (let [u, p] of r.nodeMap.entries()) p.tagName === "PRE" && (u.style.marginTop = "0", u.style.marginBlockStart = "0");
		return {
			clone: s,
			classCSS: i,
			styleCache: r.styleCache,
			nodeMap: r.nodeMap,
			reconcileRisk: r.reconcileRisk || 0,
			clipWindow: o
		};
	}
	ht();
	J();
	var no = "http://www.w3.org/1999/xlink";
	function Fs(t) {
		return t.getAttribute("href") || t.getAttribute("xlink:href") || (typeof t.getAttributeNS == "function" ? t.getAttributeNS(no, "href") : null);
	}
	function Rs(t) {
		let e = parseInt(t.dataset?.snapdomWidth || "", 10) || 0, n = parseInt(t.dataset?.snapdomHeight || "", 10) || 0, r = parseInt(t.getAttribute("width") || "", 10) || 0, o = parseInt(t.getAttribute("height") || "", 10) || 0, s = parseFloat(t.style?.width || "") || 0, i = parseFloat(t.style?.height || "") || 0;
		return {
			width: e || s || r || t.width || t.naturalWidth || 100,
			height: n || i || o || t.height || t.naturalHeight || 100
		};
	}
	async function ro(t, e = {}) {
		let n = Array.from(t.querySelectorAll("img"));
		t.tagName === "IMG" && n.unshift(t);
		let r = async (a) => {
			if (!a.getAttribute("src")) {
				let h = a.currentSrc || a.src || Ot(a.getAttribute("srcset"), a) || "";
				h && a.setAttribute("src", h);
			}
			a.removeAttribute("srcset"), a.removeAttribute("sizes");
			let c = a.src || "";
			if (!c) return;
			let f = x.image?.get(c);
			if (f) {
				a.src = f, a.width || (a.width = a.naturalWidth || 100), a.height || (a.height = a.naturalHeight || 100);
				return;
			}
			let l = await z(c, {
				as: "dataURL",
				useProxy: e.useProxy
			});
			if (l.ok && typeof l.data == "string" && l.data.startsWith("data:")) {
				x.image?.set(c, l.data), a.src = l.data, a.width || (a.width = a.naturalWidth || 100), a.height || (a.height = a.naturalHeight || 100);
				return;
			}
			let { width: d, height: u } = Rs(a), { fallbackURL: p } = e || {};
			if (p) try {
				let h = typeof p == "function" ? await p({
					width: d,
					height: u,
					src: c,
					element: a
				}) : p;
				if (h) {
					let m = await z(h, {
						as: "dataURL",
						useProxy: e.useProxy
					});
					if (m?.ok && typeof m.data == "string") {
						a.src = m.data, a.width || (a.width = d), a.height || (a.height = u);
						return;
					}
				}
			} catch {}
			if (e.placeholders !== !1) {
				let h = document.createElement("div");
				h.style.cssText = [
					`width:${d}px`,
					`height:${u}px`,
					"background:#ccc",
					"display:inline-block",
					"text-align:center",
					`line-height:${u}px`,
					"color:#666",
					"font-size:12px",
					"overflow:hidden"
				].join(";"), h.textContent = "img", a.replaceWith(h);
			} else {
				let h = document.createElement("div");
				h.style.cssText = `display:inline-block;width:${d}px;height:${u}px;visibility:hidden;`, a.replaceWith(h);
			}
		}, o = 6;
		for (let a = 0; a < n.length; a += o) {
			let c = n.slice(a, a + o).map(r);
			await Promise.allSettled(c);
		}
		let s = Array.from(t.querySelectorAll("image"));
		t.localName === "image" && s.unshift(t);
		let i = async (a) => {
			let c = Fs(a);
			if (!c || c.startsWith("data:") || c.startsWith("blob:")) return;
			let f = await z(c, {
				as: "dataURL",
				useProxy: e.useProxy
			});
			f.ok && typeof f.data == "string" && f.data.startsWith("data:") && (a.setAttribute("href", f.data), a.removeAttribute("xlink:href"), typeof a.removeAttributeNS == "function" && a.removeAttributeNS(no, "href"));
		};
		for (let a = 0; a < s.length; a += o) {
			let c = s.slice(a, a + o).map(i);
			await Promise.allSettled(c);
		}
	}
	et();
	J();
	var un = [
		"background-image",
		"mask",
		"mask-image",
		"-webkit-mask",
		"-webkit-mask-image",
		"mask-source",
		"mask-box-image-source",
		"mask-border-source",
		"-webkit-mask-box-image-source",
		"border-image",
		"border-image-source"
	];
	var Ts = [
		"mask-position",
		"mask-size",
		"mask-repeat",
		"mask-mode",
		"mask-composite",
		"-webkit-mask-position",
		"-webkit-mask-size",
		"-webkit-mask-repeat",
		"-webkit-mask-composite",
		"mask-origin",
		"mask-clip",
		"-webkit-mask-origin",
		"-webkit-mask-clip",
		"-webkit-mask-position-x",
		"-webkit-mask-position-y"
	];
	var Ls = [
		"background-position",
		"background-position-x",
		"background-position-y",
		"background-size",
		"background-repeat",
		"background-origin",
		"background-clip",
		"background-attachment",
		"background-blend-mode"
	];
	var Ps = [
		"border-image-slice",
		"border-image-width",
		"border-image-outset",
		"border-image-repeat"
	];
	async function Ns(t, e, n, r) {
		let o = n.get(t) || L(t);
		n.has(t) || n.set(t, o);
		let s = o.getPropertyValue("border-image"), i = o.getPropertyValue("border-image-source"), a = s && s !== "none" || i && i !== "none", c = o.getPropertyValue("background-image"), f = o.getPropertyValue("background-color");
		if (c && c !== "none" || f && f !== "rgba(0, 0, 0, 0)" && f !== "transparent" || /url\s*\(|gradient\s*\(/i.test(o.getPropertyValue("background") || "")) for (let d of Ls) {
			let u = o.getPropertyValue(d);
			u && e.style.setProperty(d, u);
		}
		for (let d of un) {
			let u = o.getPropertyValue(d);
			if (d === "background-image" && (!u || u === "none")) {
				let m = o.getPropertyValue("background");
				m && /url\s*\(/.test(m) && (u = _t(m).filter((g) => /url\s*\(/.test(g)).join(", ") || u);
			}
			if (!u || u === "none") continue;
			let p = _t(u), h = await Promise.all(p.map((m) => Mt(m, r)));
			h.some((m) => m && m !== "none" && !/^url\(undefined/.test(m)) && e.style.setProperty(d, h.join(", "));
		}
		for (let d of Ts) {
			let u = o.getPropertyValue(d);
			!u || u === "initial" || e.style.setProperty(d, u);
		}
		if (a) for (let d of Ps) {
			let u = o.getPropertyValue(d);
			!u || u === "initial" || e.style.setProperty(d, u);
		}
	}
	async function oo(t, e, n, r = {}, o = x.session.nodeMap) {
		if (!e) return;
		let s = [];
		t && Ke(t) && s.push([t, e]);
		let i = [e];
		for (; i.length;) {
			let c = i.pop();
			if (c.children) for (let f of c.children) {
				if (f.tagName === "STYLE") continue;
				let l = o.get(f);
				l && Ke(l) && s.push([l, f]), i.push(f);
			}
		}
		let a = 6;
		for (let c = 0; c < s.length; c += a) await Promise.allSettled(s.slice(c, c + a).map(([f, l]) => Ns(f, l, n, r)));
	}
	J();
	et();
	function so(t, e, n = x.session.nodeMap) {
		let r = [], o = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT);
		for (let a = o.currentNode; a; a = o.nextNode()) {
			let c = n.get(a);
			if (c?.nodeType !== 1) continue;
			let f = L(c), l = f.getPropertyValue("backdrop-filter") || f.getPropertyValue("-webkit-backdrop-filter");
			l && l !== "none" && a !== e && r.push({
				cloneEl: a,
				orig: c,
				bf: l,
				path: Ws(e, a)
			});
		}
		if (!r.length) return;
		let s = t.getBoundingClientRect(), i = r.map((a, c) => {
			let f = e.cloneNode(!0);
			_s(f, e, a.orig.getBoundingClientRect(), n), Os(io(f, a.path));
			for (let l = 0; l < c; l++) {
				let d = io(f, r[l].path);
				d && (d.style.setProperty("backdrop-filter", "none", "important"), d.style.setProperty("-webkit-backdrop-filter", "none", "important"));
			}
			return {
				...a,
				copy: f
			};
		});
		for (let { cloneEl: a, orig: c, bf: f, copy: l } of i) Is(a, c, f, l, s);
	}
	function Is(t, e, n, r, o) {
		let s = e.getBoundingClientRect();
		if (!s.width || !s.height) return;
		let i = L(e), a = e.offsetWidth ? s.width / e.offsetWidth : 1, c = Math.abs(a - 1) > .001 ? 1 / a : 1;
		r.style.position = "absolute", r.style.left = `${(o.left - s.left) * c}px`, r.style.top = `${(o.top - s.top) * c}px`, r.style.width = `${o.width}px`, r.style.height = `${o.height}px`, r.style.margin = "0", r.style.filter = n, c !== 1 && (r.style.transform = `scale(${c})`, r.style.transformOrigin = "top left");
		let f = document.createElement("div");
		f.style.cssText = "position:absolute;inset:0;overflow:hidden;border-radius:inherit;z-index:-2", f.appendChild(r);
		let l = document.createElement("div");
		l.style.cssText = "position:absolute;inset:0;border-radius:inherit;z-index:-1", l.style.backgroundColor = i.backgroundColor, l.style.backgroundImage = t.style.backgroundImage || i.backgroundImage;
		for (let d of [
			"background-size",
			"background-position",
			"background-repeat",
			"background-origin",
			"background-clip"
		]) l.style.setProperty(d, i.getPropertyValue(d));
		t.style.setProperty("background-color", "transparent", "important"), t.style.setProperty("background-image", "none", "important"), t.style.setProperty("backdrop-filter", "none", "important"), t.style.setProperty("-webkit-backdrop-filter", "none", "important"), i.position === "static" && (t.style.position = "relative"), t.style.isolation = "isolate", t.prepend(l), t.prepend(f);
	}
	var Re = 128;
	function _s(t, e, n, r) {
		let o = [[t, e]];
		for (; o.length;) {
			let [s, i] = o.pop(), a = r.get(i);
			if (a?.nodeType === 1) {
				let l = a.getBoundingClientRect();
				(l.left > n.right + Re || l.right < n.left - Re || l.top > n.bottom + Re || l.bottom < n.top - Re) && (s.tagName === "IMG" && s.setAttribute("src", "data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA="), s.style && (s.style.backgroundImage = "none"));
			}
			let c = s.children, f = i.children;
			for (let l = 0; l < c.length; l++) o.push([c[l], f[l]]);
		}
	}
	function Ws(t, e) {
		let n = [];
		for (let r = e; r !== t; r = r.parentElement) {
			if (!r?.parentElement) return null;
			n.push([...r.parentElement.children].indexOf(r));
		}
		return n.reverse();
	}
	function io(t, e) {
		if (!e) return null;
		let n = t;
		for (let r of e) if (n = n.children[r], !n) return null;
		return n;
	}
	function Os(t) {
		if (t) for (let e = t; e && e.parentNode;) {
			let n = e.parentNode;
			for (; e.nextSibling;) e.nextSibling.remove();
			e === t && e.remove(), e = n;
		}
	}
	et();
	J();
	function ao(t, e) {
		if (!t) return () => {};
		let n = [], r = 200;
		function o(s) {
			if (e) {
				let f = s.getBoundingClientRect();
				if (f.width > 0 || f.height > 0) {
					let l = Math.max(f.right, f.left + (s.scrollWidth || 0)), d = Math.max(f.bottom, f.top + (s.scrollHeight || 0));
					if (l < e.left - r || f.left > e.right + r || d < e.top - r || f.top > e.bottom + r) return;
				}
			}
			let i = getComputedStyle(s), a = Bs(s, i);
			a && n.push(a);
			let c = Us(s, i);
			c && n.push(c);
			for (let f of s.children || []) o(f);
		}
		return o(t), () => n.forEach((s) => s());
	}
	function Bs(t, e) {
		if (!t) return () => {};
		e = e || getComputedStyle(t);
		let n = Ds(e);
		if (n <= 0) return () => {};
		if (!co(t)) return () => {};
		let r = t.textContent ?? "", o = r, s = zs(e);
		t.textContent = "X";
		let i = t.scrollHeight - s;
		t.textContent = r;
		let a = i > 0 ? i : Hs(e), c = Math.round(a * n + s);
		if (t.scrollHeight <= c + .5) return () => {};
		let f = 0, l = r.length, d = -1;
		for (; f <= l;) {
			let u = f + l >> 1;
			t.textContent = r.slice(0, u) + "…", t.scrollHeight <= c + .5 ? (d = u, f = u + 1) : l = u - 1;
		}
		return t.textContent = (d >= 0 ? r.slice(0, d) : "") + "…", () => {
			t.textContent = o;
		};
	}
	function Us(t, e) {
		if (!t) return () => {};
		if (e = e || getComputedStyle(t), e.textOverflow !== "ellipsis") return () => {};
		if (e.whiteSpace !== "nowrap" && e.whiteSpace !== "pre") return () => {};
		if (e.overflowX !== "hidden" && e.overflowX !== "clip") return () => {};
		if (!co(t)) return () => {};
		if (t.scrollWidth <= t.clientWidth + .5) return () => {};
		let n = t.textContent ?? "", r = n, o = 0, s = n.length, i = -1;
		for (; o <= s;) {
			let a = o + s >> 1;
			t.textContent = n.slice(0, a) + "…", t.scrollWidth <= t.clientWidth + .5 ? (i = a, o = a + 1) : s = a - 1;
		}
		return t.textContent = (i >= 0 ? n.slice(0, i) : "") + "…", () => {
			t.textContent = r;
		};
	}
	function Ds(t) {
		let e = t.getPropertyValue("-webkit-line-clamp") || t.getPropertyValue("line-clamp");
		e = (e || "").trim();
		let n = parseInt(e, 10);
		return Number.isFinite(n) && n > 0 ? n : 0;
	}
	function Hs(t) {
		let e = (t.lineHeight || "").trim(), n = parseFloat(t.fontSize) || 16;
		return !e || e === "normal" ? Math.round(n * 1.2) : e.endsWith("px") ? parseFloat(e) : /^\d+(\.\d+)?$/.test(e) ? Math.round(parseFloat(e) * n) : e.endsWith("%") ? Math.round(parseFloat(e) / 100 * n) : Math.round(n * 1.2);
	}
	function zs(t) {
		return (parseFloat(t.paddingTop) || 0) + (parseFloat(t.paddingBottom) || 0);
	}
	function co(t) {
		return t.childElementCount > 0 ? !1 : Array.from(t.childNodes).some((e) => e.nodeType === Node.TEXT_NODE);
	}
	var re = [];
	function oe(t) {
		if (!t) return null;
		if (Array.isArray(t)) {
			let [e, n] = t;
			return typeof e == "function" ? e(n) : e;
		}
		if (typeof t == "object" && "plugin" in t) {
			let { plugin: e, options: n } = t;
			return typeof e == "function" ? e(n) : e;
		}
		return typeof t == "function" ? t() : t;
	}
	function lo(...t) {
		let e = t.flat();
		for (let n of e) {
			let r = oe(n);
			r && (re.some((o) => o && o.name && r.name && o.name === r.name) || re.push(r));
		}
	}
	function fo(t) {
		return t && Array.isArray(t.plugins) ? t.plugins : re;
	}
	async function at(t, e, n) {
		let r = n, o = fo(e);
		for (let s of o) {
			let i = s && typeof s[t] == "function" ? s[t] : null;
			if (!i) continue;
			let a = await i(e, r);
			typeof a < "u" && (r = a);
		}
		return r;
	}
	async function uo(t, e, n) {
		let r = [], o = fo(e);
		for (let s of o) {
			let i = s && typeof s[t] == "function" ? s[t] : null;
			if (!i) continue;
			let a = await i(e, n);
			typeof a < "u" && r.push(a);
		}
		return r;
	}
	function Vs(t) {
		let e = [];
		if (Array.isArray(t)) for (let n of t) {
			let r = oe(n);
			if (!r || !r.name) continue;
			let o = e.findIndex((s) => s && s.name === r.name);
			o >= 0 && e.splice(o, 1), e.push(r);
		}
		for (let n of re) n && n.name && !e.some((r) => r.name === n.name) && e.push(n);
		return Object.freeze(e);
	}
	function po(t, e, n = !1) {
		return !t || t.plugins && !n || (t.plugins = Vs(e)), t;
	}
	function dn() {
		return re.slice();
	}
	J();
	var js = .92;
	var qs = .95;
	async function Xs(t) {
		let e = new Image();
		if (e.decoding = "sync", e.src = t, typeof e.decode == "function") try {
			return await e.decode(), e;
		} catch {}
		return await new Promise((n, r) => {
			e.onload = () => n(), e.onerror = r;
		}), e;
	}
	function Gs(t) {
		let e = /^data:([^;,]+)/.exec(t);
		return e ? e[1] : "";
	}
	async function pn(t, e, n) {
		if (typeof t != "string" || !t.startsWith("data:image") || t.startsWith("data:image/svg")) return null;
		let r = t.length + ":" + t.slice(0, 64) + t.slice(-64) + ":" + Math.round(e) + "x" + Math.round(n);
		if (x.compress.has(r)) return x.compress.get(r);
		let o = await (async () => {
			let s;
			try {
				s = await Xs(t);
			} catch {
				return null;
			}
			let i = s.naturalWidth || s.width, a = s.naturalHeight || s.height;
			if (!i || !a) return null;
			let c = Math.min(1, Math.max(e / i, n / a));
			if (!(c > 0) || c >= .95) return null;
			let f = c * qs, l = Math.max(1, Math.round(i * f)), d = Math.max(1, Math.round(a * f)), u = document.createElement("canvas");
			u.width = l, u.height = d;
			let p = u.getContext("2d");
			if (!p) return null;
			p.imageSmoothingEnabled = !0, p.imageSmoothingQuality = "high", p.drawImage(s, 0, 0, l, d);
			let h = Gs(t), m = h === "image/jpeg" ? "image/jpeg" : h === "image/webp" ? "image/webp" : "image/png";
			try {
				let g = u.toDataURL(m, js);
				if (typeof g == "string" && g.startsWith("data:image") && g.length < t.length) return g;
			} catch {}
			return null;
		})();
		return x.compress.set(r, o), o;
	}
	async function Ys(t, e) {
		if (!e.compress) return {
			count: 0,
			before: 0,
			after: 0
		};
		let n = (e.scale || 1) * (e.dpr || 1), r = Array.from(t.querySelectorAll("img"));
		t.tagName === "IMG" && r.unshift(t);
		let o = 0, s = 0, i = 0, a = async (f) => {
			let l = f.getAttribute("src") || "";
			if (!l.startsWith("data:image") || l.startsWith("data:image/svg")) return;
			let d = parseFloat(f.dataset.snapdomWidth) || parseFloat(f.style.width) || f.width || 0, u = parseFloat(f.dataset.snapdomHeight) || parseFloat(f.style.height) || f.height || 0;
			if (!d || !u) return;
			let p = await pn(l, d * n, u * n);
			p && (o++, s += l.length, i += p.length, f.setAttribute("src", p));
		}, c = 6;
		for (let f = 0; f < r.length; f += c) await Promise.allSettled(r.slice(f, f + c).map(a));
		return {
			count: o,
			before: s,
			after: i
		};
	}
	function Ks(t) {
		return {
			w: t.offsetWidth || t.getBoundingClientRect().width || 0,
			h: t.offsetHeight || t.getBoundingClientRect().height || 0
		};
	}
	async function Qs(t, e, n = x.session.nodeMap) {
		if (!e.compress) return { count: 0 };
		let r = (e.scale || 1) * (e.dpr || 1), o = [], s = [t, ...t.querySelectorAll("*")];
		for (let f of s) {
			let l = f.style && f.style.backgroundImage;
			l && l.includes("data:image") && o.push(f);
		}
		let i = 0, a = async (f) => {
			let l = n.get(f);
			if (!l || !l.isConnected) return;
			let d;
			try {
				d = getComputedStyle(l);
			} catch {
				return;
			}
			if ((d.backgroundRepeat || "repeat").toLowerCase().split(",").some((w) => w.trim() !== "no-repeat")) return;
			let { w: p, h } = Ks(l);
			if (!p || !h) return;
			let m = p * r, g = h * r, y = f.style.backgroundImage, b = [...y.matchAll(/url\((['"]?)(data:image\/[^)'"]+)\1\)/gi)], S = y;
			for (let w of b) {
				let v = w[2];
				if (v.startsWith("data:image/svg")) continue;
				let C = await pn(v, m, g);
				C && (S = S.split(v).join(C), i++);
			}
			S !== y && (f.style.backgroundImage = S);
		}, c = 6;
		for (let f = 0; f < o.length; f += c) await Promise.allSettled(o.slice(f, f + c).map(a));
		return { count: i };
	}
	async function Js(t, e) {
		if (!e.compress) return { count: 0 };
		let n = (e.scale || 1) * (e.dpr || 1), r = Array.from(t.querySelectorAll("image"));
		t.localName === "image" && r.unshift(t);
		let o = 0, s = async (a) => {
			let c = a.getAttribute("href") || (typeof a.getAttributeNS == "function" ? a.getAttributeNS("http://www.w3.org/1999/xlink", "href") : null);
			if (!c || !c.startsWith("data:image") || c.startsWith("data:image/svg")) return;
			let f = parseFloat(a.getAttribute("width")) || 0, l = parseFloat(a.getAttribute("height")) || 0;
			if (!f || !l) return;
			let d = await pn(c, f * n, l * n);
			d && (a.setAttribute("href", d), a.hasAttribute("xlink:href") && a.setAttribute("xlink:href", d), o++);
		}, i = 6;
		for (let a = 0; a < r.length; a += i) await Promise.allSettled(r.slice(a, a + i).map(s));
		return { count: o };
	}
	async function mo(t, e, n) {
		e.compress && (await Ys(t, e), await Qs(t, e, n), await Js(t, e));
	}
	function Zs(t) {
		if (Array.isArray(t.plugins)) {
			for (let e of t.plugins) if (oe(e)?.name === "picture-resolver") return !0;
		}
		return dn().some((e) => e?.name === "picture-resolver");
	}
	function ta(t) {
		let e = Array.isArray(t.plugins) ? t.plugins : dn(), n = [];
		for (let r of e) {
			let o = oe(r);
			o && typeof o.resolveNode == "function" && n.push(o.resolveNode.bind(o));
		}
		return n.length ? n : null;
	}
	var ea = 2e3;
	var na = 3;
	function ra(t) {
		let e = Date.now(), n = x.burstAdvice.get(t);
		if (!n || e - n.firstTs > ea) {
			x.burstAdvice.set(t, {
				count: 1,
				firstTs: e,
				warned: !1
			});
			return;
		}
		n.count++, n.count >= na && !n.warned && (n.warned = !0, console.warn("[snapdom] Captured this element multiple times. Pass { burst: true } to increase the speed."));
	}
	async function ho(t, e) {
		if (!t) throw new Error("Element cannot be null or undefined");
		le(e.cache), e.__session = {
			styleMap: x.session.styleMap,
			styleCache: x.session.styleCache,
			nodeMap: x.session.nodeMap
		}, e.burst || ra(t), e.__resolveNodeHooks = ta(e);
		let n = e.fast, r = e.outerTransforms !== !1, o = !!e.outerShadows, s = e.clip ? Fe(t, e.clip) : null, i = {
			element: t,
			options: e,
			plugins: e.plugins
		}, a, c, f, l, d, u, p = "", h = "", m, g, y = null;
		await at("beforeSnap", i);
		let b = null;
		e.resolvePicturePlaceholders !== !1 && !Zs(e) && (b = await zn(i.element, i.options)), await at("beforeClone", i);
		let S = ao(i.element, s);
		try {
			({clone: a, classCSS: c, styleCache: f, nodeMap: l, reconcileRisk: d, clipWindow: u} = await eo(i.element, i.options)), d > 0 && !e.reconcile && !x.warnedReconcile && (x.warnedReconcile = !0, console.warn("[snapdom] Text in inline/table-cell elements kept its natural width and may re-wrap under font-fallback rasterization. Pass { reconcile: true } for pixel-exact layout (roughly doubles capture time).")), !r && a && (y = Ur(i.element, a)), !o && a && Gr(i.element, a, i.options), a && Yr(i.element, a, l);
		} finally {
			S();
		}
		if (i = {
			clone: a,
			classCSS: c,
			styleCache: f,
			nodeMap: l,
			...i
		}, await at("afterClone", i), b && await b(), Kr(i.clone), i.options?.excludeMode === "remove" || i.options?.filterMode === "remove") try {
			Qr(i.element, i.clone, i.styleCache);
		} catch ($) {
			console.warn("[snapdom] shrink pass failed:", $);
		}
		try {
			await cr(i.clone, i.element, i.nodeMap);
		} catch {}
		let w = ($) => new Promise((T, O) => {
			Et(() => {
				Promise.resolve().then($).then(T, O);
			}, { fast: n });
		}), v = (async () => {
			await Promise.all([w(() => ro(i.clone, i.options)), w(() => oo(i.element, i.clone, i.styleCache, i.options, i.nodeMap))]);
			try {
				so(i.element, i.clone, i.nodeMap);
			} catch ($) {
				console.warn("[snapdom] backdrop-filter emulation failed:", $);
			}
			e.compress && await w(() => mo(i.clone, i.options, i.nodeMap));
		})(), C = Promise.resolve();
		e.embedFonts && (C = w(async () => {
			let $ = i.element.ownerDocument || document, T = s ? (F) => {
				try {
					let I = F.getBoundingClientRect();
					return I.right >= s.left - 200 && I.left <= s.right + 200 && I.bottom >= s.top - 200 && I.top <= s.bottom + 200;
				} catch {
					return !0;
				}
			} : null, { required: O, usedCodepoints: W } = ee(i.element, T);
			if (q()) await Ut(new Set(Array.from(O).map((I) => String(I).split("__")[0]).filter(Boolean)), 1, $);
			p = await Ee({
				required: O,
				usedCodepoints: W,
				preCached: !1,
				exclude: i.options.excludeFonts,
				localFonts: i.options.localFonts,
				useProxy: i.options.useProxy,
				fontStylesheetDomains: i.options.fontStylesheetDomains,
				doc: $
			});
		})), await Promise.all([v, C]);
		let M = He(i.clone).sort(), A = M.join(",");
		x.baseStyle.has(A) ? h = x.baseStyle.get(A) : await new Promise(($) => {
			Et(() => {
				h = ze(M), x.baseStyle.set(A, h), $();
			}, { fast: n });
		});
		let k = to(i.element?.ownerDocument || document);
		i = {
			fontsCSS: p,
			baseCSS: h,
			scrollbarCSS: k,
			...i
		}, await at("beforeRender", i), await new Promise(($) => {
			Et(() => {
				let T = L(i.element), O = i.element.getBoundingClientRect(), W = Math.max(1, E(i.element.offsetWidth || parseFloat(T.width) || O.width || 1)), F = Math.max(1, E(i.element.offsetHeight || parseFloat(T.height) || O.height || 1)), I = i.element.ownerDocument || document;
				if (!u && (i.element === I.body || i.element === I.documentElement) && !I.documentElement.hasAttribute("data-sd-pinned")) {
					let H = Math.max(i.element.scrollHeight || 0, I.documentElement?.scrollHeight || 0, I.body?.scrollHeight || 0), K = Math.max(i.element.scrollWidth || 0, I.documentElement?.scrollWidth || 0, I.body?.scrollWidth || 0);
					H > 0 && (F = Math.max(F, E(H))), K > 0 && (W = Math.max(W, E(K)));
					try {
						let X = (i.scrollbarCSS || "").length + (i.baseCSS || "").length + (i.fontsCSS || "").length + (i.classCSS || "").length, Q = x.measureHints.get(i.element);
						if (Q && Q.cssLen === X && Q.w0 === W) Q.csh > 0 && (F = Math.max(F, E(Q.csh))), Q.csw > 0 && (W = Math.max(W, E(Q.csw)));
						else {
							let G = I.createElement("div");
							G.setAttribute("data-snapdom-internal", ""), G.style.cssText = "position:absolute!important;left:-9999px!important;top:0!important;width:" + W + "px!important;overflow:visible!important;visibility:hidden!important;";
							let Ct = G.attachShadow({ mode: "open" }), At = I.createElement("style");
							At.textContent = (i.scrollbarCSS || "") + i.baseCSS + "svg{overflow:visible;} foreignObject{overflow:visible;}" + i.classCSS, Ct.appendChild(At), Ct.appendChild(i.clone.cloneNode(!0)), I.body.appendChild(G);
							let jt = G.scrollHeight, pt = G.scrollWidth;
							I.body.removeChild(G), x.measureHints.set(i.element, {
								cssLen: X,
								w0: W,
								csh: jt,
								csw: pt
							}), jt > 0 && (F = Math.max(F, E(jt))), pt > 0 && (W = Math.max(W, E(pt)));
						}
					} catch {}
				}
				if (i.options?.excludeMode === "remove" || i.options?.filterMode === "remove") {
					let H = Jr(i.element, i.options);
					Number.isFinite(H) && H > 0 && (F = Math.max(1, Math.min(F, E(H + 1))));
				}
				if (i.options?.reconcile) try {
					let H = (i.scrollbarCSS || "") + i.baseCSS + "svg{overflow:visible;} foreignObject{overflow:visible;}" + i.classCSS;
					Zr(i.element, i.clone, H, i.nodeMap, W, F);
				} catch (H) {
					console.warn("[snapdom] reconcile pass failed:", H);
				}
				let N = (H, K = NaN) => {
					let X = typeof H == "string" ? parseFloat(H) : H;
					return Number.isFinite(X) ? X : K;
				}, yt = N(i.options.width), Rt = N(i.options.height), bt = u ? E(u.width) : W, wt = u ? E(u.height) : F, xt = bt, ut = wt, P = Number.isFinite(yt), B = Number.isFinite(Rt), U = wt > 0 ? bt / wt : 1;
				P && B ? (xt = Math.max(1, E(yt)), ut = Math.max(1, E(Rt))) : P ? (xt = Math.max(1, E(yt)), ut = Math.max(1, E(xt / (U || 1)))) : B && (ut = Math.max(1, E(Rt)), xt = Math.max(1, E(ut * (U || 1))));
				let V = 0, Y = 0, ct = W, St = F;
				if (u) {
					let H = 0, K = 0;
					if (mn(i.element)) {
						let X = null;
						if (!r && y && Number.isFinite(y.a)) X = {
							a: y.a,
							b: y.b || 0,
							c: y.c || 0,
							d: y.d || 1,
							e: 0,
							f: 0
						};
						else {
							let Q = zt(i.element), G = fn(T.transform && T.transform !== "none" ? T.transform : "", Q);
							G && G.is2D && (X = {
								a: G.a,
								b: G.b,
								c: G.c,
								d: G.d,
								e: 0,
								f: 0
							});
						}
						if (X && !(X.a === 1 && X.b === 0 && X.c === 0 && X.d === 1)) {
							let { ox: Q, oy: G } = ne(T, W, F), Ct = Ht(W, F, X, Q, G);
							H = Ct.minX, K = Ct.minY;
						}
					}
					V = E(u.x + H), Y = E(u.y + K), ct = E(V + u.width), St = E(Y + u.height);
				} else if (!r && y && Number.isFinite(y.a)) {
					let H = {
						a: y.a,
						b: y.b || 0,
						c: y.c || 0,
						d: y.d || 1,
						e: 0,
						f: 0
					}, K = Ht(W, F, H, 0, 0);
					V = E(K.minX), Y = E(K.minY), ct = E(K.maxX), St = E(K.maxY);
				} else if (r && mn(i.element)) {
					let K = T.transform && T.transform !== "none" ? T.transform : "", X = zt(i.element), Q = Dr({
						baseTransform: K,
						rotate: X.rotate || "0deg",
						scale: X.scale,
						translate: X.translate
					}), { ox: G, oy: Ct } = ne(T, W, F), At = Q.is2D ? Q : new DOMMatrix(Q.toString()), jt = {
						a: At.a,
						b: At.b,
						c: At.c,
						d: At.d,
						e: 0,
						f: 0
					}, pt = Ht(W, F, jt, G, Ct);
					V = E(pt.minX), Y = E(pt.minY), ct = E(pt.maxX), St = E(pt.maxY);
				}
				let lt = Nr(T), Tt = Ir(T), Z = Wr(T), Lt = Or(T), Pt = Br(T), vt = u ? {
					top: 0,
					right: 0,
					bottom: 0,
					left: 0
				} : o ? {
					top: E(Math.max(lt.top, Tt.top) + Z.top + Lt.top + Pt.bleed.top),
					right: E(Math.max(lt.right, Tt.right) + Z.right + Lt.right + Pt.bleed.right),
					bottom: E(Math.max(lt.bottom, Tt.bottom) + Z.bottom + Lt.bottom + Pt.bleed.bottom),
					left: E(Math.max(lt.left, Tt.left) + Z.left + Lt.left + Pt.bleed.left)
				} : {
					top: Z.top,
					right: Z.right,
					bottom: Z.bottom,
					left: Z.left
				};
				V = E(V - vt.left), Y = E(Y - vt.top), ct = E(ct + vt.right), St = E(St + vt.bottom);
				let ft = Math.max(1, E(ct - V)), vn = Math.max(1, E(St - Y)), $o = P || B ? E(xt / bt) : 1, Fo = B || P ? E(ut / wt) : 1, Ro = Math.max(1, E(ft * $o)), To = Math.max(1, E(vn * Fo)), Cn = "http://www.w3.org/2000/svg", Nt = E((mn(i.element) ? 2 : 0) + (r ? 0 : 1)), se = Math.ceil(ft + Nt * 2), ae = Math.ceil(vn + Nt * 2), _e = E(-(E(V) - Nt)), We = E(-(E(Y) - Nt)), An = Math.max(0, _e), kn = Math.max(0, We), Mn = E(se - Math.min(0, _e)), En = E(ae - Math.min(0, We)), dt = document.createElementNS(Cn, "foreignObject");
				dt.setAttribute("x", String(Math.min(0, _e))), dt.setAttribute("y", String(Math.min(0, We))), dt.setAttribute("width", String(Mn)), dt.setAttribute("height", String(En)), dt.style.overflow = "visible";
				let $n = document.createElement("style");
				$n.textContent = (i.scrollbarCSS || "") + i.baseCSS + i.fontsCSS + "svg{overflow:visible;} foreignObject{overflow:visible;} foreignObject>div{-webkit-text-size-adjust:100%!important;text-size-adjust:100%!important;}" + i.classCSS, dt.appendChild($n);
				let ce = document.createElement("div");
				ce.setAttribute("xmlns", "http://www.w3.org/1999/xhtml"), ce.style.cssText = `all:initial;box-sizing:border-box;display:block;overflow:visible;width:${Mn}px;height:${En}px` + (An !== 0 || kn !== 0 ? `;padding:${kn}px 0 0 ${An}px !important` : ""), ce.appendChild(i.clone), dt.appendChild(ce);
				let No = new XMLSerializer().serializeToString(dt), Fn = P || B;
				e.meta = {
					w0: bt,
					h0: wt,
					vbW: se,
					vbH: ae,
					targetW: xt,
					targetH: ut
				};
				g = `<svg xmlns="${Cn}" width="${!Fn || q() ? se : E(Ro + Nt * 2)}" height="${!Fn || q() ? ae : E(To + Nt * 2)}" viewBox="0 0 ${se} ${ae}" font-size="${parseFloat(L(I.documentElement)?.fontSize) || 16}px">` + No + "</svg>", m = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(g)}`, i = {
					svgString: g,
					dataURL: m,
					...i
				}, $();
			}, { fast: n });
		}), await at("afterRender", i);
		let R = document.getElementById("snapdom-sandbox");
		return R && R.style.position === "absolute" && R.remove(), i.dataURL;
	}
	function mn(t) {
		return Hr(t);
	}
	J();
	function go(t = {}) {
		let e = t.format ?? "png";
		e === "jpg" && (e = "jpeg");
		let n = Rn(t.cache);
		return {
			debug: t.debug ?? !1,
			fast: t.fast ?? !0,
			scale: t.scale ?? 1,
			exclude: t.exclude ?? [],
			excludeMode: t.excludeMode ?? "hide",
			filter: t.filter ?? null,
			filterMode: t.filterMode ?? "hide",
			placeholders: t.placeholders !== !1,
			embedFonts: t.embedFonts ?? !1,
			iconFonts: Array.isArray(t.iconFonts) ? t.iconFonts : t.iconFonts ? [t.iconFonts] : [],
			localFonts: Array.isArray(t.localFonts) ? t.localFonts : [],
			excludeFonts: t.excludeFonts ?? void 0,
			fontStylesheetDomains: Array.isArray(t.fontStylesheetDomains) ? t.fontStylesheetDomains : [],
			fallbackURL: t.fallbackURL ?? void 0,
			cache: n,
			useProxy: typeof t.useProxy == "string" ? t.useProxy : "",
			width: t.width ?? null,
			height: t.height ?? null,
			format: e,
			type: t.type ?? "svg",
			quality: t.quality ?? .92,
			dpr: t.dpr ?? (window.devicePixelRatio || 1),
			backgroundColor: t.backgroundColor ?? (["jpeg", "webp"].includes(e) ? "#ffffff" : null),
			filename: t.filename ?? "snapDOM",
			outerTransforms: t.outerTransforms ?? !0,
			outerShadows: t.outerShadows ?? !1,
			reconcile: t.reconcile ?? !1,
			burst: t.burst ?? !1,
			invalidate: t.invalidate ?? !1,
			clip: t.clip ?? null,
			compress: t.compress !== !1,
			excludeStyleProps: t.excludeStyleProps ?? null,
			resolvePicturePlaceholders: t.resolvePicturePlaceholders !== !1,
			pictureResolver: t.pictureResolver && typeof t.pictureResolver == "object" ? t.pictureResolver : {}
		};
	}
	Wt();
	qe();
	var yo = new WeakMap();
	function wo(t, e, n) {
		let r = new Set();
		if (t instanceof HTMLVideoElement && r.add(t), t.querySelectorAll) for (let o of t.querySelectorAll("video")) r.add(o);
		for (let o of e.trackedVideos) r.has(o) || (o.removeEventListener("timeupdate", n), o.removeEventListener("seeked", n), e.trackedVideos.delete(o));
		for (let o of r) e.trackedVideos.has(o) || (o.addEventListener("timeupdate", n), o.addEventListener("seeked", n), e.trackedVideos.add(o));
	}
	function oa(t) {
		let e = {
			dirty: !0,
			capturing: !1,
			last: null,
			inflight: Promise.resolve(),
			observers: [],
			trackedVideos: new Set()
		}, n = (s) => {
			e.capturing || Ye(s) && (e.dirty = !0);
		}, r = () => {
			e.capturing || (e.dirty = !0);
		}, o = t.ownerDocument || document;
		try {
			let s = new MutationObserver(n);
			s.observe(t, {
				subtree: !0,
				childList: !0,
				attributes: !0,
				characterData: !0
			}), e.observers.push(s);
		} catch {}
		try {
			if (o.head) {
				let s = new MutationObserver(n);
				s.observe(o.head, {
					subtree: !0,
					childList: !0,
					characterData: !0,
					attributes: !0
				}), e.observers.push(s);
			}
		} catch {}
		return e.markDirty = n, e.onMediaDirty = r, wo(t, e, r), e;
	}
	function bo(t) {
		let { burst: e, invalidate: n, ...r } = t || {};
		try {
			return JSON.stringify(r, Object.keys(r).sort());
		} catch {
			return null;
		}
	}
	function xo(t, e, n, r) {
		let o = yo.get(t);
		o || (o = oa(t), o.baselineSignature = bo(e), yo.set(t, o));
		let s = bo(e), i = s === null || s !== o.baselineSignature, a = async () => {
			for (let f of o.observers) o.markDirty(f.takeRecords());
			if (n.invalidate && (o.dirty = !0), !i && !o.dirty && o.last) return o.last;
			o.capturing = !0, i || (o.dirty = !1);
			try {
				let f = await r();
				return i || (o.last = f), f;
			} finally {
				for (let f of o.observers) f.takeRecords();
				o.capturing = !1, wo(t, o, o.onMediaDirty);
			}
		}, c = o.inflight.then(a, a);
		return o.inflight = c.catch(() => {}), c;
	}
	et();
	ht();
	J();
	function ba(...t) {
		return lo(...t), D;
	}
	var D = Object.assign(xa, { plugins: ba });
	var Sn = Symbol("snapdom.internal");
	var wa = Symbol("snapdom.internal.silent");
	async function xa(t, e) {
		if (!t) throw new Error("Element cannot be null or undefined");
		let n = go(e);
		if (po(n, e && e.plugins), q()) {
			if (n.embedFonts === !0) try {
				let o = wr(t);
				await Ut(new Set([...o].map((i) => String(i).split("__")[0]).filter(Boolean)), 1);
			} catch {}
			let r = Array.from(t.querySelectorAll("canvas"));
			t.tagName === "CANVAS" && r.unshift(t);
			for (let o of r) try {
				let s = o.getContext("2d", { willReadFrequently: !0 });
				s && s.getImageData(0, 0, 1, 1);
			} catch (s) {
				_(e, "safari canvas poke failed", s);
			}
		}
		return n.iconFonts && n.iconFonts.length > 0 && ar(n.iconFonts), n.snap || (n.snap = {
			toPng: (r, o) => D.toPng(r, o),
			toSvg: (r, o) => D.toSvg(r, o)
		}), n.burst ? xo(t, e, n, () => D.capture(t, n, Sn)) : D.capture(t, n, Sn);
	}
	D.capture = async (t, e, n) => {
		if (n !== Sn) throw new Error("[snapdom.capture] is internal. Use snapdom(...) instead.");
		let r = await ho(t, e), o = {
			img: async (m, g) => {
				let { toImg: y } = await Promise.resolve().then(() => (bn(), yn));
				return y(r, {
					...m,
					...g || {}
				});
			},
			svg: async (m, g) => {
				let { toSvg: y } = await Promise.resolve().then(() => (bn(), yn));
				return y(r, {
					...m,
					...g || {}
				});
			},
			canvas: async (m, g) => {
				let { toCanvas: y } = await Promise.resolve().then(() => (Vt(), Co));
				return y(r, {
					...m,
					...g || {}
				});
			},
			blob: async (m, g) => {
				let { toBlob: y } = await Promise.resolve().then(() => (xn(), Ao));
				return y(r, {
					...m,
					...g || {}
				});
			},
			png: async (m, g) => {
				let { rasterize: y } = await Promise.resolve().then(() => (ie(), Ie));
				return y(r, {
					...m,
					...g || {},
					format: "png"
				});
			},
			jpeg: async (m, g) => {
				let { rasterize: y } = await Promise.resolve().then(() => (ie(), Ie));
				return y(r, {
					...m,
					...g || {},
					format: "jpeg"
				});
			},
			webp: async (m, g) => {
				let { rasterize: y } = await Promise.resolve().then(() => (ie(), Ie));
				return y(r, {
					...m,
					...g || {},
					format: "webp"
				});
			},
			download: async (m, g) => {
				let { download: y } = await Promise.resolve().then(() => (Eo(), Mo));
				return y(r, {
					...m,
					...g || {}
				});
			}
		}, s = {};
		for (let m of [
			"img",
			"svg",
			"canvas",
			"blob",
			"png",
			"jpeg",
			"webp"
		]) s[m] = async (g) => o[m](e, {
			...g || {},
			[wa]: !0
		});
		s.jpg = s.jpeg;
		let a = await uo("defineExports", {
			...e,
			export: { url: r },
			exports: s
		}), c = Object.assign({}, ...a.filter((m) => m && typeof m == "object").reverse()), f = {
			...o,
			...c
		};
		f.jpeg && !f.jpg && (f.jpg = (m, g) => f.jpeg(m, g));
		function l(m, g) {
			let y = {
				...e,
				...g || {}
			}, b = (w) => w === "jpeg" || w === "jpg" || w === "webp";
			return [
				m,
				y.format,
				y.type
			].map((w) => typeof w == "string" ? w.toLowerCase() : "").find(b) && (y.backgroundColor == null || y.backgroundColor === "transparent") && (y.backgroundColor = "#ffffff"), y;
		}
		let d = !1, u = Promise.resolve();
		async function p(m, g) {
			let y = async () => {
				let S = f[m];
				if (!S) throw new Error(`[snapdom] Unknown export type: ${m}`);
				let w = l(m, g), v = {
					...e,
					export: {
						type: m,
						options: w,
						url: r
					}
				};
				await at("beforeExport", v, {
					format: m,
					options: w
				});
				let C = await S(v, w);
				return await at("afterExport", v, {
					format: m,
					options: w,
					result: C
				}), d || (d = !0, await at("afterSnap", e)), C;
			}, b = u.then(y);
			return u = b.catch(() => {}), b;
		}
		let h = {
			url: r,
			toRaw: () => r,
			to: (m, g) => p(m, g),
			toImg: (m) => p("img", m),
			toSvg: (m) => p("svg", m),
			toCanvas: (m) => p("canvas", m),
			toBlob: (m) => p("blob", m),
			toPng: (m) => p("png", m),
			toJpg: (m) => p("jpg", m),
			toWebp: (m) => p("webp", m),
			download: (m) => p("download", m)
		};
		for (let m of Object.keys(f)) {
			let g = "to" + m.charAt(0).toUpperCase() + m.slice(1);
			h[g] || (h[g] = (y) => p(m, y));
		}
		return h;
	};
	D.toRaw = (t, e) => D(t, e).then((n) => n.toRaw());
	D.toImg = (t, e) => D(t, e).then((n) => n.toImg());
	D.toSvg = (t, e) => D(t, e).then((n) => n.toSvg());
	D.toCanvas = (t, e) => D(t, e).then((n) => n.toCanvas());
	D.toBlob = (t, e) => D(t, e).then((n) => n.toBlob());
	D.toPng = (t, e) => D(t, {
		...e,
		format: "png"
	}).then((n) => n.toPng());
	D.toJpg = (t, e) => D(t, {
		...e,
		format: "jpeg"
	}).then((n) => n.toJpg());
	D.toWebp = (t, e) => D(t, {
		...e,
		format: "webp"
	}).then((n) => n.toWebp());
	D.download = (t, e) => D(t, e).then((n) => n.download());
	_css("[role=group]:has(>.twitter-long-image-button-container){justify-content:flex-start!important;align-items:center!important;display:flex!important}[role=group]:has(>.twitter-long-image-button-container)>*{flex:1 1 0!important;min-width:0!important;max-width:none!important}.twitter-long-image-button-container{justify-content:flex-start;align-items:center;display:flex}.twitter-long-image-button{color:inherit;cursor:pointer;background:0 0;border:0;margin:0}.twitter-long-image-button.is-fallback{color:#71767b;border-radius:9999px;justify-content:center;align-items:center;width:34.75px;height:34.75px;display:flex}.twitter-long-image-button.is-fallback:hover{color:#1d9bf0;background-color:#1d9bf01a}.twitter-long-image-button:focus-visible{outline-offset:2px;outline:2px solid #1d9bf0}.twitter-long-image-button.is-loading,.twitter-long-image-button.is-loading:hover{cursor:wait;opacity:.55}.twitter-long-image-button svg{fill:currentColor}.twitter-long-image-button.is-fallback svg{width:1.25em;height:1.25em;display:block}.twitter-long-image-capture{box-sizing:border-box;color:#0f1419;background:#fff;width:650px;font-family:TwitterChirp,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;position:absolute;top:0;left:-100000px;overflow:visible}.twitter-long-image-item{box-sizing:border-box;background:#fff;border-bottom:1px solid #eff3f4;padding:16px 24px 0;position:relative}.twitter-long-image-item.is-focused{padding:20px 24px}.twitter-long-image-thread-line{z-index:0;background:#cfd9de;width:2px;position:absolute;top:64px;bottom:0;left:39px}.twitter-long-image-item.is-focused .twitter-long-image-thread-line{top:72px;left:47px}.twitter-long-image-header{z-index:1;flex-wrap:nowrap;align-items:flex-start;margin-bottom:12px;display:flex;position:relative}.twitter-long-image-avatar{object-fit:cover;background:#fff;border-radius:50%;flex:0 0 48px;width:48px;height:48px;margin-right:12px}.twitter-long-image-user-info{flex-direction:column;flex:1;min-width:0;display:flex}.twitter-long-image-top-row{width:100%;line-height:1.3;display:block}.twitter-long-image-name{color:#0f1419;overflow-wrap:anywhere;margin-right:4px;font-size:16px;font-weight:700;line-height:1.3;display:inline}.twitter-long-image-handle,.twitter-long-image-handle-and-time{color:#536471;overflow-wrap:anywhere;font-size:15px;line-height:1.25}.twitter-long-image-handle{margin-top:2px;display:block}.twitter-long-image-handle-and-time{margin-left:4px;display:inline}.twitter-long-image-content{box-sizing:border-box;color:#0f1419;overflow-wrap:anywhere;white-space:pre-wrap;margin-left:60px;padding-bottom:8px;font-size:16px;line-height:1.4}.twitter-long-image-item.is-focused .twitter-long-image-content{padding-bottom:0;font-size:22px}.twitter-long-image-text,.twitter-long-image-combined-text{overflow-wrap:anywhere;white-space:pre-wrap;margin-bottom:12px;display:block}.twitter-long-image-content a,.twitter-long-image-quote a{color:#1d9bf0}.twitter-long-image-inline-node{text-overflow:clip!important;white-space:normal!important;width:auto!important;min-width:0!important;max-width:none!important;height:auto!important;max-height:none!important;position:static!important;overflow:visible!important}.twitter-long-image-inline-node img{vertical-align:-.2em;object-fit:contain;width:1.2em;height:1.2em;margin:0 .1em;display:inline-block}.twitter-long-image-media{flex-direction:column;gap:10px;margin-bottom:12px;display:flex}.twitter-long-image-media-image{object-fit:contain;border:1px solid #cfd9de;border-radius:16px;width:100%;max-width:100%;display:block}.twitter-long-image-quote{box-sizing:border-box;background:#fff;border:1px solid #cfd9de;border-radius:12px;flex-direction:column;gap:8px;width:auto;margin-top:12px;margin-bottom:12px;padding:12px;display:flex}.twitter-long-image-quote-header{flex-wrap:nowrap;align-items:flex-start;display:flex}.twitter-long-image-quote-avatar{object-fit:cover;border-radius:50%;flex:0 0 20px;width:20px;height:20px;margin-right:6px}.twitter-long-image-quote-user-info{flex-direction:column;justify-content:center;min-width:0;font-size:15px;line-height:1.4;display:flex}.twitter-long-image-quote-name{color:#0f1419;overflow-wrap:anywhere;font-weight:700;line-height:1.3;display:block}.twitter-long-image-quote-handle,.twitter-long-image-quote-time{color:#536471;overflow-wrap:anywhere;margin-top:2px;font-size:14px;font-weight:400;line-height:1.3;display:inline-block}.twitter-long-image-quote-time{white-space:nowrap}.twitter-long-image-quote-text{color:#0f1419;overflow-wrap:anywhere;white-space:pre-wrap;font-size:15px;line-height:1.5}.twitter-long-image-quote-images{border:1px solid #cfd9de;border-radius:12px;flex-direction:column;gap:2px;margin-top:8px;display:flex;overflow:hidden}.twitter-long-image-quote-image{width:100%;max-width:100%;display:block}.twitter-long-image-metrics{box-sizing:border-box;color:#536471;justify-content:space-between;align-items:center;width:auto;margin-left:60px;padding:0 0 12px;display:flex}.twitter-long-image-item.is-focused .twitter-long-image-metrics{border-top:1px solid #eff3f4;margin-top:16px;margin-left:0;padding:16px 0 0}.twitter-long-image-metrics-time{color:#536471;white-space:nowrap;flex:none;font-size:15px;line-height:20px}.twitter-long-image-metric{color:#536471;white-space:nowrap;flex:none;align-items:center;gap:4px;min-width:0;font-size:13px;line-height:16px;display:inline-flex}.twitter-long-image-metric svg{fill:currentColor;flex:0 0 18.75px;width:18.75px;height:18.75px}.twitter-long-image-metric-count{font-variant-numeric:tabular-nums}.twitter-long-image-emoji{vertical-align:-.2em;object-fit:contain;background:0 0;width:1.2em;height:1.2em;margin:0 .1em;display:inline-block}");
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	function toPrimitive(t, r) {
		if ("object" != _typeof(t) || !t) return t;
		var e = t[Symbol.toPrimitive];
		if (void 0 !== e) {
			var i = e.call(t, r || "default");
			if ("object" != _typeof(i)) return i;
			throw new TypeError("@@toPrimitive must return a primitive value.");
		}
		return ("string" === r ? String : Number)(t);
	}
	function toPropertyKey(t) {
		var i = toPrimitive(t, "string");
		return "symbol" == _typeof(i) ? i : i + "";
	}
	function _defineProperty(e, r, t) {
		return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
			value: t,
			enumerable: !0,
			configurable: !0,
			writable: !0
		}) : e[r] = t, e;
	}
	var TWEET_SELECTOR = "article[data-testid=\"tweet\"]";
	var CELL_SELECTOR = "div[data-testid=\"cellInnerDiv\"]";
	var STATUS_ID_PATTERN = /\/status\/(\d+)/;
	var EXPORT_SCALE = 3;
	var MAX_CANVAS_SIDE = 32767;
	var MAX_CANVAS_PIXELS = 268e6;
	var MAX_THREAD_TWEETS = 50;
	var IMAGE_WAIT_TIMEOUT = 2e3;
	var JUNK_TEXTS = {
		"显示更多": true,
		"Show more": true,
		"翻译帖子": true,
		"翻译推文": true,
		"Translate post": true,
		"Translate Tweet": true
	};
	var ACTION_PATTERNS = [
		/reply|评论|評論|回复|回覆/i,
		/retweet|repost|转发|轉發/i,
		/like|点赞|點讚|喜欢|喜歡/i,
		/bookmark|书签|書籤/i,
		/share|分享/i,
		/analytics|views?|查看|浏览|瀏覽|觀看/i
	];
	var DOWNLOAD_ICON_PATH = "<g><path d=\"M3 19.5c0 .83.67 1.5 1.5 1.5h15c.83 0 1.5-.67 1.5-1.5v-6.5h-2v6.5h-15v-6.5h-2v6.5zM10.46 13.07l-3.54-3.54-1.42 1.42L12 17.41l6.5-6.46-1.42-1.42-3.54 3.54V3h-2v10.07z\"></path></g>";
	var DOWNLOAD_ICON_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true">${DOWNLOAD_ICON_PATH}</svg>`;
	var VISIBLE_ENGAGEMENT_KINDS = [
		"replies",
		"reposts",
		"likes",
		"views"
	];
	var ENGAGEMENT_ICON_SVGS = {
		replies: "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M1.751 10c0-4.42 3.584-8.01 8.005-8.01h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z\"></path></svg>",
		reposts: "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z\"></path></svg>",
		likes: "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><g><path d=\"M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z\"></path></g></svg>",
		views: "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z\"></path></svg>"
	};
	var ENGAGEMENT_PATTERNS = {
		replies: /repl(?:y|ies)|评论|評論|回复|回覆/i,
		reposts: /retweets?|reposts?|转发|轉發/i,
		likes: /likes?|点赞|點讚|喜欢|喜歡/i,
		bookmarks: /bookmarks?|书签|書籤/i,
		views: /analytics|views?|查看|浏览|瀏覽|觀看/i
	};
	var runtime = globalThis;
	var buttonOwners = new WeakMap();
	var scanTimer = null;
	var observerStarted = false;
	function normalizeText(value) {
		return String(value ?? "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
	}
	function isUsefulText(text) {
		const value = normalizeText(text);
		return value.length > 0 && !JUNK_TEXTS[value];
	}
	function getPageLanguage(doc) {
		const declaredLanguage = doc?.documentElement?.lang || "";
		const browserLanguage = typeof navigator === "undefined" ? "" : navigator.language || "";
		return /^(zh|cmn)(?:-|$)/i.test(declaredLanguage || browserLanguage) ? "zh" : "en";
	}
	function getCurrentStatusId(pathname) {
		return (pathname ?? (typeof window === "undefined" ? "" : window.location.pathname)).match(STATUS_ID_PATTERN)?.[1] ?? null;
	}
	function cleanTextNode(node) {
		if (!node) return null;
		const clonedNode = node.cloneNode(true);
		clonedNode.querySelectorAll("a[href*=\"/i/timeline/explore_modes\"], a[href*=\"/translate\"]").forEach((element) => element.remove());
		clonedNode.querySelectorAll("a, button, [role=\"button\"]").forEach((element) => {
			if (JUNK_TEXTS[normalizeText(element.textContent)]) element.remove();
		});
		return clonedNode;
	}
	function getStatusIdFromHref(href) {
		try {
			const base = typeof document === "undefined" ? "https://x.com/" : document.baseURI;
			return new URL(href, base).pathname.match(STATUS_ID_PATTERN)?.[1] ?? null;
		} catch {
			return href.match(STATUS_ID_PATTERN)?.[1] ?? null;
		}
	}
	function getOwnStatusIds(tweetElement) {
		const ids = new Set();
		tweetElement.querySelectorAll("a[href*=\"/status/\"]").forEach((link) => {
			if (link.closest(TWEET_SELECTOR) !== tweetElement) return;
			const id = getStatusIdFromHref(link.href || link.getAttribute("href") || "");
			if (id) ids.add(id);
		});
		return [...ids];
	}
	function getTweetOwnStatusId(tweetElement) {
		const quoted = findQuotedTweetWrapper(tweetElement);
		const handle = getTweetHandle(tweetElement).replace(/^@/, "").toLowerCase();
		const ownIds = [];
		const otherIds = [];
		tweetElement.querySelectorAll("a[href*=\"/status/\"]").forEach((link) => {
			if (link.closest(TWEET_SELECTOR) !== tweetElement) return;
			if (quoted?.contains(link)) return;
			const href = link.href || link.getAttribute("href") || "";
			const id = getStatusIdFromHref(href);
			if (!id) return;
			try {
				const path = new URL(href, "https://x.com/").pathname.toLowerCase();
				if (handle && path.includes(`/${handle}/status/`)) {
					ownIds.push(id);
					return;
				}
			} catch {}
			otherIds.push(id);
		});
		return ownIds[0] || otherIds[0] || null;
	}
	function compareSnowflakeId(left, right) {
		if (left.length !== right.length) return left.length - right.length;
		if (left < right) return -1;
		if (left > right) return 1;
		return 0;
	}
	function sortTweetsByTime(tweets) {
		return [...tweets].sort((left, right) => {
			const leftId = getTweetOwnStatusId(left);
			const rightId = getTweetOwnStatusId(right);
			if (leftId && rightId) return compareSnowflakeId(leftId, rightId);
			if (leftId) return -1;
			if (rightId) return 1;
			return compareCellsTopToBottom(left.closest(CELL_SELECTOR) || left, right.closest(CELL_SELECTOR) || right);
		});
	}
	function getTweetHandle(tweetElement) {
		return normalizeText(Array.from(tweetElement.querySelectorAll("[data-testid=\"User-Name\"] span")).find((element) => /^@\S+/.test(normalizeText(element.textContent)))?.textContent);
	}
	function getTweetCellArticle(cell) {
		return Array.from(cell.querySelectorAll(TWEET_SELECTOR)).find((article) => article.closest(CELL_SELECTOR) === cell) ?? null;
	}
	function isVisibleElement(element) {
		const rect = element.getBoundingClientRect();
		return rect.width > 0 && rect.height > 0;
	}
	function articleHasStatusId(article, statusId) {
		return getOwnStatusIds(article).includes(statusId);
	}
	function findDetailMainTweet(root = document) {
		const statusId = getCurrentStatusId();
		if (!statusId) return null;
		const matches = Array.from(root.querySelectorAll(TWEET_SELECTOR)).filter((article) => articleHasStatusId(article, statusId));
		if (matches.length === 1) return matches[0];
		const visibleMatches = matches.filter(isVisibleElement);
		if (visibleMatches.length === 1) return visibleMatches[0];
		const topLevelMatches = matches.filter((article) => !matches.some((other) => other !== article && other.contains(article)));
		return topLevelMatches.length === 1 ? topLevelMatches[0] : null;
	}
	function hasReplyingToMarker(tweetElement) {
		return [tweetElement.textContent || "", ...Array.from(tweetElement.querySelectorAll("[aria-label], [data-testid]")).flatMap((element) => [element.getAttribute("aria-label") || "", element.getAttribute("data-testid") || ""])].some((value) => /replying to|回复给|回复至|回覆給|回覆至/i.test(value));
	}
	function hasThreadConnector(cell) {
		if (cell.matches(".r-1canivw, .r-1rnoaur, [data-testid=\"tweetThreadLine\"], [data-testid=\"thread-line\"]") || cell.querySelector(".r-1canivw, .r-1rnoaur, [data-testid=\"tweetThreadLine\"], [data-testid=\"thread-line\"]")) return true;
		if (typeof getComputedStyle !== "function") return false;
		for (const element of Array.from(cell.querySelectorAll("*")).slice(0, 300)) {
			const style = getComputedStyle(element);
			const rect = element.getBoundingClientRect();
			const width = rect.width || Number.parseFloat(style.width) || 0;
			const height = rect.height || Number.parseFloat(style.height) || 0;
			const borderWidth = Number.parseFloat(style.borderLeftWidth) || 0;
			if (height >= 32 && (width > 0 && width <= 4 || borderWidth >= 1)) return true;
		}
		return false;
	}
	var CONVERSATION_BREAK_PATTERN = /discover more|who to follow|发现更多|發現更多|推荐关注|推薦關注|推薦跟隨|相关用户|相關使用者|relevant people|more tweets|更多贴文|更多貼文/i;
	function isComposerCell(cell) {
		if (cell.querySelector("[data-testid=\"tweetTextarea_0\"], [data-testid=\"toolBar\"]")) return true;
		return /post your reply|发布你的回复|發佈你的回覆|发布回复|發佈回覆/i.test(normalizeText(cell.textContent));
	}
	function isConversationBreak(cell) {
		if (getTweetCellArticle(cell) || isComposerCell(cell)) return false;
		const labeled = [cell.textContent || "", ...Array.from(cell.querySelectorAll("[data-testid], [aria-label], h1, h2")).map((element) => [
			element.getAttribute("data-testid") || "",
			element.getAttribute("aria-label") || "",
			element.textContent || ""
		].join(" "))].join(" ");
		return CONVERSATION_BREAK_PATTERN.test(normalizeText(labeled));
	}
	function isConnectedConversation(parentTweet, childTweet) {
		const parentCell = parentTweet.closest(CELL_SELECTOR);
		if (parentCell && hasThreadConnector(parentCell)) return true;
		if (hasReplyingToMarker(childTweet)) return true;
		const parentIds = new Set(getOwnStatusIds(parentTweet));
		return Array.from(childTweet.querySelectorAll("a[href*=\"/status/\"]")).some((link) => {
			if (link.closest(TWEET_SELECTOR) !== childTweet) return false;
			const id = getStatusIdFromHref(link.href || link.getAttribute("href") || "");
			return Boolean(id && parentIds.has(id));
		});
	}
	function compareCellsTopToBottom(left, right) {
		const topLeft = left.getBoundingClientRect().top;
		const topRight = right.getBoundingClientRect().top;
		if (topLeft !== topRight) return topLeft - topRight;
		if (left === right) return 0;
		return left.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
	}
	function getConversationCells(currentTweet) {
		const currentCell = currentTweet.closest(CELL_SELECTOR);
		if (!currentCell) return [];
		const root = currentCell.closest("[data-testid=\"primaryColumn\"]") || currentCell.closest("[aria-label*=\"Timeline\"]") || currentCell.closest("section") || currentCell.parentElement;
		if (!root) return [currentCell];
		const cells = Array.from(root.querySelectorAll(CELL_SELECTOR)).filter((cell) => {
			return !cell.parentElement?.closest(CELL_SELECTOR);
		});
		if (cells.length === 0) return [currentCell];
		return cells.sort(compareCellsTopToBottom);
	}
	function collectConversationPath(fromTweet, mainTweet) {
		const cells = getConversationCells(fromTweet);
		const fromCell = fromTweet.closest(CELL_SELECTOR);
		const startIndex = fromCell ? cells.indexOf(fromCell) : -1;
		if (startIndex < 0) return mainTweet && mainTweet !== fromTweet ? [mainTweet, fromTweet] : [fromTweet];
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
	function collectThreadTweetElements(currentTweet, isDetailPage) {
		if (!isDetailPage) return [currentTweet];
		return collectConversationPath(currentTweet, findDetailMainTweet());
	}
	function isLikelyQuotedTweet(wrapper) {
		const hasUser = Boolean(wrapper.querySelector("[data-testid=\"User-Name\"]"));
		const hasStatusLink = Array.from(wrapper.querySelectorAll("a[href*=\"/status/\"]")).some((link) => Boolean(getStatusIdFromHref(link.href || link.getAttribute("href") || "")));
		const hasText = Boolean(wrapper.querySelector("[data-testid=\"tweetText\"], [data-testid=\"noteTweetText\"]"));
		const hasMedia = Boolean(wrapper.querySelector("img[src*=\"/media/\"]"));
		return hasUser && hasStatusLink && (hasText || hasMedia);
	}
	function findQuotedTweetWrapper(tweetElement) {
		const candidates = Array.from(tweetElement.querySelectorAll("[data-testid=\"card.wrapper\"], div[role=\"link\"][tabindex=\"0\"]"));
		return candidates.find((candidate) => isLikelyQuotedTweet(candidate) && !candidates.some((other) => other !== candidate && other.contains(candidate) && isLikelyQuotedTweet(other))) ?? null;
	}
	function isMainTextCandidate(node, quotedTweetWrapper) {
		if (quotedTweetWrapper?.contains(node)) return false;
		if (node.closest("[data-testid=\"User-Name\"], [data-testid=\"Tweet-User-Avatar\"], [role=\"group\"], time, [data-testid=\"tweetPhoto\"], [data-testid=\"videoPlayer\"], [data-testid=\"placementTracking\"], [data-testid=\"card.wrapper\"], [data-testid=\"videoComponent\"]")) return false;
		return isUsefulText(node.textContent);
	}
	function findMainTextNode(tweetElement, quotedTweetWrapper) {
		for (const selector of [
			"[data-testid=\"tweetText\"]",
			"[data-testid=\"noteTweetText\"]",
			"[data-testid=\"NoteTweet\"]"
		]) {
			const directText = Array.from(tweetElement.querySelectorAll(selector)).find((element) => !quotedTweetWrapper?.contains(element) && isUsefulText(element.textContent));
			if (directText) return cleanTextNode(directText);
		}
		const candidates = Array.from(tweetElement.querySelectorAll("div[lang], span[lang], div[dir=\"auto\"], span[dir=\"auto\"]")).filter((element) => isMainTextCandidate(element, quotedTweetWrapper));
		const uniqueCandidates = candidates.filter((element, index) => !candidates.some((other, otherIndex) => otherIndex < index && other.contains(element)));
		if (uniqueCandidates.length === 0) return null;
		if (uniqueCandidates.length === 1) return cleanTextNode(uniqueCandidates[0]);
		const wrapper = document.createElement("div");
		const seenTexts = [];
		for (const candidate of uniqueCandidates) {
			const text = normalizeText(candidate.textContent);
			if (seenTexts.some((seen) => seen.includes(text) || text.includes(seen))) continue;
			seenTexts.push(text);
			const cloned = cleanTextNode(candidate);
			if (!cloned || !isUsefulText(cloned.textContent)) continue;
			cloned.classList.add("twitter-long-image-combined-text");
			wrapper.appendChild(cloned);
		}
		return wrapper.childNodes.length > 0 ? wrapper : null;
	}
	function getUserNameNode(tweetElement) {
		const userName = tweetElement.querySelector("[data-testid=\"User-Name\"]");
		const nameAnchor = userName?.querySelector("a");
		return (nameAnchor?.querySelector("div")?.firstElementChild || nameAnchor?.firstElementChild || userName?.firstElementChild)?.cloneNode(true) ?? null;
	}
	function getTimeText(tweetElement, excluded) {
		return Array.from(tweetElement.querySelectorAll("time")).find((time) => !excluded?.contains(time))?.textContent?.trim() || "";
	}
	function getViewsText(tweetElement, excluded) {
		return Array.from(tweetElement.querySelectorAll("span, a")).filter((element) => !excluded?.contains(element)).map((element) => normalizeText(element.textContent)).find((text) => text.length <= 80 && /\d/.test(text) && /views?|查看|浏览量|浏览|瀏覽量|瀏覽|觀看/i.test(text)) || "";
	}
	function getEngagementValue(text) {
		return normalizeText(text).match(/\d[\d,.]*\s*(?:万|萬|亿|億|[KMB])?/i)?.[0]?.replace(/\s+/g, "") || "";
	}
	function getLabeledEngagementValue(text, pattern) {
		return normalizeText(text).match(new RegExp(`(\\d[\\d,.]*\\s*(?:万|萬|亿|億|[KMB])?)(?:\\s*(?:則|次|個|个))?\\s*(?:${pattern.source})`, "i"))?.[1]?.replace(/\s+/g, "") || "";
	}
	function getEngagementLabel(kind, source) {
		const pageLanguage = typeof document === "undefined" ? "" : document.documentElement.lang;
		const traditional = /(?:^|-)Hant(?:-|$)|^zh-(?:TW|HK|MO)(?:-|$)/i.test(pageLanguage) || /評論|回覆|轉發|點讚|喜歡|書籤|瀏覽|觀看/.test(source);
		if (!(traditional || /评论|回复|转发|点赞|喜欢|书签|浏览|查看/.test(source))) return {
			replies: "Replies",
			reposts: "Reposts",
			likes: "Likes",
			bookmarks: "Bookmarks",
			views: "Views"
		}[kind];
		return (traditional ? {
			replies: "回覆",
			reposts: "轉發",
			likes: "喜歡",
			bookmarks: "書籤",
			views: "觀看"
		} : {
			replies: "评论",
			reposts: "转发",
			likes: "点赞",
			bookmarks: "书签",
			views: "浏览"
		})[kind];
	}
	function findDetailActionGroup(tweetElement) {
		const mainBottom = tweetElement.getBoundingClientRect().bottom;
		const actionBars = Array.from(document.querySelectorAll("[role=\"group\"]")).filter((group) => {
			if (group.closest(TWEET_SELECTOR)) return false;
			const rect = group.getBoundingClientRect();
			if (rect.width < 240 || rect.height < 24) return false;
			if (mainBottom > 0 && Math.abs(rect.top - mainBottom) > 260) return false;
			return getActionGroupScore(group) >= 2;
		});
		actionBars.sort((left, right) => Math.abs(left.getBoundingClientRect().top - mainBottom) - Math.abs(right.getBoundingClientRect().top - mainBottom));
		return actionBars[0] || null;
	}
	function getTweetEngagements(tweetElement, excluded, isDetailPageMain) {
		const groups = [findTweetActionGroup(tweetElement, excluded), isDetailPageMain ? findDetailActionGroup(tweetElement) : null].filter((group) => group !== null);
		const ariaTexts = groups.flatMap((group) => Array.from(group.querySelectorAll("[aria-label]")).map((element) => element.getAttribute("aria-label") || ""));
		const result = {};
		for (const kind of Object.keys(ENGAGEMENT_PATTERNS)) {
			const pattern = ENGAGEMENT_PATTERNS[kind];
			let source = ariaTexts.find((text) => pattern.test(text) && getEngagementValue(text));
			if (!source) source = groups.flatMap((group) => Array.from(group.querySelectorAll("button, a, [role=\"button\"], [data-testid]"))).map((element) => normalizeText([
				element.getAttribute("aria-label"),
				element.getAttribute("data-testid"),
				element.textContent
			].filter(Boolean).join(" "))).find((text) => pattern.test(text) && getEngagementValue(text));
			let value = getEngagementValue(source || "");
			if (!value) for (const group of groups) {
				const groupLabel = group.getAttribute("aria-label") || "";
				const groupValue = getLabeledEngagementValue(groupLabel, pattern);
				if (!groupValue) continue;
				source = groupLabel;
				value = groupValue;
				break;
			}
			if (!value && kind === "views" && isDetailPageMain) {
				source = getViewsText(tweetElement, excluded);
				value = getEngagementValue(source);
			}
			if (value) result[kind] = value;
		}
		return result;
	}
	function getHighResImageUrl(source) {
		if (!source) return "";
		try {
			const base = typeof document === "undefined" ? "https://x.com/" : document.baseURI;
			const url = new URL(source, base);
			if (url.hostname === "pbs.twimg.com" && url.pathname.startsWith("/media/")) url.searchParams.set("name", "orig");
			return url.href;
		} catch {
			return source;
		}
	}
	function getTweetImages(tweetElement, excluded) {
		return Array.from(tweetElement.querySelectorAll("[data-testid=\"tweetPhoto\"] img")).filter((image) => !excluded?.contains(image)).map((image) => getHighResImageUrl(image.currentSrc || image.src)).filter(Boolean);
	}
	function getQuotedTweetData(wrapper) {
		const userInfo = wrapper.querySelector("[data-testid=\"User-Name\"]");
		const handleElement = Array.from(wrapper.querySelectorAll("[data-testid=\"User-Name\"] span")).find((element) => /^@\S+/.test(normalizeText(element.textContent)));
		const nameAnchor = userInfo?.querySelector("a");
		const nameNode = nameAnchor?.querySelector("div")?.firstElementChild?.cloneNode(true) || nameAnchor?.firstElementChild?.cloneNode(true) || null;
		const tweetTextNode = findMainTextNode(wrapper, null);
		const images = Array.from(wrapper.querySelectorAll("img[src*=\"/media/\"]")).map((image) => getHighResImageUrl(image.currentSrc || image.src)).filter(Boolean);
		if (!nameNode && !tweetTextNode && images.length === 0) return null;
		return {
			avatar: wrapper.querySelector("img[src*=\"/profile_images/\"]")?.src || "",
			nameNode,
			handle: normalizeText(handleElement?.textContent),
			time: wrapper.querySelector("time")?.textContent?.trim() || "",
			tweetTextNode,
			images
		};
	}
	function extractTweetData(tweetElement, isDetailPageMain = false) {
		try {
			const quotedTweetWrapper = findQuotedTweetWrapper(tweetElement);
			const tweetTextNode = findMainTextNode(tweetElement, quotedTweetWrapper);
			const images = getTweetImages(tweetElement, quotedTweetWrapper);
			const quotedTweetData = quotedTweetWrapper ? getQuotedTweetData(quotedTweetWrapper) : null;
			if (!Boolean(tweetTextNode && isUsefulText(tweetTextNode.textContent) || images.length > 0 || quotedTweetData)) return null;
			return {
				avatar: tweetElement.querySelector("[data-testid=\"Tweet-User-Avatar\"] img")?.src || "",
				nameNode: getUserNameNode(tweetElement),
				handle: getTweetHandle(tweetElement),
				time: getTimeText(tweetElement, quotedTweetWrapper),
				engagements: getTweetEngagements(tweetElement, quotedTweetWrapper, isDetailPageMain),
				tweetTextNode,
				images,
				quotedTweetData
			};
		} catch (error) {
			console.error("Failed to read tweet:", error);
			return null;
		}
	}
	function fetchImageAsDataURL(url) {
		if (!url || url.startsWith("data:")) return Promise.resolve(url);
		const { promise, resolve } = Promise.withResolvers();
		const request = {
			method: "GET",
			url,
			responseType: "blob",
			onload: (response) => {
				if (response.status < 200 || response.status >= 300 || !response.response) {
					resolve(url);
					return;
				}
				const reader = new FileReader();
				reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : url);
				reader.onerror = () => resolve(url);
				reader.readAsDataURL(response.response);
			},
			onerror: () => resolve(url)
		};
		try {
			if (typeof runtime.GM?.xmlHttpRequest === "function") runtime.GM.xmlHttpRequest(request);
			else if (typeof runtime.GM_xmlhttpRequest === "function") runtime.GM_xmlhttpRequest(request);
			else resolve(url);
		} catch {
			resolve(url);
		}
		return promise;
	}
	async function processEmojis(container) {
		const emojiSvgPattern = /\/emoji\/v2\/svg\/([a-f0-9-]+)\.svg/i;
		container.querySelectorAll("img").forEach((image) => {
			const match = image.src.match(emojiSvgPattern);
			if (!match?.[1]) return;
			image.src = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${match[1]}.png`;
			image.className = "twitter-long-image-emoji";
		});
		try {
			runtime.twemoji?.parse(container, {
				folder: "72x72",
				ext: ".png",
				base: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/",
				className: "twitter-long-image-emoji"
			});
		} catch (error) {
			console.warn("Emoji conversion skipped:", error);
		}
		const emojiImages = Array.from(container.querySelectorAll("img.twitter-long-image-emoji"));
		await Promise.all(emojiImages.map(async (image) => {
			image.dataset.captureRole = "emoji";
			image.src = await fetchImageAsDataURL(image.src);
		}));
	}
	function cleanClonedNodeStyles(node) {
		if (node instanceof Element) {
			node.removeAttribute("style");
			node.removeAttribute("class");
			node.removeAttribute("data-testid");
			node.removeAttribute("role");
			node.removeAttribute("tabindex");
			node.removeAttribute("aria-label");
			node.classList.add("twitter-long-image-inline-node");
		}
		node.childNodes.forEach(cleanClonedNodeStyles);
	}
	function createCaptureImage(source, className, captureRole) {
		if (!source) return null;
		const image = document.createElement("img");
		image.src = source;
		image.crossOrigin = "anonymous";
		image.className = className;
		image.dataset.captureRole = captureRole;
		return image;
	}
	async function renderSingleTweet(data, isFocused, hasThreadLine) {
		const container = document.createElement("section");
		container.className = `twitter-long-image-item${isFocused ? " is-focused" : ""}`;
		if (hasThreadLine) {
			const line = document.createElement("div");
			line.className = "twitter-long-image-thread-line";
			container.appendChild(line);
		}
		const header = document.createElement("header");
		header.className = "twitter-long-image-header";
		const avatar = createCaptureImage(data.avatar, "twitter-long-image-avatar", "avatar");
		if (avatar) header.appendChild(avatar);
		const userInfo = document.createElement("div");
		userInfo.className = "twitter-long-image-user-info";
		const topRow = document.createElement("div");
		topRow.className = "twitter-long-image-top-row";
		const nameStrong = document.createElement("strong");
		nameStrong.className = "twitter-long-image-name";
		if (data.nameNode) {
			cleanClonedNodeStyles(data.nameNode);
			nameStrong.appendChild(data.nameNode);
		}
		topRow.appendChild(nameStrong);
		if (!isFocused) {
			const handleAndTime = document.createElement("span");
			handleAndTime.className = "twitter-long-image-handle-and-time";
			handleAndTime.textContent = [data.handle, data.time].filter(Boolean).join(" · ");
			if (handleAndTime.textContent) topRow.appendChild(handleAndTime);
			userInfo.appendChild(topRow);
		} else {
			userInfo.appendChild(topRow);
			if (data.handle) {
				const handle = document.createElement("div");
				handle.className = "twitter-long-image-handle";
				handle.textContent = data.handle;
				userInfo.appendChild(handle);
			}
		}
		header.appendChild(userInfo);
		container.appendChild(header);
		const contentWrapper = document.createElement("div");
		contentWrapper.className = "twitter-long-image-content";
		if (data.tweetTextNode && isUsefulText(data.tweetTextNode.textContent)) {
			data.tweetTextNode.classList.add("twitter-long-image-text");
			contentWrapper.appendChild(data.tweetTextNode);
		}
		if (data.images.length > 0) {
			const imageStack = document.createElement("div");
			imageStack.className = "twitter-long-image-media";
			data.images.forEach((source) => {
				const image = createCaptureImage(source, "twitter-long-image-media-image", "media");
				if (image) imageStack.appendChild(image);
			});
			if (imageStack.childElementCount > 0) contentWrapper.appendChild(imageStack);
		}
		if (data.quotedTweetData) {
			const quote = data.quotedTweetData;
			const quoteContainer = document.createElement("div");
			quoteContainer.className = "twitter-long-image-quote";
			const quoteHeader = document.createElement("div");
			quoteHeader.className = "twitter-long-image-quote-header";
			const quoteAvatar = createCaptureImage(quote.avatar, "twitter-long-image-quote-avatar", "quote-avatar");
			if (quoteAvatar) quoteHeader.appendChild(quoteAvatar);
			const quoteUserInfo = document.createElement("div");
			quoteUserInfo.className = "twitter-long-image-quote-user-info";
			const quoteName = document.createElement("strong");
			quoteName.className = "twitter-long-image-quote-name";
			if (quote.nameNode) {
				cleanClonedNodeStyles(quote.nameNode);
				quoteName.appendChild(quote.nameNode);
			}
			quoteUserInfo.appendChild(quoteName);
			if (quote.handle) {
				const quoteHandle = document.createElement("span");
				quoteHandle.className = "twitter-long-image-quote-handle";
				quoteHandle.textContent = quote.handle;
				quoteUserInfo.appendChild(quoteHandle);
			}
			if (quote.time) {
				const quoteTime = document.createElement("span");
				quoteTime.className = "twitter-long-image-quote-time";
				quoteTime.textContent = ` · ${quote.time}`;
				quoteUserInfo.appendChild(quoteTime);
			}
			quoteHeader.appendChild(quoteUserInfo);
			quoteContainer.appendChild(quoteHeader);
			if (quote.tweetTextNode && isUsefulText(quote.tweetTextNode.textContent)) {
				quote.tweetTextNode.classList.add("twitter-long-image-quote-text");
				quoteContainer.appendChild(quote.tweetTextNode);
			}
			if (quote.images.length > 0) {
				const quoteImages = document.createElement("div");
				quoteImages.className = "twitter-long-image-quote-images";
				quote.images.forEach((source) => {
					const image = createCaptureImage(source, "twitter-long-image-quote-image", "quote-media");
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
	function createMetricElement(kind, value) {
		const item = document.createElement("span");
		item.className = "twitter-long-image-metric";
		item.dataset.metric = kind;
		item.setAttribute("aria-label", `${getEngagementLabel(kind, "")} ${value}`);
		item.innerHTML = ENGAGEMENT_ICON_SVGS[kind];
		const count = document.createElement("span");
		count.className = "twitter-long-image-metric-count";
		count.textContent = value;
		item.appendChild(count);
		return item;
	}
	function renderMetricsRow(data, isFocused) {
		const row = document.createElement("div");
		row.className = "twitter-long-image-metrics";
		if (isFocused && data.time) {
			const time = document.createElement("span");
			time.className = "twitter-long-image-metrics-time";
			time.textContent = data.time;
			row.appendChild(time);
		}
		for (const kind of VISIBLE_ENGAGEMENT_KINDS) row.appendChild(createMetricElement(kind, data.engagements[kind] || "0"));
		return row;
	}
	function getFocusedTweetIndex(tweetElements, currentTweet, mainTweet) {
		const currentIndex = tweetElements.indexOf(currentTweet);
		if (currentIndex >= 0) return currentIndex;
		if (mainTweet) {
			const mainIndex = tweetElements.indexOf(mainTweet);
			if (mainIndex >= 0) return mainIndex;
		}
		return Math.max(tweetElements.length - 1, 0);
	}
	async function createMultiTweetCanvas(tweetsData, isDetailPage, focusedIndex = isDetailPage ? tweetsData.length - 1 : -1) {
		const mainContainer = document.createElement("div");
		mainContainer.className = "twitter-long-image-capture";
		for (let index = 0; index < tweetsData.length; index += 1) {
			const isFocused = index === focusedIndex;
			const hasThreadLine = tweetsData.length > 1 && index < tweetsData.length - 1;
			mainContainer.appendChild(await renderSingleTweet(tweetsData[index], isFocused, hasThreadLine));
		}
		await processEmojis(mainContainer);
		return mainContainer;
	}
	async function waitForFonts() {
		if (!document.fonts?.ready) return;
		const { promise, resolve } = Promise.withResolvers();
		window.setTimeout(resolve, 1200);
		await Promise.race([document.fonts.ready.catch(() => void 0), promise]);
	}
	function waitForImage(image) {
		const { promise, resolve } = Promise.withResolvers();
		let settled = false;
		const finish = (loaded) => {
			if (settled) return;
			settled = true;
			window.clearTimeout(timeout);
			image.removeEventListener("load", onLoad);
			image.removeEventListener("error", onError);
			resolve(loaded);
		};
		const onLoad = () => finish(true);
		const onError = () => finish(false);
		const timeout = window.setTimeout(() => finish(image.complete && image.naturalWidth > 0), IMAGE_WAIT_TIMEOUT);
		if (image.complete) finish(image.naturalWidth > 0 || image.src.startsWith("data:"));
		else {
			image.addEventListener("load", onLoad, { once: true });
			image.addEventListener("error", onError, { once: true });
		}
		return promise;
	}
	async function waitForRenderReady(container) {
		await waitForFonts();
		const images = Array.from(container.querySelectorAll("img"));
		const results = await Promise.all(images.map(waitForImage));
		const { promise, resolve } = Promise.withResolvers();
		window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
		await promise;
		return images.filter((_, index) => !results[index]).map((image) => image.dataset.captureRole || "image");
	}
	function getCaptureDimensions(element, scale = EXPORT_SCALE) {
		const rect = element.getBoundingClientRect();
		const cssWidth = Math.max(rect.width, element.scrollWidth || 0);
		const cssHeight = Math.max(rect.height, element.scrollHeight || 0);
		const width = Math.ceil(cssWidth * scale);
		const height = Math.ceil(cssHeight * scale);
		return {
			width,
			height,
			pixels: width * height
		};
	}
	function assertCanvasWithinLimit(element, scale = EXPORT_SCALE) {
		const dimensions = getCaptureDimensions(element, scale);
		if (dimensions.width <= 0 || dimensions.height <= 0 || dimensions.width > MAX_CANVAS_SIDE || dimensions.height > MAX_CANVAS_SIDE || dimensions.pixels > MAX_CANVAS_PIXELS) throw new UserVisibleError("连续推文太长，超过浏览器图片尺寸上限。请分段生成。", "This thread is too long for the browser image limit. Generate it in parts.");
	}
	var UserVisibleError = class extends Error {
		constructor(zhMessage, enMessage) {
			super(zhMessage);
			_defineProperty(this, "zhMessage", void 0);
			_defineProperty(this, "enMessage", void 0);
			this.zhMessage = zhMessage;
			this.enMessage = enMessage;
			this.name = "UserVisibleError";
		}
	};
	function setButtonBusy(button, isBusy) {
		const labels = getPageLanguage(document) === "zh" ? {
			ready: "生成推文长图",
			busy: "正在生成推文长图",
			readyTitle: "生成推文长图",
			busyTitle: "正在生成推文长图…"
		} : {
			ready: "Generate long image",
			busy: "Generating long image",
			readyTitle: "Generate long image",
			busyTitle: "Generating long image…"
		};
		button.classList.toggle("is-loading", isBusy);
		button.disabled = isBusy;
		button.setAttribute("aria-busy", String(isBusy));
		button.setAttribute("aria-label", isBusy ? labels.busy : labels.ready);
		button.title = isBusy ? labels.busyTitle : labels.readyTitle;
	}
	function getErrorMessage(error, language) {
		if (error instanceof UserVisibleError) return language === "zh" ? error.zhMessage : error.enMessage;
		return language === "zh" ? "生成失败：请确认推文内容和图片已经加载完整后再试。" : "Generation failed. Make sure the post and its images are fully loaded, then try again.";
	}
	function safeFileName(text) {
		return String(text || "tweet").replace(/^@/, "").replace(/[\\/:*?"<>|]/g, "_").trim() || "tweet";
	}
	function resolveTweetForButton(button) {
		return button.closest(TWEET_SELECTOR) || buttonOwners.get(button) || null;
	}
	async function handleGenerateClick(event) {
		event.preventDefault();
		event.stopPropagation();
		const button = event.currentTarget;
		if (!(button instanceof HTMLButtonElement) || button.classList.contains("is-loading")) return;
		const currentTweet = resolveTweetForButton(button);
		if (!currentTweet) return;
		setButtonBusy(button, true);
		const language = getPageLanguage(document);
		const isDetailPage = window.location.pathname.includes("/status/");
		let canvasContainer = null;
		try {
			const tweetElements = collectThreadTweetElements(currentTweet, isDetailPage);
			const mainTweet = isDetailPage ? findDetailMainTweet() : null;
			const extracted = tweetElements.map((tweet) => ({
				tweet,
				data: extractTweetData(tweet, Boolean(mainTweet && tweet === mainTweet))
			})).filter((item) => item.data !== null);
			const tweetsData = extracted.map((item) => item.data);
			if (tweetsData.length === 0) throw new UserVisibleError("未读取到推文内容，请等页面加载完成后重试。", "No post content was found. Wait for the page to finish loading and try again.");
			const focusedIndex = isDetailPage ? getFocusedTweetIndex(extracted.map((item) => item.tweet), currentTweet, mainTweet) : -1;
			canvasContainer = await createMultiTweetCanvas(tweetsData, isDetailPage, focusedIndex);
			document.body.appendChild(canvasContainer);
			if ((await waitForRenderReady(canvasContainer)).length > 0) throw new UserVisibleError("有图片加载失败，请确认图片已经加载完成后再试。", "Some images failed to load. Make sure the images are fully loaded and try again.");
			assertCanvasWithinLimit(canvasContainer);
			const dataUrl = (await (await D(canvasContainer, {
				scale: EXPORT_SCALE,
				embedFonts: true,
				backgroundColor: "#ffffff"
			})).toPng()).src;
			if (!dataUrl) throw new UserVisibleError("没有生成有效图片，请稍后重试。", "No valid image was produced. Please try again later.");
			const fileTweet = tweetsData[focusedIndex >= 0 ? focusedIndex : tweetsData.length - 1];
			const link = document.createElement("a");
			link.download = `${safeFileName(fileTweet.handle)}-${Date.now()}.png`;
			link.href = dataUrl;
			link.click();
		} catch (error) {
			console.error("推文长图生成失败:", error);
			const message = getErrorMessage(error, language);
			if (typeof window.alert === "function") window.alert(message);
		} finally {
			canvasContainer?.remove();
			window.setTimeout(() => setButtonBusy(button, false), 500);
		}
	}
	function getActionGroupScore(group) {
		const text = [...Array.from(group.querySelectorAll("[data-testid]")).map((element) => element.getAttribute("data-testid") || ""), ...Array.from(group.querySelectorAll("[aria-label]")).map((element) => element.getAttribute("aria-label") || "")].join(" ");
		return ACTION_PATTERNS.reduce((score, pattern) => score + (pattern.test(text) ? 1 : 0), 0);
	}
	function findTweetActionGroup(node, excluded = null) {
		const candidates = Array.from(node.querySelectorAll("[role=\"group\"]")).filter((group) => group.closest(TWEET_SELECTOR) === node && !excluded?.contains(group)).map((group) => ({
			group,
			score: getActionGroupScore(group)
		})).filter(({ score }) => score >= 2);
		candidates.sort((left, right) => {
			if (right.score !== left.score) return right.score - left.score;
			return right.group.getBoundingClientRect().top - left.group.getBoundingClientRect().top;
		});
		return candidates[0]?.group || null;
	}
	function getNativeActionItems(actionGroup) {
		return Array.from(actionGroup.children).filter((child) => child instanceof HTMLElement && !child.classList.contains("twitter-long-image-button-container"));
	}
	function stripClonedCounts(button) {
		button.querySelectorAll("span, [data-testid*=\"count\" i], [data-testid*=\"Count\"]").forEach((element) => {
			if (!element.querySelector("svg")) element.remove();
		});
		const visit = (node) => {
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
	function createDownloadButton(nativeButton, ownerTweet) {
		const button = document.createElement("button");
		button.type = "button";
		button.className = nativeButton?.className || "";
		button.classList.add("twitter-long-image-button");
		if (!nativeButton) button.classList.add("is-fallback");
		if (nativeButton) {
			button.innerHTML = nativeButton.innerHTML;
			button.querySelectorAll("[data-testid], [aria-label], [href], [role]").forEach((element) => {
				element.removeAttribute("data-testid");
				element.removeAttribute("aria-label");
				element.removeAttribute("href");
				element.removeAttribute("role");
			});
			const svg = button.querySelector("svg");
			if (svg) svg.innerHTML = DOWNLOAD_ICON_PATH;
			else button.innerHTML = DOWNLOAD_ICON_SVG;
			stripClonedCounts(button);
		} else button.innerHTML = DOWNLOAD_ICON_SVG;
		buttonOwners.set(button, ownerTweet);
		setButtonBusy(button, false);
		button.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			handleGenerateClick(event);
		});
		button.addEventListener("keydown", (event) => {
			if (event.key !== "Enter" && event.key !== " ") return;
			event.preventDefault();
			event.stopPropagation();
			handleGenerateClick(event);
		});
		return button;
	}
	function appendLongImageButton(actionGroup, ownerTweet) {
		if (!actionGroup) return;
		const existingButton = actionGroup.querySelector(".twitter-long-image-button");
		if (existingButton) {
			buttonOwners.set(existingButton, ownerTweet);
			return;
		}
		const nativeItems = getNativeActionItems(actionGroup);
		const layoutSource = nativeItems[nativeItems.length - 1] || nativeItems[0] || null;
		const nativeButton = layoutSource?.querySelector("button, a[role=\"button\"], [role=\"button\"]") || null;
		const container = document.createElement("div");
		if (layoutSource) container.className = layoutSource.className;
		container.classList.add("twitter-long-image-button-container");
		container.appendChild(createDownloadButton(nativeButton, ownerTweet));
		actionGroup.appendChild(container);
	}
	function injectButton(tweetElement) {
		appendLongImageButton(findTweetActionGroup(tweetElement), tweetElement);
	}
	function scanDetailActionBars() {
		if (!window.location.pathname.includes("/status/")) return;
		const mainTweet = findDetailMainTweet();
		if (!mainTweet) return;
		appendLongImageButton(findDetailActionGroup(mainTweet), mainTweet);
	}
	function scanTweets() {
		document.querySelectorAll(TWEET_SELECTOR).forEach(injectButton);
		scanDetailActionBars();
	}
	function scheduleScan() {
		if (scanTimer !== null) return;
		scanTimer = window.setTimeout(() => {
			scanTimer = null;
			scanTweets();
		}, 250);
	}
	function startObserver() {
		if (observerStarted || !document.body) return;
		observerStarted = true;
		new MutationObserver((mutations) => {
			if (mutations.some((mutation) => mutation.type === "childList" || mutation.type === "attributes" && [
				"data-testid",
				"aria-label",
				"href"
			].includes(mutation.attributeName || ""))) scheduleScan();
		}).observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: [
				"data-testid",
				"aria-label",
				"href"
			]
		});
		window.addEventListener("popstate", scheduleScan);
		scanTweets();
	}
	function install() {
		if (typeof document === "undefined" || typeof window === "undefined") return;
		const state = window;
		if (state.__twitterLongImageGeneratorInstalled) return;
		state.__twitterLongImageGeneratorInstalled = true;
		if (document.body) startObserver();
		else document.addEventListener("DOMContentLoaded", startObserver, { once: true });
	}
	if (typeof document !== "undefined" && true) install();
})();
