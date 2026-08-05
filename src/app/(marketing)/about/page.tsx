"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <section className="pt-24 pb-12 md:pt-32 md:pb-16 bg-muted/30">
        <motion.div 
          className="container mx-auto px-4 max-w-4xl text-center"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.h1 variants={fadeIn} className="text-4xl md:text-5xl font-bold tracking-tight mb-6">About Us</motion.h1>
          <motion.p variants={fadeIn} className="text-xl text-muted-foreground">
            Building the next generation of intelligent compliance tooling.
          </motion.p>
        </motion.div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <motion.div 
          className="container mx-auto px-4 max-w-3xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
        >
          <div className="prose prose-lg dark:prose-invert mx-auto">
            <motion.h2 variants={fadeIn} className="text-3xl font-bold mb-6 text-center">Our Mission</motion.h2>
            <motion.p variants={fadeIn} className="text-xl leading-relaxed text-center mb-12">
              Legal review shouldn't be a bottleneck. Compli exists to empower legal and compliance teams to review contracts and documents against internal policies in a fraction of the time, without compromising on thoroughness or accuracy.
            </motion.p>
            
            <motion.h3 variants={fadeIn} className="text-2xl font-bold mt-16 mb-6">Why we built Compli</motion.h3>
            <motion.p variants={fadeIn}>
              We saw firsthand how manual contract review leads to missed clauses, compliance gaps, and significant organizational risk. Generic AI tools lack the specific contextual grounding needed for strict legal compliance, often hallucinating answers or failing to cite their sources.
            </motion.p>
            <motion.p variants={fadeIn}>
              Compli was built as a grounded, context-aware RAG (Retrieval-Augmented Generation) system specifically designed for reviewers.
            </motion.p>
          </div>
        </motion.div>
      </section>

      {/* Principles */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.h2 
            className="text-3xl font-bold mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Our Principles
          </motion.h2>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeIn} className="bg-background rounded-xl p-8 shadow-sm border transition-all duration-300 hover:-translate-y-2 hover:shadow-lg">
              <h3 className="font-bold text-xl mb-3 flex items-center gap-2">
                <CheckCircle2 className="text-red-600 h-5 w-5" />
                Grounded, not guessed
              </h3>
              <p className="text-muted-foreground">
                Every answer provided by our AI is grounded in your actual uploaded documents and policies. We provide exact citations for every claim.
              </p>
            </motion.div>
            <motion.div variants={fadeIn} className="bg-background rounded-xl p-8 shadow-sm border transition-all duration-300 hover:-translate-y-2 hover:shadow-lg">
              <h3 className="font-bold text-xl mb-3 flex items-center gap-2">
                <CheckCircle2 className="text-red-600 h-5 w-5" />
                Built for reviewers
              </h3>
              <p className="text-muted-foreground">
                We don't aim to replace legal professionals, but to give them superpowers. Our tools handle the tedious first pass, letting experts focus on nuanced risk.
              </p>
            </motion.div>
            <motion.div variants={fadeIn} className="bg-background rounded-xl p-8 shadow-sm border transition-all duration-300 hover:-translate-y-2 hover:shadow-lg">
              <h3 className="font-bold text-xl mb-3 flex items-center gap-2">
                <CheckCircle2 className="text-red-600 h-5 w-5" />
                Security first
              </h3>
              <p className="text-muted-foreground">
                Your data remains yours. We prioritize strict access controls, audit trails, and isolated document scopes to ensure compliance data stays secure.
              </p>
            </motion.div>
            <motion.div variants={fadeIn} className="bg-background rounded-xl p-8 shadow-sm border transition-all duration-300 hover:-translate-y-2 hover:shadow-lg">
              <h3 className="font-bold text-xl mb-3 flex items-center gap-2">
                <CheckCircle2 className="text-red-600 h-5 w-5" />
                Transparent AI
              </h3>
              <p className="text-muted-foreground">
                We believe in white-box AI. When Compli flags a risk, it tells you exactly which policy rule was violated and why.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Band */}
      <section className="py-24 relative overflow-hidden" style={{ backgroundColor: "var(--brand-red, #dc2626)" }}>
        <motion.div 
          className="container mx-auto px-4 text-center relative z-10"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to streamline your compliance?
          </h2>
          <Button size="lg" variant="secondary" className="text-lg px-8 h-14 transition-all hover:scale-105 hover:-translate-y-1 hover:shadow-xl" asChild>
            <Link href="/signup">Get Started Now</Link>
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
