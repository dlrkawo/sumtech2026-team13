from pydantic import Field

from app.common.response import CamelModel


class ElementLocationResponse(CamelModel):
    is_found: bool
    x: int | None = None
    y: int | None = None
    box: list[int] = Field(default_factory=list)
    description: str
