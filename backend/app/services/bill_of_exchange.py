from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, or_, and_

from app.models.bill_of_exchange import BillOfExchange, BillOfExchangeInvoice, BillOfExchangeStatusHistory, BillOfExchangeEndorsement, DiscountingBid, DiscountingRequest, DiscountingTransaction
from app.schemas.bill_of_exchange import BillOfExchangeCreate, BillOfExchangeUpdate, DiscountingBidCreate, BillOfExchangeEndorse, DiscountingRequestCreate
import uuid
from datetime import datetime


class BillOfExchangeService:
    async def create_with_invoices(
        self, db: AsyncSession, *, obj_in: BillOfExchangeCreate, company_id: UUID, created_by: UUID
    ) -> BillOfExchange:
        # Check for duplicates
        stmt = select(BillOfExchangeInvoice).join(BillOfExchange).where(
            BillOfExchangeInvoice.bill_id.in_(obj_in.invoice_ids),
            BillOfExchange.status.notin_(["cancelled", "rejected"]),
            BillOfExchange.is_deleted == False
        )
        existing = (await db.execute(stmt)).scalars().first()
        if existing:
            raise HTTPException(status_code=400, detail="One or more selected bills are already associated with an active Bill of Exchange")

        # Find network drawee
        from app.models.customer import Customer
        from app.models.company import Company
        network_drawee_company_id = None
        
        stmt = select(Customer).where(Customer.id == obj_in.customer_id)
        customer = (await db.execute(stmt)).scalar_one_or_none()
        
        if customer and customer.gst_number:
            stmt = select(Company).where(Company.gst_number == customer.gst_number, Company.is_active == True)
            target_company = (await db.execute(stmt)).scalar_one_or_none()
            if target_company:
                network_drawee_company_id = target_company.id

        # Create the BOE object
        db_obj = BillOfExchange(
            company_id=company_id,
            customer_id=obj_in.customer_id,
            drawer_name=obj_in.drawer_name,
            drawer_address=obj_in.drawer_address,
            drawer_phone=obj_in.drawer_phone,
            drawer_email=obj_in.drawer_email,
            drawee_name=obj_in.drawee_name,
            drawee_address=obj_in.drawee_address,
            drawee_phone=obj_in.drawee_phone,
            drawee_email=obj_in.drawee_email,
            amount=obj_in.amount,
            description=obj_in.description,
            issue_date=obj_in.issue_date,
            due_date=obj_in.due_date,
            place_of_issue=obj_in.place_of_issue,
            status="draft",
            created_by=created_by,
            network_drawee_company_id=network_drawee_company_id,
            public_access_token=uuid.uuid4(),
            current_holder_company_id=company_id
        )
        db.add(db_obj)
        await db.flush()
        
        # Link invoices
        for invoice_id in obj_in.invoice_ids:
            link = BillOfExchangeInvoice(
                bill_of_exchange_id=db_obj.id,
                bill_id=invoice_id,
                created_by=created_by
            )
            db.add(link)
            
        await db.commit()
        await db.refresh(db_obj)
        
        # Reload with relationships
        return await self.get(db, id=db_obj.id, company_id=company_id)
        
    async def get(self, db: AsyncSession, id: Any, company_id: Optional[UUID] = None) -> Optional[BillOfExchange]:
        query = select(BillOfExchange).options(
            selectinload(BillOfExchange.invoices),
            selectinload(BillOfExchange.discounting_requests),
            selectinload(BillOfExchange.bids),
            selectinload(BillOfExchange.endorsements),
            selectinload(BillOfExchange.status_history)
        ).where(
            BillOfExchange.id == id,
            BillOfExchange.is_deleted == False
        )
        if company_id:
            query = query.where(
                or_(
                    BillOfExchange.company_id == company_id,
                    BillOfExchange.current_holder_company_id == company_id,
                    BillOfExchange.network_drawee_company_id == company_id
                )
            )
            
        result = await db.execute(query)
        return result.scalars().first()

    async def get_multi(
        self,
        db: AsyncSession,
        *,
        company_id: UUID,
        skip: int = 0,
        limit: int = 100,
        customer_id: Optional[UUID] = None
    ) -> List[BillOfExchange]:
        query = select(BillOfExchange).options(
            selectinload(BillOfExchange.invoices),
            selectinload(BillOfExchange.discounting_requests),
            selectinload(BillOfExchange.bids),
            selectinload(BillOfExchange.endorsements),
            selectinload(BillOfExchange.status_history)
        ).where(
            or_(
                BillOfExchange.company_id == company_id,
                BillOfExchange.current_holder_company_id == company_id,
                BillOfExchange.network_drawee_company_id == company_id
            ),
            BillOfExchange.is_deleted == False
        )
        
        if customer_id:
            query = query.where(BillOfExchange.customer_id == customer_id)
            
        query = query.order_by(BillOfExchange.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    async def update(
        self, db: AsyncSession, *, db_obj: BillOfExchange, obj_in: BillOfExchangeUpdate
    ) -> BillOfExchange:
        update_data = obj_in.model_dump(exclude_unset=True)
        
        invoice_ids = update_data.pop("invoice_ids", None)

        # Update basic fields
        for field, value in update_data.items():
            setattr(db_obj, field, value)
            
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)

        if invoice_ids is not None:
            # Check for duplicates on other BOEs
            stmt = select(BillOfExchangeInvoice).join(BillOfExchange).where(
                BillOfExchangeInvoice.bill_id.in_(invoice_ids),
                BillOfExchange.id != db_obj.id,
                BillOfExchange.status.notin_(["cancelled", "rejected"]),
                BillOfExchange.is_deleted == False
            )
            existing = (await db.execute(stmt)).scalars().first()
            if existing:
                raise HTTPException(status_code=400, detail="One or more selected bills are already associated with an active Bill of Exchange")

            # Remove existing links
            stmt_del = select(BillOfExchangeInvoice).where(BillOfExchangeInvoice.bill_of_exchange_id == db_obj.id)
            existing_links = (await db.execute(stmt_del)).scalars().all()
            for link in existing_links:
                await db.delete(link)

            # Add new links
            for invoice_id in invoice_ids:
                new_link = BillOfExchangeInvoice(
                    bill_of_exchange_id=db_obj.id,
                    bill_id=invoice_id,
                    created_by=db_obj.created_by
                )
                db.add(new_link)
                
            await db.commit()

        return await self.get(db, id=db_obj.id)

    async def remove(self, db: AsyncSession, *, id: UUID) -> BillOfExchange:
        obj = await self.get(db, id=id)
        if not obj:
            raise HTTPException(status_code=404, detail="Bill of exchange not found")
        obj.is_deleted = True
        db.add(obj)
        await db.commit()
        return obj

    async def change_status(
        self, db: AsyncSession, *, db_obj: BillOfExchange, new_status: str, user_id: Optional[UUID], comments: str = None
    ) -> BillOfExchange:
        if db_obj.status == new_status:
            return db_obj
        
        history = BillOfExchangeStatusHistory(
            bill_of_exchange_id=db_obj.id,
            from_status=db_obj.status,
            to_status=new_status,
            changed_by=user_id,
            comments=comments
        )
        db.add(history)
        db_obj.status = new_status
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def issue(
        self, db: AsyncSession, *, db_obj: BillOfExchange, user_id: UUID
    ) -> BillOfExchange:
        if db_obj.status != "draft":
            raise HTTPException(status_code=400, detail="Only draft bills can be issued")
        
        if not db_obj.public_access_token:
            db_obj.public_access_token = uuid.uuid4()
            
        await self.change_status(db, db_obj=db_obj, new_status="issued", user_id=user_id, comments="Issued and sent to drawee")
        return db_obj

    async def cancel(
        self, db: AsyncSession, *, db_obj: BillOfExchange, user_id: UUID
    ) -> BillOfExchange:
        if db_obj.status not in ["draft", "issued"]:
            raise HTTPException(status_code=400, detail="Only draft or issued bills can be cancelled")
            
        await self.change_status(db, db_obj=db_obj, new_status="cancelled", user_id=user_id, comments="Cancelled by drawer")
        return db_obj

    async def accept(
        self, db: AsyncSession, *, db_obj: BillOfExchange, user_id: Optional[UUID] = None, signature: str = None
    ) -> BillOfExchange:
        # We allow "sent" here in case previous DB rows were already in "sent" status.
        if db_obj.status not in ["issued", "sent"]:
            raise HTTPException(status_code=400, detail="Bill cannot be accepted in current state")
            
        db_obj.accepted_at = datetime.utcnow()
        await self.change_status(db, db_obj=db_obj, new_status="accepted", user_id=user_id, comments="Accepted by drawee")
        return db_obj

    async def reject(
        self, db: AsyncSession, *, db_obj: BillOfExchange, user_id: Optional[UUID] = None, reason: str = None
    ) -> BillOfExchange:
        if db_obj.status not in ["issued", "sent"]:
            raise HTTPException(status_code=400, detail="Bill cannot be rejected in current state")
            
        db_obj.rejected_at = datetime.utcnow()
        if reason:
            db_obj.rejected_reason = reason
            
        await self.change_status(db, db_obj=db_obj, new_status="rejected", user_id=user_id, comments=reason or "Rejected by drawee")
        return db_obj

    async def endorse(
        self, db: AsyncSession, *, db_obj: BillOfExchange, endorser_company_id: UUID, user_id: UUID, obj_in: BillOfExchangeEndorse
    ) -> BillOfExchange:
        if db_obj.status not in ["accepted", "endorsed"]:
            raise HTTPException(status_code=400, detail="Only accepted or already endorsed bills can be endorsed further")
        
        if not db_obj.is_negotiable or db_obj.endorsement_restricted:
            raise HTTPException(status_code=400, detail="This Bill of Exchange is marked as not negotiable or endorsement restricted.")

        # Get company for endorser snapshot
        from app.models.company import Company
        endorser_company = await db.get(Company, endorser_company_id)

        # Handle sequence number and previous endorsements
        stmt = select(BillOfExchangeEndorsement).where(
            BillOfExchangeEndorsement.bill_of_exchange_id == db_obj.id,
            BillOfExchangeEndorsement.is_active == True
        )
        result = await db.execute(stmt)
        active_endorsements = result.scalars().all()
        
        for active in active_endorsements:
            active.is_active = False
            
        sequence_no = len(db_obj.endorsements) + 1 if hasattr(db_obj, 'endorsements') else 1

        endorsement = BillOfExchangeEndorsement(
            bill_of_exchange_id=db_obj.id,
            sequence_no=sequence_no,
            endorser_company_id=endorser_company_id,
            endorser_name=endorser_company.name if endorser_company else "Unknown",
            endorsee_company_id=obj_in.endorsee_company_id,
            endorsee_name=obj_in.endorsee_name,
            endorsee_address=obj_in.endorsee_address,
            endorsee_phone=obj_in.endorsee_phone,
            endorsee_email=obj_in.endorsee_email,
            endorsement_type=obj_in.endorsement_type,
            endorsed_by=user_id,
            remarks=obj_in.remarks,
            is_active=True
        )
        db.add(endorsement)
        
        db_obj.endorsee_company_id = obj_in.endorsee_company_id
        db_obj.current_holder_company_id = obj_in.endorsee_company_id
        await self.change_status(db, db_obj=db_obj, new_status="endorsed", user_id=user_id, comments=f"Endorsed to {obj_in.endorsee_name}")
        return db_obj

    async def list_for_discounting(
        self, db: AsyncSession, *, db_obj: BillOfExchange, user_id: UUID, company_id: UUID, obj_in: DiscountingRequestCreate
    ) -> DiscountingRequest:
        if db_obj.status not in ["accepted", "endorsed"]:
            raise HTTPException(status_code=400, detail="Only accepted or endorsed bills can be listed for discounting")
        
        if not db_obj.is_negotiable or db_obj.endorsement_restricted:
            raise HTTPException(status_code=400, detail="This Bill of Exchange is marked as not negotiable or discounting restricted.")
            
        # Check if already listed
        stmt = select(DiscountingRequest).where(
            DiscountingRequest.bill_of_exchange_id == db_obj.id,
            DiscountingRequest.status.notin_(["rejected", "expired", "cancelled", "withdrawn"])
        )
        existing = (await db.execute(stmt)).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=400, detail="An active discounting request already exists for this bill")

        tenor_days = (db_obj.due_date - datetime.utcnow().date()).days
        if tenor_days <= 0:
            raise HTTPException(status_code=400, detail="Bill is already due or past due")

        dr = DiscountingRequest(
            bill_of_exchange_id=db_obj.id,
            requested_by_company_id=company_id,
            requested_by_user_id=user_id,
            face_value=db_obj.amount,
            tenor_days=tenor_days,
            bidding_start_at=datetime.utcnow(),
            bidding_end_at=obj_in.bidding_end_at,
            min_acceptable_rate_bps=obj_in.min_acceptable_rate_bps,
            max_acceptable_rate_bps=obj_in.max_acceptable_rate_bps,
            status="open"
        )
        db.add(dr)
        
        await self.change_status(db, db_obj=db_obj, new_status="bidding_open", user_id=user_id, comments="Factoring unit created and bidding opened")
        await db.commit()
        await db.refresh(dr)
        return dr

    async def submit_bid(
        self, db: AsyncSession, *, db_obj: BillOfExchange, discounting_request: DiscountingRequest, obj_in: DiscountingBidCreate, user_id: UUID
    ) -> DiscountingBid:
        if discounting_request.status != "open":
            raise HTTPException(status_code=400, detail="Bidding is not open for this request")
        
        if datetime.utcnow().replace(tzinfo=discounting_request.bidding_end_at.tzinfo) > discounting_request.bidding_end_at:
            discounting_request.status = "expired"
            await db.commit()
            raise HTTPException(status_code=400, detail="Bidding window has closed")
            
        # Calculate discount based on 365 days
        discount_amount = (discounting_request.face_value * obj_in.discount_rate_bps * discounting_request.tenor_days) / (365 * 10000)
        net_payable = discounting_request.face_value - discount_amount
            
        bid = DiscountingBid(
            discounting_request_id=discounting_request.id,
            financier_company_id=obj_in.financier_company_id,
            discount_rate_bps=obj_in.discount_rate_bps,
            platform_fee_bps=obj_in.platform_fee_bps,
            computed_discount_amount=discount_amount,
            computed_net_payable=net_payable,
            expires_at=discounting_request.bidding_end_at  # basic default
        )
        db.add(bid)
        await db.commit()
        await db.refresh(bid)
        return bid

    async def accept_bid(
        self, db: AsyncSession, *, db_obj: BillOfExchange, discounting_request: DiscountingRequest, bid_id: UUID, user_id: UUID
    ) -> BillOfExchange:
        if discounting_request.status != "open":
            raise HTTPException(status_code=400, detail="Bidding is not open for this request")
            
        stmt = select(DiscountingBid).where(DiscountingBid.id == bid_id, DiscountingBid.discounting_request_id == discounting_request.id)
        bid = (await db.execute(stmt)).scalar_one_or_none()
        if not bid:
            raise HTTPException(status_code=404, detail="Bid not found")
            
        # Update bid and request
        bid.status = "selected"
        discounting_request.status = "bid_selected"
        discounting_request.selected_bid_id = bid.id
        
        # Endorse the bill to the financier
        from app.schemas.bill_of_exchange import BillOfExchangeEndorse
        endorse_in = BillOfExchangeEndorse(
            endorsee_company_id=bid.financier_company_id,
            endorsee_name="Financier", # In reality, lookup financier name
            endorsement_type="sans_recourse",
            remarks=f"Discounted at {bid.discount_rate_bps / 100}%"
        )
        await self.endorse(db, db_obj=db_obj, endorser_company_id=discounting_request.requested_by_company_id, user_id=user_id, obj_in=endorse_in)
        
        # Mark other bids as rejected
        stmt_others = select(DiscountingBid).where(DiscountingBid.discounting_request_id == discounting_request.id, DiscountingBid.id != bid_id)
        other_bids = (await db.execute(stmt_others)).scalars().all()
        for other_bid in other_bids:
            other_bid.status = "rejected"
            
        await self.change_status(db, db_obj=db_obj, new_status="bid_accepted", user_id=user_id, comments=f"Bid accepted at {bid.discount_rate_bps / 100}%")
        return db_obj

    async def disburse(
        self, db: AsyncSession, *, db_obj: BillOfExchange, discounting_request: DiscountingRequest, user_id: UUID
    ) -> BillOfExchange:
        if db_obj.status != "bid_accepted":
            raise HTTPException(status_code=400, detail="Bill must have an accepted bid to be disbursed")
            
        stmt = select(DiscountingBid).where(DiscountingBid.id == discounting_request.selected_bid_id)
        bid = (await db.execute(stmt)).scalar_one_or_none()
        
        if not bid:
            raise HTTPException(status_code=400, detail="No selected bid found for disbursement")
            
        transaction = DiscountingTransaction(
            discounting_request_id=discounting_request.id,
            bid_id=bid.id,
            financier_company_id=bid.financier_company_id,
            seller_company_id=discounting_request.requested_by_company_id,
            disbursement_reference=f"UTR-{uuid.uuid4().hex[:8].upper()}",
            disbursed_amount=bid.computed_net_payable,
            maturity_amount_due=discounting_request.face_value,
            maturity_settlement_status="pending",
            recourse_type="without_recourse"
        )
        db.add(transaction)
        
        discounting_request.status = "disbursed"
        await self.change_status(db, db_obj=db_obj, new_status="discounted", user_id=user_id, comments="Funds disbursed")
        await db.commit()
        
        return db_obj

    async def mature(
        self, db: AsyncSession, *, db_obj: BillOfExchange, user_id: UUID
    ) -> BillOfExchange:
        if db_obj.status not in ["accepted", "endorsed", "discounted"]:
            raise HTTPException(status_code=400, detail="Only active bills can mature")
            
        # If it was never discounted/endorsed, it's just matured
        await self.change_status(db, db_obj=db_obj, new_status="matured", user_id=user_id, comments="Bill reached maturity")
        return db_obj

    async def settle(
        self, db: AsyncSession, *, db_obj: BillOfExchange, user_id: UUID
    ) -> BillOfExchange:
        if db_obj.status not in ["matured", "discounted"]:
            raise HTTPException(status_code=400, detail="Only matured or discounted bills can be settled")
            
        # TReDS terminology: if discounted, it is 'settled', else 'paid'
        new_status = "settled" if db_obj.status == "discounted" else "paid"
        await self.change_status(db, db_obj=db_obj, new_status=new_status, user_id=user_id, comments="Bill settled/paid")
        return db_obj

    async def mark_default(
        self, db: AsyncSession, *, db_obj: BillOfExchange, user_id: UUID
    ) -> BillOfExchange:
        if db_obj.status not in ["matured", "discounted"]:
            raise HTTPException(status_code=400, detail="Only matured or discounted bills can default")
            
        await self.change_status(db, db_obj=db_obj, new_status="defaulted", user_id=user_id, comments="Drawee defaulted on payment")
        return db_obj


bill_of_exchange_service = BillOfExchangeService()
