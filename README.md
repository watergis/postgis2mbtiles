# postgis2mbtiles
![](https://github.com/watergis/postgis2mbtiles/workflows/Node.js%20Package/badge.svg)
![GitHub](https://img.shields.io/github/license/watergis/postgis2mbtiles)

A module extracting the data from PostGIS to Geojson.

I created this module because I wanted to extract PostGIS data as GeoJSON format in order to use it for Mapbox Vector Tile.

After using this module to extract your data, you can upload GeoJSON data to [Mapbox Studio](https://studio.mapbox.com) as a Tileset.

Then, you can create style file for your vector tile and enjoy it!

## Preparation
This module uses [`tippecanoe`](https://github.com/mapbox/tippecanoe) to convert geojson files to mbtiles. Please make sure to install it before running.

for MacOS
```
$ brew install tippecanoe
```

for Ubuntu
```
$ git clone https://github.com/mapbox/tippecanoe.git
$ cd tippecanoe
$ make -j
$ make install
```


## Installation

```sh
$ npm install @watergis/postgis2mbtiles
```

## Example

```
$ npm run test
```

## Usage
See also [test.js](./test/test.js)
```js
const {postgis2mbtiles} = require('postgis2mbtiles');
const config = require('./config');

const pg2json = new postgis2mbtiles(config);
pg2json.run().then(res=>{
    console.log(res);
}).catch(err=>{
    console.log(err);
})
```
This module will return MBTiles file paths which are exported in your directory.


## Configuration

### Dababase Connection
Please put your PostGIS database settings as follow under `config.js`.
```js
db: {
    user:'postgres',
    password:'Your password',
    host:'localhost',
    post:5432,
    database:'Your database name',
},
```

### mbtiles's Setting
```js
mbtiles: __dirname + '/narok.mbtiles',
```

### Layers' Setting
```js
layers: [
    //Put your layer definition here.
    ]
```

Each layer definition should include the following information.
The below is just an example of Pipeline Layer.
```js
    name: 'pipeline', //Layer Name
    geojsonFileName: __dirname + '/pipeline.geojson', //Temporary working file path
    //The following SQL is the most important one which is able to extract PostGIS data as GeoJSON format.
    select: `
    SELECT row_to_json(featurecollection) AS json FROM (
        SELECT
            'FeatureCollection' AS type,
            array_to_json(array_agg(feature)) AS features
        FROM (
            SELECT
            'Feature' AS type,
            ST_AsGeoJSON(ST_TRANSFORM(ST_MakeValid(x.geom),4326))::json AS geometry,
            row_to_json((
                SELECT p FROM (
                SELECT
                    x.pipeid as fid,
                    a.name as pipetype,
                    x.pipesize,
                    b.name as material,
                    x.constructiondate,
                    x.insertdate,
                    x.updatedate,
                    x.isjica
                ) AS p
            )) AS properties
            FROM pipenet x
            INNER JOIN pipetype a
            ON x.pipetypeid = a.pipetypeid
            INNER JOIN material b
            ON x.materialid = b.materialid
            WHERE NOT ST_IsEmpty(x.geom)
        ) AS feature
        ) AS featurecollection
    `
},
```

```
copyright (c) 2020 Jin IGARASHI
```