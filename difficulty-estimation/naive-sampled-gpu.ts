import * as gpuJS from 'gpu.js';
import * as jsonRPC20 from 'json-rpc-2.0';
import express from 'express';
import bodyParser from 'body-parser';
// eslint-disable-next-line import/no-unresolved
import { FixedSizeArray } from 'fixed-size-array';
import Collectible from './models/Collectible';
import Obstacle from './models/Obstacle';

const gpuCores = 3072;

const { GPU } = gpuJS;
const { JSONRPCServer } = jsonRPC20;

const gpu = new GPU();
// const gpu = new GPU({ mode: 'dev' });
const server = new JSONRPCServer();

server.addMethod('getMinIntensity', getMinIntensity as any);

const app = express();
app.use(bodyParser.json());

app.post('/json-rpc', (req, res) => {
  const jsonRPCRequest = req.body;
  server.receive(jsonRPCRequest).then((jsonRPCResponse) => {
    if (jsonRPCResponse) {
      res.json(jsonRPCResponse);
    } else {
      res.sendStatus(204);
    }
  });
});

app.listen(4000);
console.log('Listening on http://localhost:4000');

function present() {
  const now = process.hrtime();
  return Math.floor(now[0] * 1e3 + now[1] * 1e-6);
}

function getMinIntensity({
  objects,
  cumulatedIntensity,
  lastPositions
}: {
  objects: Array<Collectible | Obstacle>;
  cumulatedIntensity: { [key: string]: number };
  lastPositions: any;
}) {
  const depthOnDifferentCores = Math.floor(Math.log(gpuCores) / Math.log(4));
  console.log(`CPU utilization ${((4 ** depthOnDifferentCores / gpuCores) * 100).toFixed(1)}%`);
  const t0 = present();
  const kernel = gpu
    .createKernel(function (
      this: any,
      _objects: number[][],
      _cumulatedIntensity: number[],
      _lastPositions: number[][]
    ) {
      return _cumulatedIntensity[this.thread.x % 4];
    } as any)
    .setOutput([4 ** depthOnDifferentCores]);
  const t1 = present();
  const out = kernel([[5]], Object.values(cumulatedIntensity), [[6]]);
  const tEnd = present();
  console.log(`Took ${tEnd - t0}ms to compute, of which ${t1 - t0}ms for kernel creation`);
  console.log(out);
  // return kernel(objects, cumulatedIntensity, lastPositions);
  return out;
}
