import { WebContainer } from "@webcontainer/api";

let webcontainerInstance: WebContainer | null = null;

export async function getWebContainer() {
  if (!webcontainerInstance) {
    webcontainerInstance = await WebContainer.boot();
  }
  return webcontainerInstance;
}

export function parseFileTreeToWebContainerFormat(fileTree: any) {
  const result: any = {};
  for (const [key, value] of Object.entries(fileTree)) {
    // Assuming value is { file: { contents: "..." } } based on AI response format
    const val = value as any;
    if (val && val.file && typeof val.file.contents === "string") {
      result[key] = {
        file: {
          contents: val.file.contents,
        },
      };
    } else {
      // If it's a directory (future proofing)
      result[key] = {
        directory: parseFileTreeToWebContainerFormat(val),
      };
    }
  }
  return result;
}
