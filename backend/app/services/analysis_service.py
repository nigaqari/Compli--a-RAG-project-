import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.analysis import DocumentAnalysis, AnalysisStatus, AnalysisClause, Risk, Recommendation
from app.schemas.analysis import ExtractedAnalysis, ExtractedRiskAnalysis, ExtractedRecommendationAnalysis
from app.services.extraction_service import run_extraction
from app.services.risk_service import run_risk_analysis
from app.services.recommendation_service import run_recommendations

logger = logging.getLogger(__name__)

def _find_best_chunk(db: Session, document_id: str, page_number: int, summary_text: str = None) -> str:
    if not page_number:
        return None
    
    # Try to find a chunk on this page
    chunks = db.query(DocumentChunk).filter(
        DocumentChunk.document_id == document_id,
        DocumentChunk.page_number == page_number
    ).all()
    
    if not chunks:
        return None
        
    # In a full implementation, we could fuzzy match `summary_text` against chunk contents.
    # For now, just return the first chunk on that page.
    return chunks[0].id

def persist_extraction(db: Session, analysis: DocumentAnalysis, extracted: ExtractedAnalysis):
    analysis.executive_summary = extracted.executive_summary
    analysis.key_parties = [p.model_dump() for p in extracted.key_parties]
    
    for category_name, clause_data in extracted.clauses.items():
        chunk_id = None
        if clause_data.found and clause_data.page:
            chunk_id = _find_best_chunk(db, analysis.document_id, clause_data.page, clause_data.summary)
            
        clause = AnalysisClause(
            analysis_id=analysis.id,
            category=category_name,
            found=clause_data.found,
            summary_text=clause_data.summary,
            page_number=clause_data.page,
            source_chunk_id=chunk_id
        )
        db.add(clause)

def persist_risks(db: Session, analysis: DocumentAnalysis, risks_data: ExtractedRiskAnalysis):
    for risk_item in risks_data.risks:
        chunk_id = None
        if risk_item.page:
            chunk_id = _find_best_chunk(db, analysis.document_id, risk_item.page)
            
        risk = Risk(
            analysis_id=analysis.id,
            severity=risk_item.severity,
            title=risk_item.title,
            rationale=risk_item.rationale,
            page_number=risk_item.page,
            source_chunk_id=chunk_id
        )
        db.add(risk)
    
def persist_recommendations(db: Session, analysis: DocumentAnalysis, recs_data: ExtractedRecommendationAnalysis):
    # Map risk title to risk ID from the DB
    # Ensure risks are flushed so they have IDs
    db.flush() 
    
    db_risks = {r.title: r.id for r in analysis.risks}
    
    for rec_item in recs_data.recommendations:
        related_id = None
        if rec_item.related_risk_title and rec_item.related_risk_title in db_risks:
            related_id = db_risks[rec_item.related_risk_title]
            
        rec = Recommendation(
            analysis_id=analysis.id,
            text=rec_item.text,
            related_risk_id=related_id
        )
        db.add(rec)

def run_full_analysis(db: Session, document_id: str, user_id: str = "system", analysis_id: str = None):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        logger.error(f"Document {document_id} not found")
        return
        
    if doc.processing_status != "completed":
        logger.error(f"Cannot analyze document {document_id} with status {doc.processing_status}")
        return

    # Use existing analysis row or create a new one
    if analysis_id:
        analysis = db.query(DocumentAnalysis).filter(DocumentAnalysis.id == analysis_id).first()
        if not analysis:
            logger.error(f"Analysis {analysis_id} not found")
            return
        analysis.status = AnalysisStatus.analyzing
    else:
        analysis = DocumentAnalysis(document_id=document_id, status=AnalysisStatus.analyzing)
        db.add(analysis)

    db.commit()
    db.refresh(analysis)
    
    try:
        # 1. Extraction
        extracted = run_extraction(db, user_id, document_id)
        persist_extraction(db, analysis, extracted)
        db.commit()
        
        # 2. Risks
        risks_data = run_risk_analysis(db, user_id, extracted)
        persist_risks(db, analysis, risks_data)
        db.commit()
        
        # 3. Recommendations
        recs_data = run_recommendations(db, user_id, extracted, risks_data)
        persist_recommendations(db, analysis, recs_data)
        
        # Mark completed
        analysis.status = AnalysisStatus.completed
        analysis.completed_at = datetime.utcnow()
        db.commit()
        
    except Exception as e:
        logger.exception(f"Analysis failed for {document_id}")
        db.rollback()
        analysis.status = AnalysisStatus.failed
        analysis.error = str(e)
        db.commit()

