# -*- coding: utf-8 -*-
"""
Created on Thu Nov 29 18:53:41 2018

@author: bszabo
"""


import json
from mpl_toolkits.basemap import Basemap
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans

size = (15, 15)
#filetype = ".svg"
filetype = ".png"
markersize = 1

colors = ['red', 'sienna','chartreuse','lightseagreen','lime','orangered','cyan','slateblue','magenta','yellow']

def calcAvgLoc(scientist):
    if len(scientist['places']) == 0:
        return (scientist['birthplace']['long'], scientist['birthplace']['lat'])
    
    
    longsum = 0
    latsum = 0
    for location in scientist['places']:
        longsum += location['long']
        latsum += location['lat']
        
    longsum /= len(scientist['places'])
    latsum /= len(scientist['places'])
    
    long = (scientist['birthplace']['long'] + longsum) / 2
    lat = (scientist['birthplace']['lat'] + latsum) / 2
    
    return (long, lat)


def clusterLocations(data):
    X = []
    for scientist in data['data']:
        X.append((scientist['birthplace']['long'], scientist['birthplace']['lat']))
        for location in scientist['places']:
            X.append((location['long'], location['lat']))
    
    kmeans = KMeans(n_clusters=10).fit(X)
    labels = kmeans.labels_
    
    plt.figure(figsize=size)
    map = Basemap(projection='mill', llcrnrlat=-90,urcrnrlat=90, llcrnrlon=-180,urcrnrlon=180)
    
#    for i in range(0, len(data['data'])):
#        scientist = data['data'][i]
#        long, lat = map(scientist['birthplace']['long'], scientist['birthplace']['lat'])
#        map.plot(long, lat, marker='.', color=colors[labels[i]], alpha = 1, markersize=10)
#        for location in scientist['places']:
#            long, lat = map(location['long'], location['lat'])
#            map.plot(long, lat, marker='.', color=colors[labels[i]], alpha = 1, markersize=10)
    
    i = 0
    for x in X:
        long, lat = map(x[0], x[1])
        map.plot(long, lat, marker='.', color=colors[labels[i]], alpha = 1, markersize=markersize)
        i += 1
            
    map.drawmapboundary(fill_color='white')
    map.fillcontinents(color='black', zorder=1)
    plt.savefig("scientists_location_clusters" + filetype)
    print("Map of location clusters created.")
    
    
    
def clusterAvgLocations(data):
    X = []
    
    for scientist in data['data']:
        avglocation = calcAvgLoc(scientist)
        X.append(avglocation)
        
    kmeans = KMeans(n_clusters=10).fit(X)
    labels = kmeans.labels_
    
    plt.figure(figsize=size)
    map = Basemap(projection='mill', llcrnrlat=-90,urcrnrlat=90, llcrnrlon=-180,urcrnrlon=180)
    
    for i in range(0, len(X)):
        long, lat = map(X[i][0], X[i][1])
        map.plot(long, lat, marker='.', color=colors[labels[i]], alpha = 1, markersize=markersize)
        
    map.drawmapboundary(fill_color='white')
    map.fillcontinents(color='black', zorder=1)
    plt.savefig("scientists_location_avg" + filetype)
    print("Map of avarage location clusters created.")
    
    labeled = []
    for i in range(0, 10):
        labeled.append([])

    for i in range(0, len(labels)):
        labeled[labels[i]].append(i)
        
    for i in range(0, 10):
        plt.figure(figsize=size)
        map = Basemap(projection='mill', llcrnrlat=-90,urcrnrlat=90, llcrnrlon=-180,urcrnrlon=180)
        for j in labeled[i]:
            scientist = data['data'][j]
            long, lat = map(scientist['birthplace']['long'], scientist['birthplace']['lat'])
            map.plot(long, lat, marker='.', color='red', alpha = 1, markersize=markersize)
            for location in scientist['places']:
                long, lat = map(location['long'], location['lat'])
                map.plot(long, lat, marker='.', color='red', alpha = 1, markersize=markersize)
                
        map.drawmapboundary(fill_color='white')
        map.fillcontinents(color='black', zorder=1)
        plt.savefig("scientists_location_avg_cluster" + str(i) + filetype)
        print("Map of avg cluster " + str(i) + " created.")
    
    
    

dataset = "scientists_data_full.json"

with open(dataset, mode='r', encoding='utf-8') as content:
    data = json.loads(content.read())
    

clusterLocations(data)
clusterAvgLocations(data)  
    