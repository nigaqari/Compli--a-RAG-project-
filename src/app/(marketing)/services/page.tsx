"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileSearch, MessageSquare, ShieldCheck, AlertTriangle, FileBarChart, History } from "lucide-react";
import { motion } from "framer-motion";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

export default function ServicesPage() {
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
          <motion.h1 variants={fadeIn} className="text-4xl md:text-5xl font-bold tracking-tight mb-6">What Compli does</motion.h1>
          <motion.p variants={fadeIn} className="text-xl text-muted-foreground">
            A comprehensive suite of tools for intelligent contract and policy review.
          </motion.p>
        </motion.div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeIn} className="bg-background rounded-xl p-8 shadow-sm border flex flex-col h-full transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center mb-6 text-red-600">
                <FileSearch className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-xl mb-3">Document Intelligence</h3>
              <p className="text-muted-foreground mb-6 flex-1">
                Upload contracts, NDAs, and SLAs. Our system automatically extracts text, chunks it, and creates semantic embeddings for lightning-fast search.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">•</span> Secure document storage</li>
                <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">•</span> Automatic text extraction</li>
                <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">•</span> Semantic search capabilities</li>
              </ul>
            </motion.div>
            
            <motion.div variants={fadeIn} className="bg-background rounded-xl p-8 shadow-sm border flex flex-col h-full transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center mb-6 text-red-600">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-xl mb-3">AI Chat with Citations</h3>
              <p className="text-muted-foreground mb-6 flex-1">
                Ask specific questions about your uploaded documents. Get natural language answers grounded entirely in your data.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">•</span> Interactive RAG Q&A</li>
                <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">•</span> Exact page/section citations</li>
                <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">•</span> Cross-document querying</li>
              </ul>
            </motion.div>
            
            <motion.div variants={fadeIn} className="bg-background rounded-xl p-8 shadow-sm border flex flex-col h-full transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center mb-6 text-red-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-xl mb-3">Compliance Comparison</h3>
              <p className="text-muted-foreground mb-6 flex-1">
                Select a contract and an internal policy. Compli generates a gap analysis highlighting areas of non-compliance.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">•</span> Automated gap analysis</li>
                <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">•</span> Policy violation detection</li>
                <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">•</span> Side-by-side comparison</li>
              </ul>
            </motion.div>
            
            <motion.div variants={fadeIn} className="bg-background rounded-xl p-8 shadow-sm border flex flex-col h-full transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center mb-6 text-red-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-xl mb-3">Risk Classification</h3>
              <p className="text-muted-foreground mb-6 flex-1">
                Detected issues are automatically classified by severity (High/Medium/Low) with a clear rationale for the rating.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">•</span> Severity triaging</li>
                <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">•</span> AI-generated risk rationale</li>
                <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">•</span> Prioritized review queues</li>
              </ul>
            </motion.div>
            
            <motion.div variants={fadeIn} className="bg-background rounded-xl p-8 shadow-sm border flex flex-col h-full transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center mb-6 text-red-600">
                <FileBarChart className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-xl mb-3">Reporting</h3>
              <p className="text-muted-foreground mb-6 flex-1">
                Export your findings. Generate comprehensive PDF reports that include identified risks, citations, and policy comparisons.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">•</span> One-click PDF exports</li>
                <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">•</span> Executive summaries</li>
                <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">•</span> Detailed citation logs</li>
              </ul>
            </motion.div>
            
            <motion.div variants={fadeIn} className="bg-background rounded-xl p-8 shadow-sm border flex flex-col h-full transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center mb-6 text-red-600">
                <History className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-xl mb-3">Audit Trail</h3>
              <p className="text-muted-foreground mb-6 flex-1">
                Maintain full accountability. Every upload, query, report generation, and deletion is logged in an immutable audit trail.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">•</span> Complete activity logging</li>
                <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">•</span> User accountability tracking</li>
                <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">•</span> Admin oversight dashboards</li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Differentiator Strip */}
      <section className="py-20 bg-black text-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.h2 
            className="text-3xl font-bold mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Why not just use a generic chatbot?
          </motion.h2>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeIn}>
              <h3 className="text-xl text-red-500 font-bold mb-4">Generic AI</h3>
              <ul className="space-y-4 text-zinc-400">
                <li className="border-b border-zinc-800 pb-4">Trained on the public internet; lacks context about your specific internal policies.</li>
                <li className="border-b border-zinc-800 pb-4">Prone to hallucinations when dealing with complex legal language.</li>
                <li className="border-b border-zinc-800 pb-4">Provides answers without citing exactly where in the contract the information was found.</li>
                <li className="pb-4">Data might be used to train future public models, posing a security risk for confidential contracts.</li>
              </ul>
            </motion.div>
            <motion.div variants={fadeIn}>
              <h3 className="text-xl text-green-500 font-bold mb-4">Compli</h3>
              <ul className="space-y-4 text-zinc-200">
                <li className="border-b border-zinc-800 pb-4">Uses RAG to ground every answer exclusively in the documents you upload.</li>
                <li className="border-b border-zinc-800 pb-4">Specifically prompted and constrained to evaluate text against policy rules.</li>
                <li className="border-b border-zinc-800 pb-4">Always provides explicit source citations (e.g., "Found in Section 4.2, Paragraph 3").</li>
                <li className="pb-4">Enterprise-grade data isolation. We use secure APIs (like Groq) that do not train on your private documents.</li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-muted/30">
        <motion.div 
          className="container mx-auto px-4 max-w-3xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left text-lg">Where does my document data go?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                Your documents are securely stored in our backend database. When generating AI responses, we use enterprise API providers (such as Groq) to process text snippets. These providers have strict data privacy agreements and do not use your data to train their models.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left text-lg">Does Compli replace my legal team?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                No. Compli is an assistive tool designed to accelerate the review process. It performs the tedious "first pass" gap analysis, highlighting potential issues so your legal professionals can focus their expertise on evaluating and mitigating those specific risks.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left text-lg">What types of documents can I upload?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                Currently, we support PDF uploads for both Contracts (NDAs, SLAs, MSAs) and Policies (Data Privacy, HR, Vendor Security).
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>
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
