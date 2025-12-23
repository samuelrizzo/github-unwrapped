import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import type { Request, Response } from "express";
import { existsSync, mkdirSync } from "fs";
import { ObjectId } from "mongodb";
import path from "path";
import type { z } from "zod";
import type { RenderResponse, compositionSchema } from "../config.js";
import {
  RenderRequest,
  computeCompositionParameters,
} from "../config.js";
import type { Render } from "./db.js";
import {
  findRender,
  getProfileStatsFromCache,
  saveRender,
  updateRender,
} from "./db.js";
import { makeOrGetIgStory, makeOrGetOgImage } from "./make-og-image.js";
import {
  addRenderInProgress,
  getRenderInProgress,
  removeRenderInProgress,
} from "./render-pool.js";

const OUTPUT_DIR = path.join(process.cwd(), "public", "output");

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Bundle cache to avoid re-bundling on each render
let bundledPromise: Promise<string> | null = null;

const getBundled = async () => {
  if (!bundledPromise) {
    bundledPromise = bundle({
      entryPoint: path.join(process.cwd(), "remotion", "index.ts"),
      onProgress: (progress) => {
        console.log(`Bundling: ${Math.round(progress * 100)}%`);
      },
    });
  }
  return bundledPromise;
};

export const renderOrGetProgress = async (
  requestBody: unknown,
): Promise<RenderResponse> => {
  const { username, theme } = RenderRequest.parse(requestBody);
  const exists = getRenderInProgress({
    username: username.toLowerCase(),
    theme,
  });

  // Check if a completed render already exists
  const existingRender = await findRender({
    username,
    theme,
  });

  if (existingRender) {
    if (existingRender.finality) {
      if (existingRender.finality.type === "success") {
        return {
          type: "video-available",
          url: existingRender.finality.url,
        };
      }

      return {
        type: "render-error",
        error: existingRender.finality.errors,
      };
    }
  }

  // If already rendering, return progress
  if (exists) {
    return {
      type: "render-running",
      progress: 0.5, // Estimated progress
    };
  }

  // Mark as in progress
  addRenderInProgress({ theme, username: username.toLowerCase() });

  const _id = new ObjectId();

  const userStat = await getProfileStatsFromCache(username);
  if (userStat === "not-found") {
    removeRenderInProgress({ username: username.toLowerCase(), theme });
    return {
      type: "render-error",
      error: "User not found",
    };
  }

  if (userStat === null) {
    removeRenderInProgress({ username: username.toLowerCase(), theme });
    return {
      type: "render-error",
      error: "User not fetched",
    };
  }

  const inputProps: z.infer<typeof compositionSchema> =
    computeCompositionParameters(userStat, theme);

  // Start background render
  renderVideoLocally(username, theme, inputProps, _id).catch((err) => {
    console.error("Render error:", err);
  });

  // Generate OG/IG images in parallel
  Promise.all([
    makeOrGetOgImage(userStat),
    makeOrGetIgStory(userStat),
  ]).catch((err) => {
    console.error("Image generation error:", err);
  });

  return {
    type: "render-running",
    progress: 0,
  };
};

async function renderVideoLocally(
  username: string,
  theme: string,
  inputProps: z.infer<typeof compositionSchema>,
  _id: ObjectId,
) {
  const outputFileName = `unwrapped-${username.toLowerCase()}-${theme}.mp4`;
  const outputPath = path.join(OUTPUT_DIR, outputFileName);
  const outputUrl = `/output/${outputFileName}`;

  // Create initial database record
  const newRender: Render = {
    region: "local" as any,
    bucketName: "local",
    renderId: _id.toString(),
    username: username.toLowerCase(),
    functionName: "local",
    theme: theme as any,
    account: 0,
    finality: null,
  };

  await saveRender(newRender, _id);

  try {
    console.log(`Starting local render for ${username}...`);

    const bundled = await getBundled();

    const composition = await selectComposition({
      serveUrl: bundled,
      id: "Main",
      inputProps,
    });

    await renderMedia({
      composition,
      serveUrl: bundled,
      codec: "h264",
      outputLocation: outputPath,
      inputProps,
      onProgress: ({ progress }) => {
        console.log(`Rendering ${username}: ${Math.round(progress * 100)}%`);
      },
    });

    console.log(`Render complete for ${username}: ${outputPath}`);

    // Update render with success
    await updateRender({
      ...newRender,
      finality: {
        type: "success",
        url: outputUrl,
        outputSize: 0,
        reportedCost: 0,
      },
    });
  } catch (error) {
    console.error(`Render failed for ${username}:`, error);

    // Update render with error
    await updateRender({
      ...newRender,
      finality: {
        type: "error",
        errors: (error as Error).message,
      },
    });
  } finally {
    removeRenderInProgress({ username: username.toLowerCase(), theme: theme as any });
  }
}

export const renderEndPoint = async (request: Request, response: Response) => {
  if (request.method === "OPTIONS") {
    return response.end();
  }

  const res = await renderOrGetProgress(request.body);

  return response.json(res);
};
