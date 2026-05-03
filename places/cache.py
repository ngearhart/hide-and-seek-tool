import firebase_admin
from firebase_admin import credentials, App, db
from functools import cache
from models import PlaceFirebaseEntry, PlaceApiResponse
import json

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

@cache
def initialize_firebase() -> App:
    cred = credentials.Certificate("serviceAccountKey.json")  
    
    return firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://hide-and-seek-64012-default-rtdb.firebaseio.com/'  
    })


@cache
def get_place_by_place_id(place_id: str) -> PlaceFirebaseEntry | None:
    initialize_firebase()
    ref = db.reference(f'/places/{place_id}')
    place = ref.get()
    if place is None:
        return None  # cache miss
    return PlaceFirebaseEntry.from_dict(place)

def save_place(place: PlaceApiResponse, place_id: str) -> None:
    initialize_firebase()
    ref = db.reference(f'/places/{place_id}')
    ref.set(PlaceFirebaseEntry.from_api(place).to_dict())

def save_list_for_region(place_list: list[PlaceFirebaseEntry], region_name: str, item_type: str, override: bool=True):
    initialize_firebase()
    ref = db.reference(f'/regions/{region_name}/{item_type}')
    if override:
        ref.set(
            PlaceFirebaseEntry.schema().dump(place_list, many=True)
        )
    else:
        existing_list = set(PlaceFirebaseEntry.schema().load(ref.get() or [], many=True))
        existing_list.update(place_list)
        ref.set(
            PlaceFirebaseEntry.schema().dump(existing_list, many=True)
        )

def load_list_for_region(region_name: str, place_type: str) -> list[PlaceFirebaseEntry]:
    initialize_firebase()
    ref = db.reference(f'/regions/{region_name}/{place_type}')
    return PlaceFirebaseEntry.schema().load(ref.get() or [], many=True)


# Test connection to Firebase
if __name__ == "__main__":
    initialize_firebase()
    print("converting")
    with open("../public/regions/pittsburgh_pa.geojson", "r") as infile:
        data = infile.read()
    json_data = json.loads(data)
    
    for place_type in PLACE_TYPES.keys():
        items = load_list_for_region("pittsburgh_pa", place_type)
        for place in items:
            json_data["features"].append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        place.location.longitude,
                        place.location.latitude
                    ]
                },
                "properties": {
                    "Name": place.name,
                    "Type": place_type
                }
            })
    
    with open("../public/regions/pittsburgh_pa.geojson", "w+") as outfile:
        outfile.write(json.dumps(json_data))

    # place = {'location': {'latitude': 38.900318, 'longitude': -77.021591}, 'displayName': {'text': 'Reren Lamen & Bar', 'languageCode': 'en'}}
    # save_place(PlaceApiResponse.from_dict(place), "ChIJ77MH9423t4kR1yI5zyphx9E")
    # print(get_place_by_place_id("test"))
