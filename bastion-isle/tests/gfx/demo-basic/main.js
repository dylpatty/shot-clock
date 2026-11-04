import { H } from '../harness.js';
await H.init({ seed: 7, city: true });
H.basicGround();
H.setCam({ x: 0, z: 4, dist: 40, yaw: 0.7 });
H.start();
