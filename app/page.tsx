import { Hero } from "./components/hero/Hero";
import { Problem } from "./components/problem/Problem";
import { SiteHeader } from "./components/hero/SiteHeader";

export default function Home() {
  return (
    <>
      {/* The site header sits outside <main> so it exposes the banner landmark
       * and its navigation is not duplicated inside the main content. */}
      <SiteHeader />
      <main id="main">
        <Hero />
        <Problem />
      </main>
    </>
  );
}
