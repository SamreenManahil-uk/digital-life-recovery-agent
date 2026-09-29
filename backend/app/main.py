from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router

from app.api.routes.health import router as health_router
from app.api.routes.services import router as services_router
from app.api.routes.dependencies import router as dependencies_router
from app.api.routes.recovery_methods import router as recovery_methods_router
from app.api.routes.incidents import router as incidents_router
from app.api.routes.recovery_plans import router as recovery_plans_router
from app.api.routes.audit_events import router as audit_events_router


def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""

    application = FastAPI(
        title="Digital Life Recovery & Dependency Agent API",
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

    return application


app = create_application()
