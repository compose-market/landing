import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { SceneMount, SceneOptions } from "./scene";

type Cubie = {
  index: number;
  group: THREE.Group;
  core: THREE.Mesh<RoundedBoxGeometry, THREE.MeshPhysicalMaterial>;
  shellMaterial: THREE.MeshPhysicalMaterial;
  coreMaterial: THREE.MeshPhysicalMaterial;
  edgeMaterial: THREE.LineBasicMaterial;
  base: THREE.Vector3;
  direction: THREE.Vector3;
  activation: number;
};

type RailTrail = {
  group: SVGGElement;
  trace: SVGPathElement;
  core: SVGPathElement;
  packet: SVGPathElement;
  age: number;
  lifetime: number;
  direction: "ingress" | "egress";
};

type AmbientRail = {
  group: SVGGElement;
  trace: SVGPathElement;
  core: SVGPathElement;
  packet: SVGPathElement;
  phase: number;
  speed: number;
};

const brandGradientShader = /* glsl */ `
  vec3 brandGradient(vec3 position) {
    float sweep = smoothstep(-2.35, 2.35, position.x);
    vec3 cyan = vec3(0.0, 0.898, 1.0);
    vec3 blue = vec3(0.12, 0.24, 1.0);
    vec3 violet = vec3(0.55, 0.20, 1.0);
    vec3 pink = vec3(0.984, 0.671, 1.0);
    vec3 leftField = mix(cyan, blue, smoothstep(0.0, 0.48, sweep));
    vec3 rightField = mix(violet, pink, smoothstep(0.48, 1.0, sweep));
    return mix(leftField, rightField, smoothstep(0.38, 0.62, sweep));
  }
`;

function damp(current: number, target: number, speed: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-speed * dt));
}

function applyBrandGradient(material: THREE.MeshPhysicalMaterial, tint: number): void {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vBrandPosition;")
      .replace(
        "#include <project_vertex>",
        "#include <project_vertex>\nvBrandPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;"
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vBrandPosition;\n${brandGradientShader}`)
      .replace(
        "vec4 diffuseColor = vec4( diffuse, opacity );",
        `vec4 diffuseColor = vec4(brandGradient(vBrandPosition) * ${tint.toFixed(3)}, opacity);`
      )
      .replace(
        "vec3 totalEmissiveRadiance = emissive;",
        "vec3 totalEmissiveRadiance = brandGradient(vBrandPosition) * emissive;"
      );
  };
  material.customProgramCacheKey = () => `continuous-brand-glass-${tint}`;
}

function applyBrandGradientToEdges(material: THREE.LineBasicMaterial): void {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vBrandPosition;")
      .replace(
        "#include <project_vertex>",
        "#include <project_vertex>\nvBrandPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;"
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vBrandPosition;\n${brandGradientShader}`)
      .replace(
        "vec4 diffuseColor = vec4( diffuse, opacity );",
        "vec4 diffuseColor = vec4(brandGradient(vBrandPosition), opacity);"
      );
  };
  material.customProgramCacheKey = () => "continuous-brand-edges";
}

export function mountScene(root: ParentNode, options: SceneOptions = {}): SceneMount {
  const stage = root.querySelector<HTMLElement>(".stage");
  const hero = root.querySelector<HTMLElement>(".hero");
  const shell = root.querySelector<HTMLElement>(".shell");

  if (!stage || !hero || !shell) {
    throw new Error("Unable to mount native inference cube scene");
  }

  const params = new URLSearchParams(window.location.search);
  const testing = params.get("test") === "1";
  const forcedReduced = params.get("motion") === "reduce";
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: !testing,
    powerPreference: "high-performance",
    preserveDrawingBuffer: testing
  });

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.domElement.className = "scene cube-scene";
  renderer.domElement.dataset.sceneCanvas = "inference";
  renderer.domElement.dataset.geometry = "native-3d";
  renderer.domElement.dataset.cubieCount = "27";
  renderer.domElement.dataset.particleCount = String(testing ? 72 : 128);
  renderer.domElement.dataset.circuitMode = "pointer-driven";
  renderer.domElement.dataset.activeCubie = "none";
  renderer.domElement.dataset.activeOffset = "0";
  renderer.domElement.setAttribute("aria-hidden", "true");
  stage.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  const cubeRoot = new THREE.Group();
  cubeRoot.rotation.set(0.53, -0.66, 0.075);
  scene.add(cubeRoot);

  scene.add(new THREE.AmbientLight(0xa9c8ff, 0.78));
  scene.add(new THREE.HemisphereLight(0xd9faff, 0x090719, 1.05));

  const keyLight = new THREE.DirectionalLight(0xeaf8ff, 4.4);
  keyLight.position.set(4, 7, 8);
  scene.add(keyLight);

  const cyanLight = new THREE.PointLight(0x00e5ff, 26, 14, 2);
  cyanLight.position.set(-5, 1.8, 5);
  scene.add(cyanLight);

  const pinkLight = new THREE.PointLight(0xf07cff, 24, 14, 2);
  pinkLight.position.set(5, -1.5, 4);
  scene.add(pinkLight);

  const shellGeometry = new RoundedBoxGeometry(0.94, 0.94, 0.94, 4, 0.105);
  const coreGeometry = new RoundedBoxGeometry(0.56, 0.56, 0.56, 3, 0.085);
  const edgeGeometry = new THREE.EdgesGeometry(shellGeometry, 22);
  const cubies: Cubie[] = [];
  const hitMeshes: THREE.Mesh[] = [];
  const spacing = 1.035;

  for (let z = -1; z <= 1; z += 1) {
    for (let y = -1; y <= 1; y += 1) {
      for (let x = -1; x <= 1; x += 1) {
        const index = cubies.length;
        const shellMaterial = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          emissive: 0xffffff,
          emissiveIntensity: 0.065,
          metalness: 0.04,
          roughness: 0.1,
          transmission: 0.82,
          thickness: 0.48,
          ior: 1.46,
          transparent: true,
          opacity: 0.64,
          clearcoat: 1,
          clearcoatRoughness: 0.055,
          attenuationColor: 0x89dfff,
          attenuationDistance: 1.15,
          depthWrite: false
        });
        applyBrandGradient(shellMaterial, 0.18);
        const coreMaterial = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          emissive: 0xffffff,
          emissiveIntensity: 0.22,
          metalness: 0.04,
          roughness: 0.2,
          transmission: 0.28,
          transparent: true,
          opacity: 0.14,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        applyBrandGradient(coreMaterial, 0.28);
        const edgeMaterial = new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.62,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        applyBrandGradientToEdges(edgeMaterial);
        const group = new THREE.Group();
        const shellMesh = new THREE.Mesh(shellGeometry, shellMaterial);
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        const base = new THREE.Vector3(x * spacing, y * spacing, z * spacing);
        const direction = base.lengthSq() > 0 ? base.clone().normalize() : new THREE.Vector3(0, 0, 1);

        shellMesh.userData.cubieIndex = index;
        shellMesh.renderOrder = 2;
        core.renderOrder = 1;
        edges.renderOrder = 3;
        group.position.copy(base);
        group.add(core, shellMesh, edges);
        cubeRoot.add(group);
        hitMeshes.push(shellMesh);
        cubies.push({
          index,
          group,
          core,
          shellMaterial,
          coreMaterial,
          edgeMaterial,
          base,
          direction,
          activation: 0
        });
      }
    }
  }

  const particleCount = testing ? 72 : 128;
  const particlePositions = new Float32Array(particleCount * 3);
  const particleRestPositions = new Float32Array(particleCount * 3);
  const particleGatherOffsets = new Float32Array(particleCount * 3);
  const particleVelocity = new Float32Array(particleCount * 3);
  const particlePhases = new Float32Array(particleCount);
  const particleGeometry = new THREE.BufferGeometry();

  for (let i = 0; i < particleCount; i += 1) {
    const offset = i * 3;
    particlePositions[offset] = (Math.random() - 0.5) * spacing * 2.75;
    particlePositions[offset + 1] = (Math.random() - 0.5) * spacing * 2.75;
    particlePositions[offset + 2] = (Math.random() - 0.5) * spacing * 2.75;
    particleRestPositions[offset] = particlePositions[offset]!;
    particleRestPositions[offset + 1] = particlePositions[offset + 1]!;
    particleRestPositions[offset + 2] = particlePositions[offset + 2]!;
    const gatherRadius = 0.12 + Math.random() * 0.2;
    const gatherTheta = Math.random() * Math.PI * 2;
    const gatherZ = Math.random() * 2 - 1;
    const gatherPlanar = Math.sqrt(1 - gatherZ * gatherZ);
    particleGatherOffsets[offset] = Math.cos(gatherTheta) * gatherPlanar * gatherRadius;
    particleGatherOffsets[offset + 1] = Math.sin(gatherTheta) * gatherPlanar * gatherRadius;
    particleGatherOffsets[offset + 2] = gatherZ * gatherRadius;
    particleVelocity[offset] = (Math.random() - 0.5) * 0.08;
    particleVelocity[offset + 1] = (Math.random() - 0.5) * 0.08;
    particleVelocity[offset + 2] = (Math.random() - 0.5) * 0.08;
    particlePhases[i] = Math.random() * Math.PI * 2;
  }

  particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  const particleMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uEnergy: { value: 0 }
    },
    vertexShader: /* glsl */ `
      uniform float uEnergy;
      varying vec3 vBrandPosition;

      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vec4 viewPosition = viewMatrix * worldPosition;
        vBrandPosition = worldPosition.xyz;
        gl_PointSize = (2.2 + uEnergy * 2.8) * (18.0 / max(1.0, -viewPosition.z));
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uEnergy;
      varying vec3 vBrandPosition;
      ${brandGradientShader}

      void main() {
        float distanceToCenter = length(gl_PointCoord - 0.5) * 2.0;
        float corona = 1.0 - smoothstep(0.12, 1.0, distanceToCenter);
        float core = 1.0 - smoothstep(0.0, 0.28, distanceToCenter);
        vec3 color = mix(brandGradient(vBrandPosition), vec3(0.94, 1.0, 1.0), core);
        gl_FragColor = vec4(color * (corona * (1.2 + uEnergy * 1.8) + core), corona * (0.42 + uEnergy * 0.4));
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    toneMapped: true
  });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  particles.renderOrder = 1;
  cubeRoot.add(particles);

  const svgNamespace = "http://www.w3.org/2000/svg";
  const backdrop = shell.querySelector<HTMLElement>(".backdrop");
  const stageLayer = shell.querySelector<HTMLElement>(".stage");
  const ambientRailLayer = document.createElementNS(svgNamespace, "svg");
  ambientRailLayer.classList.add("inference-ambient-rail-layer");
  ambientRailLayer.dataset.ambientRailLayer = "inference";
  ambientRailLayer.setAttribute("aria-hidden", "true");
  backdrop?.insertBefore(ambientRailLayer, stageLayer);
  const ambientRails: AmbientRail[] = [];
  const railLayer = document.createElementNS(svgNamespace, "svg");
  railLayer.classList.add("inference-rail-layer");
  railLayer.dataset.railLayer = "inference";
  railLayer.setAttribute("aria-hidden", "true");
  backdrop?.insertBefore(railLayer, stageLayer);
  const railTrails: RailTrail[] = [];

  const raycaster = new THREE.Raycaster();
  const focusLight = new THREE.PointLight(0x00e5ff, 0, 2.6, 2);
  cubeRoot.add(focusLight);
  const pointer = new THREE.Vector2();
  const pointerTarget = new THREE.Vector3();
  const pointerWorld = new THREE.Vector3();
  const pointerPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const lastPointer = new THREE.Vector2(0, 0);
  const pointerClient = new THREE.Vector2(window.innerWidth * 0.5, window.innerHeight * 0.5);
  const lastExternalPoint = new THREE.Vector2(window.innerWidth * 0.16, window.innerHeight * 0.5);
  const projectedPoint = new THREE.Vector3();
  const interactionHost = root instanceof HTMLElement ? root : hero;
  let hoverIndex: number | null = null;
  let focusIndex: number | null = null;
  let outputIndex: number | null = null;
  let activeElement: HTMLElement | null = null;
  let pointerActive = false;
  let pointerEnergy = 0;
  let particleGather = 0;
  let particleBurst = 0;
  let particlePulseStart = Number.NEGATIVE_INFINITY;
  let particlePulseIndex: number | null = null;
  let particleBurstApplied = false;
  let previousActiveIndex: number | null = null;
  let railDemand = 0;
  let lastRail = 0;
  let touchPointerId: number | null = null;
  let touchReleaseAt = 0;
  let visible = document.visibilityState !== "hidden";
  let destroyed = false;
  let dirty = true;
  let raf = 0;
  let posterTimer = 0;
  let posterCleared = false;
  let last = performance.now();

  const reduced = () => options.reduced ?? (forcedReduced || media.matches);

  const applyMetadata = () => {
    const currentHero = root.querySelector<HTMLElement>(".hero");
    const motion = reduced() ? "reduce" : "full";
    shell.dataset.renderer = "three-webgl";
    shell.dataset.sceneRenderer = "native-cube";
    shell.dataset.motion = motion;

    if (currentHero) {
      currentHero.dataset.renderer = "three-webgl";
      currentHero.dataset.sceneRenderer = "native-cube";
      currentHero.dataset.motion = motion;
    }
  };

  const resize = () => {
    const width = Math.max(1, stage.clientWidth || window.innerWidth);
    const height = Math.max(1, stage.clientHeight || window.innerHeight);
    const mobile = width < 700;
    camera.aspect = width / height;
    camera.position.set(0, 0, mobile ? 19.5 : 16.5);
    camera.updateProjectionMatrix();
    cubeRoot.scale.setScalar(mobile ? 0.72 : 0.82);
    renderer.setPixelRatio(testing ? 1 : Math.min(mobile ? 1.4 : 1.8, window.devicePixelRatio || 1));
    renderer.setSize(width, height, false);
    buildAmbientRails();
    dirty = false;
  };

  const pick = (clientX: number, clientY: number): number | null => {
    const rect = renderer.domElement.getBoundingClientRect();

    if (!rect.width || !rect.height) {
      return null;
    }

    pointer.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    cubeRoot.updateMatrixWorld(true);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(hitMeshes, false)[0];
    return typeof hit?.object.userData.cubieIndex === "number"
      ? hit.object.userData.cubieIndex
      : null;
  };

  const targetPointer = (clientX: number, clientY: number): number => {
    const rect = renderer.domElement.getBoundingClientRect();

    if (!rect.width || !rect.height) {
      return 0;
    }

    const nextX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const nextY = -((clientY - rect.top) / rect.height) * 2 + 1;
    const movement = Math.hypot(nextX - lastPointer.x, nextY - lastPointer.y);
    pointer.set(nextX, nextY);
    lastPointer.copy(pointer);
    pointerClient.set(clientX, clientY);
    pointerEnergy = Math.min(1, pointerEnergy + movement * 2.8 + 0.08);
    pointerActive = true;
    cubeRoot.updateMatrixWorld(true);
    raycaster.setFromCamera(pointer, camera);

    if (raycaster.ray.intersectPlane(pointerPlane, pointerWorld)) {
      pointerTarget.copy(pointerWorld);
      cubeRoot.worldToLocal(pointerTarget);
      pointerTarget.x = THREE.MathUtils.clamp(pointerTarget.x, -spacing * 1.18, spacing * 1.18);
      pointerTarget.y = THREE.MathUtils.clamp(pointerTarget.y, -spacing * 1.18, spacing * 1.18);
      pointerTarget.z = THREE.MathUtils.clamp(pointerTarget.z, -spacing * 1.18, spacing * 1.18);
    }

    return movement;
  };

  const screenPointForCubie = (index: number): THREE.Vector2 => {
    cubies[index]!.group.getWorldPosition(projectedPoint);
    projectedPoint.project(camera);
    return new THREE.Vector2(
      (projectedPoint.x * 0.5 + 0.5) * window.innerWidth,
      (-projectedPoint.y * 0.5 + 0.5) * window.innerHeight
    );
  };

  const nearestCubie = (target: THREE.Vector2): number => {
    cubeRoot.updateMatrixWorld(true);
    let nearest = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const cubie of cubies) {
      const point = screenPointForCubie(cubie.index);
      const distance = point.distanceToSquared(target);

      if (distance < nearestDistance) {
        nearest = cubie.index;
        nearestDistance = distance;
      }
    }

    return nearest;
  };

  const elementPoint = (element: HTMLElement, from: THREE.Vector2): THREE.Vector2 => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width * 0.5;
    const centerY = rect.top + rect.height * 0.5;
    const dx = centerX - from.x;
    const dy = centerY - from.y;

    if (Math.abs(dx / Math.max(rect.width, 1)) > Math.abs(dy / Math.max(rect.height, 1))) {
      return new THREE.Vector2(dx > 0 ? rect.left : rect.right, THREE.MathUtils.clamp(from.y, rect.top, rect.bottom));
    }

    return new THREE.Vector2(THREE.MathUtils.clamp(from.x, rect.left, rect.right), dy > 0 ? rect.top : rect.bottom);
  };

  const railPath = (start: THREE.Vector2, end: THREE.Vector2): string => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const horizontal = Math.abs(dx) >= Math.abs(dy);
    const variance = (Math.random() - 0.5) * 0.1;

    if (horizontal) {
      const lead = start.x + Math.sign(dx || 1) * Math.min(44, Math.abs(dx) * 0.2);
      const gate = start.x + dx * (0.5 + variance);
      return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} H ${lead.toFixed(1)} H ${gate.toFixed(1)} V ${end.y.toFixed(1)} H ${end.x.toFixed(1)}`;
    }

    const lead = start.y + Math.sign(dy || 1) * Math.min(44, Math.abs(dy) * 0.2);
    const gate = start.y + dy * (0.5 + variance);
    return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} V ${lead.toFixed(1)} V ${gate.toFixed(1)} H ${end.x.toFixed(1)} V ${end.y.toFixed(1)}`;
  };

  const createRail = (start: THREE.Vector2, end: THREE.Vector2, direction: RailTrail["direction"]): void => {
    if (start.distanceTo(end) < 28) {
      return;
    }

    const group = document.createElementNS(svgNamespace, "g");
    const trace = document.createElementNS(svgNamespace, "path");
    const core = document.createElementNS(svgNamespace, "path");
    const packet = document.createElementNS(svgNamespace, "path");
    const path = railPath(start, end);

    group.dataset.direction = direction;
    trace.setAttribute("class", "inference-rail__trace");
    core.setAttribute("class", "inference-rail__core");
    packet.setAttribute("class", "inference-rail__packet");

    for (const item of [trace, core, packet]) {
      item.setAttribute("d", path);
      item.setAttribute("pathLength", "1");
    }

    core.setAttribute("stroke-dasharray", ".055 .025 .012 .025");
    packet.setAttribute("stroke-dasharray", ".12 .88");
    group.append(trace, core, packet);
    railLayer.append(group);
    railTrails.push({ group, trace, core, packet, age: 0, lifetime: 2.8 + Math.random() * 0.8, direction });

    while (railTrails.length > 7) {
      railTrails.shift()!.group.remove();
    }
  };

  const createAmbientRail = (path: string, index: number, strong: boolean): void => {
    const group = document.createElementNS(svgNamespace, "g");
    const trace = document.createElementNS(svgNamespace, "path");
    const core = document.createElementNS(svgNamespace, "path");
    const packet = document.createElementNS(svgNamespace, "path");

    group.dataset.ambientRail = "true";
    group.classList.add(strong ? "inference-ambient-rail--strong" : "inference-ambient-rail--faint");
    trace.setAttribute("class", "inference-ambient-rail__trace");
    core.setAttribute("class", "inference-ambient-rail__core");
    packet.setAttribute("class", "inference-ambient-rail__packet");

    for (const item of [trace, core, packet]) {
      item.setAttribute("d", path);
      item.setAttribute("pathLength", "1");
    }

    packet.setAttribute("stroke-dasharray", strong ? ".1 .9" : ".065 .935");
    group.append(trace, core, packet);
    ambientRailLayer.append(group);
    ambientRails.push({
      group,
      trace,
      core,
      packet,
      phase: (index * 0.173) % 1,
      speed: strong ? 0.105 + (index % 3) * 0.012 : 0.065 + (index % 4) * 0.009
    });
  };

  const clearAmbientRails = (): void => {
    ambientRails.splice(0).forEach((trail) => trail.group.remove());
  };

  const buildAmbientRails = (): void => {
    clearAmbientRails();

    if (reduced()) {
      return;
    }

    const grid = 48;
    const width = Math.ceil(window.innerWidth / grid) * grid;
    const height = Math.ceil(window.innerHeight / grid) * grid;
    const centerX = Math.round((width * 0.5) / grid) * grid;
    const centerY = Math.round((height * 0.5) / grid) * grid;
    const mobile = window.innerWidth < 700;
    const cavityX = mobile ? grid * 2.5 : grid * 4.2;
    const cavityY = mobile ? grid * 3 : grid * 3.4;
    const paths: Array<{ path: string; strong: boolean }> = [];
    const horizontalRows = mobile ? 8 : 12;
    const verticalColumns = mobile ? 5 : 8;

    for (let index = 0; index < horizontalRows; index += 1) {
      const y = Math.round(((index + 1) * height / (horizontalRows + 1)) / grid) * grid;
      const strong = index % 4 === 1;

      if (Math.abs(y - centerY) < cavityY) {
        const leftEdge = centerX - cavityX - grid;
        const rightEdge = centerX + cavityX + grid;
        const routeY = centerY + (index % 2 ? 1 : -1) * (cavityY + grid * (1 + index % 3));
        paths.push({ path: `M -${grid} ${y} H ${leftEdge} V ${routeY} H ${rightEdge} V ${y} H ${width + grid}`, strong });
      } else {
        const gateX = centerX + (index % 2 ? -grid * 3 : grid * 3);
        const offsetY = index % 2 ? grid : -grid;
        paths.push({ path: `M -${grid} ${y} H ${gateX} V ${y + offsetY} H ${width + grid}`, strong });
      }
    }

    for (let index = 0; index < verticalColumns; index += 1) {
      const x = Math.round(((index + 1) * width / (verticalColumns + 1)) / grid) * grid;

      if (Math.abs(x - centerX) < cavityX + grid) {
        continue;
      }

      const gateY = centerY + (index % 2 ? -cavityY - grid : cavityY + grid);
      const offsetX = index % 2 ? grid : -grid;
      paths.push({
        path: `M ${x} -${grid} V ${gateY} H ${x + offsetX} V ${height + grid}`,
        strong: index % 3 === 1
      });
    }

    paths.forEach(({ path, strong }, index) => createAmbientRail(path, index, strong));
  };

  const clearTouchInteraction = (): void => {
    touchPointerId = null;
    touchReleaseAt = 0;
    focusIndex = null;
    hoverIndex = null;
    activeElement = null;
    outputIndex = null;
    pointerActive = false;
  };

  const move = (event: PointerEvent) => {
    if (event.pointerType === "touch") {
      return;
    }

    const movement = targetPointer(event.clientX, event.clientY);
    const node = event.target instanceof Element
      ? event.target.closest<HTMLElement>(".cm-button, .cm-cell, .hero-chip, [data-rail-target]")
      : null;

    if (node && shell.contains(node)) {
      if (activeElement !== node) {
        railDemand = Math.max(railDemand, 1.6);
      }

      activeElement = node;
      hoverIndex = null;
      lastExternalPoint.set(event.clientX, event.clientY);
      const rect = node.getBoundingClientRect();
      outputIndex = nearestCubie(new THREE.Vector2(rect.left + rect.width * 0.5, rect.top + rect.height * 0.5));
      railDemand = Math.min(3, railDemand + movement * 10);
      return;
    }

    activeElement = null;
    outputIndex = null;
    const picked = pick(event.clientX, event.clientY);

    if (picked !== hoverIndex && picked !== null) {
      railDemand = Math.max(railDemand, 1.5);
    }

    if (picked === null) {
      lastExternalPoint.set(event.clientX, event.clientY);
    } else {
      railDemand = Math.min(3, railDemand + movement * 10);
    }

    hoverIndex = picked;
  };

  const down = (event: PointerEvent) => {
    targetPointer(event.clientX, event.clientY);
    const touchLike = event.pointerType === "touch" || window.matchMedia("(hover: none)").matches;

    if (touchLike) {
      touchPointerId = event.pointerId;
      touchReleaseAt = performance.now() + 1100;
    }

    const node = event.target instanceof Element
      ? event.target.closest<HTMLElement>(".cm-button, .cm-cell, .hero-chip, [data-rail-target]")
      : null;

    if (node && shell.contains(node)) {
      activeElement = node;
      const rect = node.getBoundingClientRect();
      outputIndex = nearestCubie(new THREE.Vector2(rect.left + rect.width * 0.5, rect.top + rect.height * 0.5));
      railDemand = Math.max(railDemand, 1.8);
      return;
    }

    const picked = pick(event.clientX, event.clientY);

    if (touchLike) {
      focusIndex = picked;
    } else {
      hoverIndex = picked;
    }

    railDemand = picked === null ? railDemand : Math.max(railDemand, 1.8);
  };

  const up = (event: PointerEvent) => {
    if (event.pointerId === touchPointerId) {
      touchReleaseAt = performance.now() + 1400;
    }
  };

  const cancel = (event: PointerEvent) => {
    if (event.pointerId === touchPointerId) {
      clearTouchInteraction();
    }
  };

  const blur = () => {
    clearTouchInteraction();
  };

  const leave = () => {
    hoverIndex = null;
    activeElement = null;
    outputIndex = null;
    pointerActive = focusIndex !== null;
  };

  const focusIn = (event: FocusEvent) => {
    const node = event.target instanceof Element
      ? event.target.closest<HTMLElement>(".cm-button, .cm-cell, [data-rail-target]")
      : null;

    if (!node || !shell.contains(node)) {
      return;
    }

    const rect = node.getBoundingClientRect();
    activeElement = node;
    pointerActive = true;
    pointerClient.set(rect.left + rect.width * 0.5, rect.top + rect.height * 0.5);
    outputIndex = nearestCubie(pointerClient);
    railDemand = Math.max(railDemand, 1.6);
  };

  const focusOut = (event: FocusEvent) => {
    if (event.target === activeElement) {
      activeElement = null;
      outputIndex = null;
    }
  };

  const visibility = () => {
    visible = document.visibilityState !== "hidden";
    last = performance.now();

    if (!visible) {
      clearTouchInteraction();
    }
  };

  const motion = () => {
    applyMetadata();

    if (reduced()) {
      particlePositions.set(particleRestPositions);
      particleVelocity.fill(0);
      particleGather = 0;
      particleBurst = 0;
      particlePulseStart = Number.NEGATIVE_INFINITY;
      particlePulseIndex = null;
      particleBurstApplied = false;
      particleGeometry.attributes.position!.needsUpdate = true;
      clearAmbientRails();
    } else {
      buildAmbientRails();
    }
  };

  const contextLost = (event: Event) => {
    event.preventDefault();
    visible = false;
  };

  const contextRestored = () => {
    visible = true;
    dirty = true;
    last = performance.now();
  };

  const frame = (time: number) => {
    raf = window.requestAnimationFrame(frame);

    if (!visible || destroyed) {
      return;
    }

    if (dirty) {
      resize();
    }

    const dt = Math.min(0.05, Math.max(0.001, (time - last) / 1000));
    if (touchReleaseAt > 0 && time >= touchReleaseAt) {
      clearTouchInteraction();
    }

    if (activeElement?.isConnected) {
      const rect = activeElement.getBoundingClientRect();
      outputIndex = nearestCubie(new THREE.Vector2(rect.left + rect.width * 0.5, rect.top + rect.height * 0.5));
    }

    const activeIndex = focusIndex ?? hoverIndex ?? outputIndex;
    const travel = reduced() ? 0.1 : 0.24;
    const activeTarget = activeIndex === null ? pointerTarget : cubies[activeIndex]!.base;
    let maxOffset = 0;
    last = time;
    pointerEnergy = damp(pointerEnergy, pointerActive ? 0.16 : 0, 2.8, dt);

    if (activeIndex !== null && activeIndex !== previousActiveIndex) {
      particlePulseStart = time;
      particlePulseIndex = activeIndex;
      particleBurstApplied = false;
    }
    previousActiveIndex = activeIndex;

    if (!reduced()) {
      for (const trail of ambientRails) {
        const progress = (time * 0.001 * trail.speed + trail.phase) % 1;
        trail.packet.style.strokeDashoffset = String(1 - progress);
      }
    }

    if (!reduced() && activeIndex !== null && railDemand >= 0.34 && time - lastRail > 72) {
      const cubePoint = screenPointForCubie(activeIndex);

      if (activeElement) {
        createRail(cubePoint, elementPoint(activeElement, cubePoint), "egress");
      } else {
        let source = lastExternalPoint.clone();

        if (source.distanceTo(cubePoint) < 72) {
          source = new THREE.Vector2(cubePoint.x < window.innerWidth * 0.5 ? 0 : window.innerWidth, cubePoint.y);
        }

        createRail(source, cubePoint, "ingress");
      }

      railDemand = Math.max(0, railDemand - 0.78);
      lastRail = time;
    }

    for (let index = railTrails.length - 1; index >= 0; index -= 1) {
      const trail = railTrails[index]!;
      trail.age += dt;
      const life = trail.age / trail.lifetime;
      const progress = THREE.MathUtils.smoothstep(life, 0.01, 0.24);
      const fade = 1 - THREE.MathUtils.smoothstep(life, 0.78, 1);
      const retract = 1 - THREE.MathUtils.smoothstep(life, 0.64, 1);
      trail.group.style.opacity = String(Math.min(1, progress * 2.2) * fade);
      trail.trace.setAttribute("stroke-dasharray", `${Math.max(0.001, retract)} 1`);
      trail.trace.setAttribute("stroke-dashoffset", String(-(1 - retract)));
      trail.core.style.strokeDashoffset = String(1 - progress * 1.16);
      trail.packet.style.strokeDashoffset = String(1 - progress * 1.08);

      if (life >= 1) {
        trail.group.remove();
        railTrails.splice(index, 1);
      }
    }

    const particleTargetEnergy = activeIndex === null || reduced() ? 0.12 : 1;
    particleMaterial.uniforms.uEnergy.value = damp(
      particleMaterial.uniforms.uEnergy.value as number,
      particleTargetEnergy,
      activeIndex === null ? 2.4 : 9,
      dt
    );
    const particlePulseAge = (time - particlePulseStart) / 1000;
    const gathering = !reduced() && particlePulseIndex !== null && particlePulseAge >= 0 && particlePulseAge < 0.52;
    particleGather = damp(particleGather, gathering ? 1 : 0, gathering ? 13 : 10, dt);

    if (!reduced() && particlePulseIndex !== null && particlePulseAge >= 0.52 && !particleBurstApplied) {
      const burstTarget = cubies[particlePulseIndex]!.base;

      for (let i = 0; i < particleCount; i += 1) {
        const offset = i * 3;
        let dx = particleRestPositions[offset]! - burstTarget.x;
        let dy = particleRestPositions[offset + 1]! - burstTarget.y;
        let dz = particleRestPositions[offset + 2]! - burstTarget.z;
        const distance = Math.max(0.2, Math.hypot(dx, dy, dz));
        dx /= distance;
        dy /= distance;
        dz /= distance;
        const impulse = 2.8 + (i % 7) * 0.12;
        particleVelocity[offset] += dx * impulse + Math.sin(particlePhases[i]!) * 0.34;
        particleVelocity[offset + 1] += dy * impulse + Math.cos(particlePhases[i]! * 1.3) * 0.34;
        particleVelocity[offset + 2] += dz * impulse + Math.sin(particlePhases[i]! * 0.7) * 0.34;
      }

      particleBurst = 1;
      particleBurstApplied = true;
    }

    particleBurst = damp(particleBurst, 0, 1.8, dt);

    if (!reduced()) {
      const limit = spacing * 1.42;
      const drag = Math.exp(-(6.2 - particleBurst * 4 + particleGather * 1.8) * dt);

      for (let i = 0; i < particleCount; i += 1) {
        const offset = i * 3;
        const px = particlePositions[offset]!;
        const py = particlePositions[offset + 1]!;
        const pz = particlePositions[offset + 2]!;
        const phase = particlePhases[i]!;
        const idleX = particleRestPositions[offset]! + Math.sin(time * 0.00055 + phase) * 0.075;
        const idleY = particleRestPositions[offset + 1]! + Math.cos(time * 0.00047 + phase * 1.31) * 0.075;
        const idleZ = particleRestPositions[offset + 2]! + Math.sin(time * 0.00063 + phase * 0.73) * 0.06;
        const pulseTarget = particlePulseIndex === null ? activeTarget : cubies[particlePulseIndex]!.base;
        const gatheredX = pulseTarget.x + particleGatherOffsets[offset]! + Math.sin(time * 0.0013 + phase) * 0.035;
        const gatheredY = pulseTarget.y + particleGatherOffsets[offset + 1]! + Math.cos(time * 0.0011 + phase * 1.4) * 0.035;
        const gatheredZ = pulseTarget.z + particleGatherOffsets[offset + 2]! + Math.sin(time * 0.0015 + phase * 0.8) * 0.03;
        const targetX = THREE.MathUtils.lerp(idleX, gatheredX, particleGather);
        const targetY = THREE.MathUtils.lerp(idleY, gatheredY, particleGather);
        const targetZ = THREE.MathUtils.lerp(idleZ, gatheredZ, particleGather);
        const stiffness = 7.5 + particleGather * 12 - particleBurst * 5;
        particleVelocity[offset] = particleVelocity[offset]! * drag + (targetX - px) * stiffness * dt;
        particleVelocity[offset + 1] = particleVelocity[offset + 1]! * drag + (targetY - py) * stiffness * dt;
        particleVelocity[offset + 2] = particleVelocity[offset + 2]! * drag + (targetZ - pz) * stiffness * dt;

        particlePositions[offset] += particleVelocity[offset]! * dt;
        particlePositions[offset + 1] += particleVelocity[offset + 1]! * dt;
        particlePositions[offset + 2] += particleVelocity[offset + 2]! * dt;

        for (let axis = 0; axis < 3; axis += 1) {
          const index3 = offset + axis;
          if (Math.abs(particlePositions[index3]!) > limit) {
            particlePositions[index3] = THREE.MathUtils.clamp(particlePositions[index3]!, -limit, limit);
            particleVelocity[index3] *= -0.72;
          }
        }
      }

      particleGeometry.attributes.position!.needsUpdate = true;
    }

    let centerX = 0;
    let centerY = 0;
    let centerZ = 0;
    for (let offset = 0; offset < particlePositions.length; offset += 3) {
      centerX += particlePositions[offset]!;
      centerY += particlePositions[offset + 1]!;
      centerZ += particlePositions[offset + 2]!;
    }
    centerX /= particleCount;
    centerY /= particleCount;
    centerZ /= particleCount;
    let particleSpread = 0;
    for (let offset = 0; offset < particlePositions.length; offset += 3) {
      particleSpread += (particlePositions[offset]! - centerX) ** 2
        + (particlePositions[offset + 1]! - centerY) ** 2
        + (particlePositions[offset + 2]! - centerZ) ** 2;
    }

    const lookX = reduced() || !pointerActive ? 0 : pointer.x * 0.11;
    const lookY = reduced() || !pointerActive ? 0 : pointer.y * 0.08;
    cubeRoot.rotation.y = damp(cubeRoot.rotation.y, -0.66 + lookX, 4.2, dt);
    cubeRoot.rotation.x = damp(cubeRoot.rotation.x, 0.53 - lookY, 4.2, dt);
    cubeRoot.position.x = damp(cubeRoot.position.x, pointerActive && !reduced() ? pointer.x * 0.13 : 0, 3.8, dt);
    cubeRoot.position.y = damp(cubeRoot.position.y, pointerActive && !reduced() ? pointer.y * 0.09 : 0, 3.8, dt);

    for (const cubie of cubies) {
      const target = cubie.index === activeIndex ? 1 : 0;
      cubie.activation = damp(cubie.activation, target, target ? 13 : 8, dt);
      const eased = cubie.activation * cubie.activation * (3 - 2 * cubie.activation);
      const offset = travel * eased;
      cubie.group.position.copy(cubie.base).addScaledVector(cubie.direction, offset);
      cubie.shellMaterial.emissiveIntensity = 0.065 + eased * 0.22;
      cubie.shellMaterial.opacity = 0.64 + eased * 0.08;
      cubie.shellMaterial.roughness = 0.1 - eased * 0.045;
      cubie.coreMaterial.emissiveIntensity = 0.22 + eased * 4.8;
      cubie.coreMaterial.opacity = 0.14 + eased * 0.78;
      cubie.edgeMaterial.opacity = 0.62 + eased * 0.34;
      cubie.core.scale.setScalar(1 + eased * 0.09);

      maxOffset = Math.max(maxOffset, offset);

      if (cubie.index === activeIndex) {
        focusLight.position.copy(cubie.group.position);
      }
    }

    focusLight.position.lerp(activeTarget, 1 - Math.exp(-12 * dt));
    const railLight = pointerActive ? Math.min(6, railTrails.length * 0.9 + pointerEnergy * 2.4) : 0;
    focusLight.intensity = damp(focusLight.intensity, activeIndex === null ? railLight : 7 + railLight, 10, dt);

    renderer.domElement.dataset.activeCubie = activeIndex === null ? "none" : String(activeIndex);
    renderer.domElement.dataset.activeOffset = maxOffset.toFixed(3);
    renderer.domElement.dataset.activeCircuits = String(railTrails.length);
    renderer.domElement.dataset.ambientCircuits = String(ambientRails.length);
    renderer.domElement.dataset.particleSpread = Math.sqrt(particleSpread / particleCount).toFixed(3);
    renderer.domElement.dataset.railDirection = activeElement ? "egress" : activeIndex === null ? "idle" : "ingress";
    renderer.render(scene, camera);

    if (!posterCleared) {
      posterCleared = true;
      const poster = stage.querySelector<HTMLElement>(".scene-poster");
      if (poster) {
        poster.style.opacity = "0";
        posterTimer = window.setTimeout(() => poster.remove(), 280);
      }
    }
  };

  const observer = new ResizeObserver(() => {
    dirty = true;
  });
  observer.observe(stage);
  interactionHost.addEventListener("pointermove", move);
  interactionHost.addEventListener("pointerdown", down);
  interactionHost.addEventListener("pointerup", up);
  interactionHost.addEventListener("pointercancel", cancel);
  interactionHost.addEventListener("pointerleave", leave);
  interactionHost.addEventListener("focusin", focusIn);
  interactionHost.addEventListener("focusout", focusOut);
  document.addEventListener("visibilitychange", visibility);
  window.addEventListener("blur", blur);
  media.addEventListener("change", motion);
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  renderer.domElement.addEventListener("webglcontextrestored", contextRestored);
  applyMetadata();
  resize();
  frame(performance.now());

  return {
    rebind() {
      applyMetadata();
    },
    destroy() {
      if (destroyed) {
        return;
      }

      destroyed = true;
      window.cancelAnimationFrame(raf);
      window.clearTimeout(posterTimer);
      observer.disconnect();
      interactionHost.removeEventListener("pointermove", move);
      interactionHost.removeEventListener("pointerdown", down);
      interactionHost.removeEventListener("pointerup", up);
      interactionHost.removeEventListener("pointercancel", cancel);
      interactionHost.removeEventListener("pointerleave", leave);
      interactionHost.removeEventListener("focusin", focusIn);
      interactionHost.removeEventListener("focusout", focusOut);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", blur);
      media.removeEventListener("change", motion);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      renderer.domElement.removeEventListener("webglcontextrestored", contextRestored);
      shell.removeAttribute("data-renderer");
      shell.removeAttribute("data-scene-renderer");
      shell.removeAttribute("data-motion");

      for (const cubie of cubies) {
        cubie.shellMaterial.dispose();
        cubie.coreMaterial.dispose();
        cubie.edgeMaterial.dispose();
      }

      shellGeometry.dispose();
      coreGeometry.dispose();
      edgeGeometry.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      railTrails.forEach((trail) => trail.group.remove());
      clearAmbientRails();
      ambientRailLayer.remove();
      railLayer.remove();
      renderer.dispose();
      renderer.domElement.remove();
    }
  };
}
