from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.jobs.tasks import (
    task_hourly_ingestion,
    task_daily_forecast_generation,
    task_weekly_model_retrain,
    task_periodic_forecast_evaluation,
    run_sync,
)

scheduler: BackgroundScheduler = None


def get_scheduler() -> BackgroundScheduler:
    global scheduler
    if scheduler is None:
        scheduler = BackgroundScheduler(timezone="UTC")
    return scheduler


def start_scheduler() -> None:
    """Configures and starts background scheduled weather jobs."""
    if not settings.SCHEDULER_ENABLED:
        logger.info("Background scheduler is disabled in settings.")
        return

    sched = get_scheduler()

    # 1. Hourly: Ingest new observations for tracked stations
    sched.add_job(
        run_sync(task_hourly_ingestion),
        trigger=CronTrigger(minute=5, timezone="UTC"),
        id="hourly_weather_ingestion",
        name="Hourly Observation Ingestion",
        max_instances=1,
        coalesce=True,
        replace_existing=True,
    )

    # 2. Daily: Generate and persist 24h & 7d forecasts
    sched.add_job(
        run_sync(task_daily_forecast_generation),
        trigger=CronTrigger(hour=0, minute=15, timezone="UTC"),
        id="daily_forecast_generation",
        name="Daily Forecast Generation",
        max_instances=1,
        coalesce=True,
        replace_existing=True,
    )

    # 3. Weekly: Retrain ML models
    sched.add_job(
        run_sync(task_weekly_model_retrain),
        trigger=CronTrigger(day_of_week="sun", hour=2, minute=0, timezone="UTC"),
        id="weekly_model_retrain",
        name="Weekly Model Retraining",
        max_instances=1,
        coalesce=True,
        replace_existing=True,
    )

    # 4. Periodically (Every 6h): Compare saved forecasts with actual observations
    sched.add_job(
        run_sync(task_periodic_forecast_evaluation),
        trigger=CronTrigger(hour="*/6", minute=30, timezone="UTC"),
        id="periodic_forecast_evaluation",
        name="Periodic Forecast Evaluation",
        max_instances=1,
        coalesce=True,
        replace_existing=True,
    )

    sched.start()
    logger.info("APScheduler background pipeline started successfully.")


def shutdown_scheduler() -> None:
    """Gracefully shuts down scheduler."""
    global scheduler
    if scheduler and scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped.")
