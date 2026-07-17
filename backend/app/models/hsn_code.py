from sqlalchemy import Column, String
from app.models.base import Base

class HsnCode(Base):
    __tablename__ = "hsn_sac_codes"

    hsn_cd = Column(String, primary_key=True, index=True)
    description = Column(String, nullable=False)
