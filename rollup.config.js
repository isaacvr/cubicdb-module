import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

export default [
  // CommonJS (Node.js tradicional)
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.cjs",
      format: "cjs"
    },
    plugins: [typescript()]
  },

  // ESM (Node moderno, bundlers)
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.esm.js",
      format: "esm"
    },
    plugins: [typescript()]
  },

  // UMD (para navegador con <script>)
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.umd.js",
      format: "umd",
      name: "CDBModule"
    },
    plugins: [typescript(), terser()]
  }
];
