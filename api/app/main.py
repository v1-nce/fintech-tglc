from fastapi import FastAPI, Request, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import os
import logging

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="TGLC API", version="0.1.0")

cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Import and include routers directly with full paths
from .routes.liquidity import router as liquidity_router
from .routes.credentials import router as credentials_router
from .routes.banks import router as banks_router

app.include_router(liquidity_router, prefix="/api/liquidity")
app.include_router(credentials_router, prefix="/api/credentials")
app.include_router(banks_router, prefix="/api/banks")

# Log all registered routes on startup
@app.on_event("startup")
async def startup_event():
    logger.info("=" * 60)
    logger.info("REGISTERED ROUTES:")
    for route in app.routes:
        if hasattr(route, 'path') and hasattr(route, 'methods'):
            methods = ', '.join(sorted(route.methods))
            logger.info(f"  {methods:15} {route.path}")
    logger.info("=" * 60)

# Debug middleware to log all requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f">>> INCOMING: {request.method} {request.url.path}")
    try:
        response = await call_next(request)
        logger.info(f"<<< RESPONSE: {response.status_code} for {request.url.path}")
        return response
    except Exception as e:
        logger.error(f"ERROR in {request.url.path}: {e}", exc_info=True)
        raise

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


@app.get("/")
def health():
    return {"status": "online", "network": os.getenv("XRPL_NETWORK", "testnet")}

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "network": os.getenv("XRPL_NETWORK", "testnet"),
        "issuer_configured": bool(os.getenv("ISSUER_SEED"))
    }

