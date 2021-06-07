import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.121.1/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/loaders/GLTFLoader.js";
import { GUI } from "https://threejsfundamentals.org/threejs/../3rdparty/dat.gui.module.js";
// https://www.jsdelivr.com/package/npm/three
// for some reason 0.128.0 imports "three" differently and it doesnt work

init();

function init() {
  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const pixelRatio = window.devicePixelRatio;
    const width = (canvas.clientWidth * pixelRatio) | 0;
    const height = (canvas.clientHeight * pixelRatio) | 0;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  const canvas = document.querySelector("#c");
  const gui = new GUI();

  const renderer = new THREE.WebGLRenderer({ canvas });
  resizeRendererToDisplaySize(renderer);
  const fov = 45;
  const aspect = 2; // the canvas default
  const near = 0.1;
  const far = 100;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(-2, 15, 25);
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();
  const cameraFolder = gui.addFolder("Camera");
  // cameraFolder.open();
  cameraFolder.add(camera.position, "x", -45, 45, 1).listen();
  cameraFolder.add(camera.position, "y", -45, 45, 1).listen();
  cameraFolder.add(camera.position, "z", -45, 45, 1).listen();

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 5, 0);
  controls.autoRotate = true;
  controls.update();

  gui.add(controls, "autoRotate");

  const scene = new THREE.Scene();

  scene.background = new THREE.Color(0x66bfff);

  {
    const planeSize = 40;
    const loader = new THREE.TextureLoader();
    const texture = loader.load("checker.png");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    const repeats = planeSize / 2;
    texture.repeat.set(repeats, repeats);
    const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshPhongMaterial({
      map: texture,
      // color: 0x66bfff,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(planeGeo, planeMat);
    mesh.rotation.x = Math.PI * -0.5;
    scene.add(mesh);
  }

  const params = {
    color: 0xffffff,
    transmission: 1,
    opacity: 1,
    metalness: 0.1,
    roughness: 0,
    envMapIntensity: 1,
    lightIntensity: 1,
    exposure: 1,
  };

  {
    const height = 10;
    const radius = 3;
    const geometry = new THREE.CylinderGeometry(
      radius,
      radius,
      height,
      32,
      1,
      true
    );
    const material = new THREE.MeshPhysicalMaterial({
      color: params.color,
      transmission: params.transmission,
      opacity: params.opacity,
      metalness: params.metalness,
      roughness: params.roughness,
      envMapIntensity: params.envMapIntensity,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.y = height / 2;
    // scene.add(cylinder);
  }

  let cork, glass, water;

  {
    const gltfLoader = new GLTFLoader();
    const url = "jug/9-5 Jug.gltf";
    gltfLoader.load(
      url,
      (gltf) => {
        const root = gltf.scene;
        root.scale.multiplyScalar(40.0);
        root.traverse((o) => {
          if (o.isMesh) {
            if (o.name === "Jug v1.2_2") {
              cork = o;
            }
            if (o.name === "Jug v1.2_3") {
              let showWater = {
                showWater: true,
                waterOpacity: 0.8,
              };
              water = o;
              water.material.color = new THREE.Color(0x0000ff);
              water.material.opacity = 0.8;
              const waterFolder = gui.addFolder("Water");
              waterFolder.add(showWater, "showWater").onChange((v) => {
                if (v) {
                  water.material.opacity = showWater.waterOpacity;
                } else {
                  showWater.waterOpacity = water.material.opacity;
                  water.material.opacity = 0;
                }
              });
              waterFolder.add(water.material, "transparent");
              waterFolder.add(water.material, "opacity", 0, 1);
            }
            if (o.name === "Jug v1.2_4") {
              glass = o;
              const material = new THREE.MeshPhysicalMaterial({
                color: params.color,
                transmission: params.transmission,
                opacity: params.opacity,
                metalness: params.metalness,
                roughness: params.roughness,
                envMapIntensity: params.envMapIntensity,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: true,
                // alphaMap: texture,
                // envMap: hdrCubeRenderTarget.texture,
              });

              glass.material = material;
              const glassFolder = gui.addFolder("Glass");
              glassFolder.open();
              glassFolder.add(glass.material, "transmission", 0, 1, 0.01);
              glassFolder.add(glass.material, "opacity", 0, 1, 0.1);
              glassFolder.add(glass.material, "metalness", 0, 1, 0.1);
              glassFolder.add(glass.material, "roughness", 0, 1, 0.1);
              glassFolder.add(glass.material, "envMapIntensity", 0, 1, 0.1);
              glassFolder.add(glass.material, "transparent");
              glassFolder.add(glass.material, "depthWrite");
              glassFolder.add(glass.material, "reflectivity", 0, 1, 0.1);
              glassFolder.add(glass.material, "clearcoat", 0, 1, 0.01);
            }
          }
        });
        scene.add(root);
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      (err) => {
        console.log("---@err --- jug.js: er, L103");
        console.log(err);
      }
    );
  }

  let bulbX = 4,
    bulbY = 13,
    bulbZ = 5;

  let lightbulb = new THREE.Object3D();
  lightbulb.position.set(bulbX, bulbY, bulbZ);
  scene.add(lightbulb);

  {
    const geometry = new THREE.SphereGeometry(2, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const bulbSphere = new THREE.Mesh(geometry, material);
    lightbulb.add(bulbSphere);
  }

  {
    const lightColor = 0xffffff;
    const intensity = 1.2;
    const light = new THREE.PointLight(lightColor, intensity, 0, 2);
    lightbulb.add(light);
    const lightFolder = gui.addFolder("Light");
    lightFolder.add(lightbulb.position, "x", -8, 8, 0.1).listen();
    lightFolder.add(lightbulb.position, "y", 1, 15, 0.1).listen();
    lightFolder.add(lightbulb.position, "z", -8, 8, 0.1).listen();
    lightFolder.add(light, "intensity", 0, 3, 0.01);
  }

  renderer.render(scene, camera);

  function render(time) {
    time *= 0.001; // convert time to seconds

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    // bulbX += Math.sin(time) / 10;
    // bulbY += Math.sin(time) / 10;
    // bulbZ += Math.sin(time * 5);
    // lightbulb.position.set(bulbX, bulbY, bulbZ);

    renderer.render(scene, camera);
    controls.update();

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}