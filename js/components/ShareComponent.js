import { ballotAsText } from './BallotModalComponent.js?v=2';

/**
 * Social sharing. Only X/Twitter has a reliable web "intent" URL that
 * accepts pre-filled free text. Facebook's sharer.php has ignored custom
 * quote text since ~2018 (anti-spam) and only takes a URL, and Instagram
 * has no web share-intent URL at all — for both of those we copy the
 * ballot text to the clipboard so the user can paste it themselves (into
 * Facebook's comment box, or an Instagram Story/bio/DM), and use the
 * native Web Share API when available so mobile users can hand the text
 * straight to the Instagram app via the OS share sheet instead.
 */

function shareText(markingService) {
  const { text } = ballotAsText(markingService);
  return text;
}

export function canNativeShare() {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export function shareToTwitter(markingService) {
  const text = shareText(markingService);
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
}

export function shareToFacebook(markingService, toast) {
  // window.open() must run synchronously, in the same tick as the click, or
  // Safari/iOS (and Chrome's stricter heuristics) drop the "user activation"
  // flag and silently block the popup — that's what broke this: the old
  // version awaited navigator.clipboard.writeText() first, which pushed
  // window.open() a tick later and got it treated as an unrequested popup.
  const pageUrl = window.location.href;
  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
  window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');

  const text = shareText(markingService);
  navigator.clipboard
    .writeText(text)
    .then(() => toast.show('הפתק הועתק ללוח — הדביקו אותו בתיבת השיתוף שנפתחת בפייסבוק'))
    .catch(() => toast.show('פותח פייסבוק לשיתוף...'));
}

export async function shareToInstagram(markingService, toast) {
  const text = shareText(markingService);

  if (canNativeShare()) {
    try {
      await navigator.share({ title: 'פתק ההצבעה שלי — פריימריז הליכוד 2026', text, url: window.location.href });
      return;
    } catch (e) {
      // user cancelled the native share sheet, or it isn't fully supported — fall through to clipboard
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    toast.show('הפתק הועתק ללוח — פתחו את אינסטגרם והדביקו בסטורי, בביו או בהודעה');
  } catch (e) {
    toast.show('אינסטגרם לא תומכת בשיתוף ישיר מהדפדפן — העתיקו את הפתק ידנית מלמעלה');
  }
}

export async function shareNative(markingService, toast) {
  const text = shareText(markingService);
  try {
    await navigator.share({ title: 'פתק ההצבעה שלי — פריימריז הליכוד 2026', text, url: window.location.href });
  } catch (e) {
    // user cancelled — no toast needed
  }
}
