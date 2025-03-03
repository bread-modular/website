import Layout from "../components/Layout";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from './page.module.css';

export const metadata: Metadata = {
  title: "Bread Modular is Launched Now",
  description: "Bread Modular has officially launched. Checkout our modules and documentation.",
  keywords: ["bread modular", "launch", "modular synth", "synthesizer"],
  openGraph: {
    title: "Bread Modular is Launched Now",
    description: "Bread Modular has officially launched. Checkout our modules and documentation.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bread Modular is Launched Now",
    description: "Bread Modular has officially launched. Checkout our modules and documentation.",
  },
};

export default function LaunchDay() {
  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>Bread Modular is Launched Now</h1>
        <Image src="/images/bread-modular-system.jpg" alt="Bread Modular is Launched Now" className={styles.image} width={600} height={400} />
        <div className={styles.buttonContainer}>
          <Link href="/modules" className={styles.button}>Explore Modules</Link>
          <Link href="/docs" className={styles.button}>Read Documentation</Link>
        </div>
      </div>
    </Layout>
  );
} 