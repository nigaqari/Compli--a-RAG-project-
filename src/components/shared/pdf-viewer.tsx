"use client"

import { useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import "react-pdf/dist/esm/Page/AnnotationLayer.css"
import "react-pdf/dist/esm/Page/TextLayer.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react"

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFViewerProps {
  url: string
}

export function PDFViewer({ url }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>()
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [inputPage, setInputPage] = useState<string>("1")

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages)
    setPageNumber(1)
    setInputPage("1")
  }

  function changePage(offset: number) {
    setPageNumber(prevPageNumber => {
      const newPage = prevPageNumber + offset
      setInputPage(newPage.toString())
      return newPage
    })
  }

  function handlePageInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputPage(e.target.value)
  }

  function handlePageInputSubmit(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      const page = parseInt(inputPage)
      if (!isNaN(page) && page >= 1 && numPages && page <= numPages) {
        setPageNumber(page)
      } else {
        setInputPage(pageNumber.toString())
      }
    }
  }

  return (
    <div className="flex flex-col h-full items-center bg-gray-50/50">
      <div className="flex items-center justify-between w-full p-2 border-b bg-background sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => changePage(-1)} 
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 text-sm">
            <Input 
              value={inputPage}
              onChange={handlePageInputChange}
              onKeyDown={handlePageInputSubmit}
              className="w-12 h-8 text-center"
            />
            <span className="text-muted-foreground whitespace-nowrap">
              of {numPages || "--"}
            </span>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => changePage(1)} 
            disabled={pageNumber >= (numPages || 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.max(0.5, s - 0.2))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.min(2.5, s + 0.2))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto w-full flex justify-center p-4">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="p-4 text-muted-foreground">Loading PDF...</div>}
          error={<div className="p-4 text-destructive">Failed to load PDF. Please check the network tab.</div>}
        >
          <Page 
            pageNumber={pageNumber} 
            scale={scale}
            className="shadow-lg border bg-white"
            loading={<div className="p-4 text-muted-foreground w-[600px] h-[800px] flex items-center justify-center">Loading page...</div>}
          />
        </Document>
      </div>
    </div>
  )
}
