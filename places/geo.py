from spherical_geometry import polygon
from astropy.constants import R_earth
from astropy import units
import matplotlib.pyplot as plt
from mpl_toolkits.basemap import Basemap, cm 
import numpy as np
import shapely.geometry as sgeom

import cartopy.crs as ccrs
import cartopy.io.shapereader as shpreader

from math import pi, cos

def add_meters(latitude: float, longitude: float, dx_meters: int, dy_meters: int) -> tuple[units.Quantity, units.Quantity]:
    dy = dy_meters / 1000.0
    dx = dx_meters / 1000.0
    new_latitude  = latitude  + (dy / R_earth.to_value(units.km)) * (180.0 / pi)
    new_longitude = longitude + (dx / R_earth.to_value(units.km)) * (180.0 / pi) / cos(latitude * pi/180.0)
    return (new_latitude * units.deg, new_longitude * units.deg)

def get_square_around(latitude: float, longitude: float, size_meters: int):
    center = [longitude * units.deg, latitude * units.deg]

    top_left_corner = add_meters(latitude, longitude, -size_meters, size_meters)
    top_right_corner = add_meters(latitude, longitude, size_meters, size_meters)
    bottom_right_corner = add_meters(latitude, longitude, size_meters, -size_meters)
    bottom_left_corner = add_meters(latitude, longitude, -size_meters, -size_meters)

    corners = (top_left_corner, top_right_corner, bottom_right_corner, bottom_left_corner)

    latitudes = np.array([item[0].to_value(units.deg) for item in corners])
    longitudes = np.array([item[1].to_value(units.deg) for item in corners])
 
    return polygon.SphericalPolygon.from_radec(
        longitudes, latitudes, center, degrees=True
    )


if __name__ == "__main__":
    sq = get_square_around(
        38.8929403,
        -77.0174532,
        1000
    )
    points = list(sq.points)[0]
    print(points)
    print(points[0][0] / pi * 180)
    print(points[0][1] / pi * 180)
    # map = Basemap(projection='ortho',lat_0=45,lon_0=-100,resolution='l')
    # # draw coastlines, country boundaries, fill continents.
    # map.drawcoastlines(linewidth=0.25)
    # map.drawcountries(linewidth=0.25)
    # map.fillcontinents(color='coral',lake_color='aqua')
    # # draw the edge of the map projection region (the projection limb)
    # map.drawmapboundary(fill_color='aqua')
    # # draw lat/lon grid lines every 30 degrees.
    # map.drawmeridians(np.arange(0,360,30))
    # map.drawparallels(np.arange(-90,90,30))

    # map.drawgreatcircle(
    #     points[0][0],
    #     points[0][1],
    #     points[1][0],
    #     points[1][1],
    # )
    fig = plt.figure()
    # to get the effect of having just the states without a map "background"
    # turn off the background patch and axes frame
    ax = fig.add_axes([0, 0, 1, 1], projection=ccrs.LambertConformal(),
                      frameon=False)
    ax.patch.set_visible(False)

    ax.set_extent([-125, -66.5, 20, 50], ccrs.Geodetic())

    shapename = 'admin_1_states_provinces_lakes'
    states_shp = shpreader.natural_earth(resolution='110m',
                                         category='cultural', name=shapename)

    ax.set_title('US States which intersect the track of '
                 'Hurricane Katrina (2005)')

    # turn the lons and lats into a shapely LineString
    track = sgeom.LineString([
        (points[0][1], points[0][0]),
        (points[1][1], points[1][0])
    ])
    ax.add_geometries(
        shpreader.Reader(states_shp).geometries(),
        ccrs.PlateCarree())

    # buffer the linestring by two degrees (note: this is a non-physical
    # distance)
    track_buffer = track.buffer(2)
    ax.add_geometries([track_buffer], ccrs.PlateCarree(),
                      facecolor='#C8A2C8', alpha=0.5)
    ax.add_geometries([track], ccrs.PlateCarree(),
                      facecolor='none', edgecolor='k')

    plt.show()
