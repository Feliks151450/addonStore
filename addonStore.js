/**
 * 根据指定的 scheme、host、path、query 和 fragment 生成一个完整的 URL Scheme 字符串。
 * URL Scheme 完整格式：scheme://host/path?query#fragment
 *
 * @param {string} scheme - URL scheme，例如 'myapp'。必须提供。
 * @param {string|undefined} [host] - host 部分，例如 'user_profile'。
 * @param {string|string[]|undefined} [path] - path 部分，例如 'view/123'。
 * @param {Object<string, string|number|boolean|object>|undefined} [query] - 查询参数对象。
 * @param {string|undefined} [fragment] - fragment 标识符，即 URL 中 # 后面的部分。
 * @returns {string} - 生成的完整 URL 字符串。
 */
function generateUrlScheme(scheme, host, path, query, fragment) {
  // 1. 处理必须的 scheme
  if (!scheme) {
    console.error("Scheme is a required parameter.");
    return '';
  }
  // 2. 构建基础部分：scheme 和 host
  //    即使 host 为空，也会生成 'scheme://'，这对于 'file:///' 这类 scheme 是正确的
  let url = `${scheme}://${host || ''}`;

  // 3. 添加 path
  if (path) {
    if (Array.isArray(path)) {
      let pathStr = path.join('/')
      url += `/${pathStr.replace(/^\/+/, '')}`;
    }else{
      // 确保 host 和 path 之间只有一个斜杠，并处理 path 开头可能存在的斜杠
      url += `/${path.replace(/^\/+/, '')}`;
    }
  }

  // 4. 添加 query 参数
  if (query && Object.keys(query).length > 0) {
    const queryParts = [];
    for (const key in query) {
      // 确保我们只处理对象自身的属性
      if (Object.prototype.hasOwnProperty.call(query, key)) {
        const value = query[key];
        const encodedKey = encodeURIComponent(key);
        // 对值进行编码，如果是对象，则先序列化为 JSON 字符串
        const encodedValue = encodeURIComponent(
          typeof value === "object" && value !== null ? JSON.stringify(value) : value
        );
        queryParts.push(`${encodedKey}=${encodedValue}`);
      }
    }
    if (queryParts.length > 0) {
      url += `?${queryParts.join('&')}`;
    }
  }

  // 5. 添加 fragment
  if (fragment) {
    // Fragment 部分不应该被编码
    url += `#${fragment}`;
  }

  return url;
}
/**
 *
 * @param {string} scheme - URL scheme, 例如 'myapp'。
 * @param {string} [host] - 可选的路径或操作名。
 * @param {string|string[]|undefined} [path] - path 部分，例如 'view/123'。
 * @param {Object<string, string|number|boolean>} [params] - 查询参数对象。
 */
function postMessageToAddon(scheme, host, path, params) {
  let url = generateUrlScheme(scheme,host,path,params)
  window.location.href = url
}
/**
 * 生成安装插件的 URL
 * @param {string} downloadURL - 插件下载 URL
 * @returns {string} - 生成的安装插件的 URL
 */
function generateAddonInstallUrl(downloadURL) {
  let url = generateUrlScheme("marginnote4app","addon","installAddon",{url:downloadURL})
  return url
}



function wantsInstall(addon) {
  return (addon.action || "install") === "install";
}

function hasInstallFn() {
  return typeof generateAddonInstallUrl === "function";
}

function buildAddonChains(addon) {
  var url = addon.url;
  var globalUrl = addon.globalUrl;
  var backUpUrl = addon.backUpUrl;
  var chains = [];
  if (url) chains.push({ u: url, label: "主链" });
  if (globalUrl && globalUrl !== url) {
    chains.push({ u: globalUrl, label: "global" });
  }
  if (backUpUrl && backUpUrl !== url && backUpUrl !== globalUrl) {
    chains.push({ u: backUpUrl, label: "backup" });
  }
  return chains;
}

function primaryChainUrl(addon) {
  var chains = buildAddonChains(addon);
  return chains.length ? chains[0].u : "";
}

/** description 字段作为说明页/主页链接（http(s)） */
function descriptionPageUrl(addon) {
  var d = addon.description;
  if (d == null || String(d).trim() === "") return "";
  var s = String(d).trim();
  if (/^https?:\/\//i.test(s)) return s;
  return "";
}

function installOrDownloadLabel(addon) {
  return wantsInstall(addon) && hasInstallFn() ? "安装" : "下载";
}

function buildAddonActionBarHtml(addon) {
  var primaryU = primaryChainUrl(addon);
  var homeUrl = descriptionPageUrl(addon);
  var parts = [];
  parts.push('<div class="addon-action-bar">');
  if (primaryU) {
    var href =
      wantsInstall(addon) && hasInstallFn()
        ? generateAddonInstallUrl(primaryU)
        : primaryU;
    var label = installOrDownloadLabel(addon);
    var primaryClasses =
      wantsInstall(addon) && hasInstallFn()
        ? "btn-primary btn-install addon-action-btn"
        : "btn-primary addon-action-btn";
    parts.push(
      '<a class="' +
        primaryClasses +
        '" href="' +
        escapeHtmlAttr(href) +
        '" rel="noopener">' +
        escapeHtml(label) +
        "</a>"
    );
  } else {
    parts.push(
      '<span class="addon-action-btn addon-action-btn-muted" aria-disabled="true">暂无包</span>'
    );
  }
  if (homeUrl) {
    parts.push(
      '<a class="btn-secondary addon-action-btn" href="' +
        escapeHtmlAttr(homeUrl) +
        '" target="_blank" rel="noopener noreferrer">插件文档</a>'
    );
  }
  parts.push("</div>");
  return parts.join("");
}

function buildHistoryChains(h) {
  var url = h.url;
  var globalUrl = h.globalUrl;
  var backUpUrl = h.backUpUrl;
  var chains = [];
  if (url) chains.push({ u: url, label: "主链" });
  if (globalUrl && globalUrl !== url) {
    chains.push({ u: globalUrl, label: "global" });
  }
  if (backUpUrl && backUpUrl !== url && backUpUrl !== globalUrl) {
    chains.push({ u: backUpUrl, label: "backup" });
  }
  return chains;
}

function escapeHtml(s) {
  if (s == null) return "";
  var d = document.createElement("div");
  d.textContent = String(s);
  return d.innerHTML;
}

function escapeHtmlAttr(s) {
  return escapeHtml(s).replace(/"/g, "&quot;");
}

function initHistoryChangelogs(root) {
  root.querySelectorAll(".history-changelog[data-changelog-url]").forEach(function (el) {
    if (el.getAttribute("data-changelog-loaded")) return;
    var url = el.getAttribute("data-changelog-url");
    if (!url) return;
    el.setAttribute("data-changelog-loaded", "1");
    el.classList.add("loading");
    el.innerHTML =
      '<span class="changelog-loading-text">加载更新日志…</span>';
    fetch(url, { mode: "cors" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      })
      .then(function (text) {
        el.classList.remove("loading");
        el.innerHTML = "";
        var wrap = document.createElement("div");
        wrap.className = "changelog-md-wrap";
        var md = document.createElement("div");
        md.className = "changelog-md";
        try {
          var parse =
            typeof marked !== "undefined" && marked.parse
              ? marked.parse.bind(marked)
              : null;
          if (!parse) throw new Error("marked 未加载");
          md.innerHTML = parse(text, { breaks: true });
        } catch (err) {
          md.textContent = text;
        }
        wrap.appendChild(md);
        var link = document.createElement("a");
        link.className = "changelog-open-link";
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "在浏览器中打开原文";
        wrap.appendChild(link);
        el.appendChild(wrap);
      })
      .catch(function () {
        el.classList.remove("loading");
        el.innerHTML = "";
        var msg = document.createElement("p");
        msg.className = "changelog-err-msg";
        msg.textContent =
          "无法加载更新日志（可能受跨域限制）。请尝试在浏览器中打开原文。";
        el.appendChild(msg);
        var link = document.createElement("a");
        link.className = "changelog-open-link";
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "打开原文链接";
        el.appendChild(link);
      });
  });
}

var addons = [];
var grid = document.getElementById("grid");
var countEl = document.getElementById("count");
var qInput = document.getElementById("q");
var loadError = document.getElementById("load-error");
var overlay = document.getElementById("overlay");
var drawer = document.getElementById("drawer");
var drawerClose = document.getElementById("drawer-close");
var detailIcon = document.getElementById("detail-icon");
var detailTitle = document.getElementById("detail-title");
var detailSub = document.getElementById("detail-sub");
var detailBody = document.getElementById("detail-body");
var tagBarWrap = document.getElementById("tag-bar-wrap");
var tagBar = document.getElementById("tag-bar");

/** null 表示未选标签（显示全部） */
var selectedTagFilter = null;

function logoUrl(a) {
  return a.logo || a.globalLogo || "";
}

/** 界面展示的扩展 id：有 fullId 用 fullId，否则 marginnote.extension.{短 id} */
function extensionDisplayId(addon) {
  if (addon.fullId) return String(addon.fullId);
  var sid = addon.id || "";
  if (!sid) return "";
  return "marginnote.extension." + sid;
}

function normalizeTags(addon) {
  var t = addon.tags;
  if (!Array.isArray(t)) return [];
  return t
    .map(function (x) {
      return String(x).trim();
    })
    .filter(Boolean);
}

function collectAllTagsFromAddons() {
  var map = {};
  addons.forEach(function (a) {
    normalizeTags(a).forEach(function (t) {
      map[t] = true;
    });
  });
  return Object.keys(map).sort(function (a, b) {
    return a.localeCompare(b, "zh-Hans");
  });
}

function addonMatchesTagFilter(a) {
  if (selectedTagFilter == null || selectedTagFilter === "") return true;
  return normalizeTags(a).indexOf(selectedTagFilter) !== -1;
}

function addonMatchesQuery(a, query) {
  var q = (query || "").trim().toLowerCase();
  if (!q) return true;
  var name = (a.name || "").toLowerCase();
  var author = (a.author || "").toLowerCase();
  var id = (a.id || "").toLowerCase();
  var fullId = (a.fullId || "").toLowerCase();
  var disp = extensionDisplayId(a).toLowerCase();
  var summary = (a.summary || "").toLowerCase();
  var tagsStr = normalizeTags(a).join(" ").toLowerCase();
  return (
    name.indexOf(q) !== -1 ||
    author.indexOf(q) !== -1 ||
    id.indexOf(q) !== -1 ||
    fullId.indexOf(q) !== -1 ||
    disp.indexOf(q) !== -1 ||
    summary.indexOf(q) !== -1 ||
    tagsStr.indexOf(q) !== -1
  );
}

/** 首次构建全部卡片；搜索只改 hidden，避免反复销毁 img 造成 logo 闪烁 */
function buildGridFromAddons() {
  grid.innerHTML = "";
  var frag = document.createDocumentFragment();
  addons.forEach(function (a, idx) {
    var card = document.createElement("div");
    card.className = "card";
    card.setAttribute("role", "listitem");
    card.setAttribute("data-addon-idx", String(idx));
    var logo = logoUrl(a);

    var badge = document.createElement("span");
    badge.className = "badge badge-card-corner";
    badge.textContent = "v" + String(a.version || "").replace(/^v/i, "");
    card.appendChild(badge);

    var main = document.createElement("button");
    main.type = "button";
    main.className = "card-main";
    main.setAttribute(
      "aria-label",
      "查看详情：" + (a.name || "插件")
    );

    if (logo) {
      var img = document.createElement("img");
      img.className = "card-icon";
      img.alt = a.name || "插件图标";
      img.loading = "lazy";
      img.decoding = "async";
      img.src = logo;
      img.onerror = function () {
        img.remove();
      };
      main.appendChild(img);
    }

    var body = document.createElement("div");
    body.className = "card-body";
    var h3 = document.createElement("h3");
    h3.className = "card-title";
    h3.textContent = a.name || "(未命名)";
    var p = document.createElement("p");
    p.className = "card-meta";
    p.textContent = a.author || "未知作者";
    body.appendChild(h3);
    body.appendChild(p);
    main.appendChild(body);

    main.addEventListener("click", function () {
      openDetail(addons[idx]);
    });
    card.appendChild(main);

    var sum = (a.summary || "").trim();
    var sumEl = document.createElement("p");
    sumEl.className =
      "card-summary" + (sum ? "" : " card-summary-empty");
    sumEl.textContent = sum || "无描述";
    card.appendChild(sumEl);

    var tags = normalizeTags(a);
    if (tags.length) {
      var tagsWrap = document.createElement("div");
      tagsWrap.className = "card-tags-wrap";
      tagsWrap.setAttribute("aria-label", "标签");
      var tagsScroll = document.createElement("div");
      tagsScroll.className = "card-tags-scroll";
      tagsScroll.setAttribute("role", "list");
      tags.forEach(function (tag) {
        var pill = document.createElement("span");
        pill.className = "tag-pill";
        pill.setAttribute("role", "listitem");
        pill.textContent = tag;
        tagsScroll.appendChild(pill);
      });
      tagsWrap.appendChild(tagsScroll);
      card.appendChild(tagsWrap);
    }

    var footer = document.createElement("div");
    footer.className = "card-footer";
    footer.innerHTML = buildAddonActionBarHtml(a);
    card.appendChild(footer);

    frag.appendChild(card);
  });
  grid.appendChild(frag);
}

function updateTagBarActive() {
  if (!tagBar) return;
  tagBar.querySelectorAll(".tag-filter-chip").forEach(function (chip) {
    var raw = chip.getAttribute("data-tag");
    var t = raw === null || raw === "" ? null : raw;
    var active =
      (selectedTagFilter === null && t === null) ||
      selectedTagFilter === t;
    chip.classList.toggle("is-active", active);
    chip.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function buildTagBar() {
  if (!tagBar || !tagBarWrap) return;
  tagBar.innerHTML = "";
  var tags = collectAllTagsFromAddons();
  if (tags.length === 0) {
    tagBarWrap.hidden = true;
    return;
  }
  tagBarWrap.hidden = false;

  function addChip(label, tagValue) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "tag-filter-chip";
    b.setAttribute("data-tag", tagValue);
    b.setAttribute("aria-pressed", "false");
    b.textContent = label;
    tagBar.appendChild(b);
  }

  addChip("全部", "");
  tags.forEach(function (t) {
    addChip(t, t);
  });
  updateTagBarActive();
}

function applySearchFilter() {
  var q = qInput.value;
  var cards = grid.querySelectorAll(".card[data-addon-idx]");
  var total = cards.length;
  var shown = 0;
  for (var i = 0; i < cards.length; i++) {
    var btn = cards[i];
    var idx = parseInt(btn.getAttribute("data-addon-idx"), 10);
    var a = addons[idx];
    if (!a) continue;
    var match = addonMatchesQuery(a, q) && addonMatchesTagFilter(a);
    btn.hidden = !match;
    if (match) shown++;
  }
  var noText = !q.trim();
  var noTag = selectedTagFilter == null || selectedTagFilter === "";
  if ((noText && noTag) || shown === total) {
    countEl.textContent = "共 " + total + " 个插件";
  } else {
    countEl.textContent = "显示 " + shown + " / " + total + " 个插件";
  }
}

function openDetail(a) {
  var logo = logoUrl(a);
  if (logo) {
    detailIcon.alt = (a.name || "插件") + " 图标";
    detailIcon.onerror = function () {
      detailIcon.hidden = true;
      detailIcon.removeAttribute("src");
    };
    detailIcon.hidden = false;
    detailIcon.src = logo;
  } else {
    detailIcon.hidden = true;
    detailIcon.removeAttribute("src");
  }

  detailTitle.textContent = a.name || "(未命名)";
  var dispId = extensionDisplayId(a);
  detailSub.textContent =
    (a.author || "未知作者") +
    " · v" +
    String(a.version || "").replace(/^v/i, "");

  var parts = [];

  parts.push('<div class="detail-section">');
  parts.push(
    '<div class="detail-row"><strong>id：</strong>' +
    escapeHtml(dispId || "—") +
    "</div>"
  );
  parts.push("</div>");

  var sumText = (a.summary || "").trim();
  parts.push('<div class="detail-section">');
  parts.push("<h3>摘要</h3>");
  parts.push(
    '<p class="detail-summary-text' +
      (sumText ? "" : " detail-summary-empty") +
      '">' +
      escapeHtml(sumText || "无描述") +
      "</p>"
  );
  parts.push("</div>");

  var detailTags = normalizeTags(a);
  if (detailTags.length) {
    parts.push('<div class="detail-section">');
    parts.push("<h3>标签</h3>");
    parts.push('<div class="detail-tags-wrap">');
    parts.push('<div class="detail-tags-scroll" role="list">');
    detailTags.forEach(function (tag) {
      parts.push(
        '<span class="tag-pill" role="listitem">' +
          escapeHtml(tag) +
          "</span>"
      );
    });
    parts.push("</div></div></div>");
  }

  if (a.description) {
    parts.push('<div class="detail-section detail-section-doc">');
    parts.push("<h3>说明</h3>");
    parts.push('<div class="detail-doc-block">');
    parts.push(
      '<a class="btn-secondary detail-doc-btn" href="' +
      escapeHtmlAttr(a.description) +
      '" target="_blank" rel="noopener noreferrer">打开插件文档</a>'
    );
    parts.push("</div></div>");
  }

  if (a.urlToParse && a.urlToParse !== a.description) {
    parts.push('<div class="detail-section">');
    parts.push("<h3>解析</h3>");
    parts.push('<div class="link-list">');
    parts.push(
      '<a href="' +
      escapeHtml(a.urlToParse) +
      '" target="_blank" rel="noopener noreferrer">相关页面</a>'
    );
    parts.push("</div></div>");
  }

  parts.push('<div class="detail-section">');
  parts.push("<h3>获取</h3>");
  (function () {
    var chains = buildAddonChains(a);
    if (chains.length === 0) {
      parts.push('<p class="detail-row">暂无直接下载链接</p>');
      return;
    }
    var canInst = wantsInstall(a) && hasInstallFn();
    if (canInst) {
      parts.push('<div class="acquire-block acquire-block-install">');
      parts.push('<h4 class="acquire-block-title">安装</h4>');
      parts.push('<div class="acquire-block-actions">');
      chains.forEach(function (c, idx) {
        var btnClass =
          idx === 0 ? "btn-primary btn-install" : "btn-secondary btn-install";
        parts.push(
          '<a class="' +
          btnClass +
          '" href="' +
          escapeHtmlAttr(generateAddonInstallUrl(c.u)) +
          '">安装（' +
          escapeHtml(c.label) +
          "）</a>"
        );
      });
      parts.push("</div></div>");
    }
    parts.push('<div class="acquire-block acquire-block-download">');
    parts.push('<h4 class="acquire-block-title">下载</h4>');
    parts.push('<div class="acquire-block-actions">');
    chains.forEach(function (c, idx) {
      var btnClass = idx === 0 ? "btn-primary" : "btn-secondary";
      parts.push(
        '<a class="' +
        btnClass +
        '" href="' +
        escapeHtml(c.u) +
        '" download rel="noopener">下载（' +
        escapeHtml(c.label) +
        "）</a>"
      );
    });
    parts.push("</div></div>");
  })();
  parts.push("</div>");

  if (a.history && a.history.length) {
    parts.push('<div class="detail-section">');
    parts.push(
      '<details class="history-block"><summary>历史版本（' +
      a.history.length +
      "）</summary>"
    );
    parts.push('<div class="history-inner">');
    a.history.forEach(function (h) {
      parts.push('<div class="history-item">');
      parts.push(
        '<div class="history-ver">v' +
        escapeHtml(String(h.version || "").replace(/^v/i, "")) +
        "</div>"
      );
      if (h.changeLogUrl) {
        parts.push(
          '<div class="history-changelog" data-changelog-url="' +
          escapeHtmlAttr(h.changeLogUrl) +
          '"></div>'
        );
      }
      (function () {
        var hChains = buildHistoryChains(h);
        if (hChains.length === 0) {
          parts.push("</div>");
          return;
        }
        var canInst = wantsInstall(a) && hasInstallFn();
        parts.push('<div class="history-links-group">');
        if (canInst) {
          parts.push(
            '<div class="history-chain history-chain-install"><span class="history-chain-label">安装</span><div class="history-chain-btns">'
          );
          hChains.forEach(function (c) {
            parts.push(
              '<a class="history-install" href="' +
              escapeHtmlAttr(generateAddonInstallUrl(c.u)) +
              '" rel="noopener">' +
              escapeHtml(c.label) +
              "</a>"
            );
          });
          parts.push("</div></div>");
        }
        parts.push(
          '<div class="history-chain history-chain-download"><span class="history-chain-label">下载</span><div class="history-chain-btns">'
        );
        hChains.forEach(function (c) {
          parts.push(
            '<a href="' +
            escapeHtml(c.u) +
            '" download rel="noopener">' +
            escapeHtml(c.label) +
            "</a>"
          );
        });
        parts.push("</div></div></div></div>");
      })();
    });
    parts.push("</div></details></div>");
  }

  detailBody.innerHTML = parts.join("");
  initHistoryChangelogs(detailBody);
  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  drawerClose.focus();
}

function closeDetail() {
  overlay.classList.remove("open");
  overlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

overlay.addEventListener("click", function (e) {
  if (e.target === overlay) closeDetail();
});

drawerClose.addEventListener("click", closeDetail);

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && overlay.classList.contains("open")) {
    closeDetail();
  }
});

qInput.addEventListener("input", applySearchFilter);

if (tagBarWrap && tagBar) {
  tagBarWrap.addEventListener("click", function (e) {
    var chip = e.target.closest(".tag-filter-chip");
    if (!chip || !tagBar.contains(chip)) return;
    var raw = chip.getAttribute("data-tag");
    selectedTagFilter = raw === null || raw === "" ? null : raw;
    updateTagBarActive();
    applySearchFilter();
  });
}

fetch("https://1836303614.v.123pan.cn/1836303614/dl/mnaddonStore/mnaddon.json")
  .then(function (r) {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  })
  .then(function (data) {
    if (!Array.isArray(data)) throw new Error("数据格式应为数组");
    addons = data;
    loadError.classList.remove("visible");
    loadError.textContent = "";
    buildGridFromAddons();
    buildTagBar();
    applySearchFilter();
  })
  .catch(function (err) {
    loadError.classList.add("visible");
    loadError.textContent =
      "无法加载 mnaddon.json：" +
      (err && err.message ? err.message : String(err)) +
      "。请使用本地 HTTP 服务打开本页面（见上方说明）。";
    countEl.textContent = "";
  });