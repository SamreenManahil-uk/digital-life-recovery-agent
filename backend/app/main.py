import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.neo4j import neo4j_client

from app.api.routes.auth import router as auth_router

from app.api.routes.health import router as health_router
from app.api.routes.services import router as services_router
from app.api.routes.dependencies import router as dependencies_router
from app.api.routes.recovery_methods import router as recovery_methods_router
from app.api.routes.incidents import router as incidents_router
from app.api.routes.recovery_plans import router as recovery_plans_router
from app.api.routes.audit_events import router as audit_events_router
from app.api.routes.graph import router as graph_router


logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


@asynccontextmanager
async def lifespan(application: FastAPI):
    """
    Manage optional Neo4j infrastructure lifecycle.

    PostgreSQL remains the source of truth. Neo4j being
    temporarily unavailable must not prevent the API from
    starting.
    """
    if neo4j_client.is_available():
        logger.info("Neo4j connectivity verified.")
    else:
        logger.warning(
            "Neo4j is unavailable. "
            "Core PostgreSQL-backed API remains available."
        )

    try:
        yield
    finally:
        neo4j_client.close()
        logger.info("Neo4j driver closed.")


def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""

    application = FastAPI(
        title="Digital Life Recovery & Dependency Agent API",
        lifespan=lifespan,
        description=(
            "API for modelling digital dependencies, analysing cascading "
            "incident impact, assessing recovery risk, and supporting "
            "AI-assisted recovery planning."
        ),
        version="0.1.0",
    )

    # Development frontend origins.
    # Keep this explicit rather than allowing every origin.
    application.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:5175",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(health_router)
    application.include_router(auth_router)
    application.include_router(services_router)
    application.include_router(dependencies_router)
    application.include_router(recovery_methods_router)
    application.include_router(incidents_router)
    application.include_router(recovery_plans_router)
    application.include_router(audit_events_router)
    application.include_router(graph_router)

    return application


app = create_application()
