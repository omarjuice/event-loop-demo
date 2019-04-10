process.env.UV_THREADPOOL_SIZE = 5
const express = require('express');
const crypto = require('crypto');
const Worker = require('webworker-threads').Worker
const fs = require('fs')
const app = express();


app.get('/', async (req, res) => {

    function withWorkers() {
        const worker = new Worker(function () {
            this.onmessage = function () {
                let counter = 0
                while (counter < 1e9) {
                    counter++
                }
                postMessage(counter)
            }
        })
        worker.onmessage = function (message) {
            res.send('' + message.data)
        }
        worker.postMessage()
    }
    function single() {
        let counter = 0
        while (counter < 1e9) {
            counter++
        }
        res.send('' + counter)
    }
    process.env.NODE_ENV === 'single' ? single() : withWorkers()

})
app.get('/fast', (req, res) => {
    res.send('done')
})
app.get('/crypto', (req, res) => {
    crypto.pbkdf2('a', 'b', 100000, 512, 'sha512', () => {
        res.send('done')
    })
})
app.get('/file', (req, res) => {
    fs.readFile('index.js', () => {
        res.send('done')
    })
})
app.listen(3000, () => {
    console.log('----------BEGINNING----------');
    const { promisify } = require('util');
    const exec = promisify(require('child_process').exec)
    const start = Date.now()
    let eventLoops = 0
    let completedTasks = 0

    // Any TIMER FUNCTIONS that need to be executed? First thing on the exent loop. Will not run until the current event loop has finished.
    // The times cannot print while the event loop is blocked
    const interval = setInterval(() => {
        console.log(Date.now() - start);
    }, 1000)

    // Make 20 CONCURRENT requests to a computationally expensive endpoint
    // IF only a single thread is available, this will block the event loop until all of these computations are finished.
    // Meaning that our application can do NOTHING while this is running.
    // Executing these computations in a worker thread will not block the event loop.
    exec('ab -c 20 -n 20 http://localhost:3000/').then((result) => {
        clearInterval(interval)
        console.log('COMPUTATION ', Date.now() - start);
        completedTasks++
        if (completedTasks === 4) {
            console.log('COMPLETED ALL TASKS')
        }
    }).catch((err) => {
        console.log(err)
    });

    // Make one request to an endpoint that should send an immediate response if the event loop is not blocked.
    exec('ab -c 1 -n 1 http://localhost:3000/fast').then((result) => {
        console.log('NORMAL ', Date.now() - start);
        completedTasks++
        if (completedTasks === 4) {
            console.log('COMPLETED ALL TASKS')
        }
    }).catch((err) => {
        console.log(err)
    });

    // Make four concurrent requests to an endpoint that performs asynchronous computationally expensive tasks from the event loop
    // LIBUV's crypto.pbkdf2 is one such function
    exec('ab -c 4 -n 4 http://localhost:3000/crypto').then((result) => {
        console.log('LIBUV ', Date.now() - start);
        completedTasks++
        if (completedTasks === 4) {
            console.log('----------COMPLETED----------')
        }
    }).catch((err) => {
        console.log(err)
    });
    exec('ab -c 2 -n 2 http://localhost:3000/file').then((result) => {
        console.log('OS ', Date.now() - start);
        completedTasks++
        if (completedTasks === 4) {
            console.log('----------COMPLETED----------')
        }
    }).catch((err) => {
        console.log(err)
    });

    // Five seconds into our server, the below line should print ONLY if the event loop is not blocked
    // If it is blocked, this code will not run until it becomes unblocked, but is GUARANTEED to run once it does. 
    // (process.nextTick schedules code strictly for the next event loop)
    setTimeout(() => {
        process.nextTick(() => {
            console.log('EVENT LOOP IS NOT BLOCKED RIGHT NOW');
        })
    }, 5000)
})