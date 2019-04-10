### Node Event loop demo

#### _This may not work on a windows machine because it relies on Apache Benchmark. [Checkout the ab docs](https://httpd.apache.org/docs/2.4/programs/ab.html)_

First:
```
npm install
```

To see the benchmark test for a single thread run:
```
npm run bm-single
```
To see the benchmark test for a server with worker threads run:
```
npm run bm-worker
```