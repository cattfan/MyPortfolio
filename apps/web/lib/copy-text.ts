/** Copy during a user gesture, including the temporary HTTP deployment. */
export async function copyText(value: string): Promise<void> {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      /* A denied clipboard permission can still allow gesture-based copying. */
    }
  }
  const focused = document.activeElement as HTMLElement | null;
  const selection = document.getSelection();
  const ranges = selection
    ? Array.from({ length: selection.rangeCount }, (_, i) =>
        selection.getRangeAt(i).cloneRange(),
      )
    : [];
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.readOnly = true;
  textarea.setAttribute("aria-label", "Copy contact");
  Object.assign(textarea.style, {
    position: "fixed",
    left: "0",
    top: "0",
    width: "1px",
    height: "1px",
    opacity: "0",
    fontSize: "16px",
  });
  document.body.appendChild(textarea);
  try {
    textarea.focus({ preventScroll: true });
    textarea.select();
    if (!document.execCommand("copy")) throw new Error("Clipboard unavailable");
  } finally {
    textarea.remove();
    focused?.focus({ preventScroll: true });
    selection?.removeAllRanges();
    ranges.forEach((range) => selection?.addRange(range));
  }
}
