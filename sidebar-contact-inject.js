(() => {
  const GLOBAL_KEY = "__customSidebarContactInjector__";

  if (window[GLOBAL_KEY]) {
    window[GLOBAL_KEY].ensure();
    return;
  }

  const CONTACT_ID = "custom-sidebar-contact";
  const STYLE_ID = "custom-sidebar-contact-style";

  const config = {
    github: "https://github.com/mdddj",
    twitter: "https://x.com/hlx40708255",
    telegram: "https://t.me/hlxstel",
    email: "mailto:hlxsmail@gmail.com",

    // 这里替换成你自己的二维码图片地址；留空就不显示按钮
    wechatQr: "https://minio.itbug.shop/blog/uploads/85e59184-20bd-4195-9afc-d6e09afaecc3.JPG",
    qqQr: "https://minio.itbug.shop/blog/uploads/2683bb27-0bdc-41d6-abb5-e70cb93f2f1a.JPG"
  };

  const icons = {
    github: `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
        <path d="M9 18c-4.51 2-5-2-7-2"></path>
      </svg>
    `,
    twitter: `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
      </svg>
    `,
    telegram: `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path>
        <path d="m21.854 2.147-10.94 10.939"></path>
      </svg>
    `,
    email: `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
        <rect x="2" y="4" width="20" height="16" rx="2"></rect>
      </svg>
    `,
    wechat: `
      <svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor" aria-hidden="true">
        <path d="M690.1 377.4c5.9 0 11.8 0.2 17.6 0.5-24.4-128.7-158.3-227.1-319.9-227.1C209 150.8 64 271.4 64 420.2c0 81.1 43.6 154.2 111.9 203.6 5.5 3.9 9.1 10.3 9.1 17.6 0 2.4-0.5 4.6-1.1 6.9-5.5 20.3-14.2 52.8-14.6 54.3-0.7 2.6-1.7 5.2-1.7 7.9 0 5.9 4.8 10.8 10.8 10.8 2.3 0 4.2-0.9 6.2-2l70.9-40.9c5.3-3.1 11-5 17.2-5 3.2 0 6.4 0.5 9.5 1.4 33.1 9.5 68.8 14.8 105.7 14.8 6 0 11.9-0.1 17.8-0.4-7.1-21-10.9-43.1-10.9-66 0-135.8 132.2-245.8 295.3-245.8z m-194.3-86.5c23.8 0 43.2 19.3 43.2 43.1s-19.3 43.1-43.2 43.1c-23.8 0-43.2-19.3-43.2-43.1s19.4-43.1 43.2-43.1z m-215.9 86.2c-23.8 0-43.2-19.3-43.2-43.1s19.3-43.1 43.2-43.1 43.2 19.3 43.2 43.1-19.4 43.1-43.2 43.1z"></path>
        <path d="M866.7 792.7c56.9-41.2 93.2-102 93.2-169.7 0-124-120.8-224.5-269.9-224.5-149 0-269.9 100.5-269.9 224.5S540.9 847.5 690 847.5c30.8 0 60.6-4.4 88.1-12.3 2.6-0.8 5.2-1.2 7.9-1.2 5.2 0 9.9 1.6 14.3 4.1l59.1 34c1.7 1 3.3 1.7 5.2 1.7 2.4 0 4.7-0.9 6.4-2.6 1.7-1.7 2.6-4 2.6-6.4 0-2.2-0.9-4.4-1.4-6.6-0.3-1.2-7.6-28.3-12.2-45.3-0.5-1.9-0.9-3.8-0.9-5.7 0.1-5.9 3.1-11.2 7.6-14.5zM600.2 587.2c-19.9 0-36-16.1-36-35.9 0-19.8 16.1-35.9 36-35.9s36 16.1 36 35.9c0 19.8-16.2 35.9-36 35.9z m179.9 0c-19.9 0-36-16.1-36-35.9 0-19.8 16.1-35.9 36-35.9s36 16.1 36 35.9c-0.1 19.8-16.2 35.9-36 35.9z"></path>
      </svg>
    `,
    qq: `
      <svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor" aria-hidden="true">
        <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m210.5 612.4c-11.5 1.4-44.9-52.7-44.9-52.7 0 31.3-16.2 72.2-51.1 101.8 16.9 5.2 54.9 19.2 45.9 34.4-7.3 12.3-125.6 7.9-159.8 4-34.2 3.8-152.5 8.3-159.8-4-9.1-15.2 28.9-29.2 45.8-34.4-35-29.5-51.1-70.4-51.1-101.8 0 0-33.4 54.1-44.9 52.7-5.4-0.7-12.4-29.6 9.4-99.7 10.3-33 22-60.5 40.2-105.8-3.1-116.9 45.3-215 160.4-215 113.9 0 163.3 96.1 160.4 215 18.1 45.2 29.9 72.8 40.2 105.8 21.7 70.1 14.6 99.1 9.3 99.7z"></path>
      </svg>
    `
  };

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${CONTACT_ID} {
        margin-top: 12px;
        padding: 12px 10px 14px;
        border-top: 1px solid rgba(127, 127, 127, 0.18);
      }

      #${CONTACT_ID} .contact-title {
        margin: 0 0 8px;
        font-size: 12px;
        line-height: 1;
        color: #888;
      }

      #${CONTACT_ID} .contact-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      #${CONTACT_ID} .contact-btn {
        width: 30px;
        height: 30px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        border: 1px solid rgba(127, 127, 127, 0.18);
        background: rgba(255, 255, 255, 0.04);
        color: inherit;
        text-decoration: none;
        cursor: pointer;
        transition: transform 0.18s ease, border-color 0.18s ease, background-color 0.18s ease;
      }

      #${CONTACT_ID} .contact-btn:hover {
        transform: translateY(-1px);
        border-color: rgba(127, 127, 127, 0.32);
        background: rgba(255, 255, 255, 0.08);
      }

      #${CONTACT_ID} .contact-btn:focus-visible {
        outline: 2px solid rgba(59, 130, 246, 0.65);
        outline-offset: 2px;
      }
    `;
    document.head.appendChild(style);
  }

  function createLinkButton(label, href, iconHtml) {
    const link = document.createElement("a");
    link.className = "contact-btn";
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", label);
    link.innerHTML = iconHtml;
    return link;
  }

  function createActionButton(label, textOrIcon, handler) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "contact-btn";
    button.setAttribute("aria-label", label);
    button.innerHTML = textOrIcon;
    button.addEventListener("click", handler);
    return button;
  }

  function openQr(label, url) {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function buildContactBlock() {
    const wrapper = document.createElement("div");
    wrapper.id = CONTACT_ID;

    const title = document.createElement("p");
    title.className = "contact-title";
    title.textContent = "联系方式";

    const row = document.createElement("div");
    row.className = "contact-row";

    row.appendChild(createLinkButton("GitHub", config.github, icons.github));
    row.appendChild(createLinkButton("Twitter", config.twitter, icons.twitter));
    row.appendChild(createLinkButton("Telegram", config.telegram, icons.telegram));

    if (config.wechatQr) {
      row.appendChild(
        createActionButton("微信二维码", icons.wechat, () => openQr("微信二维码", config.wechatQr))
      );
    }

    if (config.qqQr) {
      row.appendChild(
        createActionButton(
          "QQ二维码",
          icons.qq,
          () => openQr("QQ二维码", config.qqQr)
        )
      );
    }

    row.appendChild(createLinkButton("Email", config.email, icons.email));

    wrapper.appendChild(title);
    wrapper.appendChild(row);
    return wrapper;
  }

  function ensure() {
    injectStyle();

    const aside = document.querySelector("aside.home-aside.home-aside--rail");
    if (!aside) return false;

    if (!aside.querySelector(`#${CONTACT_ID}`)) {
      aside.appendChild(buildContactBlock());
    }

    return true;
  }

  let rafId = 0;
  function scheduleEnsure() {
    if (rafId) return;
    rafId = window.requestAnimationFrame(() => {
      rafId = 0;
      ensure();
    });
  }

  const observer = new MutationObserver(scheduleEnsure);

  function start() {
    ensure();
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    window.addEventListener("hashchange", scheduleEnsure);
    window.addEventListener("popstate", scheduleEnsure);
  }

  function destroy() {
    observer.disconnect();
    document.getElementById(CONTACT_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();
    window.removeEventListener("hashchange", scheduleEnsure);
    window.removeEventListener("popstate", scheduleEnsure);
    delete window[GLOBAL_KEY];
  }

  window[GLOBAL_KEY] = {
    ensure,
    destroy
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
