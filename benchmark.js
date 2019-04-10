const { promisify } = require('util');
const exec = promisify(require('child_process').exec)

const start = Date.now()
exec('ab -c 20 -n 20 http://localhost:3000/').then((result) => {
    console.log('COMPUTATION ', Date.now() - start);
}).catch((err) => {
    console.log(err)
});
exec('ab -c 50 -n 50 http://localhost:3000/fast').then((result) => {
    console.log('OTHER ', Date.now() - start);
}).catch((err) => {
    console.log(err)
});
