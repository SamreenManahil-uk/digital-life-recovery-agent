from collections import deque
from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True)
class DependencyEdge:
    source_service_id: UUID
    target_service_id: UUID


@dataclass(frozen=True)
class ImpactedService:
    service_id: UUID
    dependency_depth: int


class DependencyGraph:
    """
    Directed dependency graph.

    Semantic:
        source_service -> target_service

    means:

        target_service depends on source_service

    Example:

        Phone -> Gmail -> GitHub -> Vercel

    If Phone becomes unavailable:
        Phone  depth 0
        Gmail  depth 1
        GitHub depth 2
        Vercel depth 3
    """

    def __init__(self, edges: list[DependencyEdge]) -> None:
        self._adjacency: dict[UUID, set[UUID]] = {}

        for edge in edges:
            self._adjacency.setdefault(
                edge.source_service_id,
                set(),
            ).add(edge.target_service_id)

            self._adjacency.setdefault(
                edge.target_service_id,
                set(),
            )

    def calculate_cascade(
        self,
        root_service_id: UUID,
    ) -> list[ImpactedService]:
        """
        Calculate every service affected downstream from root.

        Breadth-first traversal guarantees that if multiple paths
        reach the same service, the shortest dependency depth wins.
        """

        queue: deque[tuple[UUID, int]] = deque(
            [(root_service_id, 0)]
        )

        visited: set[UUID] = set()

        impacts: list[ImpactedService] = []

        while queue:
            service_id, depth = queue.popleft()

            if service_id in visited:
                continue

            visited.add(service_id)

            impacts.append(
                ImpactedService(
                    service_id=service_id,
                    dependency_depth=depth,
                )
            )

            for dependent_service_id in self._adjacency.get(
                service_id,
                set(),
            ):
                if dependent_service_id not in visited:
                    queue.append(
                        (
                            dependent_service_id,
                            depth + 1,
                        )
                    )

        return impacts
