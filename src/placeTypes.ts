export type PlaceType =
  "transitstations" |
  "airports" |
  "museums" |
  "movietheaters" |
  "hospitals" |
  "libraries" |
  "zoos" |
  "aquariums" |
  "parks" |
  "graveyards" |
  "custompins";

type Place = {
  singularLabel: string,
  pluralLabel: string,
  key: PlaceType,
}

export const places: Place[] = [
  {
    pluralLabel: "Transit Stations",
    singularLabel: "Transit Station",
    key: "transitstations",
  },
  {
    pluralLabel: "Airports",
    singularLabel: "Airport",
    key: "airports",
  },
  {
    pluralLabel: "Museums",
    singularLabel: "Museum",
    key: "museums",
  },
  {
    pluralLabel: "Movie Theaters",
    singularLabel: "Movie Thearer",
    key: "movietheaters",
  },
  {
    pluralLabel: "Hospitals",
    singularLabel: "Hospital",
    key: "hospitals",
  },
  {
    pluralLabel: "Libraries",
    singularLabel: "Library",
    key: "libraries",
  },
  {
    pluralLabel: "Zoos",
    singularLabel: "Zoo",
    key: "zoos",
  },
  {
    pluralLabel: "Aquariums",
    singularLabel: "Aquarium",
    key: "aquariums",
  },
  {
    pluralLabel: "Parks",
    singularLabel: "Park",
    key: "parks",
  },
  {
    pluralLabel: "Graveyards",
    singularLabel: "Graveyard",
    key: "graveyards",
  },
  {
    pluralLabel: "Custom Pins",
    singularLabel: "Custom Pin",
    key: "custompins"
  },
];

type ColorDict = { [place in PlaceType]: string };
export const colors: ColorDict = {
  "transitstations": "#5E3408",
  "airports": "#FFFCF2",
  "museums": "#0D3B66",
  "movietheaters": "#F4D666",
  "hospitals": "#EB5E28",
  "libraries": "#FAF0CA",
  "zoos": "#A663CC",
  "aquariums": "#669BBC",
  "parks": "#84A98C",
  "graveyards": "#03071E",
  "custompins": "#C2095A",
}

export const getImagePathFor = (placeType: PlaceType): string => 'images/markers/' + placeType + '.png';
