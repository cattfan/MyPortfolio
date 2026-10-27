// Node resolve hook for the manager's TypeScript test fixtures, which import
// sibling modules without an extension the way Vite allows.
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (error?.code !== "ERR_MODULE_NOT_FOUND" || !/^\.{1,2}\//.test(specifier)) throw error;
    for (const extension of [".ts", ".tsx", "/index.ts"]) {
      try {
        return await nextResolve(specifier + extension, context);
      } catch {}
    }
    throw error;
  }
}
