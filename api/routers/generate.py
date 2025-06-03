"""
Package generation endpoints with advanced features
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from typing import Dict, Any, Optional
import asyncio
import uuid
from datetime import datetime
from pydantic import BaseModel, Field

from ..services.package_generator import PackageGeneratorService
from ..services.ai_service import AIService
from ..models.package import PackageGenerationRequest, PackageGenerationResponse
from ..utils.auth import get_current_user
from ..utils.cache import cache_manager
from ..utils.monitoring import monitor_endpoint

router = APIRouter(prefix="/generate", tags=["Generation"])

class GenerationStatus(BaseModel):
    task_id: str
    status: str
    progress: int
    stage: str
    message: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: datetime
    updated_at: datetime

# In-memory task storage (use Redis in production)
generation_tasks: Dict[str, GenerationStatus] = {}

@router.post("/", response_model=PackageGenerationResponse)
@monitor_endpoint
async def generate_package(
    request: PackageGenerationRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict = Depends(get_current_user)
):
    """Generate a new npm package using AI"""
    
    # Create task ID
    task_id = str(uuid.uuid4())
    
    # Initialize task status
    generation_tasks[task_id] = GenerationStatus(
        task_id=task_id,
        status="pending",
        progress=0,
        stage="initialization",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    # Start generation in background
    background_tasks.add_task(
        generate_package_async,
        task_id,
        request,
        current_user["user_id"]
    )
    
    return PackageGenerationResponse(
        task_id=task_id,
        status="accepted",
        message="Package generation started",
        websocket_url=f"/ws/tasks/{task_id}"
    )

async def generate_package_async(
    task_id: str,
    request: PackageGenerationRequest,
    user_id: str
):
    """Async package generation with progress updates"""
    
    generator = PackageGeneratorService()
    ai_service = AIService()
    
    try:
        # Update progress: Starting
        update_task_status(task_id, "in_progress", 10, "analyzing_requirements")
        
        # Analyze package idea with AI
        analysis = await ai_service.analyze_idea(
            request.idea,
            request.complexity,
            request.priorities
        )
        
        # Update progress: Analysis complete
        update_task_status(task_id, "in_progress", 30, "generating_structure")
        
        # Generate package structure
        package_config = {
            "name": request.package_name or analysis["suggested_name"],
            "description": request.description or analysis["description"],
            "type": request.package_type or analysis["suggested_type"],
            "features": analysis["recommended_features"],
            "dependencies": analysis["recommended_dependencies"]
        }
        
        # Update progress: Generating code
        update_task_status(task_id, "in_progress", 50, "generating_code")
        
        # Generate source code with AI
        source_files = await ai_service.generate_source_code(
            package_config,
            request.ai_config
        )
        
        # Update progress: Setting up tests
        update_task_status(task_id, "in_progress", 70, "generating_tests")
        
        # Generate tests
        if request.enable_testing:
            test_files = await ai_service.generate_tests(
                source_files,
                package_config
            )
        
        # Update progress: Finalizing
        update_task_status(task_id, "in_progress", 90, "finalizing_package")
        
        # Create final package
        result = await generator.create_package(
            package_config,
            source_files,
            test_files if request.enable_testing else []
        )
        
        # Update progress: Complete
        update_task_status(
            task_id, 
            "completed", 
            100, 
            "done",
            result=result
        )
        
        # Cache result
        await cache_manager.set(
            f"package:{task_id}",
            result,
            expire=3600  # 1 hour
        )
        
    except Exception as e:
        update_task_status(
            task_id,
            "failed",
            generation_tasks[task_id].progress,
            generation_tasks[task_id].stage,
            error=str(e)
        )

def update_task_status(
    task_id: str,
    status: str,
    progress: int,
    stage: str,
    message: Optional[str] = None,
    result: Optional[Dict[str, Any]] = None,
    error: Optional[str] = None
):
    """Update task status and notify via WebSocket"""
    
    if task_id in generation_tasks:
        task = generation_tasks[task_id]
        task.status = status
        task.progress = progress
        task.stage = stage
        task.message = message
        task.result = result
        task.error = error
        task.updated_at = datetime.utcnow()
        
        # TODO: Send WebSocket notification

@router.get("/status/{task_id}", response_model=GenerationStatus)
async def get_generation_status(task_id: str):
    """Get the status of a package generation task"""
    
    if task_id not in generation_tasks:
        # Check cache
        cached_result = await cache_manager.get(f"package:{task_id}")
        if cached_result:
            return GenerationStatus(
                task_id=task_id,
                status="completed",
                progress=100,
                stage="done",
                result=cached_result,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
        
        raise HTTPException(status_code=404, detail="Task not found")
    
    return generation_tasks[task_id]

@router.post("/ultrathink")
@monitor_endpoint
async def generate_with_ultrathink(
    request: PackageGenerationRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict = Depends(get_current_user)
):
    """Generate package using UltraThink advanced AI reasoning"""
    
    # Enhanced request with UltraThink
    enhanced_request = request.copy()
    enhanced_request.ai_config.enable_ultrathink = True
    enhanced_request.ai_config.enable_self_improvement = True
    enhanced_request.ai_config.max_iterations = 5
    
    return await generate_package(enhanced_request, background_tasks, current_user)

@router.post("/from-template/{template_id}")
async def generate_from_template(
    template_id: str,
    customization: Dict[str, Any],
    background_tasks: BackgroundTasks,
    current_user: Dict = Depends(get_current_user)
):
    """Generate package from a predefined template"""
    
    # Load template
    template = await load_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Create generation request from template
    request = PackageGenerationRequest(
        package_name=customization.get("name", template["default_name"]),
        description=customization.get("description", template["description"]),
        package_type=template["type"],
        enable_typescript=template.get("typescript", True),
        enable_testing=template.get("testing", True),
        ai_config={
            "model": "gpt-4o-mini",
            "temperature": 0.3
        }
    )
    
    return await generate_package(request, background_tasks, current_user)

async def load_template(template_id: str) -> Optional[Dict[str, Any]]:
    """Load template configuration"""
    
    # Mock template data (implement actual template loading)
    templates = {
        "typescript-library": {
            "default_name": "my-library",
            "description": "A TypeScript library",
            "type": "library",
            "typescript": True,
            "testing": True,
            "features": ["jest", "eslint", "prettier"]
        },
        "react-component": {
            "default_name": "my-component",
            "description": "A React component library",
            "type": "react-component",
            "typescript": True,
            "testing": True,
            "features": ["storybook", "jest", "rollup"]
        }
    }
    
    return templates.get(template_id) 