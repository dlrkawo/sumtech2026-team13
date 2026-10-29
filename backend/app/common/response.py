from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

T = TypeVar("T")


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class ApiResponse(CamelModel, Generic[T]):
    success: bool = True
    data: T | None = None
    message: str = "OK"


class ErrorResponse(CamelModel):
    success: bool = False
    data: None = None
    message: str
    code: str


def ok(data: T, message: str = "OK") -> ApiResponse[T]:
    return ApiResponse[T](data=data, message=message)
