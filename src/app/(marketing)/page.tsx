"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Shield, Search, FileText, Zap } from "lucide-react";
import { motion } from "framer-motion";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-12 md:pt-32 md:pb-24">
        <motion.div 
          className="container mx-auto px-4 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.h1 variants={fadeIn} className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-5 max-w-2xl sm:max-w-4xl mx-auto leading-[1.15] text-white">
            Review contracts against your policies in minutes, not days.
          </motion.h1>
          <motion.p variants={fadeIn} className="text-[15px] sm:text-lg text-slate-300/90 mb-8 sm:mb-10 max-w-md sm:max-w-xl mx-auto leading-relaxed">
            Compli uses advanced AI to compare your documents against your organization&apos;s specific policies, instantly surfacing risks and compliance gaps.
          </motion.p>
          <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full">
            <Link href="/signup" className="w-full sm:w-auto flex justify-center">
              <Button size="lg" className="w-full max-w-[260px] sm:max-w-none sm:w-auto text-base font-semibold px-8 h-12 transition-all hover:scale-105 hover:shadow-lg shadow-md rounded-lg" style={{ backgroundColor: "var(--brand-red, #dc2626)", color: "white" }}>
                Get Started Free
              </Button>
            </Link>
            <Link href="/services" className="w-full sm:w-auto flex justify-center">
              <Button size="lg" variant="outline" className="w-full max-w-[260px] sm:max-w-none sm:w-auto text-base font-medium px-8 h-12 border-white/20 bg-zinc-950/70 text-white hover:bg-zinc-900 hover:text-white rounded-lg shadow-sm transition-all hover:scale-105">
                See how it works <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Hero Mockup */}
        <motion.div 
          className="mt-16 container mx-auto px-4 max-w-5xl relative"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="absolute inset-0 bg-red-600/10 blur-[100px] rounded-full"></div>
          <div className="relative rounded-xl border bg-black shadow-2xl overflow-hidden aspect-video">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 bg-zinc-950">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
            </div>
            <div className="relative w-full h-full pb-[56.25%] sm:pb-[60%]">
              <Image 
                src="/dashboard-screenshot.jpg" 
                alt="Compli Dashboard Mockup" 
                fill 
                className="object-contain object-top"
                priority
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Problem/Solution Strip */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeIn} className="bg-background rounded-xl p-6 shadow-sm border text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-default">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-600">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-xl mb-2">Manual review is slow</h3>
              <p className="text-muted-foreground text-sm">Compli automates the first pass, extracting key clauses and entities instantly.</p>
            </motion.div>
            
            <motion.div variants={fadeIn} className="bg-background rounded-xl p-6 shadow-sm border text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-default">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-600">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-xl mb-2">Missed clauses are risky</h3>
              <p className="text-muted-foreground text-sm">Every finding is grounded with exact citations to both the contract and your policy.</p>
            </motion.div>
            
            <motion.div variants={fadeIn} className="bg-background rounded-xl p-6 shadow-sm border text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-default">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-xl mb-2">Compliance gaps go unnoticed</h3>
              <p className="text-muted-foreground text-sm">Our AI detects missing requirements and classifies risks by severity.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col gap-24">
            
            {/* Feature 1 */}
            <motion.div 
              className="flex flex-col md:flex-row items-center gap-12"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
            >
              <div className="flex-1 space-y-4">
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-red-600 bg-red-50 border-red-200">
                  <Zap className="mr-1 h-3 w-3" /> AI Chat
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Ask questions, get cited answers</h2>
                <p className="text-lg text-muted-foreground">
                  Stop Ctrl+F searching. Ask complex questions about any document and get answers backed by exact page and section citations.
                </p>
                <ul className="space-y-2 mt-4">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-500" /> Semantic search across all uploads</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-500" /> Grounded RAG architecture</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-500" /> Cross-document reasoning</li>
                </ul>
              </div>
              <div className="flex-1 w-full">
                <div className="relative rounded-xl aspect-[4/3] border shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                  <Image src="/chat-screenshot.jpg" alt="AI Chat feature" fill className="object-contain bg-muted" />
                </div>
              </div>
            </motion.div>
            
            {/* Feature 2 */}
            <motion.div 
              className="flex flex-col md:flex-row-reverse items-center gap-12"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
            >
              <div className="flex-1 space-y-4">
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-red-600 bg-red-50 border-red-200">
                  <FileText className="mr-1 h-3 w-3" /> Compliance Center
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Auto-compare against policy</h2>
                <p className="text-lg text-muted-foreground">
                  Select a contract and a policy, and Compli instantly generates a gap analysis highlighting areas of non-compliance.
                </p>
              </div>
              <div className="flex-1 w-full">
                <div className="relative rounded-xl aspect-[4/3] border shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                  <Image src="/analysis-screenshot.jpg" alt="Compliance comparison feature" fill className="object-contain bg-muted" />
                </div>
              </div>
            </motion.div>
            
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-12">How it works</h2>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeIn} className="flex flex-col items-center group">
              <div className="w-16 h-16 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center text-2xl font-bold mb-6 transition-transform group-hover:scale-110 group-hover:shadow-lg">1</div>
              <h3 className="text-xl font-semibold mb-2">Upload</h3>
              <p className="text-muted-foreground text-center">Upload your contracts and internal policies securely.</p>
            </motion.div>
            <motion.div variants={fadeIn} className="flex flex-col items-center group">
              <div className="w-16 h-16 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center text-2xl font-bold mb-6 transition-transform group-hover:scale-110 group-hover:shadow-lg">2</div>
              <h3 className="text-xl font-semibold mb-2">Analyze</h3>
              <p className="text-muted-foreground text-center">Our AI automatically extracts clauses and compares against rules.</p>
            </motion.div>
            <motion.div variants={fadeIn} className="flex flex-col items-center group">
              <div className="w-16 h-16 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center text-2xl font-bold mb-6 transition-transform group-hover:scale-110 group-hover:shadow-lg">3</div>
              <h3 className="text-xl font-semibold mb-2">Review & Export</h3>
              <p className="text-muted-foreground text-center">Review the cited findings and export a PDF risk report.</p>
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
