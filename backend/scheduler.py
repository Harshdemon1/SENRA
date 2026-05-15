import os
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler(timezone="Asia/Kolkata")


@scheduler.scheduled_job("cron", hour=3, minute=0)
async def full_data_refresh():
    if os.getenv("USE_LIVE_DATA") != "true":
        logger.info("Scheduler: USE_LIVE_DATA=false — skipping live refresh")
        return
    try:
        from seed import refresh_once
        await refresh_once()
        logger.info("Scheduled data refresh complete")
    except Exception as e:
        logger.error("Scheduled refresh failed: %s", e)


def start_scheduler():
    if os.getenv("USE_LIVE_DATA") == "true":
        scheduler.start()
        logger.info("APScheduler started (3am IST daily refresh)")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
