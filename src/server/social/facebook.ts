/**
 * Facebook Graph API posting service.
 *
 * Strategy: Post via /{page-id}/photos (image + caption) for maximum reach,
 * then drop the link as the first comment. Facebook's algorithm penalises
 * outbound links in the main post — putting it in the comment keeps reach
 * high while still driving traffic.
 *
 * Required env vars:
 * - FACEBOOK_PAGE_ID
 * - FACEBOOK_PAGE_TOKEN
 */

import type { SocialPost } from "./content-generator";

const GRAPH_API = "https://graph.facebook.com/v19.0";

export function isFacebookConfigured(): boolean {
  return Boolean(
    process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_TOKEN
  );
}

export interface FacebookPostResult {
  success: boolean;
  postId: string | null;
  commentId: string | null;
  error: string | null;
}

/**
 * Post an image with caption, then add the link as a comment.
 * Falls back to a text-only /feed post if no image is available.
 */
export async function publishToFacebook(
  post: SocialPost
): Promise<FacebookPostResult> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const token = process.env.FACEBOOK_PAGE_TOKEN;

  if (!pageId || !token) {
    return {
      success: false,
      postId: null,
      commentId: null,
      error: "Facebook not configured (missing FACEBOOK_PAGE_ID or FACEBOOK_PAGE_TOKEN)",
    };
  }

  try {
    let postId: string;

    if (post.imageUrl) {
      // Post via /photos — image + caption (no link in main post)
      const body = {
        url: post.imageUrl,
        message: post.text,
        access_token: token,
      };

      const res = await fetch(`${GRAPH_API}/${pageId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as {
        id?: string;
        post_id?: string;
        error?: { message: string };
      };

      if (!res.ok || data.error) {
        return {
          success: false,
          postId: null,
          commentId: null,
          error: data.error?.message ?? `HTTP ${res.status}`,
        };
      }

      // /photos returns `post_id` (the feed post) and `id` (the photo object)
      postId = data.post_id ?? data.id ?? "";
    } else {
      // Fallback: text-only post via /feed
      const body = {
        message: post.text,
        access_token: token,
      };

      const res = await fetch(`${GRAPH_API}/${pageId}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as {
        id?: string;
        error?: { message: string };
      };

      if (!res.ok || data.error) {
        return {
          success: false,
          postId: null,
          commentId: null,
          error: data.error?.message ?? `HTTP ${res.status}`,
        };
      }

      postId = data.id ?? "";
    }

    // Drop the link as first comment to drive traffic without hurting reach
    let commentId: string | null = null;
    if (post.link && postId) {
      commentId = await addLinkComment(postId, post.link, token);
    }

    return {
      success: true,
      postId,
      commentId,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      postId: null,
      commentId: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Add a comment with the link to the post.
 * Returns the comment ID or null on failure.
 */
async function addLinkComment(
  postId: string,
  link: string,
  token: string
): Promise<string | null> {
  try {
    const res = await fetch(`${GRAPH_API}/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Full story \u2192 ${link}`,
        access_token: token,
      }),
    });

    const data = (await res.json()) as {
      id?: string;
      error?: { message: string };
    };

    return data.id ?? null;
  } catch {
    // Non-critical — post is already live
    return null;
  }
}

export async function publishMultiple(
  posts: SocialPost[],
  delayMs: number = 5000
): Promise<FacebookPostResult[]> {
  const results: FacebookPostResult[] = [];

  for (const post of posts) {
    const result = await publishToFacebook(post);
    results.push(result);

    if (results.length < posts.length) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return results;
}
