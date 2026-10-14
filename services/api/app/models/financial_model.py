"""
SQLAlchemy Models for Financial Models, Inputs, Scenarios, Hiring Plans, Model Runs, Imports, and Audits.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class FinancialModel(Base):
    __tablename__ = "financial_models"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    business_model = Column(String(50), default="b2b_saas", nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    start_date = Column(String(7), default="2026-01", nullable=False)
    planning_horizon = Column(Integer, default=12, nullable=False)
    description = Column(Text, nullable=True)

    # Core Parameters Stored as JSON for flexible versioning & exact engine execution
    configuration = Column(JSON, nullable=False, default=dict)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    organization = relationship("Organization", back_populates="financial_models")
    scenarios = relationship("Scenario", back_populates="financial_model", cascade="all, delete-orphan")
    inputs = relationship("ModelInput", back_populates="financial_model", cascade="all, delete-orphan")
    hiring_plans = relationship("HiringPlan", back_populates="financial_model", cascade="all, delete-orphan")
    runs = relationship("ModelRun", back_populates="financial_model", cascade="all, delete-orphan")
    imports = relationship("ImportJob", back_populates="financial_model", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="financial_model", cascade="all, delete-orphan")


class ModelInput(Base):
    __tablename__ = "model_inputs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    model_id = Column(String(36), ForeignKey("financial_models.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(50), default="USER_ASSUMPTION", nullable=False)  # OBSERVED_DATA, USER_ASSUMPTION, MODEL_OUTPUT
    section = Column(String(50), nullable=False)
    key_name = Column(String(100), nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String(30), default="currency", nullable=False)
    period = Column(String(7), nullable=True)
    source = Column(String(100), default="user_entry", nullable=False)
    notes = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    financial_model = relationship("FinancialModel", back_populates="inputs")


class Scenario(Base):
    __tablename__ = "scenarios"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    model_id = Column(String(36), ForeignKey("financial_models.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    scenario_type = Column(String(50), default="custom", nullable=False)  # base, optimistic, downside, custom
    description = Column(Text, nullable=True)
    overrides = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    financial_model = relationship("FinancialModel", back_populates="scenarios")
    runs = relationship("ModelRun", back_populates="scenario", cascade="all, delete-orphan")


class HiringPlan(Base):
    __tablename__ = "hiring_plans"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    model_id = Column(String(36), ForeignKey("financial_models.id", ondelete="CASCADE"), nullable=False, index=True)
    role_title = Column(String(150), nullable=False)
    department = Column(String(100), default="Engineering", nullable=False)
    headcount = Column(Integer, default=1, nullable=False)
    monthly_salary = Column(Float, nullable=False)
    employer_burden_rate = Column(Float, default=0.15, nullable=False)
    start_month = Column(Integer, default=1, nullable=False)
    annual_increase_rate = Column(Float, default=0.05, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    financial_model = relationship("FinancialModel", back_populates="hiring_plans")


class ModelRun(Base):
    __tablename__ = "model_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    model_id = Column(String(36), ForeignKey("financial_models.id", ondelete="CASCADE"), nullable=False, index=True)
    scenario_id = Column(String(36), ForeignKey("scenarios.id", ondelete="CASCADE"), nullable=True, index=True)
    engine_version = Column(String(20), default="1.0.0", nullable=False)
    status = Column(String(50), default="COMPLETED", nullable=False)
    executed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Store complete execution artifact for reproducibility
    results_summary = Column(JSON, nullable=True)
    projections = Column(JSON, nullable=True)
    warnings = Column(JSON, nullable=True)

    financial_model = relationship("FinancialModel", back_populates="runs")
    scenario = relationship("Scenario", back_populates="runs")


class ImportJob(Base):
    __tablename__ = "import_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    model_id = Column(String(36), ForeignKey("financial_models.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    status = Column(String(50), default="PENDING", nullable=False)  # PENDING, PREVIEWED, COMPLETED, FAILED
    column_mapping = Column(JSON, nullable=True)
    preview_data = Column(JSON, nullable=True)
    error_log = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    financial_model = relationship("FinancialModel", back_populates="imports")


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    model_id = Column(String(36), ForeignKey("financial_models.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), nullable=False)
    action = Column(String(100), nullable=False)  # MODEL_CREATED, INPUT_UPDATED, SCENARIO_ADDED, REVERSE_PLAN_RUN
    payload = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    financial_model = relationship("FinancialModel", back_populates="audit_events")
