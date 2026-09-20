from pydantic import BaseModel, Field


class Features(BaseModel):

    # Input features required for Airbnb room type prediction.
    latitude: float = Field(
        ...,
        ge=-90,
        le=90,
        description="Latitude coordinate of the listing"
    )

    longitude: float = Field(
        ...,
        ge=-180,
        le=180,
        description="Longitude coordinate of the listing"
    )

    price: float = Field(
        ...,
        gt=0,
        description="Price per night"
    )

    minimum_nights: int = Field(
        ...,
        ge=1,
        le=365,
        description="Minimum number of nights required for booking"
    )

    number_of_reviews: int = Field(
        ...,
        ge=0,
        description="Total number of reviews"
    )

    reviews_per_month: float = Field(
        ...,
        ge=0,
        description="Average number of reviews per month"
    )

    calculated_host_listings_count: int = Field(
        ...,
        ge=0,
        description="Total number of listings managed by the host"
    )

    availability_365: int = Field(
        ...,
        ge=0,
        le=365,
        description="Number of available days in a year"
    )

    neighbourhood_group: str = Field(
        ...,
        min_length=1,
        description="Borough or neighbourhood group"
    )

    neighbourhood: str = Field(
        ...,
        min_length=1,
        description="Specific neighbourhood name"
    )