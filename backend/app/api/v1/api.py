from fastapi import APIRouter

from app.api.v1.endpoints import (
    api_keys,
    auth,
    bills,
    companies,
    creditors,
    customers,
    dashboard,
    documents,
    financiers,
    bills_of_exchange,
    notifications,
    payments,
    products,
    public,
    reports,
    users,
)

api_router = APIRouter()
api_router.include_router(public.router, prefix="/public", tags=["public"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(companies.router, prefix="/companies", tags=["companies"])
api_router.include_router(financiers.router, prefix="/financiers", tags=["financiers"])
api_router.include_router(api_keys.router, tags=["api-keys"])
api_router.include_router(customers.router, prefix="/customers", tags=["customers"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(creditors.router, prefix="/creditors", tags=["creditors"])
api_router.include_router(bills.router, prefix="/bills", tags=["bills"])
api_router.include_router(bills_of_exchange.router, prefix="/bills-of-exchange", tags=["bills_of_exchange"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
