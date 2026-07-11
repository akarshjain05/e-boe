from fastapi import APIRouter, Depends, Path
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID
from app.core.database import get_db
from app.models.bill import Bill
from app.models.company import Company
from app.models.user import User
from app.api.dependencies.auth import get_current_user
from app.utils.pdf_generator import BillPDFGenerator

router = APIRouter()

@router.get("/bill/{bill_id}")
async def generate_bill_pdf(
    bill_id: UUID = Path(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch bill with items
    stmt = select(Bill).options(
        selectinload(Bill.items)
    ).where(
        Bill.id == bill_id,
        Bill.company_id == current_user.company_id,
        Bill.is_deleted == False
    )
    result = await db.execute(stmt)
    bill = result.scalar_one_or_none()
    
    if not bill:
        return {"error": "Bill not found"}
    
    # Fetch company info
    stmt = select(Company).where(Company.id == current_user.company_id)
    result = await db.execute(stmt)
    company = result.scalar_one_or_none()
    
    # Build data for PDF
    bill_data = {
        "company_name": company.name if company else "",
        "company_address": f"{company.address_line1 or ''}, {company.city or ''}, {company.state or ''}" if company else "",
        "bill_number": bill.bill_number,
        "issue_date": str(bill.issue_date),
        "due_date": str(bill.due_date),
        "currency_code": bill.currency_code,
        "drawer_name": bill.drawer_name,
        "drawer_address": bill.drawer_address or "",
        "drawee_name": bill.drawee_name,
        "drawee_address": bill.drawee_address or "",
        "payee_name": bill.payee_name,
        "payee_address": bill.payee_address or "",
        "amount": float(bill.amount),
        "discount_amount": float(bill.discount_amount),
        "tax_amount": float(bill.tax_amount),
        "total_amount": float(bill.total_amount),
        "terms_and_conditions": bill.terms_and_conditions or "",
        "items": [
            {
                "description": item.description,
                "hsn_code": item.hsn_code or "",
                "quantity": float(item.quantity),
                "unit_price": float(item.unit_price),
                "tax_rate": float(item.tax_rate),
                "amount": float(item.amount),
            }
            for item in bill.items
        ]
    }
    
    generator = BillPDFGenerator()
    pdf_buffer = generator.generate(bill_data)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=BOE-{bill.bill_number}.pdf"}
    )

from sqlalchemy import func
from app.models.payment import Payment
from datetime import datetime, timedelta, timezone

@router.get("/dashboard")
async def get_dashboard_reports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.company_id
    
    # 1. Status Distribution
    status_stmt = select(Bill.status, func.count(Bill.id)).where(
        Bill.company_id == company_id,
        Bill.is_deleted == False
    ).group_by(Bill.status)
    status_result = await db.execute(status_stmt)
    
    status_counts = {"paid": 0, "overdue": 0, "pending": 0, "draft": 0}
    for status, count in status_result.all():
        if status in status_counts:
            status_counts[status] = count
        else:
            status_counts["pending"] += count # fallback
            
    status_distribution = [
        {"name": "Paid", "value": status_counts["paid"], "color": "#10b981"},
        {"name": "Overdue", "value": status_counts["overdue"], "color": "#ef4444"},
        {"name": "Pending", "value": status_counts["pending"], "color": "#f59e0b"},
        {"name": "Draft", "value": status_counts["draft"], "color": "#64748b"}
    ]

    # 2. Monthly Trend (Issued, Overdue, Paid)
    # 3. Cash Flow (Inflow, Outflow)
    # To keep it simple, we'll generate the last 6 months structure
    now = datetime.now(timezone.utc)
    months_labels = []
    cash_flow = []
    monthly_trend = []
    
    for i in range(5, -1, -1):
        month_date = now - timedelta(days=30 * i)
        month_label = month_date.strftime("%b")
        months_labels.append(month_label)
        
        # Simple mock aggregation per month for real query would group by date_trunc
        cash_flow.append({"month": month_label, "Inflow": 0, "Outflow": 0})
        monthly_trend.append({"month": month_label, "Issued": 0, "Overdue": 0, "Paid": 0})

    # Top Customers
    top_customers_stmt = select(
        Bill.drawee_name, 
        func.count(Bill.id).label("bills"),
        func.sum(Bill.total_amount).label("revenue")
    ).where(
        Bill.company_id == company_id,
        Bill.is_deleted == False
    ).group_by(Bill.drawee_name).order_by(func.sum(Bill.total_amount).desc()).limit(5)
    
    top_customers_result = await db.execute(top_customers_stmt)
    top_customers = []
    for row in top_customers_result.all():
        top_customers.append({
            "name": row.drawee_name,
            "bills": row.bills,
            "revenue": float(row.revenue or 0)
        })

    return {
        "statusDistribution": status_distribution,
        "cashFlow": cash_flow,
        "monthlyTrend": monthly_trend,
        "topCustomers": top_customers
    }
