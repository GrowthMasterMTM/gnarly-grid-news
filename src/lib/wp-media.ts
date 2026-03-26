/**
 * Shared WordPress media image URL extraction.
 * Used by EnduroGP and SuperEnduro parsers.
 */

interface WpMediaSizes {
  large?: { source_url: string };
  medium_large?: { source_url: string };
  full?: { source_url: string };
}

interface WpFeaturedMedia {
  source_url?: string;
  media_details?: { sizes?: WpMediaSizes };
}

export function selectWpImageUrl(
  embedded?: { "wp:featuredmedia"?: WpFeaturedMedia[] }
): string | null {
  const media = embedded?.["wp:featuredmedia"]?.[0];
  if (!media) return null;

  return (
    media.media_details?.sizes?.large?.source_url ??
    media.media_details?.sizes?.medium_large?.source_url ??
    media.source_url ??
    null
  );
}
