from requests import post

nearby = post(
    url="https://areainsights.googleapis.com/v1:computeInsights",
    json={
        "insights": ["INSIGHT_PLACES"],
        "filter": {
            "locationFilter": {
                "circle": {
                    "radius": "1000",  # meters
                    "latLng": {"latitude": 38.8929403, "longitude": -77.0174532},
                }
            },
            "typeFilter": {"includedTypes": ["restaurant"]},
            "operatingStatus": ["OPERATING_STATUS_OPERATIONAL"],
            "priceLevels": ["PRICE_LEVEL_INEXPENSIVE"],
            "ratingFilter": {"minRating": 4.0, "maxRating": 5.0},
        },
    },
    headers={"X-Goog-Api-Key": ""},
)

print(nearby.json())

# nearby = gmaps.places_nearby(location=None,
#     radius=None,
#     keyword=None,
#     language=None,
#     min_price=None,
#     max_price=None,
#     name=None,
#     open_now=False,
#     rank_by=None,
#     type=None  # from https://developers.google.com/maps/documentation/places/web-service/legacy/supported_types
# )

# # Geocoding an address
# geocode_result = gmaps.geocode('1600 Amphitheatre Parkway, Mountain View, CA')

# # Look up an address with reverse geocoding
# reverse_geocode_result = gmaps.reverse_geocode((40.714224, -73.961452))

# # Request directions via public transit
# now = datetime.now()
# directions_result = gmaps.directions("Sydney Town Hall",
#                                      "Parramatta, NSW",
#                                      mode="transit",
#                                      departure_time=now)

# # Validate an address with address validation
# addressvalidation_result =  gmaps.addressvalidation(['1600 Amphitheatre Pk'],
#                                                     regionCode='US',
#                                                     locality='Mountain View',
#                                                     enableUspsCass=True)

# # Get an Address Descriptor of a location in the reverse geocoding response
# address_descriptor_result = gmaps.reverse_geocode((40.714224, -73.961452), enable_address_descriptor=True)
