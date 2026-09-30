import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.neo4j import neo4j_client
from app.models.dependency_relationship import DependencyRelationship
from app.models.service_account import ServiceAccount


logger = logging.getLogger(__name__)


def sync_user_graph(
    db: Session,
    user_id: UUID,
) -> dict[str, int]:
    """
    Synchronise one user's PostgreSQL digital dependency
    graph into Neo4j.

    PostgreSQL remains the system of record.
    Neo4j is the graph intelligence layer.
    """

    services = db.execute(
        select(ServiceAccount).where(
            ServiceAccount.user_id == user_id
        )
    ).scalars().all()

    dependencies = db.execute(
        select(DependencyRelationship).where(
            DependencyRelationship.user_id == user_id
        )
    ).scalars().all()

    user_key = str(user_id)

    with neo4j_client.driver.session(
        database=settings.neo4j_database
    ) as session:

        # Remove only this user's previous graph projection.
        session.run(
            """
            MATCH (asset:DigitalAsset {user_id: $user_id})
            DETACH DELETE asset
            """,
            user_id=user_key,
        ).consume()

        for service in services:
            session.run(
                """
                MERGE (asset:DigitalAsset {
                    id: $id,
                    user_id: $user_id
                })
                SET asset.name = $name,
                    asset.provider = $provider,
                    asset.service_type = $service_type,
                    asset.criticality = $criticality,
                    asset.is_active = $is_active
                """,
                id=str(service.id),
                user_id=user_key,
                name=service.name,
                provider=service.provider,
                service_type=service.service_type.value,
                criticality=service.criticality,
                is_active=service.is_active,
            ).consume()

        for dependency in dependencies:
            session.run(
                """
                MATCH (source:DigitalAsset {
                    id: $source_id,
                    user_id: $user_id
                })
                MATCH (target:DigitalAsset {
                    id: $target_id,
                    user_id: $user_id
                })
                MERGE (source)-[relationship:REQUIRED_BY {
                    dependency_id: $dependency_id
                }]->(target)
                SET relationship.relationship_type =
                        $relationship_type,
                    relationship.is_critical =
                        $is_critical
                """,
                source_id=str(
                    dependency.source_service_id
                ),
                target_id=str(
                    dependency.target_service_id
                ),
                user_id=user_key,
                dependency_id=str(dependency.id),
                relationship_type=(
                    dependency.relationship_type.value
                ),
                is_critical=dependency.is_critical,
            ).consume()

    return {
        "services_synced": len(services),
        "dependencies_synced": len(dependencies),
    }



def try_sync_user_graph(
    db: Session,
    user_id: UUID,
) -> bool:
    """
    Best-effort refresh of the user's Neo4j projection.

    PostgreSQL remains the source of truth. A temporary
    Neo4j failure must not undo an already committed
    PostgreSQL mutation.
    """
    try:
        sync_user_graph(
            db=db,
            user_id=user_id,
        )
        return True
    except Exception:
        logger.exception(
            "Neo4j graph projection sync failed for user %s.",
            user_id,
        )
        return False

def get_downstream_impacts(
    user_id: UUID,
    root_service_id: UUID,
) -> list[dict]:
    """
    Return all services that depend directly or indirectly
    on the supplied root service.

    REQUIRED_BY direction:
        source -> target
        target depends on source
    """

    with neo4j_client.driver.session(
        database=settings.neo4j_database
    ) as session:
        result = session.run(
            """
            MATCH path =
                (root:DigitalAsset {
                    id: $root_id,
                    user_id: $user_id
                })
                -[:REQUIRED_BY*1..]->
                (affected:DigitalAsset {
                    user_id: $user_id
                })
            RETURN
                affected.id AS id,
                affected.name AS name,
                affected.criticality AS criticality,
                min(length(path)) AS dependency_depth
            ORDER BY dependency_depth, affected.name
            """,
            root_id=str(root_service_id),
            user_id=str(user_id),
        )

        return [
            {
                "id": record["id"],
                "name": record["name"],
                "criticality": record["criticality"],
                "dependency_depth": (
                    record["dependency_depth"]
                ),
            }
            for record in result
        ]


def get_user_graph(user_id: UUID) -> dict:
    """
    Return the authenticated user's Neo4j dependency graph.
    """

    with neo4j_client.driver.session(
        database=settings.neo4j_database
    ) as session:
        node_result = session.run(
            """
            MATCH (asset:DigitalAsset {
                user_id: $user_id
            })
            RETURN
                asset.id AS id,
                asset.name AS name,
                asset.provider AS provider,
                asset.service_type AS service_type,
                asset.criticality AS criticality,
                asset.is_active AS is_active
            ORDER BY asset.name
            """,
            user_id=str(user_id),
        )

        nodes = [
            {
                "id": record["id"],
                "name": record["name"],
                "provider": record["provider"],
                "service_type": record["service_type"],
                "criticality": record["criticality"],
                "is_active": record["is_active"],
            }
            for record in node_result
        ]

        edge_result = session.run(
            """
            MATCH
                (source:DigitalAsset {
                    user_id: $user_id
                })
                -[relationship:REQUIRED_BY]->
                (target:DigitalAsset {
                    user_id: $user_id
                })
            RETURN
                relationship.dependency_id AS id,
                source.id AS source_service_id,
                target.id AS target_service_id,
                relationship.relationship_type
                    AS relationship_type,
                relationship.is_critical AS is_critical
            ORDER BY source.name, target.name
            """,
            user_id=str(user_id),
        )

        edges = [
            {
                "id": record["id"],
                "source_service_id": (
                    record["source_service_id"]
                ),
                "target_service_id": (
                    record["target_service_id"]
                ),
                "relationship_type": (
                    record["relationship_type"]
                ),
                "is_critical": record["is_critical"],
            }
            for record in edge_result
        ]

    return {
        "nodes": nodes,
        "edges": edges,
        "node_count": len(nodes),
        "edge_count": len(edges),
    }


def get_single_points_of_failure(
    user_id: UUID,
) -> list[dict]:
    """
    Identify assets whose failure can affect one or more
    downstream assets.

    Higher downstream_count means a wider blast radius.
    """

    with neo4j_client.driver.session(
        database=settings.neo4j_database
    ) as session:
        result = session.run(
            """
            MATCH (root:DigitalAsset {
                user_id: $user_id
            })
            OPTIONAL MATCH
                (root)-[:REQUIRED_BY*1..]->
                (affected:DigitalAsset {
                    user_id: $user_id
                })
            WITH
                root,
                count(DISTINCT affected)
                    AS downstream_count
            WHERE downstream_count > 0
            RETURN
                root.id AS id,
                root.name AS name,
                root.criticality AS criticality,
                downstream_count
            ORDER BY
                downstream_count DESC,
                root.criticality DESC,
                root.name
            """,
            user_id=str(user_id),
        )

        return [
            {
                "id": record["id"],
                "name": record["name"],
                "criticality": record["criticality"],
                "downstream_count": (
                    record["downstream_count"]
                ),
            }
            for record in result
        ]
