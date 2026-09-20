import logging
import time
import requests
from requests.adapters import HTTPAdapter

logger = logging.getLogger(__name__)

# Une session réutilise les connexions au lieu d'en ouvrir une par appel
session = requests.Session()
_adapter = HTTPAdapter(pool_connections=10, pool_maxsize=20)
session.mount('https://', _adapter)
session.mount('http://', _adapter)

MAX_ATTEMPTS = 3


def call_service(method, url, headers, body):
    # POST/PUT/DELETE : on ne rejoue que sur 429 (requête refusée avant traitement).
    # GET/HEAD : on rejoue aussi sur 502/503/504 (service en train de se réveiller).
    retry_on = {429, 502, 503, 504} if method in ('GET', 'HEAD') else {429}
    for attempt in range(1, MAX_ATTEMPTS + 1):
        response = session.request(
            method=method, url=url, headers=headers, data=body, timeout=(5, 60)
        )
        if response.status_code not in retry_on:
            return response
        logger.warning(
            "Reponse %s de %s (tentative %s/%s) en-tetes=%s corps=%r",
            response.status_code, url, attempt, MAX_ATTEMPTS,
            dict(response.headers), response.text[:200],
        )
        if attempt < MAX_ATTEMPTS:
            time.sleep(attempt)  # attend 1 s puis 2 s
    return response
