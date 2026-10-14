"""
Financial Model Repository with strict tenant scoping.
"""
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, delete
from app.models.financial_model import (
    FinancialModel,
    Scenario,
    HiringPlan,
    ModelRun,
    AuditEvent,
)
from app.engine.models import ModelEngineInputs


class ModelRepository:
    def __init__(self, db: AsyncSession, organization_id: str):
        self.db = db
        self.organization_id = organization_id

    async def list_models(self) -> List[FinancialModel]:
        stmt = (
            select(FinancialModel)
            .where(FinancialModel.organization_id == self.organization_id)
            .order_by(FinancialModel.created_at.desc())
        )
        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def get_model(self, model_id: str) -> Optional[FinancialModel]:
        stmt = select(FinancialModel).where(
            and_(
                FinancialModel.id == model_id,
                FinancialModel.organization_id == self.organization_id,
            )
        )
        res = await self.db.execute(stmt)
        return res.scalars().first()

    async def create_model(
        self,
        name: str,
        business_model: str,
        currency: str,
        start_date: str,
        planning_horizon: int,
        inputs: ModelEngineInputs,
        description: Optional[str] = None,
    ) -> FinancialModel:
        model = FinancialModel(
            organization_id=self.organization_id,
            name=name,
            business_model=business_model,
            currency=currency,
            start_date=start_date,
            planning_horizon=planning_horizon,
            description=description,
            configuration=inputs.model_dump(),
        )
        self.db.add(model)
        await self.db.flush()

        # Create Default Base Case Scenario
        base_scenario = Scenario(
            model_id=model.id,
            name="Base Case",
            scenario_type="base",
            description="Baseline assumptions scenario",
            overrides={},
        )
        self.db.add(base_scenario)
        await self.db.commit()
        await self.db.refresh(model)
        return model

    async def update_model(
        self,
        model_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        inputs: Optional[ModelEngineInputs] = None,
    ) -> Optional[FinancialModel]:
        model = await self.get_model(model_id)
        if not model:
            return None
        if name is not None:
            model.name = name
        if description is not None:
            model.description = description
        if inputs is not None:
            model.configuration = inputs.model_dump()
            model.currency = inputs.currency.value
            model.start_date = inputs.start_date
            model.planning_horizon = inputs.planning_horizon
        await self.db.commit()
        await self.db.refresh(model)
        return model

    async def delete_model(self, model_id: str) -> bool:
        model = await self.get_model(model_id)
        if not model:
            return False
        await self.db.delete(model)
        await self.db.commit()
        return True

    async def get_scenarios(self, model_id: str) -> List[Scenario]:
        # Validate model belongs to tenant
        model = await self.get_model(model_id)
        if not model:
            return []
        stmt = select(Scenario).where(Scenario.model_id == model_id)
        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def add_scenario(
        self,
        model_id: str,
        name: str,
        scenario_type: str,
        description: Optional[str],
        overrides: dict,
    ) -> Optional[Scenario]:
        model = await self.get_model(model_id)
        if not model:
            return None
        scenario = Scenario(
            model_id=model_id,
            name=name,
            scenario_type=scenario_type,
            description=description,
            overrides=overrides,
        )
        self.db.add(scenario)
        await self.db.commit()
        await self.db.refresh(scenario)
        return scenario

    async def record_run(
        self,
        model_id: str,
        scenario_id: Optional[str],
        summary: dict,
        projections: list,
        warnings: list,
    ) -> ModelRun:
        run = ModelRun(
            model_id=model_id,
            scenario_id=scenario_id,
            results_summary=summary,
            projections=projections,
            warnings=warnings,
        )
        self.db.add(run)
        await self.db.commit()
        await self.db.refresh(run)
        return run

