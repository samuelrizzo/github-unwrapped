import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import type { z } from "zod";
import type { ProfileStats, ogImageSchema } from "../config.js";
import { parseTopLanguage } from "../config.js";
import { getIgStory, getOgImage, saveIgStory, saveOgImage } from "./db.js";

const OUTPUT_DIR = path.join(process.cwd(), "public", "output");
const OG_DIR = path.join(OUTPUT_DIR, "og");
const IG_DIR = path.join(OUTPUT_DIR, "ig");

// Ensure directories exist
[OUTPUT_DIR, OG_DIR, IG_DIR].forEach((dir) => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

// Bundle cache to avoid re-bundling on each render
let bundledPromise: Promise<string> | null = null;

const getBundled = async () => {
  if (!bundledPromise) {
    bundledPromise = bundle({
      entryPoint: path.join(process.cwd(), "remotion", "index.ts"),
      onProgress: (progress) => {
        console.log(`Bundling for images: ${Math.round(progress * 100)}%`);
      },
    });
  }
  return bundledPromise;
};

export const makeOrGetOgImage = async (profileStats: ProfileStats) => {
  const ogImage = await getOgImage(profileStats.username);
  if (ogImage) {
    return ogImage.url;
  }

  const schema: z.infer<typeof ogImageSchema> = {
    pullRequests: profileStats.totalPullRequests,
    contributionData: profileStats.contributionData,
    issues: profileStats.closedIssues,
    login: profileStats.username,
    stars: profileStats.totalStars,
    topLanguage: profileStats.topLanguages[0]
      ? parseTopLanguage(profileStats.topLanguages[0])
      : null,
    weekdays: profileStats.allWeekdays,
    longestStreak: profileStats.longestStreak,
    totalContributions: profileStats.totalContributions,
  };

  try {
    const bundled = await getBundled();
    const outputFileName = `${profileStats.username.toLowerCase()}.jpg`;
    const outputPath = path.join(OG_DIR, outputFileName);
    const outputUrl = `/output/og/${outputFileName}`;

    const composition = await selectComposition({
      serveUrl: bundled,
      id: "og-image",
      inputProps: schema,
    });

    await renderStill({
      composition,
      serveUrl: bundled,
      output: outputPath,
      inputProps: schema,
      imageFormat: "jpeg",
      jpegQuality: 100,
    });

    await saveOgImage({ url: outputUrl, username: profileStats.username });

    return outputUrl;
  } catch (error) {
    console.error("Error generating OG image:", error);
    throw error;
  }
};

export const makeOrGetIgStory = async (profileStats: ProfileStats) => {
  const igStory = await getIgStory(profileStats.username);
  if (igStory) {
    return igStory.url;
  }

  const schema: z.infer<typeof ogImageSchema> = {
    pullRequests: profileStats.totalPullRequests,
    contributionData: profileStats.contributionData,
    issues: profileStats.closedIssues,
    login: profileStats.username,
    stars: profileStats.totalStars,
    topLanguage: profileStats.topLanguages[0]
      ? parseTopLanguage(profileStats.topLanguages[0])
      : null,
    weekdays: profileStats.allWeekdays,
    longestStreak: profileStats.longestStreak,
    totalContributions: profileStats.totalContributions,
  };

  try {
    const bundled = await getBundled();
    const outputFileName = `${profileStats.username.toLowerCase()}.jpg`;
    const outputPath = path.join(IG_DIR, outputFileName);
    const outputUrl = `/output/ig/${outputFileName}`;

    const composition = await selectComposition({
      serveUrl: bundled,
      id: "ig-story",
      inputProps: schema,
    });

    await renderStill({
      composition,
      serveUrl: bundled,
      output: outputPath,
      inputProps: schema,
      imageFormat: "jpeg",
      jpegQuality: 100,
    });

    await saveIgStory({ url: outputUrl, username: profileStats.username });

    return outputUrl;
  } catch (error) {
    console.error("Error generating IG story:", error);
    throw error;
  }
};
