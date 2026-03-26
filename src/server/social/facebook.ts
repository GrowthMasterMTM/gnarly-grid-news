/**
 * Facebook Graph API posting service.
 *
 * Required env vars:
 * - FACEBOOK_PAGE_ID
 * - FACEBOOK_PAGE_TOKEN
 *
 * Posts to /{page-id}/feed via Graph API v19.0
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
  error: string | null;
}

export async function publishToFacebook(
  post: SocialPost
): Promise<FacebookPostResult> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const token = process.env.FACEBOOK_PAGE_TOKEN;

  if (!pageId || !token) {
    return {
      success: false,
      postId: null,
      error: "Facebook not configured (missing FACEBOOK_PAGE_ID or FACEBOOK_PAGE_TOKEN)",
    };
  }

  try {
    const body: Record<string, string> = {
      message: post.text,
      access_token: token,
    };

    if (post.link) {
      body.link = post.link;
    }

    const response = await fetch(`${GRAPH_API}/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as {
      id?: string;
      error?: { message: string };
    };

    if (!response.ok || data.error) {
      return {
        success: false,
        postId: null,
        error: data.error?.message ?? `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      postId: data.id ?? null,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      postId: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
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
