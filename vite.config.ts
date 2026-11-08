import { defineConfig } from "vite";
import vinext from "vinext";
import mdx from "@mdx-js/rollup";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
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
