import { defineConfig } from "vite";
import vinext from "vinext";
import mdx from "@mdx-js/rollup";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import rehypeShiki from "@shikijs/rehype";
import { cloudflare } from "@cloudflare/vite-plugin";
import { imagesOptimizer } from "@vinext/cloudflare/images/images-optimizer";

export default defineConfig({
  plugins: [
    // MDX must run before vinext so vinext sees plain JS/JSX modules.
    {
      enforce: "pre",
      ...mdx({
        remarkPlugins: [
          remarkFrontmatter,
          // Exposes the YAML block as `export const frontmatter = {...}`,
          // which is what lib/questions.ts globs for the index.
          [remarkMdxFrontmatter, { name: "frontmatter" }],
        ],
        rehypePlugins: [
          [
            rehypeShiki,
            {
              themes: { light: "github-light", dark: "github-dark" },
              // Emits `color: light-dark(#light, #dark)` on every token, so the
              // theme follows prefers-color-scheme with no JavaScript and no
              // class toggling. Highlighting happens at build time, so the
              // Worker ships plain HTML and never loads Shiki at runtime.
              defaultColor: "light-dark()",
              // Only the languages the questions actually use. The default
              // bundles every grammar Shiki ships, which slows the build for
              // no benefit.
              langs: ["cpp", "rust", "text", "bash", "json", "yaml"],
            },
          ],
        ],
      }),
    },
    vinext({
      images: { optimizer: imagesOptimizer() },
    }),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
