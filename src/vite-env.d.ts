/// <reference types="vite/client" />

// Typed env vars — without this, every `import.meta.env.VITE_*` read is `any`.
interface ImportMetaEnv {
    readonly VITE_TCMS_API_URL: string;
    readonly VITE_TCMS_API_MOCKING?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
