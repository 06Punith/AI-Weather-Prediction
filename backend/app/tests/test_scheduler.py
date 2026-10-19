from backend.app.jobs.scheduler import get_scheduler, start_scheduler, shutdown_scheduler
from backend.app.core.config import settings


def test_scheduler_lifecycle():
    settings.SCHEDULER_ENABLED = True
    start_scheduler()
    sched = get_scheduler()

    assert sched.running is True
    job_ids = [j.id for j in sched.get_jobs()]
    assert "hourly_weather_ingestion" in job_ids
    assert "daily_forecast_generation" in job_ids
    assert "weekly_model_retrain" in job_ids
    assert "periodic_forecast_evaluation" in job_ids

    shutdown_scheduler()
    assert sched.running is False
    settings.SCHEDULER_ENABLED = False
