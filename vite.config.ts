import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  // GitHub Pages phục vụ thư mục docs/ trên nhánh main
  build: { outDir: 'docs', emptyOutDir: true },
})
