import * as gpuJS from 'gpu.js';
import * as jsonRPC20 from 'json-rpc-2.0';
import express from 'express';
import bodyParser from 'body-parser';
import Collectible from './models/Collectible';
import Obstacle from './models/Obstacle';

const gpuCores = 3072;

const { GPU } = gpuJS;
const { JSONRPCServer } = jsonRPC20;

const gpu = new GPU();
// const gpu = new GPU({ mode: 'dev' });
const server = new JSONRPCServer();

function calcDistanceXY(posA: number[], posB: number[]) {
  return ((posA[0] - posB[0]) ** 2 + (posA[1] - posB[1]) ** 2) ** (1 / 2);
}
gpu.addFunction(calcDistanceXY, {
  argumentTypes: {
    posA: 'Array(3)',
    posB: 'Array(3)'
  },
  returnType: 'Number'
});

function calcDistanceZ(posA: number[], posB: number[]) {
  return Math.abs(posA[2] - posB[2]);
}
gpu.addFunction(calcDistanceZ, {
  argumentTypes: {
    posA: 'Array(3)',
    posB: 'Array(3)'
  },
  returnType: 'Number'
});

function calcIntensity(distance: number, time: number) {
  if (distance === 0) return 0;
  if (time === 0) return Infinity;
  return distance / time;
}
gpu.addFunction(calcIntensity);

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
  console.log(`GPU utilization ${((4 ** depthOnDifferentCores / gpuCores) * 100).toFixed(1)}%`);
  const t0 = present();
  const kernel = gpu
    .createKernel(function (
      this: any,
      _objects: number[], // nx4, inner array represents x, y, z, type (0 = Obstacles, 1-9 = Collectible)
      _cumulatedIntensity: number[], // 1x4, cumulated intensity per extremity
      _lastPositions: number[], // 4x3, last position per extremity
      _depthOnDifferentCores: number
    ) {
      let distanceXY = 0;
      let distanceZ = 0;
      let intensity = 0;
      const localCumulatedIntensity = [
        _cumulatedIntensity[0],
        _cumulatedIntensity[1],
        _cumulatedIntensity[2],
        _cumulatedIntensity[3]
      ];
      const localLastPositionsA = [_lastPositions[0], _lastPositions[1], _lastPositions[2]];
      const localLastPositionsB = [_lastPositions[3], _lastPositions[4], _lastPositions[5]];
      const localLastPositionsC = [_lastPositions[6], _lastPositions[7], _lastPositions[8]];
      const localLastPositionsD = [_lastPositions[9], _lastPositions[10], _lastPositions[11]];

      function localLastPositions(
        index: number,
        a: number[],
        b: number[],
        c: number[],
        d: number[]
      ) {
        if (index < 3) return a[index];
        if (index < 6) return b[index % 3];
        if (index < 9) return c[index % 3];
        return d[index % 3];
      }

      for (let i = 0; i < _depthOnDifferentCores; i += 1) {
        const j = Math.floor((4 * this.thread.x) / 4 ** (_depthOnDifferentCores - i)) % 4;
        const type = _objects[i * 4 + 3];
        if (type === 0) continue;
        if (
          type === 1 ||
          (type === 2 && (j === 0 || j === 1)) ||
          (type === 3 && (j === 2 || j === 3)) ||
          (type === 4 && (j === 0 || j === 2)) ||
          (type === 5 && (j === 1 || j === 3)) ||
          type === j + 5
        ) {
          distanceXY = calcDistanceXY(
            [
              localLastPositions(
                3 * j,
                localLastPositionsA,
                localLastPositionsB,
                localLastPositionsC,
                localLastPositionsD
              ),
              localLastPositions(
                3 * j + 1,
                localLastPositionsA,
                localLastPositionsB,
                localLastPositionsC,
                localLastPositionsD
              ),
              localLastPositions(
                3 * j + 2,
                localLastPositionsA,
                localLastPositionsB,
                localLastPositionsC,
                localLastPositionsD
              )
            ],
            [_objects[i * 4], _objects[i * 4 + 1], _objects[i * 4 + 2]]
          );
          distanceZ = calcDistanceZ(
            [
              localLastPositions(
                3 * j,
                localLastPositionsA,
                localLastPositionsB,
                localLastPositionsC,
                localLastPositionsD
              ),
              localLastPositions(
                3 * j + 1,
                localLastPositionsA,
                localLastPositionsB,
                localLastPositionsC,
                localLastPositionsD
              ),
              localLastPositions(
                3 * j + 2,
                localLastPositionsA,
                localLastPositionsB,
                localLastPositionsC,
                localLastPositionsD
              )
            ],
            [_objects[i * 4], _objects[i * 4 + 1], _objects[i * 4 + 2]]
          );
          intensity = calcIntensity(distanceXY, distanceZ);
          localCumulatedIntensity[j] += intensity;
        } else {
          localCumulatedIntensity[0] = Infinity;
          localCumulatedIntensity[1] = Infinity;
          localCumulatedIntensity[2] = Infinity;
          localCumulatedIntensity[3] = Infinity;
          break;
        }
      }
      return [
        localCumulatedIntensity[0],
        localCumulatedIntensity[1],
        localCumulatedIntensity[2],
        localCumulatedIntensity[3]
      ];
    } as any)
    .setOutput([4 ** depthOnDifferentCores]);
  const transformedObjects = objects.map((obj) => {
    return [
      obj.position.x,
      obj.position.y,
      obj.position.z,
      obj.type === 'Obstacle' ? 0 : obj.collectibleType
    ];
  });
  const transformedLastPositions = Object.values(lastPositions).map((pos: any) => {
    return [pos.x, pos.y, pos.z, 0];
  });
  const t1 = present();
  const out = kernel(
    transformedObjects.flat(),
    Object.values(cumulatedIntensity),
    transformedLastPositions.flat(),
    depthOnDifferentCores
  );
  const tEnd = present();
  console.log(`Took ${tEnd - t0}ms to compute, of which ${t1 - t0}ms for setup.`);
  // return kernel(objects, cumulatedIntensity, lastPositions);
  return out;
}
