from sqlalchemy import (
    Column, Integer, String, Boolean, Numeric, BigInteger,
    Date, DateTime, Text, ARRAY, ForeignKey, UniqueConstraint, Index
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from database import Base


class State(Base):
    __tablename__ = "states"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    iso_code = Column(String(10))
    region = Column(String(50))
    is_ut = Column(Boolean, default=False)
    area_sq_km = Column(Numeric)
    population = Column(BigInteger)


class RawDataSnapshot(Base):
    __tablename__ = "raw_data_snapshots"
    __table_args__ = (
        UniqueConstraint("state_id", "snapshot_date"),
        Index("idx_snapshots_state_date", "state_id", "snapshot_date"),
    )

    id = Column(Integer, primary_key=True)
    state_id = Column(Integer, ForeignKey("states.id", ondelete="CASCADE"), nullable=False)
    snapshot_date = Column(Date, nullable=False)
    road_quality_raw = Column(Numeric)
    business_density_raw = Column(Numeric)
    monsoon_disruption_raw = Column(Numeric)
    logistics_access_raw = Column(Numeric)
    power_reliability_raw = Column(Numeric)
    cold_chain_infra_raw = Column(Numeric)
    market_concentration_raw = Column(Numeric)
    data_completeness = Column(Numeric)
    sources_used = Column(JSONB)


class FragilityScore(Base):
    __tablename__ = "fragility_scores"
    __table_args__ = (
        UniqueConstraint("state_id", "computed_at", "sector_preset"),
        Index("idx_scores_state_preset", "state_id", "sector_preset"),
        Index("idx_scores_computed_at", "computed_at"),
    )

    id = Column(Integer, primary_key=True)
    state_id = Column(Integer, ForeignKey("states.id", ondelete="CASCADE"), nullable=False)
    computed_at = Column(DateTime(timezone=True), server_default=func.now())
    score = Column(Numeric, nullable=False)
    rank = Column(Integer, nullable=False)
    band = Column(String(20), nullable=False)
    confidence = Column(Numeric, nullable=False)
    subscore_road = Column(Numeric)
    subscore_business = Column(Numeric)
    subscore_monsoon = Column(Numeric)
    subscore_logistics = Column(Numeric)
    subscore_power = Column(Numeric)
    subscore_cold_chain = Column(Numeric)
    subscore_concentration = Column(Numeric)
    imputed_dimensions = Column(ARRAY(Text))
    sector_preset = Column(String(50), default="default")


class DataRefreshLog(Base):
    __tablename__ = "data_refresh_log"

    id = Column(Integer, primary_key=True)
    ran_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(20))
    sources_ok = Column(JSONB)
    states_count = Column(Integer)
    error_msg = Column(Text)
