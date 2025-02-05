import { resolve } from "path";
import ModuleData from "./module.json";
import PackageData from "./package.json";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import generateFile from "vite-plugin-generate-file";
import zipPack from "vite-plugin-zip-pack";

// https://vitejs.dev/config/
export default defineConfig({
  // root: "src/", // Source location / esbuild root
  base: `/modules/${ModuleData.id}/`, // Base module path that 30001 / served dev directory.
  // publicDir: resolve(__dirname + "public"), // No public resources to copy.

  resolve: {
    conditions: ["import", "browser"],
    alias: {
      "~": resolve(__dirname + "src")
    }
  },

  esbuild: {
    target: ["es2022"]
  },

  css: {
    // Creates a standard configuration for PostCSS with autoprefixer & postcss-preset-env.
    // postcss: postcssConfig({ compress: s_COMPRESS, sourceMap: s_SOURCEMAPS })
    devSourcemap: true
  },

  define: {
    "process.env": {}
  },

  server: {
    port: 30001,
    proxy: {
      // Serves static files from main Foundry server.
      [`^/(modules/${ModuleData.id}/(images|assets|lang|packs|style\\.css))`]:
        "http://localhost:30000",

      // // All other paths besides package ID path are served from main Foundry server.
      [`^/(?!` +
      [
        `modules/${ModuleData.id}/@vite\\/client`,
        `modules/${ModuleData.id}/@id`,
        `modules/${ModuleData.id}/.*?/env.mjs$`,
        `modules/${ModuleData.id}/node_modules/.vite/.*`,
        `modules/${ModuleData.id}/src/`,
        `/${ModuleData.id}/`
      ].join("|") +
      ")"]: "http://localhost:30000",

      // [`^/modules/${ModuleData.id}/src/`]: {
      //   target: "http://localhost:30001",
      //   rewrite: path => {
      //     return path.replace(`/modules/${ModuleData.id}`, "");
      //   }
      // },

      // Enable socket.io from main Foundry server.
      "/socket.io": { target: "ws://localhost:30000", ws: true }
    }
  },
  preview: {
    port: 30001,
    proxy: {
      // Serves static files from main Foundry server.
      [`^/(modules/${ModuleData.id}/(images|assets|lang|packs|style\\.css))`]:
        "http://localhost:30000",

      // // All other paths besides package ID path are served from main Foundry server.
      [`^/(?!` +
      [
        `modules/${ModuleData.id}/@vite\\/client`,
        `modules/${ModuleData.id}/@id`,
        `modules/${ModuleData.id}/.*?/env.mjs$`,
        `modules/${ModuleData.id}/node_modules/.vite/.*`,
        `modules/${ModuleData.id}/src/`
      ].join("|") +
      ")"]: "http://localhost:30000",

      // [`^/modules/${ModuleData.id}/src/`]: {
      //   target: "http://localhost:30001",
      //   rewrite: path => {
      //     return path.replace(`/modules/${ModuleData.id}`, "");
      //   }
      // },

      // Enable socket.io from main Foundry server.
      "/socket.io": { target: "ws://localhost:30000", ws: true }
    }
  },
  build: {
    outDir: resolve(__dirname + "/dist"),
    emptyOutDir: true,
    sourcemap: "inline",
    // Avoiding minification is important, because we don't want names of globals/etc. to be mangled.
    minify: false,
    target: ["es2022"],
    lib: {
      entry: "./src/sheexcel.js",
      formats: ["es"],
      fileName: "scripts/sheexcel",
      cssFileName: "styles/sheexcel"
    }
  },
  // Necessary when using the dev server for top-level await usage inside of TRL.
  optimizeDeps: {
    esbuildOptions: {
      target: "es2022"
    }
  },
  plugins: [
    vue(),
    tailwindcss(),
    {
      name: "vite-plugin-prebuild",
      buildStart() {
        delete ModuleData.scripts;
        ModuleData.version = PackageData.version;
        ModuleData.esmodules = ["scripts/sheexcel.js"];
        ModuleData.styles = ["styles/sheexcel.css"];
        const downloadUrl =
          "https://github.com/Daedalus11069/foundry-sheexcelrefresh-module/releases/download";
        ModuleData.download = `${downloadUrl}/v${PackageData.version}/sheexcelrefresh_${PackageData.version}.zip`;
      }
    },
    generateFile([
      {
        type: "template",
        template: "src/module.ejs",
        output: "module.json",
        data: { ModuleData }
      }
    ]),
    viteStaticCopy({
      targets: [{ src: "lang", dest: "" }]
    }),
    zipPack({
      inDir: "dist",
      outDir: "dist-zip",
      outFileName: `${ModuleData.id}_${PackageData.version}.zip`
    })
  ]
});
