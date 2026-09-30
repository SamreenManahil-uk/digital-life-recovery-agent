import logging

from neo4j import GraphDatabase

from app.core.config import settings


logger = logging.getLogger(__name__)


class Neo4jClient:
    def __init__(self) -> None:
        self.driver = GraphDatabase.driver(
            settings.neo4j_uri,
            auth=(
                settings.neo4j_user,
                settings.neo4j_password,
            ),
        )

    def verify_connectivity(self) -> None:
        self.driver.verify_connectivity()

    def is_available(self) -> bool:
        """
        Return True when Neo4j is reachable.

        PostgreSQL remains the source of truth, so callers can
        use this check without making Neo4j a hard dependency.
        """
        try:
            self.verify_connectivity()
            return True
        except Exception:
            logger.exception(
                "Neo4j connectivity check failed."
            )
            return False

    def close(self) -> None:
        self.driver.close()


neo4j_client = Neo4jClient()
