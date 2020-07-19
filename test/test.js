const {postgis2mbtiles} = require('../dist/index');
const config = require('./config');

const example = () =>{
    console.time('postgis2mbtiles');
    const pg2json = new postgis2mbtiles(config);
    pg2json.run().then(res=>{
        console.log(res);
    }).catch(err=>{
        console.log(err);
    }).finally(()=>{
        console.timeEnd('postgis2mbtiles');
    })
};

module.exports = example();