import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100svh",
        display: "grid",
        placeContent: "center",
        gap: 20,
        padding: 32,
        textAlign: "center",
      }}
    >
      <p style={{ color: "var(--muted)", fontSize: 12 }}>404</p>
      <h1
        style={{
          fontFamily: "var(--font-book), Georgia, serif",
          fontWeight: 400,
          fontSize: 36,
        }}
      >
        Trang này không tồn tại.
      </h1>
      <p style={{ color: "var(--muted)" }}>Đường dẫn có thể đã thay đổi.</p>
      <Link
        href="/"
        style={{
          color: "var(--earth)",
          textDecoration: "underline",
          textUnderlineOffset: 5,
        }}
      >
        Về trang của Dinh
      </Link>
    </main>
  );
}
