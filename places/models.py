from dataclasses import dataclass
from dataclasses_json import dataclass_json, LetterCase

@dataclass_json
@dataclass
class Location:
    latitude: float
    longitude: float


@dataclass_json(letter_case=LetterCase.CAMEL)
@dataclass
class DisplayName:
    text: str
    language_code: str


@dataclass_json(letter_case=LetterCase.CAMEL)
@dataclass
class PlaceApiResponse:
    location: Location
    display_name: DisplayName


@dataclass_json
@dataclass
class PlaceFirebaseEntry:
    location: Location
    name: str    

    @staticmethod
    def from_api(place: PlaceApiResponse):
        return PlaceFirebaseEntry(place.location, place.display_name.text)

    def __hash__(self) -> int:
        return hash(self.name)
