from requests import post, get
from models import PlaceFirebaseEntry, PlaceApiResponse
from cache import get_place_by_place_id, save_place, save_list_for_region
from collections import defaultdict
from time import sleep


GOOG_API_KEY = ""

# We get 10k places lookups/month
# We get 5k place insights/month
API_USAGE = defaultdict(int)

PLACE_TYPES = {
    "airport": "airport",
    "museum": "museum",
    "theater": "movie_theater",
    "hospital": "hospital",
    "library": "library",
    "zoo": "zoo",
    "aquarium": "aquarium",
    "park": "park"
}


def get_place(place_id: str) -> PlaceFirebaseEntry | None:
    fb_result = get_place_by_place_id(place_id)
    if fb_result is not None:
        return fb_result
    api_result = get(
        url=f"https://places.googleapis.com/v1/places/{place_id}",
        headers={
            "X-Goog-Api-Key": GOOG_API_KEY,
            "Content-Type": "application/json",
            "X-Goog-FieldMask": "displayName,location",
        },
    )
    API_USAGE["place_lookup"] += 1
    sleep(0.1)
    json_result = api_result.json()
    print(f"Cache miss for place id={place_id} - loaded {json_result}")
    if "location" not in json_result or "displayName" not in json_result:
        print(f"Missing attribute for place ID={place_id}")
        return
    api_dataclass = PlaceApiResponse.from_dict(json_result)
    save_place(api_dataclass, place_id)
    return PlaceFirebaseEntry.from_api(api_dataclass)


def load_place(center_latitide: float, center_longitude: float, radius_meters: int, place_type: str, region_name: str, override: bool=True):
    places_nearby = post(
        url="https://areainsights.googleapis.com/v1:computeInsights",
        json={
            "insights": ["INSIGHT_PLACES"],
            "filter": {
                "locationFilter": {
                    "circle": {
                        "radius": str(radius_meters),  # meters
                        "latLng": {"latitude": center_latitide, "longitude": center_longitude},
                    }
                },
                "typeFilter": {"includedPrimaryTypes": [PLACE_TYPES[place_type]]},
                # "operatingStatus": ["OPERATING_STATUS_OPERATIONAL"],
            },
        },
        headers={"X-Goog-Api-Key": GOOG_API_KEY},
    )
    API_USAGE["place_insights"] += 1
    results = places_nearby.json()
    if 'placeInsights' in results:
        print(f"Loaded {len(results['placeInsights'])} locations for query type={place_type} region={region_name}")
        place_list = [p for p in [get_place(place['place'].replace("places/", "")) for place in results['placeInsights']] if p is not None]
        save_list_for_region(place_list, region_name, place_type, override)
    else:
        raise Exception("Too many places returned")


if __name__ == "__main__":
    # load_place(
    #     40.366396,
    #     -80.016047,
    #     16000,  # 10 miles
    #     "hospital",
    #     "pittsburgh_pa"
    # )
    
    # load_place(
    #     40.42081,
    #     -80.006928,
    #     5000,  # 3 miles
    #     "hospital",
    #     "pittsburgh_pa"
    # )

    # load_place(40.365419,
    #     -80.0261299999999,
    #     5000,  # 3 miles
    #     "hospital",
    #     "pittsburgh_pa",
    #     override=False
    # )

    load_place(40.3009089999999,
        -80.0314769999999,
        5000,  # 3 miles
        "hospital",
        "pittsburgh_pa",
        override=False
    )

    print("API usage:")
    print(API_USAGE)
