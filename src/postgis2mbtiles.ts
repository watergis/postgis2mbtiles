import fs from 'fs';
import { execSync } from 'child_process';
import { postgis2geojson } from '@watergis/postgis2geojson';

type Config = {
  db: DbConfig; //DB Settings
  mbtiles: string; //File path for mbtiles of vectortiles
  minzoom: number; //Min zoom level given to tippecanoe
  maxzoom: number; //Max zoom level given to tippecanoe
  layers: Layer[]; //List of layer to define SQL for GeoJSON
};

type DbConfig = {
  user: string;
  password: string;
  host: string;
  post: string;
  database: string;
};

type Layer = {
  name: string;
  geojsonFileName: string; //File path for GeoJSON
  select: string; //SQL for PostGIS
};

class postgis2mbtiles {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  run() {
    return new Promise<string>(
      (resolve: (value?: string) => void, reject: (reason?: any) => void) => {
        const pg2json = new postgis2geojson(this.config);
        pg2json
          .run()
          .then((geojsonfiles: string[]) => {
            return this.createMbtiles(geojsonfiles, this.config.mbtiles);
          })
          .then((file: string) => {
            resolve(file);
          })
          .catch((err: any) => {
            reject(err);
          });
      }
    );
  }

  createMbtiles(geojsonfiles: string[], mbtiles: string) {
    return new Promise<string>(
      (resolve: (value?: string) => void, reject: (reason?: any) => void) => {
        try {
          if (fs.existsSync(mbtiles)) {
            fs.unlinkSync(mbtiles);
          }
          const cmd = `tippecanoe -rg -z${this.config.maxzoom} -Z${
            this.config.minzoom
          } -o ${mbtiles} ${geojsonfiles.join(' ')}`;

          execSync(cmd).toString();

          geojsonfiles.forEach((f: string) => {
            fs.unlinkSync(f);
          });
          console.log(
            `Creating voctor tile was done successfully at ${mbtiles}`
          );
          resolve(mbtiles);
        } catch (err) {
          reject(err);
        }
      }
    );
  }
}

export default postgis2mbtiles;
