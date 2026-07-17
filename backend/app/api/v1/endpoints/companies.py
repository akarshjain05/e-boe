from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_user
from app.core.database import get_db
from app.models.company import Branch, Company
from app.models.user import User
from app.schemas.branch import BranchCreate, BranchResponse
from app.schemas.company import CompanyResponse, CompanyUpdate, CompanyLookupResponse

router = APIRouter()

@router.get("/me", response_model=CompanyResponse)
async def get_current_company(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not associated with any company"
        )
        
    stmt = select(Company).where(Company.id == current_user.company_id)
    result = await db.execute(stmt)
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
        
    return company

@router.put("/me", response_model=CompanyResponse)
async def update_current_company(
    data: CompanyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not associated with any company"
        )
        
    stmt = select(Company).where(Company.id == current_user.company_id)
    result = await db.execute(stmt)
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
        
    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(company, key, value)
        
    db.add(company)
    await db.commit()
    await db.refresh(company)
    
    return company

@router.get("/me/branches", response_model=list[BranchResponse])
async def get_current_company_branches(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not associated with any company"
        )
        
    stmt = select(Branch).where(Branch.company_id == current_user.company_id)
    result = await db.execute(stmt)
    branches = result.scalars().all()
    
    return branches

@router.post("/me/branches", response_model=BranchResponse)
async def create_branch(
    data: BranchCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not associated with any company"
        )
        
    branch = Branch(
        id=uuid4(),
        company_id=current_user.company_id,
        created_by=current_user.id,
        updated_by=current_user.id,
        **data.model_dump()
    )
    db.add(branch)
    await db.commit()
    await db.refresh(branch)
    
    return branch

@router.get("/lookup/{gstin}", response_model=CompanyLookupResponse)
async def lookup_company_by_gstin(
    gstin: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # First check if the requested GSTIN belongs to the current user's company
    stmt_curr = select(Company).where(Company.id == current_user.company_id)
    current_company = (await db.execute(stmt_curr)).scalar_one_or_none()
    
    if current_company and current_company.gst_number == gstin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not Applicable"
        )
    # Second, check if the customer is already added by this company
    from app.models.customer import Customer
    stmt_customer = select(Customer).where(
        Customer.company_id == current_user.company_id,
        Customer.gst_number == gstin
    )
    existing_customer = (await db.execute(stmt_customer)).scalar_one_or_none()
    if existing_customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Customer with this GSTIN is already added"
        )

    # Third, check if they exist as another company on the platform
    stmt = select(Company).where(Company.gst_number == gstin, Company.is_active == True)
    result = await db.execute(stmt)
    company = result.scalar_one_or_none()
    
    if company:
        # Return internal company
        return CompanyLookupResponse(
            name=company.name,
            legal_name=company.legal_name,
            gst_number=company.gst_number,
            pan_number=company.pan_number,
            email=company.email,
            phone=company.phone,
            address_line1=company.address_line1,
            address_line2=company.address_line2,
            city=company.city,
            state=company.state,
            country=company.country,
            postal_code=company.postal_code,
            source="internal"
        )
    
    # Finally, try RapidAPI
    from app.core.config import settings
    if settings.RAPIDAPI_KEY:
        import httpx
        url = f"https://gst-insights-api.p.rapidapi.com/getGSTDetailsUsingGST/{gstin}"
        headers = {
            "x-rapidapi-host": "gst-insights-api.p.rapidapi.com",
            "x-rapidapi-key": settings.RAPIDAPI_KEY
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and data.get("data") and len(data["data"]) > 0:
                        gst_data = data["data"][0]
                        address_obj = gst_data.get("principalAddress", {}).get("address", {})
                        
                        bno = address_obj.get("buildingNumber", "")
                        street = address_obj.get("street", "")
                        loc = address_obj.get("location", "")
                        parts = [p for p in [bno, street, loc] if p]
                        address1 = ", ".join(parts)
                        
                        legal_name = gst_data.get("legalName")
                        trade_name = gst_data.get("tradeName") or legal_name or "Unknown Company"
                        
                        return CompanyLookupResponse(
                            name=trade_name,
                            legal_name=legal_name,
                            gst_number=gstin,
                            pan_number=gstin[2:12] if len(gstin) >= 12 else None,
                            address_line1=address1[:255] if address1 else None,
                            city=address_obj.get("district", address_obj.get("city")),
                            state=address_obj.get("stateCode"),
                            postal_code=address_obj.get("pincode"),
                            country="India",
                            source="rapidapi"
                        )
            except Exception as e:
                print(f"RapidAPI GST Lookup failed: {e}")

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Company not found with this GSTIN"
    )
