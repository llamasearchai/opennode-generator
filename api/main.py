"""
OpenNode Forge FastAPI Application
==================================

Comprehensive REST API for AI-powered npm package generation with
advanced features, monitoring, security, and OpenAI integration.
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional, Any, Union
import asyncio
import json
import os
import tempfile
import shutil
import subprocess
import time
import uuid
from datetime import datetime, timedelta
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="OpenNode Forge API",
    description="AI-powered npm package generation and management platform",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Security
security = HTTPBearer()

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Pydantic Models
class PackageConfig(BaseModel):
    packageName: str = Field(..., min_length=1, max_length=214)
    description: str = Field(..., min_length=1, max_length=500)
    version: str = Field(default="1.0.0", regex=r"^\d+\.\d+\.\d+")
    license: str = Field(default="MIT")
    packageType: str = Field(..., regex="^(library|cli-tool|react-component|express-api|utility|monorepo|plugin)$")
    qualityLevel: str = Field(..., regex="^(good|better|best|enterprise)$")
    outputDir: Optional[str] = None
    enableTesting: bool = Field(default=True)
    enableDocumentation: bool = Field(default=True)
    enableLinting: bool = Field(default=True)
    enableTypeScript: bool = Field(default=True)
    enableGitInit: bool = Field(default=False)
    enableCodexIntegration: bool = Field(default=False)
    enableOpenAIAgents: bool = Field(default=False)
    enableCICD: bool = Field(default=False)
    enableDocker: bool = Field(default=False)
    enableSecurity: bool = Field(default=True)
    enablePerformanceMonitoring: bool = Field(default=False)
    author: Optional[str] = None
    email: Optional[str] = None
    repository: Optional[str] = None
    keywords: List[str] = Field(default_factory=list)
    dependencies: Dict[str, str] = Field(default_factory=dict)
    devDependencies: Dict[str, str] = Field(default_factory=dict)
    customizations: Optional[Dict[str, Any]] = None

    @validator('packageName')
    def validate_package_name(cls, v):
        if not v.replace('-', '').replace('_', '').replace('@', '').replace('/', '').isalnum():
            raise ValueError('Package name contains invalid characters')
        return v

class GenerationRequest(BaseModel):
    config: PackageConfig
    aiConfig: Optional[Dict[str, Any]] = None
    options: Optional[Dict[str, Any]] = None

class GenerationResponse(BaseModel):
    success: bool
    generationId: str
    packagePath: str
    metadata: Dict[str, Any]
    files: List[str]
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)

class AnalysisRequest(BaseModel):
    packagePath: str
    analysisType: str = Field(default="comprehensive", regex="^(basic|comprehensive|security|performance)$")
    includeRecommendations: bool = Field(default=True)

class AnalysisResponse(BaseModel):
    success: bool
    analysisId: str
    qualityScore: float
    securityScore: float
    performanceScore: float
    maintainabilityScore: float
    metrics: Dict[str, Any]
    recommendations: List[str]
    insights: List[str]
    warnings: List[str]

class PublishRequest(BaseModel):
    packagePath: str
    registry: str = Field(default="npm")
    isPublic: bool = Field(default=True)
    dryRun: bool = Field(default=False)
    tag: str = Field(default="latest")

class PublishResponse(BaseModel):
    success: bool
    publishId: str
    packageUrl: Optional[str] = None
    version: str
    registry: str
    errors: List[str] = Field(default_factory=list)

class OptimizationRequest(BaseModel):
    packagePath: str
    optimizationType: str = Field(..., regex="^(bundle|dependencies|performance|security)$")
    aggressiveness: str = Field(default="moderate", regex="^(conservative|moderate|aggressive)$")

class OptimizationResponse(BaseModel):
    success: bool
    optimizationId: str
    improvements: List[str]
    metrics: Dict[str, Any]
    recommendations: List[str]

class TemplateRequest(BaseModel):
    templateId: str
    config: Dict[str, Any]
    outputDir: str

class TemplateResponse(BaseModel):
    success: bool
    templateId: str
    outputPath: str
    files: List[str]

class UltraThinkRequest(BaseModel):
    idea: str = Field(..., min_length=10, max_length=1000)
    context: Optional[str] = None
    creativity: float = Field(default=0.7, ge=0.0, le=1.0)
    depth: int = Field(default=3, ge=1, le=5)

class UltraThinkResponse(BaseModel):
    success: bool
    thinkingId: str
    solutions: List[Dict[str, Any]]
    insights: List[str]
    recommendations: List[str]

# Global state management
generation_tasks: Dict[str, Dict[str, Any]] = {}
analysis_tasks: Dict[str, Dict[str, Any]] = {}
publish_tasks: Dict[str, Dict[str, Any]] = {}

# Utility functions
def get_node_executable():
    """Get the Node.js executable path"""
    return shutil.which('node') or '/usr/local/bin/node'

def get_npm_executable():
    """Get the npm executable path"""
    return shutil.which('npm') or '/usr/local/bin/npm'

async def verify_auth(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify API authentication"""
    # Implement your authentication logic here
    # For now, we'll accept any token
    if not credentials.credentials:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    return credentials.credentials

async def run_node_command(command: List[str], cwd: str = None) -> Dict[str, Any]:
    """Run a Node.js command asynchronously"""
    try:
        process = await asyncio.create_subprocess_exec(
            *command,
            cwd=cwd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        return {
            "success": process.returncode == 0,
            "stdout": stdout.decode('utf-8'),
            "stderr": stderr.decode('utf-8'),
            "returncode": process.returncode
        }
    except Exception as e:
        return {
            "success": False,
            "stdout": "",
            "stderr": str(e),
            "returncode": -1
        }

# API Routes

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "OpenNode Forge API",
        "version": "2.0.0",
        "description": "AI-powered npm package generation and management platform",
        "endpoints": {
            "generation": "/api/v1/generate",
            "analysis": "/api/v1/analyze",
            "publishing": "/api/v1/publish",
            "optimization": "/api/v1/optimize",
            "templates": "/api/v1/templates",
            "ultrathink": "/api/v1/ultrathink",
            "health": "/health",
            "docs": "/docs"
        },
        "features": [
            "AI-powered package generation",
            "Comprehensive code analysis",
            "Automated publishing",
            "Performance optimization",
            "Security scanning",
            "Template management",
            "UltraThink creative solutions"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    node_path = get_node_executable()
    npm_path = get_npm_executable()
    
    # Check Node.js version
    node_result = await run_node_command([node_path, "--version"])
    npm_result = await run_node_command([npm_path, "--version"])
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "api": "running",
            "node": {
                "available": node_result["success"],
                "version": node_result["stdout"].strip() if node_result["success"] else None,
                "path": node_path
            },
            "npm": {
                "available": npm_result["success"],
                "version": npm_result["stdout"].strip() if npm_result["success"] else None,
                "path": npm_path
            }
        },
        "metrics": {
            "active_generations": len(generation_tasks),
            "active_analyses": len(analysis_tasks),
            "active_publishes": len(publish_tasks)
        }
    }

@app.post("/api/v1/generate", response_model=GenerationResponse)
async def generate_package(
    request: GenerationRequest,
    background_tasks: BackgroundTasks,
    token: str = Depends(verify_auth)
):
    """Generate a new npm package using AI"""
    generation_id = str(uuid.uuid4())
    
    try:
        # Create temporary output directory
        output_dir = request.config.outputDir or tempfile.mkdtemp(prefix="opennode_")
        
        # Prepare generation command
        node_path = get_node_executable()
        cli_path = os.path.join(os.path.dirname(__file__), "../dist/cli/index.js")
        
        if not os.path.exists(cli_path):
            raise HTTPException(status_code=500, detail="OpenNode CLI not found. Please build the project first.")
        
        # Build command arguments
        cmd = [
            node_path, cli_path, "generate",
            request.config.packageName,
            "--type", request.config.packageType,
            "--quality", request.config.qualityLevel,
            "--output", output_dir,
            "--no-interactive"
        ]
        
        if request.config.enableTypeScript:
            cmd.append("--typescript")
        if request.config.enableTesting:
            cmd.append("--testing")
        if request.config.enableDocumentation:
            cmd.append("--documentation")
        if request.config.enableLinting:
            cmd.append("--linting")
        if request.config.enableSecurity:
            cmd.append("--security")
        if request.config.enableDocker:
            cmd.append("--docker")
        if request.config.enableCICD:
            cmd.append("--cicd")
        
        # Store task info
        generation_tasks[generation_id] = {
            "id": generation_id,
            "status": "running",
            "config": request.config.dict(),
            "started_at": datetime.utcnow(),
            "command": cmd
        }
        
        # Run generation in background
        background_tasks.add_task(run_generation_task, generation_id, cmd, output_dir)
        
        package_path = os.path.join(output_dir, request.config.packageName)
        
        return GenerationResponse(
            success=True,
            generationId=generation_id,
            packagePath=package_path,
            metadata={
                "status": "running",
                "started_at": datetime.utcnow().isoformat(),
                "estimated_completion": (datetime.utcnow() + timedelta(minutes=2)).isoformat()
            },
            files=[]
        )
        
    except Exception as e:
        logger.error(f"Generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

async def run_generation_task(generation_id: str, command: List[str], output_dir: str):
    """Background task to run package generation"""
    try:
        result = await run_node_command(command)
        
        # Update task status
        generation_tasks[generation_id].update({
            "status": "completed" if result["success"] else "failed",
            "completed_at": datetime.utcnow(),
            "result": result,
            "output_dir": output_dir
        })
        
        if result["success"]:
            # Collect generated files
            files = []
            if os.path.exists(output_dir):
                for root, dirs, filenames in os.walk(output_dir):
                    for filename in filenames:
                        files.append(os.path.join(root, filename))
            
            generation_tasks[generation_id]["files"] = files
            
    except Exception as e:
        generation_tasks[generation_id].update({
            "status": "failed",
            "completed_at": datetime.utcnow(),
            "error": str(e)
        })

@app.get("/api/v1/generate/{generation_id}")
async def get_generation_status(generation_id: str, token: str = Depends(verify_auth)):
    """Get the status of a package generation"""
    if generation_id not in generation_tasks:
        raise HTTPException(status_code=404, detail="Generation not found")
    
    task = generation_tasks[generation_id]
    return {
        "generationId": generation_id,
        "status": task["status"],
        "started_at": task["started_at"].isoformat(),
        "completed_at": task.get("completed_at", {}).isoformat() if task.get("completed_at") else None,
        "config": task["config"],
        "files": task.get("files", []),
        "result": task.get("result", {}),
        "error": task.get("error")
    }

@app.post("/api/v1/analyze", response_model=AnalysisResponse)
async def analyze_package(
    request: AnalysisRequest,
    background_tasks: BackgroundTasks,
    token: str = Depends(verify_auth)
):
    """Analyze an existing package"""
    analysis_id = str(uuid.uuid4())
    
    try:
        if not os.path.exists(request.packagePath):
            raise HTTPException(status_code=400, detail="Package path does not exist")
        
        # Prepare analysis command
        node_path = get_node_executable()
        cli_path = os.path.join(os.path.dirname(__file__), "../dist/cli/index.js")
        
        cmd = [
            node_path, cli_path, "analyze",
            request.packagePath,
            "--type", request.analysisType,
            "--json"
        ]
        
        if request.includeRecommendations:
            cmd.append("--recommendations")
        
        # Store task info
        analysis_tasks[analysis_id] = {
            "id": analysis_id,
            "status": "running",
            "package_path": request.packagePath,
            "analysis_type": request.analysisType,
            "started_at": datetime.utcnow(),
            "command": cmd
        }
        
        # Run analysis in background
        background_tasks.add_task(run_analysis_task, analysis_id, cmd)
        
        return AnalysisResponse(
            success=True,
            analysisId=analysis_id,
            qualityScore=0.0,  # Will be updated when complete
            securityScore=0.0,
            performanceScore=0.0,
            maintainabilityScore=0.0,
            metrics={"status": "running"},
            recommendations=[],
            insights=[],
            warnings=[]
        )
        
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

async def run_analysis_task(analysis_id: str, command: List[str]):
    """Background task to run package analysis"""
    try:
        result = await run_node_command(command)
        
        analysis_result = {}
        if result["success"] and result["stdout"]:
            try:
                analysis_result = json.loads(result["stdout"])
            except json.JSONDecodeError:
                analysis_result = {"error": "Failed to parse analysis result"}
        
        # Update task status
        analysis_tasks[analysis_id].update({
            "status": "completed" if result["success"] else "failed",
            "completed_at": datetime.utcnow(),
            "result": result,
            "analysis_result": analysis_result
        })
        
    except Exception as e:
        analysis_tasks[analysis_id].update({
            "status": "failed",
            "completed_at": datetime.utcnow(),
            "error": str(e)
        })

@app.get("/api/v1/analyze/{analysis_id}")
async def get_analysis_status(analysis_id: str, token: str = Depends(verify_auth)):
    """Get the status of a package analysis"""
    if analysis_id not in analysis_tasks:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    task = analysis_tasks[analysis_id]
    return {
        "analysisId": analysis_id,
        "status": task["status"],
        "started_at": task["started_at"].isoformat(),
        "completed_at": task.get("completed_at", {}).isoformat() if task.get("completed_at") else None,
        "package_path": task["package_path"],
        "analysis_type": task["analysis_type"],
        "result": task.get("analysis_result", {}),
        "error": task.get("error")
    }

@app.post("/api/v1/publish", response_model=PublishResponse)
async def publish_package(
    request: PublishRequest,
    background_tasks: BackgroundTasks,
    token: str = Depends(verify_auth)
):
    """Publish a package to npm registry"""
    publish_id = str(uuid.uuid4())
    
    try:
        if not os.path.exists(request.packagePath):
            raise HTTPException(status_code=400, detail="Package path does not exist")
        
        # Prepare publish command
        npm_path = get_npm_executable()
        
        cmd = [npm_path, "publish"]
        
        if request.dryRun:
            cmd.append("--dry-run")
        
        if request.isPublic:
            cmd.extend(["--access", "public"])
        
        if request.tag != "latest":
            cmd.extend(["--tag", request.tag])
        
        # Store task info
        publish_tasks[publish_id] = {
            "id": publish_id,
            "status": "running",
            "package_path": request.packagePath,
            "registry": request.registry,
            "started_at": datetime.utcnow(),
            "command": cmd
        }
        
        # Run publish in background
        background_tasks.add_task(run_publish_task, publish_id, cmd, request.packagePath)
        
        return PublishResponse(
            success=True,
            publishId=publish_id,
            packageUrl=None,  # Will be updated when complete
            version="unknown",  # Will be updated when complete
            registry=request.registry,
            errors=[]
        )
        
    except Exception as e:
        logger.error(f"Publish failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Publish failed: {str(e)}")

async def run_publish_task(publish_id: str, command: List[str], package_path: str):
    """Background task to run package publishing"""
    try:
        result = await run_node_command(command, cwd=package_path)
        
        # Update task status
        publish_tasks[publish_id].update({
            "status": "completed" if result["success"] else "failed",
            "completed_at": datetime.utcnow(),
            "result": result
        })
        
    except Exception as e:
        publish_tasks[publish_id].update({
            "status": "failed",
            "completed_at": datetime.utcnow(),
            "error": str(e)
        })

@app.get("/api/v1/publish/{publish_id}")
async def get_publish_status(publish_id: str, token: str = Depends(verify_auth)):
    """Get the status of a package publish"""
    if publish_id not in publish_tasks:
        raise HTTPException(status_code=404, detail="Publish not found")
    
    task = publish_tasks[publish_id]
    return {
        "publishId": publish_id,
        "status": task["status"],
        "started_at": task["started_at"].isoformat(),
        "completed_at": task.get("completed_at", {}).isoformat() if task.get("completed_at") else None,
        "package_path": task["package_path"],
        "registry": task["registry"],
        "result": task.get("result", {}),
        "error": task.get("error")
    }

@app.post("/api/v1/optimize", response_model=OptimizationResponse)
async def optimize_package(
    request: OptimizationRequest,
    token: str = Depends(verify_auth)
):
    """Optimize a package for performance, bundle size, or security"""
    optimization_id = str(uuid.uuid4())
    
    try:
        if not os.path.exists(request.packagePath):
            raise HTTPException(status_code=400, detail="Package path does not exist")
        
        # Prepare optimization command
        node_path = get_node_executable()
        cli_path = os.path.join(os.path.dirname(__file__), "../dist/cli/index.js")
        
        cmd = [
            node_path, cli_path, "optimize",
            request.packagePath,
            "--type", request.optimizationType,
            "--level", request.aggressiveness,
            "--json"
        ]
        
        result = await run_node_command(cmd)
        
        optimization_result = {}
        if result["success"] and result["stdout"]:
            try:
                optimization_result = json.loads(result["stdout"])
            except json.JSONDecodeError:
                optimization_result = {"error": "Failed to parse optimization result"}
        
        return OptimizationResponse(
            success=result["success"],
            optimizationId=optimization_id,
            improvements=optimization_result.get("improvements", []),
            metrics=optimization_result.get("metrics", {}),
            recommendations=optimization_result.get("recommendations", [])
        )
        
    except Exception as e:
        logger.error(f"Optimization failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

@app.get("/api/v1/templates")
async def list_templates(token: str = Depends(verify_auth)):
    """List available package templates"""
    try:
        node_path = get_node_executable()
        cli_path = os.path.join(os.path.dirname(__file__), "../dist/cli/index.js")
        
        cmd = [node_path, cli_path, "template", "--list", "--json"]
        result = await run_node_command(cmd)
        
        if result["success"] and result["stdout"]:
            try:
                templates = json.loads(result["stdout"])
                return {"success": True, "templates": templates}
            except json.JSONDecodeError:
                return {"success": False, "error": "Failed to parse templates"}
        
        return {"success": False, "error": result["stderr"]}
        
    except Exception as e:
        logger.error(f"Template listing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Template listing failed: {str(e)}")

@app.post("/api/v1/templates/{template_id}", response_model=TemplateResponse)
async def generate_from_template(
    template_id: str,
    request: TemplateRequest,
    token: str = Depends(verify_auth)
):
    """Generate a package from a template"""
    try:
        node_path = get_node_executable()
        cli_path = os.path.join(os.path.dirname(__file__), "../dist/cli/index.js")
        
        # Create config file
        config_file = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
        json.dump(request.config, config_file)
        config_file.close()
        
        cmd = [
            node_path, cli_path, "template",
            "--generate", template_id,
            "--config", config_file.name,
            "--output", request.outputDir
        ]
        
        result = await run_node_command(cmd)
        
        # Clean up config file
        os.unlink(config_file.name)
        
        if result["success"]:
            # Collect generated files
            files = []
            if os.path.exists(request.outputDir):
                for root, dirs, filenames in os.walk(request.outputDir):
                    for filename in filenames:
                        files.append(os.path.join(root, filename))
            
            return TemplateResponse(
                success=True,
                templateId=template_id,
                outputPath=request.outputDir,
                files=files
            )
        else:
            raise HTTPException(status_code=500, detail=result["stderr"])
        
    except Exception as e:
        logger.error(f"Template generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Template generation failed: {str(e)}")

@app.post("/api/v1/ultrathink", response_model=UltraThinkResponse)
async def ultrathink_generate(
    request: UltraThinkRequest,
    token: str = Depends(verify_auth)
):
    """Generate creative solutions using UltraThink AI"""
    thinking_id = str(uuid.uuid4())
    
    try:
        node_path = get_node_executable()
        cli_path = os.path.join(os.path.dirname(__file__), "../dist/cli/index.js")
        
        cmd = [
            node_path, cli_path, "ultrathink",
            "--idea", request.idea,
            "--creativity", str(request.creativity),
            "--depth", str(request.depth),
            "--json"
        ]
        
        if request.context:
            cmd.extend(["--context", request.context])
        
        result = await run_node_command(cmd)
        
        if result["success"] and result["stdout"]:
            try:
                thinking_result = json.loads(result["stdout"])
                return UltraThinkResponse(
                    success=True,
                    thinkingId=thinking_id,
                    solutions=thinking_result.get("solutions", []),
                    insights=thinking_result.get("insights", []),
                    recommendations=thinking_result.get("recommendations", [])
                )
            except json.JSONDecodeError:
                raise HTTPException(status_code=500, detail="Failed to parse UltraThink result")
        else:
            raise HTTPException(status_code=500, detail=result["stderr"])
        
    except Exception as e:
        logger.error(f"UltraThink failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"UltraThink failed: {str(e)}")

@app.get("/api/v1/metrics")
async def get_metrics(token: str = Depends(verify_auth)):
    """Get API usage metrics and statistics"""
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "tasks": {
            "generations": {
                "total": len(generation_tasks),
                "running": len([t for t in generation_tasks.values() if t["status"] == "running"]),
                "completed": len([t for t in generation_tasks.values() if t["status"] == "completed"]),
                "failed": len([t for t in generation_tasks.values() if t["status"] == "failed"])
            },
            "analyses": {
                "total": len(analysis_tasks),
                "running": len([t for t in analysis_tasks.values() if t["status"] == "running"]),
                "completed": len([t for t in analysis_tasks.values() if t["status"] == "completed"]),
                "failed": len([t for t in analysis_tasks.values() if t["status"] == "failed"])
            },
            "publishes": {
                "total": len(publish_tasks),
                "running": len([t for t in publish_tasks.values() if t["status"] == "running"]),
                "completed": len([t for t in publish_tasks.values() if t["status"] == "completed"]),
                "failed": len([t for t in publish_tasks.values() if t["status"] == "failed"])
            }
        },
        "system": {
            "node_available": bool(get_node_executable()),
            "npm_available": bool(get_npm_executable()),
            "temp_dir": tempfile.gettempdir()
        }
    }

@app.delete("/api/v1/cleanup")
async def cleanup_tasks(token: str = Depends(verify_auth)):
    """Clean up completed and failed tasks"""
    initial_counts = {
        "generations": len(generation_tasks),
        "analyses": len(analysis_tasks),
        "publishes": len(publish_tasks)
    }
    
    # Remove completed and failed tasks older than 1 hour
    cutoff_time = datetime.utcnow() - timedelta(hours=1)
    
    # Clean generation tasks
    to_remove = [
        task_id for task_id, task in generation_tasks.items()
        if task["status"] in ["completed", "failed"] and 
        task.get("completed_at", datetime.utcnow()) < cutoff_time
    ]
    for task_id in to_remove:
        del generation_tasks[task_id]
    
    # Clean analysis tasks
    to_remove = [
        task_id for task_id, task in analysis_tasks.items()
        if task["status"] in ["completed", "failed"] and 
        task.get("completed_at", datetime.utcnow()) < cutoff_time
    ]
    for task_id in to_remove:
        del analysis_tasks[task_id]
    
    # Clean publish tasks
    to_remove = [
        task_id for task_id, task in publish_tasks.items()
        if task["status"] in ["completed", "failed"] and 
        task.get("completed_at", datetime.utcnow()) < cutoff_time
    ]
    for task_id in to_remove:
        del publish_tasks[task_id]
    
    final_counts = {
        "generations": len(generation_tasks),
        "analyses": len(analysis_tasks),
        "publishes": len(publish_tasks)
    }
    
    return {
        "success": True,
        "cleaned": {
            "generations": initial_counts["generations"] - final_counts["generations"],
            "analyses": initial_counts["analyses"] - final_counts["analyses"],
            "publishes": initial_counts["publishes"] - final_counts["publishes"]
        },
        "remaining": final_counts
    }

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "status_code": 500,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 