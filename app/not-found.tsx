import Link from "next/link";

import Header from "@/components/Header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="container">
        <div className="card" style={{ maxWidth: 720, margin: "0 auto" }}>
          <h1 className="sectionTitle">Page not found</h1>
          <p className="muted">The page you’re looking for doesn’t exist.</p>
          <Link className="btn" href="/">
            Go Home
          </Link>
        </div>
      </main>
    </>
  );
}
