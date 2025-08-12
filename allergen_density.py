import geopandas as gpd
import pandas as pd
import numpy as np

#########################
# Initial data processing
#########################

# read in the trees data
gdf = gpd.read_file('data/CITY_TREES.geojson')
gdf['lat'] = gdf.geometry.y
gdf['lon'] = gdf.geometry.x

# generate a sorted list of trees
excluded_values = [
    '',' ','unknown','unknown tree','test','Do not plant','N/A','Other','Stump','Vacant',
    'Vacant - Retired/Obsolete','Vacant site medium','Vacant site small','Vamcant'
    ]

unique_trees = sorted( set(gdf.COMMON.dropna()) - set(excluded_values) )

###################################
# On-demand functions
###################################

def handle_sent_coords(coords):
    # take in coords, return json with density rings for each tree
    [lat,lon] = [float(coords[0]), float(coords[1])]
    print('handle_sent_coords() received coords:',[lat,lon])
    gdf['feet_to_location'] = haversine_vectorized(lat, lon, gdf.lat, gdf.lon)
    #todo: convert raw counts to densities
    density_by_tree = gdf.groupby('COMMON').agg(
        le_500=  ('feet_to_location', lambda x: (x <= 500 ).sum()),
        le_1000= ('feet_to_location', lambda x: (x <= 1000).sum()),
        le_2500= ('feet_to_location', lambda x: (x <= 2500).sum()),
        citywide=('feet_to_location', lambda x: (x > -1   ).sum())
    )
    
    return density_by_tree

# helper functions
def haversine_vectorized(lat1, lon1, lat2, lon2, earth_radius=20_925_525):
    lat1 = np.radians(lat1)
    lon1 = np.radians(lon1)
    lat2 = np.radians(lat2)
    lon2 = np.radians(lon2)

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = np.sin(dlat / 2.0)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2.0)**2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
    return c * earth_radius

def calc_density(df, coords, radius_ft=1000):
    # radius provided in feet, density provided in count per sq mi
    [lat, lon] = coords
    count = np.sum(df.feet_to_location <= radius_ft)
    sq_mi = np.pi * radius_ft**2 / 27_878_400
    return count / sq_mi