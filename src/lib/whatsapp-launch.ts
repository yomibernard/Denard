export type WhatsAppLaunchHandle = {
  tab: Window | null;
  isMobile: boolean;
};

/**
 * Open a WhatsApp click-to-chat URL reliably after an async enquiry save.
 * Desktop browsers often block window.open() when it is not in the same
 * user-gesture turn as the click — so we open a blank tab synchronously,
 * then navigate it once the URL is ready.
 */
export function prepareWhatsAppLaunch(): WhatsAppLaunchHandle {
  if (typeof window === "undefined") {
    return { tab: null, isMobile: false };
  }
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  if (isMobile) {
    return { tab: null, isMobile: true };
  }
  // Must run synchronously inside the click/submit handler (before await).
  const tab = window.open("about:blank", "denard-whatsapp");
  return { tab, isMobile: false };
}

export function completeWhatsAppLaunch(
  url: string,
  prepared: WhatsAppLaunchHandle,
): { opened: boolean } {
  if (typeof window === "undefined" || !url) return { opened: false };

  if (prepared.isMobile) {
    window.location.assign(url);
    return { opened: true };
  }

  if (prepared.tab && !prepared.tab.closed) {
    try {
      prepared.tab.location.href = url;
      prepared.tab.focus();
      return { opened: true };
    } catch {
      try {
        prepared.tab.close();
      } catch {
        /* ignore */
      }
    }
  }

  const popup = window.open(url, "denard-whatsapp");
  if (popup) {
    popup.focus();
    return { opened: true };
  }

  return { opened: false };
}

export function cancelWhatsAppLaunch(prepared: WhatsAppLaunchHandle) {
  if (prepared.tab && !prepared.tab.closed) {
    try {
      prepared.tab.close();
    } catch {
      /* ignore */
    }
  }
}
