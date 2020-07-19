require('dotenv').config();
const env = process.env;

const export_dir = env.export_dir || __dirname;
const srid = 21036;
const bounds = {
  narok : [812426.912,9874766.763, 824725.257,9886273.737],
  ololulunga: [785664.199,9881732.510, 804144.874,9896784.534],
  kilgoris:[705144.310,9886407.088,712355.048,9892300.895],
  suswa:[845132.373,9870063.657,898656.630,9921327.599],
}

module.exports = {
    db: {
      user:env.db_user,
      password:env.db_password,
      host:env.db_host,
      post:env.db_port,
      database:env.db_name,
    },
    mbtiles: export_dir + '/narok.mbtiles',
    minzoom: 10,
    maxzoom: 16,
    layers : [
        {
            name: 'pipeline',
            geojsonFileName: export_dir + '/pipeline.geojson',
            select: `
            WITH pipeline AS (
              SELECT * FROM pipenet WHERE geom && ST_MakeEnvelope(${bounds.narok.join(",")}, ${srid}) AND isjica = true
              UNION ALL
              SELECT * FROM pipenet WHERE geom && ST_MakeEnvelope(${bounds.ololulunga.join(",")}, ${srid})
              UNION ALL
              SELECT * FROM pipenet WHERE geom && ST_MakeEnvelope(${bounds.kilgoris.join(",")}, ${srid})
              UNION ALL
              SELECT * FROM pipenet WHERE geom && ST_MakeEnvelope(${bounds.suswa.join(",")}, ${srid})
            )
            SELECT row_to_json(featurecollection) AS json FROM (
                SELECT
                  'FeatureCollection' AS type,
                  array_to_json(array_agg(feature)) AS features
                FROM (
                  SELECT
                    'Feature' AS type,
                    ST_AsGeoJSON(ST_TRANSFORM(ST_MakeValid(x.geom),4326))::json AS geometry,
                    row_to_json((
                      SELECT t FROM (
                        SELECT
                          16 as maxzoom,
                          10 as minzoom
                      ) AS t
                    )) AS tippecanoe,
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
                          x."Town"
                      ) AS p
                    )) AS properties
                  FROM pipeline x
                  INNER JOIN pipetype a
                  ON x.pipetypeid = a.pipetypeid
                  INNER JOIN material b
                  ON x.materialid = b.materialid
                  WHERE NOT ST_IsEmpty(x.geom)
                ) AS feature
              ) AS featurecollection
            `
        },
        {
          name: 'meter',
          geojsonFileName: export_dir + '/meter.geojson',
          select:`
          SELECT row_to_json(featurecollection) AS json FROM (
            SELECT
              'FeatureCollection' AS type,
              array_to_json(array_agg(feature)) AS features
            FROM (
              SELECT
              'Feature' AS type,
              ST_AsGeoJSON(ST_TRANSFORM(x.geom,4326))::json AS geometry,
              row_to_json((
                SELECT t FROM (
                  SELECT
                    16 as maxzoom,
                    16 as minzoom
                ) AS t
              )) AS tippecanoe,
              row_to_json((
                SELECT p FROM (
                  SELECT
                  x.meterid as fid,
                  a.name as metertype,
                  x.pipesize as diameter,
                  x.zonecd,
                  CASE WHEN x.connno=-1 THEN NULL ELSE LPAD(CAST(x.connno as text), 4, '0') END as connno,
                  x.installationdate,
                  b.status,
                  x.serialno,
                  b.name as customer,
                  c.name as village,
                  x.insertdate,
                  x.updatedate,
                  x.isgrantprj as isjica
                ) AS p
              )) AS properties
              FROM meter x
              INNER JOIN metertype a
              ON x.metertypeid = a.metertypeid
              LEFT JOIN customer b
              ON x.zonecd = b.zonecd
              AND x.connno = b.connno
              LEFT JOIN village c
			        on b.villageid = c.villageid
              WHERE NOT ST_IsEmpty(x.geom) AND x.metertypeid = 1
            ) AS feature
          ) AS featurecollection
          `
        },
        {
          name: 'flowmeter',
          geojsonFileName: export_dir + '/flowmeter.geojson',
          select:`
          SELECT row_to_json(featurecollection) AS json FROM (
            SELECT
              'FeatureCollection' AS type,
              array_to_json(array_agg(feature)) AS features
            FROM (
              SELECT
              'Feature' AS type,
              ST_AsGeoJSON(ST_TRANSFORM(x.geom,4326))::json AS geometry,
              row_to_json((
                SELECT t FROM (
                  SELECT
                    16 as maxzoom,
                    14 as minzoom
                ) AS t
              )) AS tippecanoe,
              row_to_json((
                SELECT p FROM (
                  SELECT
                  x.meterid as fid,
                  a.name as metertype,
                  x.pipesize as diameter,
                  x.zonecd,
                  CASE WHEN x.connno=-1 THEN NULL ELSE LPAD(CAST(x.connno as text), 4, '0') END as connno,
                  x.installationdate,
                  b.status,
                  x.serialno,
                  b.name as customer,
                  c.name as village,
                  x.insertdate,
                  x.updatedate,
                  x.isgrantprj as isjica
                ) AS p
              )) AS properties
              FROM meter x
              INNER JOIN metertype a
              ON x.metertypeid = a.metertypeid
              LEFT JOIN customer b
              ON x.zonecd = b.zonecd
              AND x.connno = b.connno
              LEFT JOIN village c
			        on b.villageid = c.villageid
              WHERE NOT ST_IsEmpty(x.geom) AND x.metertypeid <> 1
            ) AS feature
          ) AS featurecollection
          `
        },
        {
          name: 'valve',
          geojsonFileName: export_dir + '/valve.geojson',
          select:`
          WITH valves AS (
            SELECT * FROM valve WHERE geom && ST_MakeEnvelope(${bounds.narok.join(",")}, ${srid}) AND isjica = true
            UNION ALL
            SELECT * FROM valve WHERE geom && ST_MakeEnvelope(${bounds.ololulunga.join(",")}, ${srid})
            UNION ALL
            SELECT * FROM valve WHERE geom && ST_MakeEnvelope(${bounds.kilgoris.join(",")}, ${srid})
            UNION ALL
            SELECT * FROM valve WHERE geom && ST_MakeEnvelope(${bounds.suswa.join(",")}, ${srid})
          )
          SELECT row_to_json(featurecollection) AS json FROM (
            SELECT
              'FeatureCollection' AS type,
              array_to_json(array_agg(feature)) AS features
            FROM (
              SELECT
              'Feature' AS type,
              ST_AsGeoJSON(ST_TRANSFORM(ST_MakeValid(x.geom),4326))::json AS geometry,
              row_to_json((
                SELECT t FROM (
                  SELECT
                    16 as maxzoom,
                    15 as minzoom
                ) AS t
              )) AS tippecanoe,
              row_to_json((
                SELECT p FROM (
                SELECT
                  x.valveid as fid,
                  a.name as valvetype,
                  x.pipesize as diameter,
                  x.installationdate,
                  CASE WHEN x.status = 1 THEN 'Closed' ELSE 'Opened' END as status,
                  x.insertdate,
                  x.updatedate,
                  x.isjica
                ) AS p
              )) AS properties
              FROM valves x
              INNER JOIN valvetype a
              ON x.valvetypeid = a.valvetypeid
              WHERE NOT ST_IsEmpty(x.geom)
            ) AS feature
          ) AS featurecollection
          `
        },
        {
          name: 'firehydrant',
          geojsonFileName: export_dir + '/firehydrant.geojson',
          select:`
          SELECT row_to_json(featurecollection) AS json FROM (
            SELECT
              'FeatureCollection' AS type,
              array_to_json(array_agg(feature)) AS features
            FROM (
              SELECT
              'Feature' AS type,
              ST_AsGeoJSON(ST_TRANSFORM(x.geom,4326))::json AS geometry,
              row_to_json((
                SELECT t FROM (
                  SELECT
                    16 as maxzoom,
                    15 as minzoom
                ) AS t
              )) AS tippecanoe,
              row_to_json((
                SELECT p FROM (
                SELECT
                  x.firehydrantid as fid,
                  x.size,
                  x.installationdate,
                  x.insertdate,
                  x.updatedate,
                  x.isjica
                ) AS p
              )) AS properties
              FROM firehydrant x
              WHERE NOT ST_IsEmpty(x.geom)
            ) AS feature
          ) AS featurecollection
          `
        },
        {
          name: 'washout',
          geojsonFileName: export_dir + '/washout.geojson',
          select:`
          SELECT row_to_json(featurecollection) AS json FROM (
            SELECT
              'FeatureCollection' AS type,
              array_to_json(array_agg(feature)) AS features
            FROM (
              SELECT
              'Feature' AS type,
              ST_AsGeoJSON(ST_TRANSFORM(x.geom,4326))::json AS geometry,
              row_to_json((
                SELECT t FROM (
                  SELECT
                    16 as maxzoom,
                    15 as minzoom
                ) AS t
              )) AS tippecanoe,
              row_to_json((
                SELECT p FROM (
                SELECT
                  x.washoutid as fid,
                  x.size,
                  x.installationdate,
                  x.insertdate,
                  x.updatedate,
                  x.isjica
                ) AS p
              )) AS properties
              FROM washout x
              WHERE NOT ST_IsEmpty(x.geom)
            ) AS feature
          ) AS featurecollection
          `
        },
        {
            name: 'tank',
            geojsonFileName: export_dir + '/tank.geojson',
            select:`
            SELECT row_to_json(featurecollection) AS json FROM (
                SELECT
                  'FeatureCollection' AS type,
                  array_to_json(array_agg(feature)) AS features
                FROM (
                  SELECT
                    'Feature' AS type,
                    ST_AsGeoJSON(ST_TRANSFORM(ST_MakeValid(x.geom),4326))::json AS geometry,
                    row_to_json((
                      SELECT t FROM (
                        SELECT
                          16 as maxzoom,
                          13 as minzoom
                      ) AS t
                    )) AS tippecanoe,
                    row_to_json((
                      SELECT p FROM (
                        SELECT
                          x.tankid as fid,
                          x.name,
                          x.capacity,
                          x.servicelocation,
                          a.name as material,
                          x.shape,
                          x.constructiondate,
                          x.insertdate,
                          x.updatedate
                      ) AS p
                    )) AS properties
                  FROM tank x
                  INNER JOIN material a
                  ON x.materialid = a.materialid
                  WHERE NOT ST_IsEmpty(x.geom)
                ) AS feature
              ) AS featurecollection
            `
        },
        {
          name: 'plant',
          geojsonFileName: export_dir + '/plant.geojson',
          select:`
          WITH plant as(
            SELECT
              wtpid as fid,
              name,
              'WTP' as plant_type,
              insertdate,
              updatedate,
              geom
            FROM wtp
            UNION ALL
            SELECT
              intakeid as fid,
              name,
              'INTAKE' as plant_type,
              insertdate,
              updatedate,
              geom
            FROM intake
          )
          SELECT row_to_json(featurecollection) AS json FROM (
            SELECT
              'FeatureCollection' AS type,
              array_to_json(array_agg(feature)) AS features
            FROM (
              SELECT
              'Feature' AS type,
              ST_AsGeoJSON(ST_TRANSFORM(ST_MakeValid(x.geom),4326))::json AS geometry,
              row_to_json((
                SELECT t FROM (
                  SELECT
                    16 as maxzoom,
                    10 as minzoom
                ) AS t
              )) AS tippecanoe,
              row_to_json((
                SELECT p FROM (
                SELECT
                x.fid,
                x.name,
                x.plant_type,
                x.insertdate,
                x.updatedate
              ) AS p
              )) AS properties
                FROM plant x
              WHERE NOT ST_IsEmpty(x.geom)
            ) AS feature
          ) AS featurecollection
          `
        },
        {
          name: 'parcels',
          geojsonFileName: export_dir + '/parcels.geojson',
          select:`
          WITH percels AS(
            SELECT 
              plotid as fid, 
              CASE WHEN parcel_no = '0' THEN NULL ELSE parcel_no END as parcel_no,  
              geom
            FROM planner_plot
            UNION ALL
            SELECT 
              gid as fid, 
              plotno as parcel_no, 
              geom
            FROM basemap_plots
          )
          SELECT row_to_json(featurecollection) AS json FROM (
            SELECT
              'FeatureCollection' AS type,
              array_to_json(array_agg(feature)) AS features
            FROM (
              SELECT
              'Feature' AS type,
              ST_AsGeoJSON(ST_TRANSFORM(x.geom,4326))::json AS geometry,
              row_to_json((
                SELECT t FROM (
                  SELECT
                    16 as maxzoom,
                    16 as minzoom
                ) AS t
              )) AS tippecanoe,
              row_to_json((
                SELECT p FROM (
                SELECT
                  x.fid,
                  x.parcel_no
                ) AS p
              )) AS properties
              FROM percels x
              WHERE NOT ST_IsEmpty(x.geom)
            ) AS feature
          ) AS featurecollection
          `
        },
        {
          name: 'parcels_annotation',
          geojsonFileName: export_dir + '/parcels_annotation.geojson',
          select:`
          WITH percels AS(
            SELECT 
              plotid as fid, 
              CASE WHEN parcel_no = '0' THEN NULL ELSE parcel_no END as parcel_no,  
              ST_CENTROID(geom) as geom
            FROM planner_plot
            UNION ALL
            SELECT 
              gid as fid, 
              plotno as parcel_no, 
              ST_CENTROID(geom) as geom
            FROM basemap_plots
          )
          SELECT row_to_json(featurecollection) AS json FROM (
            SELECT
              'FeatureCollection' AS type,
              array_to_json(array_agg(feature)) AS features
            FROM (
              SELECT
              'Feature' AS type,
              ST_AsGeoJSON(ST_TRANSFORM(x.geom,4326))::json AS geometry,
              row_to_json((
                SELECT t FROM (
                  SELECT
                    16 as maxzoom,
                    16 as minzoom
                ) AS t
              )) AS tippecanoe,
              row_to_json((
                SELECT p FROM (
                SELECT
                  x.fid,
                  x.parcel_no
                ) AS p
              )) AS properties
              FROM percels x
              WHERE NOT ST_IsEmpty(x.geom)
            ) AS feature
          ) AS featurecollection
          `
        },
        {
          name: 'village',
          geojsonFileName: export_dir + '/village.geojson',
          select:`
          SELECT row_to_json(featurecollection) AS json FROM (
            SELECT
              'FeatureCollection' AS type,
              array_to_json(array_agg(feature)) AS features
            FROM (
              SELECT
              'Feature' AS type,
              ST_AsGeoJSON(ST_TRANSFORM(x.geom,4326))::json AS geometry,
              row_to_json((
                SELECT t FROM (
                  SELECT
                    16 as maxzoom,
                    10 as minzoom
                ) AS t
              )) AS tippecanoe,
              row_to_json((
                SELECT p FROM (
                SELECT
                  x.villageid as fid,
                  x.name,
                  x.area,
                  x.zone,
                  x.insertdate,
                  x.updatedate
                ) AS p
              )) AS properties
              FROM village x
              WHERE NOT ST_IsEmpty(x.geom)
            ) AS feature
          ) AS featurecollection
          `
        },
        {
          name: 'dma',
          geojsonFileName: export_dir + '/dma.geojson',
          select:`
          SELECT row_to_json(featurecollection) AS json FROM (
            SELECT
              'FeatureCollection' AS type,
              array_to_json(array_agg(feature)) AS features
            FROM (
              SELECT
              'Feature' AS type,
              ST_AsGeoJSON(ST_TRANSFORM(x.geom,4326))::json AS geometry,
              row_to_json((
                SELECT t FROM (
                  SELECT
                    16 as maxzoom,
                    13 as minzoom
                ) AS t
              )) AS tippecanoe,
              row_to_json((
                SELECT p FROM (
                SELECT
                  x.pkuid as fid, 
				          x.name,
                  x.insertdate,
                  x.updatedate
                ) AS p
              )) AS properties
              FROM dma x
              WHERE NOT ST_IsEmpty(x.geom)
            ) AS feature
          ) AS featurecollection
          `
        },
        {
          name: 'point_annotation',
          geojsonFileName: export_dir + '/point_annotation.geojson',
          select:`
          WITH annotations AS(
            SELECT 
              tankid as masterid, 
              name,
              'tank' as layer,
              ST_CENTROID(geom) as geom
            FROM tank
            UNION ALL
            SELECT 
              wtpid as masterid, 
              name, 
              'wtp' as layer,
              ST_CENTROID(geom) as geom
            FROM wtp
            UNION ALL
            SELECT 
              intakeid as masterid, 
              name, 
              'intake' as layer,
              ST_CENTROID(geom) as geom
            FROM intake
            UNION ALL
            SELECT 
              villageid as masterid, 
              name, 
              'village' as layer,
              ST_CENTROID(geom) as geom
            FROM village
            UNION ALL
            SELECT 
              pkuid as masterid, 
              name, 
              'dma' as layer,
              ST_CENTROID(geom) as geom
            FROM dma
            UNION ALL
            SELECT 
              placeid as masterid, 
              name, 
              category as layer, 
              geom
            FROM places
          )
          SELECT row_to_json(featurecollection) AS json FROM (
            SELECT
              'FeatureCollection' AS type,
              array_to_json(array_agg(feature)) AS features
            FROM (
              SELECT
              'Feature' AS type,
              ST_AsGeoJSON(ST_TRANSFORM(x.geom,4326))::json AS geometry,
              row_to_json((
                SELECT t FROM (
                  SELECT
                    16 as maxzoom,
                    10 as minzoom
                ) AS t
              )) AS tippecanoe,
              row_to_json((
                SELECT p FROM (
                SELECT
                  x.masterid,
                  x.name,
                  x.layer
                ) AS p
              )) AS properties
              FROM annotations x
              WHERE NOT ST_IsEmpty(x.geom)
            ) AS feature
          ) AS featurecollection
          `
        }
    ],
};
