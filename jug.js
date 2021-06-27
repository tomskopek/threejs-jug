
import * as THREE from "https://cdn.skypack.dev/three@0.128.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.128.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.128.0/examples/jsm/loaders/GLTFLoader.js";
import {RGBELoader} from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/loaders/RGBELoader.js';
import { GUI } from "https://cdn.skypack.dev/three@0.128.0/examples/jsm/libs/dat.gui.module.js";
import {Water} from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/objects/Water.js';
import {RectAreaLightUniformsLib} from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/postprocessing/UnrealBloomPass.js';



/*
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
import {RGBELoader} from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/RGBELoader.js';
import { GUI } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/libs/dat.gui.module.js";
import {Water} from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/objects/Water.js';
import {RectAreaLightUniformsLib} from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/UnrealBloomPass.js';
*/

//---------------------------------------------------------------------------------   INIT
var watermat,mixer;
var clock = new THREE.Clock();

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

//---------------------------------------------------------------------------------   RENDERER

  const canvas = document.querySelector("#c");
  const gui = new GUI();

  const renderer = new THREE.WebGLRenderer({ canvas,antialias:true});
  resizeRendererToDisplaySize(renderer);
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1;
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.outputEncoding = THREE.GammaEncoding;
	renderer.gammaFactor=1.2;
	renderer.physicallyCorrectLights=true;
  const EnvFolder = gui.addFolder("Environment");
  EnvFolder.add(renderer, "toneMappingExposure", 0, 5, 0.1).listen();

//---------------------------------------------------------------------------------   CAMERA

  const fov = 45;
  const aspect = 2; // the canvas default
  const near = 0.1;
  const far = 100;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(2, 15, 25);
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();
  const cameraFolder = gui.addFolder("Camera");
  // cameraFolder.open();
  cameraFolder.add(camera.position, "x", -45, 45, 1).listen();
  cameraFolder.add(camera.position, "y", -45, 45, 1).listen();
  cameraFolder.add(camera.position, "z", -45, 45, 1).listen();

//---------------------------------------------------------------------------------   ORBIT CONTROLS
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 5, 0);
  controls.autoRotate = false;
  controls.update();

  gui.add(controls, "autoRotate");

//---------------------------------------------------------------------------------   SCENE - BACKGROUND


  const scene = new THREE.Scene();

	var fog= new THREE.Fog(0xaaaaaa,5,100);
//	scene.fog=fog;

    const fogFolder = gui.addFolder("Fog");
    fogFolder.add(fog, "near", 0, 100, 0.1).listen();
    fogFolder.add(fog, "far", 0, 100, 0.1).listen();

  // scene.background = new THREE.Color(0xaaaaaa);
  scene.background = new THREE.Color(0x0C9CDB); // Primary Blue
  // scene.background = new THREE.Color(0xffffff); // White
//  scene.background = new THREE.Color(0x333388);

//---------------------------------------------------------------------------------    RADIANCE MAP

	new RGBELoader()
	    .setDataType(THREE.UnsignedByteType)
	    .setPath('jug/9-5_Jug_resources/')
		
      .load('snowy_field_1k.hdr', function(texture){
		texture.encoding = THREE.RGBEEncoding;
		let pmremGenerator = new THREE.PMREMGenerator(renderer);
		let envMap = pmremGenerator.fromEquirectangular(texture).texture;
		pmremGenerator.compileEquirectangularShader();

		scene.environment = envMap;

		texture.dispose();
		pmremGenerator.dispose();
	});
	
	
//---------------------------------------------------------------------------------    GROUND PLANE

  {
    const planeSize = 60;
    const loader = new THREE.TextureLoader();
    const texture = loader.load("jug/9-5_Jug_resources/wood.jpg");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    const repeats = 1;
    texture.repeat.set(repeats, repeats);
    const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshPhysicalMaterial({
      map: texture,
      // color: 0x66bfff,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(planeGeo, planeMat);
    mesh.rotation.x = Math.PI * -0.5;
    mesh.position.y=-0.01;
//    scene.add(mesh);
  }

//---------------------------------------------------------------------------------   PARAMS
let cork, glass, water;

  {
//---------------------------------------------------------------------------------   GLTF LOADER
    const gltfLoader = new GLTFLoader();
    const url = "jug/9-5 Jug.glb";
    gltfLoader.load(
      url,
      (gltf) => {
      
        const root = gltf.scene;
        root.scale.multiplyScalar(40.0);
        root.traverse((o) => {
          if (o.isMesh) {
            if (o.name === "Jug_v1003") {
              cork = o;
            }
            if (o.name === "Jug_v1005") {


//------------------------------------------------------------------------------	 GLASS
              glass = o;

//			glass.material.ior=1.06;
			root.getObjectByName('water').material.ior=2;
			root.getObjectByName('water').material.depthWrite=false;
			
              const glassFolder = gui.addFolder("Glass");
              glassFolder.add(glass.material, "transmission", 0, 1, 0.01);
              glassFolder.add(glass.material, "opacity", 0, 1, 0.1);
              glassFolder.add(glass.material, "metalness", 0, 1, 0.1);
              glassFolder.add(glass.material, "roughness", 0, 1, 0.1);
              glassFolder.add(glass.material, "envMapIntensity", 0, 1, 0.1);
              glassFolder.add(glass.material, "transparent");
              glassFolder.add(glass.material, "depthWrite");
              glassFolder.add(glass.material, "reflectivity", 0, 1, 0.1);
              glassFolder.add(glass.material, "clearcoat", 0, 1, 0.01);
              glassFolder.add(glass.material, "ior", 1, 2.333, 0.01);
            }
          }
        });
const waterGeometry = new THREE.CircleGeometry( 0.057, 64 );
				watermat = new Water(
					waterGeometry,
					{
						textureWidth: 512,
						textureHeight: 512,
						waterNormals: new THREE.TextureLoader().load( 'jug/9-5_Jug_resources/waternormals.jpg', function ( texture ) {

							texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

						} ),
						sunDirection: new THREE.Vector3(),
						sunColor: 0xffffff,
						waterColor: 0xcccccc,
						distortionScale: 3.7,
						fog: scene.fog !== undefined
					}
				);

				watermat.rotation.x = - Math.PI / 2;
				watermat.position.set(root.getObjectByName('water').position.x,root.getObjectByName('water').position.y,root.getObjectByName('water').position.z);
				watermat.name='watermat';
				root.add(watermat); 
        
        scene.add(root);
			mixer = new THREE.AnimationMixer( gltf.scene );
			var i=0;
			for (i=0; i<gltf.animations.length;i++){
				mixer.clipAction(gltf.animations[i]).play();
			};
        
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



	var glight = new THREE.HemisphereLight(0xffffff,0xaaaaff,1);
	scene.add(glight);
    let hemiFolder = gui.addFolder("HemiLight");
    hemiFolder.add(glight, "intensity", 0, 10, 0.1).listen();


//----------------------------------------------------------------------------------------- LIGHTS

	let L1= new THREE.RectAreaLight(0xffffff,10,10,100);
	L1.name='L1';
	L1.power=800;
	L1.position.y=0;
	L1.position.x=-20;
	L1.position.z=10;
 	L1.rotation.y=-Math.PI/2.5;
//	scene.add(L1);

	let L2= new THREE.RectAreaLight(0xffcc88,10,10,100);
	L2.name='L2';
	L2.power=800;
	L2.position.y=0;
	L2.position.x=20;
	L2.position.z=-10;
 	L2.rotation.y=-Math.PI/2.5;
//	scene.add(L2);

	RectAreaLightUniformsLib.init()
    const ArealightFolder = gui.addFolder("AreaLight");
    ArealightFolder.add(L1, "intensity", 0, 100, 0.1).listen();
    ArealightFolder.add(L2, "intensity", 0, 100, 0.1).listen();



//----------------------------------------------------------------------------------------- EFFECT COMPOSER



	const composer= new EffectComposer(renderer);
	composer.addPass(new RenderPass(scene,camera));

	
	var bloomPass = new UnrealBloomPass(new THREE.Vector2(window.clientWidth,window.clientHeight) , 1, 1, 1); // Strength, radius, threshold
	bloomPass.strength=0.45;
	bloomPass.threshold=0.916;
	bloomPass.radius=1.21;

	composer.addPass(bloomPass);
    const bloomFolder = gui.addFolder("Bloom");
    bloomFolder.add(bloomPass, "strength", 0, 2, 0.01).listen();
    bloomFolder.add(bloomPass, "threshold", 0.5, 1, 0.001).listen();
    bloomFolder.add(bloomPass, "radius", 0, 1.5, 0.01).listen();


//-----------------------------------------------------------------------------------------  ANIM LOOP

 

  function render(time) {
    time *= 0.001; // convert time to seconds

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

	composer.render();
//   renderer.render(scene, camera);
    controls.update();
    requestAnimationFrame(render);
	if (mixer != null) {
		watermat.material.uniforms[ 'time' ].value += 0.2 / 60.0;
	};
	if (mixer != null) {
		mixer.update(clock.getDelta());
	};

  }

  requestAnimationFrame(render);
}
