import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three-stdlib";
import {
  Rows,
  Text,
  Select,
  Button,
  ColorSelector,
  Box,
  Slider,
  FormField,
  Accordion,
  AccordionItem,
  Checkbox,
  Alert,
} from "@canva/app-ui-kit";
import { addElementAtPoint } from "@canva/design";
import type { IntlShape } from "react-intl";
import { useIntl } from "react-intl";
import "styles/components.css";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import venice_sunset from "assets/hdr/venice_sunset_1k.hdr";
import { messages } from "./i18n/messages";

type Shape =
  | "cube"
  | "sphere"
  | "cylinder"
  | "donut"
  | "cone"
  | "torusKnot"
  | "icosahedron"
  | "dodecahedron"
  | "capsule"
  | "octahedron"
  | "tetrahedron";
type MaterialType =
  | "matte"
  | "metal"
  | "glass"
  | "velvet"
  | "toon"
  | "wireframe"
  | "plastic"
  | "porcelain"
  | "normal"
  | "lambert";

const defaultState = {
  shape: "cube" as Shape,
  twist: 0,
  roundness: 0.1,
  taper: 0,
  noise: 0,
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
  mainColor: "#4A90E2",
  shadowTint: "#1E3A5F",
  lightColor: "#FFFFFF",
  lightX: 5,
  lightY: 10,
  lightZ: 7.5,
  shadowIntensity: 0.8,
  ambientIntensity: 0.5,
  materialType: "matte" as MaterialType,
  donutTube: 0.4,
  knotP: 2,
  knotQ: 3,
  isTransparent: true,
  backgroundColor: "#FFFFFF",
  backgroundOpacity: 1,
  wireframeOverlay: false,
};

interface ThreeSceneProps {
  shape: Shape;
  twist: number;
  roundness: number;
  taper: number;
  noise: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  mainColor: string;
  shadowTint: string;
  lightColor: string;
  lightX: number;
  lightY: number;
  lightZ: number;
  shadowIntensity: number;
  ambientIntensity: number;
  materialType: MaterialType;
  donutTube: number;
  knotP: number;
  knotQ: number;
  isTransparent: boolean;
  backgroundColor: string;
  backgroundOpacity: number;
  wireframeOverlay: boolean;
  onSceneReady: () => void;
  getRenderer: (renderer: THREE.WebGLRenderer) => void;
  getScene: (scene: THREE.Scene) => void;
  getCamera: (camera: THREE.PerspectiveCamera) => void;
  intl: IntlShape;
}

const ThreeScene: React.FC<ThreeSceneProps> = (props) => {
  const { onSceneReady, getRenderer, getScene, getCamera, intl, ...rest } =
    props;
  const {
    shape,
    twist,
    roundness,
    taper,
    noise,
    rotationX,
    rotationY,
    rotationZ,
    mainColor,
    shadowTint,
    lightColor,
    lightX,
    lightY,
    lightZ,
    shadowIntensity,
    ambientIntensity,
    materialType,
    donutTube,
    knotP,
    knotQ,
    isTransparent,
    backgroundColor,
    backgroundOpacity,
    wireframeOverlay,
  } = rest;

  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Initialize Scene and Renderer once on mount
  useEffect(() => {
    if (!mountRef.current) return;

    const width = 328;
    const height = 328;
    const renderScale = 8;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    getScene(scene);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    cameraRef.current = camera;
    getCamera(camera);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width * renderScale, height * renderScale);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;
    getRenderer(renderer);

    const canvas = renderer.domElement;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    mountRef.current.appendChild(canvas);

    new RGBELoader().load(venice_sunset, function (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      if (sceneRef.current) {
        sceneRef.current.environment = texture;
      }
      // Force a re-render after the environment map is set
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      onSceneReady();
    });

    return () => {
      renderer.dispose();
      if (mountRef.current) {
        mountRef.current.innerHTML = "";
      }
    };
  }, []);

  // Update and Render scene on property change
  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;

    if (!scene || !camera || !renderer) return;

    while (scene.children.length > 0) {
      const obj = scene.children[0];
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((material) => material.dispose());
        } else {
          obj.material.dispose();
        }
      }
      scene.remove(obj);
    }

    if (isTransparent) {
      renderer.setClearAlpha(0);
    } else {
      renderer.setClearColor(backgroundColor);
      renderer.setClearAlpha(backgroundOpacity);
    }

    const ambientLight = new THREE.AmbientLight(lightColor, ambientIntensity);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(
      new THREE.Color(lightColor),
      shadowIntensity,
    );
    directionalLight.position.set(lightX, lightY, lightZ);
    scene.add(directionalLight);

    const createMesh = (geometry: THREE.BufferGeometry) => {
      let material: THREE.Material;
      switch (materialType) {
        case "metal":
          material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(mainColor),
            roughness: 0.1,
            metalness: 0.9,
            emissive: new THREE.Color(shadowTint).multiplyScalar(0.1),
          });
          break;
        case "glass":
          material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(mainColor),
            roughness: 0,
            metalness: 0.1,
            transmission: 1.0,
            ior: 1.5,
            thickness: 1.0,
          });
          break;
        case "velvet":
          material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(mainColor),
            roughness: 1,
            metalness: 0.1,
            sheen: 0.7,
            sheenRoughness: 0.3,
            sheenColor: new THREE.Color(shadowTint),
          });
          break;
        case "toon":
          material = new THREE.MeshToonMaterial({
            color: new THREE.Color(mainColor),
          });
          break;
        case "wireframe":
          material = new THREE.MeshBasicMaterial({
            color: new THREE.Color(mainColor),
            wireframe: true,
          });
          break;
        case "plastic":
          material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(mainColor),
            roughness: 0.4,
            metalness: 0.05,
          });
          break;
        case "porcelain":
          material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(mainColor),
            roughness: 0.1,
            metalness: 0.1,
            transmission: 0.2,
            sheen: 0.5,
            sheenColor: new THREE.Color(shadowTint),
          });
          break;
        case "normal":
          material = new THREE.MeshNormalMaterial();
          break;
        case "lambert":
          material = new THREE.MeshLambertMaterial({
            color: new THREE.Color(mainColor),
          });
          break;
        case "matte":
        default:
          material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(mainColor),
            roughness: 0.9,
            metalness: 0.1,
            emissive: new THREE.Color(shadowTint).multiplyScalar(0.2),
          });
          break;
      }

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      mesh.rotation.set(
        THREE.MathUtils.degToRad(rotationX),
        THREE.MathUtils.degToRad(rotationY),
        THREE.MathUtils.degToRad(rotationZ),
      );

      geometry.computeBoundingBox();
      const bbox = geometry.boundingBox as THREE.Box3;
      const height = bbox.max.y - bbox.min.y;

      const positionAttribute = mesh.geometry.getAttribute("position");
      const vertex = new THREE.Vector3();
      for (let i = 0; i < positionAttribute.count; i++) {
        vertex.fromBufferAttribute(positionAttribute, i);

        const normalizedY = height > 0 ? (vertex.y - bbox.min.y) / height : 0;

        const taperAmount = 1.0 - normalizedY * taper;
        vertex.x *= taperAmount;
        vertex.z *= taperAmount;

        if (noise > 0) {
          const noiseAngle = vertex.y * 2.0;
          const noiseAmount = Math.sin(noiseAngle) * noise * 0.2;
          vertex.x += noiseAmount;
          vertex.z += noiseAmount;
        }

        const twistAngle = vertex.y * ((twist * Math.PI) / 180);
        const sin = Math.sin(twistAngle);
        const cos = Math.cos(twistAngle);
        const x = vertex.x * cos - vertex.z * sin;
        const z = vertex.x * sin + vertex.z * cos;
        vertex.x = x;
        vertex.z = z;

        positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }
      positionAttribute.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
    };

    let geometry: THREE.BufferGeometry | undefined;

    switch (shape) {
      case "cube":
        geometry = new RoundedBoxGeometry(2.2, 2.2, 2.2, 6, roundness * 10);
        break;
      case "sphere":
        geometry = new THREE.SphereGeometry(1.5, 32, 16);
        break;
      case "cylinder":
        geometry = new THREE.CylinderGeometry(0.8, 0.8, 2, 64);
        break;
      case "donut":
        geometry = new THREE.TorusGeometry(1, donutTube, 64, 100);
        break;
      case "cone":
        geometry = new THREE.ConeGeometry(1, 2, 64);
        break;
      case "torusKnot":
        geometry = new THREE.TorusKnotGeometry(
          0.8,
          0.25,
          100,
          16,
          knotP,
          knotQ,
        );
        break;
      case "icosahedron":
        geometry = new THREE.IcosahedronGeometry(1.2, 0);
        break;
      case "dodecahedron":
        geometry = new THREE.DodecahedronGeometry(1.2, 0);
        break;
      case "capsule":
        geometry = new THREE.CapsuleGeometry(1, 1, 4, 8);
        break;
      case "octahedron":
        geometry = new THREE.OctahedronGeometry(1.5);
        break;
      case "tetrahedron":
        geometry = new THREE.TetrahedronGeometry(1.5);
        break;
      default:
        geometry = new RoundedBoxGeometry(2.2, 2.2, 2.2, 6, roundness * 10);
    }

    if (geometry) {
      createMesh(geometry);
    }

    if (wireframeOverlay) {
      const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      });
      const wireframeMesh = new THREE.Mesh(geometry, wireframeMaterial);
      wireframeMesh.rotation.set(
        THREE.MathUtils.degToRad(rotationX),
        THREE.MathUtils.degToRad(rotationY),
        THREE.MathUtils.degToRad(rotationZ),
      );
      scene.add(wireframeMesh);
    }

    camera.position.set(0, 1, 5);
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }, [
    shape,
    twist,
    roundness,
    taper,
    noise,
    rotationX,
    rotationY,
    rotationZ,
    mainColor,
    shadowTint,
    lightColor,
    lightX,
    lightY,
    lightZ,
    shadowIntensity,
    ambientIntensity,
    materialType,
    donutTube,
    knotP,
    knotQ,
    isTransparent,
    backgroundColor,
    backgroundOpacity,
    wireframeOverlay,
  ]);

  return (
    <div
      ref={mountRef}
      className="renderPreview"
      role="img"
      aria-label={intl.formatMessage(messages.renderPreviewAriaLabel)}
    />
  );
};

const App = () => {
  const intl = useIntl();
  const [shape, setShape] = useState<Shape>(defaultState.shape);
  const [twist, setTwist] = useState(defaultState.twist);
  const [roundness, setRoundness] = useState(defaultState.roundness);
  const [taper, setTaper] = useState(defaultState.taper);
  const [noise, setNoise] = useState(defaultState.noise);
  const [rotationX, setRotationX] = useState(defaultState.rotationX);
  const [rotationY, setRotationY] = useState(defaultState.rotationY);
  const [rotationZ, setRotationZ] = useState(defaultState.rotationZ);
  const [mainColor, setMainColor] = useState(defaultState.mainColor);
  const [shadowTint, setShadowTint] = useState(defaultState.shadowTint);
  const [lightColor, setLightColor] = useState(defaultState.lightColor);
  const [lightX, setLightX] = useState(defaultState.lightX);
  const [lightY, setLightY] = useState(defaultState.lightY);
  const [lightZ, setLightZ] = useState(defaultState.lightZ);
  const [shadowIntensity, setShadowIntensity] = useState(
    defaultState.shadowIntensity,
  );
  const [ambientIntensity, setAmbientIntensity] = useState(
    defaultState.ambientIntensity,
  );
  const [materialType, setMaterialType] = useState<MaterialType>(
    defaultState.materialType,
  );
  const [donutTube, setDonutTube] = useState(defaultState.donutTube);
  const [knotP, setKnotP] = useState(defaultState.knotP);
  const [knotQ, setKnotQ] = useState(defaultState.knotQ);
  const [isTransparent, setIsTransparent] = useState(
    defaultState.isTransparent,
  );
  const [backgroundColor, setBackgroundColor] = useState(
    defaultState.backgroundColor,
  );
  const [backgroundOpacity, setBackgroundOpacity] = useState(
    defaultState.backgroundOpacity,
  );
  const [wireframeOverlay, setWireframeOverlay] = useState(
    defaultState.wireframeOverlay,
  );
  const [exportSize, setExportSize] = useState(1024);
  const [isSceneReady, setIsSceneReady] = useState(false);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const shapes: Shape[] = [
    "cube",
    "sphere",
    "cylinder",
    "donut",
    "cone",
    "torusKnot",
    "icosahedron",
    "dodecahedron",
    "capsule",
    "octahedron",
    "tetrahedron",
  ];
  const materials: MaterialType[] = [
    "matte",
    "plastic",
    "metal",
    "glass",
    "porcelain",
    "velvet",
    "toon",
    "lambert",
    "normal",
    "wireframe",
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case "enter":
          event.preventDefault();
          addToCanva();
          break;
        case "r":
          event.preventDefault();
          handleReset();
          break;
        case "c":
          event.preventDefault();
          setShape(
            (prev) => shapes[(shapes.indexOf(prev) + 1) % shapes.length],
          );
          break;
        case "m":
          event.preventDefault();
          setMaterialType(
            (prev) =>
              materials[(materials.indexOf(prev) + 1) % materials.length],
          );
          break;
        case "q":
          event.preventDefault();
          setRotationX((prev) => (prev + 5) % 360);
          break;
        case "a":
          event.preventDefault();
          setRotationX((prev) => (prev - 5 + 360) % 360);
          break;
        case "w":
          event.preventDefault();
          setRotationY((prev) => (prev + 5) % 360);
          break;
        case "s":
          event.preventDefault();
          setRotationY((prev) => (prev - 5 + 360) % 360);
          break;
        case "e":
          event.preventDefault();
          setRotationZ((prev) => (prev + 5) % 360);
          break;
        case "d":
          event.preventDefault();
          setRotationZ((prev) => (prev - 5 + 360) % 360);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [shapes, materials]);

  const addToCanva = () => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;

    if (!renderer || !scene || !camera) return;

    const canvas = renderer.domElement;

    // Temporarily resize for export
    const originalSize = new THREE.Vector2();
    renderer.getSize(originalSize);
    const originalStyle = {
      width: canvas.style.width,
      height: canvas.style.height,
    };

    renderer.setSize(exportSize, exportSize);
    canvas.style.width = `${exportSize}px`;
    canvas.style.height = `${exportSize}px`;
    renderer.render(scene, camera);

    const dataUrl = renderer.domElement.toDataURL("image/png");

    // Restore original size for preview
    renderer.setSize(originalSize.x, originalSize.y);
    canvas.style.width = originalStyle.width;
    canvas.style.height = originalStyle.height;
    renderer.render(scene, camera);

    addElementAtPoint({
      type: "image",
      dataUrl,
      width: 328,
      height: 328,
      top: 100,
      left: 100,
      altText: {
        text: intl.formatMessage({
          defaultMessage: "A 3D rendered object",
          description: "Alt text for the exported image",
        }),
        decorative: false,
      },
    });
  };

  const handleReset = () => {
    setShape(defaultState.shape);
    setTwist(defaultState.twist);
    setRoundness(defaultState.roundness);
    setTaper(defaultState.taper);
    setNoise(defaultState.noise);
    setRotationX(defaultState.rotationX);
    setRotationY(defaultState.rotationY);
    setRotationZ(defaultState.rotationZ);
    setMainColor(defaultState.mainColor);
    setShadowTint(defaultState.shadowTint);
    setLightColor(defaultState.lightColor);
    setLightX(defaultState.lightX);
    setLightY(defaultState.lightY);
    setLightZ(defaultState.lightZ);
    setShadowIntensity(defaultState.shadowIntensity);
    setAmbientIntensity(defaultState.ambientIntensity);
    setMaterialType(defaultState.materialType);
    setDonutTube(defaultState.donutTube);
    setKnotP(defaultState.knotP);
    setKnotQ(defaultState.knotQ);
    setIsTransparent(defaultState.isTransparent);
    setBackgroundColor(defaultState.backgroundColor);
    setBackgroundOpacity(defaultState.backgroundOpacity);
    setWireframeOverlay(defaultState.wireframeOverlay);
  };

  return (
    <div className="container" style={{ padding: "16px" }}>
      <Rows spacing="1u">
        <Box>
          <ThreeScene
            shape={shape}
            twist={twist}
            roundness={roundness}
            taper={taper}
            noise={noise}
            rotationX={rotationX}
            rotationY={rotationY}
            rotationZ={rotationZ}
            mainColor={mainColor}
            shadowTint={shadowTint}
            lightColor={lightColor}
            lightX={lightX}
            lightY={lightY}
            lightZ={lightZ}
            shadowIntensity={shadowIntensity}
            ambientIntensity={ambientIntensity}
            materialType={materialType}
            donutTube={donutTube}
            knotP={knotP}
            knotQ={knotQ}
            isTransparent={isTransparent}
            backgroundColor={backgroundColor}
            backgroundOpacity={backgroundOpacity}
            wireframeOverlay={wireframeOverlay}
            onSceneReady={() => setIsSceneReady(true)}
            getRenderer={(renderer) => (rendererRef.current = renderer)}
            getScene={(scene) => (sceneRef.current = scene)}
            getCamera={(camera) => (cameraRef.current = camera)}
            intl={intl}
          />
        </Box>

        <Rows spacing="1u">
          <Button
            variant="primary"
            onClick={addToCanva}
            stretch
            disabled={!isSceneReady}
            loading={!isSceneReady}
            ariaLabel={intl.formatMessage(messages.addToCanvaAriaLabel)}
          >
            {isSceneReady
              ? intl.formatMessage(messages.addToCanva)
              : intl.formatMessage(messages.loadingScene)}
          </Button>
          <Button
            variant="secondary"
            onClick={handleReset}
            stretch
            ariaLabel={intl.formatMessage(messages.resetAriaLabel)}
          >
            {intl.formatMessage(messages.reset)}
          </Button>
        </Rows>

        <Accordion>
          <AccordionItem
            title={intl.formatMessage(messages.object)}
            defaultExpanded
          >
            <Rows spacing="1.5u">
              <FormField<Shape>
                label={intl.formatMessage(messages.shape)}
                value={shape}
                control={(controlProps) => (
                  <Select
                    value={shape}
                    options={[
                      { value: "cube", label: intl.formatMessage(messages.cube) },
                      {
                        value: "sphere",
                        label: intl.formatMessage(messages.sphere),
                      },
                      {
                        value: "cylinder",
                        label: intl.formatMessage(messages.cylinder),
                      },
                      {
                        value: "donut",
                        label: intl.formatMessage(messages.donut),
                      },
                      {
                        value: "cone",
                        label: intl.formatMessage(messages.cone),
                      },
                      {
                        value: "torusKnot",
                        label: intl.formatMessage(messages.torusKnot),
                      },
                      {
                        value: "icosahedron",
                        label: intl.formatMessage(messages.icosahedron),
                      },
                      {
                        value: "dodecahedron",
                        label: intl.formatMessage(messages.dodecahedron),
                      },
                      {
                        value: "capsule",
                        label: intl.formatMessage(messages.capsule),
                      },
                      {
                        value: "octahedron",
                        label: intl.formatMessage(messages.octahedron),
                      },
                      {
                        value: "tetrahedron",
                        label: intl.formatMessage(messages.tetrahedron),
                      },
                    ]}
                    onChange={(value) => setShape(value as Shape)}
                    {...controlProps}
                  />
                )}
              />

              <FormField<MaterialType>
                label={intl.formatMessage(messages.material)}
                value={materialType}
                control={(controlProps) => (
                  <Select
                    value={materialType}
                    options={[
                      {
                        value: "matte",
                        label: intl.formatMessage(messages.matte),
                      },
                      {
                        value: "plastic",
                        label: intl.formatMessage(messages.plastic),
                      },
                      {
                        value: "metal",
                        label: intl.formatMessage(messages.metal),
                      },
                      {
                        value: "glass",
                        label: intl.formatMessage(messages.glass),
                      },
                      {
                        value: "porcelain",
                        label: intl.formatMessage(messages.porcelain),
                      },
                      {
                        value: "velvet",
                        label: intl.formatMessage(messages.velvet),
                      },
                      {
                        value: "toon",
                        label: intl.formatMessage(messages.toon),
                      },
                      {
                        value: "lambert",
                        label: intl.formatMessage(messages.lambert),
                      },
                      {
                        value: "normal",
                        label: intl.formatMessage(messages.normal),
                      },
                      {
                        value: "wireframe",
                        label: intl.formatMessage(messages.wireframe),
                      },
                    ]}
                    onChange={(value) => setMaterialType(value as MaterialType)}
                    {...controlProps}
                  />
                )}
              />
              <Checkbox
                label={intl.formatMessage(messages.wireframeOverlay)}
                checked={wireframeOverlay}
                onChange={(_, checked) => setWireframeOverlay(checked)}
              />
            </Rows>
          </AccordionItem>

          <AccordionItem title={intl.formatMessage(messages.rotation)}>
            <Rows spacing="1.5u">
              <FormField<number>
                label={intl.formatMessage(messages.rotationX, { rotationX })}
                value={rotationX}
                control={(controlProps) => (
                  <Slider
                    value={rotationX}
                    min={0}
                    max={360}
                    onChange={setRotationX}
                    {...controlProps}
                  />
                )}
              />
              <FormField<number>
                label={intl.formatMessage(messages.rotationY, { rotationY })}
                value={rotationY}
                control={(controlProps) => (
                  <Slider
                    value={rotationY}
                    min={0}
                    max={360}
                    onChange={setRotationY}
                    {...controlProps}
                  />
                )}
              />
              <FormField<number>
                label={intl.formatMessage(messages.rotationZ, { rotationZ })}
                value={rotationZ}
                control={(controlProps) => (
                  <Slider
                    value={rotationZ}
                    min={0}
                    max={360}
                    onChange={setRotationZ}
                    {...controlProps}
                  />
                )}
              />
            </Rows>
          </AccordionItem>

          <AccordionItem title={intl.formatMessage(messages.deformations)}>
            <Rows spacing="1.5u">
              <FormField<number>
                label={intl.formatMessage(messages.twist, { twist })}
                value={twist}
                control={(controlProps) => (
                  <Slider
                    value={twist}
                    min={-180}
                    max={180}
                    onChange={setTwist}
                    {...controlProps}
                  />
                )}
              />
              <FormField<number>
                label={intl.formatMessage(messages.taper, {
                  taper: taper.toFixed(2),
                })}
                value={taper}
                control={(controlProps) => (
                  <Slider
                    value={taper}
                    min={-1}
                    max={1}
                    step={0.05}
                    onChange={setTaper}
                    {...controlProps}
                  />
                )}
              />
              <FormField<number>
                label={intl.formatMessage(messages.noise, {
                  noise: noise.toFixed(2),
                })}
                value={noise}
                control={(controlProps) => (
                  <Slider
                    value={noise}
                    min={0}
                    max={1}
                    step={0.05}
                    onChange={setNoise}
                    {...controlProps}
                  />
                )}
              />
              {shape === "cube" && (
                <FormField<number>
                  label={intl.formatMessage(messages.roundness, {
                    roundness: roundness.toFixed(2),
                  })}
                  value={roundness}
                  control={(controlProps) => (
                    <Slider
                      value={roundness}
                      min={0}
                      max={1}
                      step={0.05}
                      onChange={setRoundness}
                      {...controlProps}
                    />
                  )}
                />
              )}
              {shape === "donut" && (
                <FormField<number>
                  label={intl.formatMessage(messages.donutTube, {
                    donutTube: donutTube.toFixed(2),
                  })}
                  value={donutTube}
                  control={(controlProps) => (
                    <Slider
                      value={donutTube}
                      min={0.1}
                      max={0.8}
                      step={0.05}
                      onChange={setDonutTube}
                      {...controlProps}
                    />
                  )}
                />
              )}
              {shape === "torusKnot" && (
                <>
                  <FormField<number>
                    label={intl.formatMessage(messages.knotP, { knotP })}
                    value={knotP}
                    control={(controlProps) => (
                      <Slider
                        value={knotP}
                        min={1}
                        max={10}
                        step={1}
                        onChange={setKnotP}
                        {...controlProps}
                      />
                    )}
                  />
                  <FormField<number>
                    label={intl.formatMessage(messages.knotQ, { knotQ })}
                    value={knotQ}
                    control={(controlProps) => (
                      <Slider
                        value={knotQ}
                        min={1}
                        max={10}
                        step={1}
                        onChange={setKnotQ}
                        {...controlProps}
                      />
                    )}
                  />
                </>
              )}
            </Rows>
          </AccordionItem>

          <AccordionItem title={intl.formatMessage(messages.lightingColors)}>
            <Rows spacing="1.5u">
              <Rows spacing="1u">
                <Rows spacing="0.5u">
                  <Text size="xsmall">{intl.formatMessage(messages.mainColor)}</Text>
                  <ColorSelector color={mainColor} onChange={setMainColor} />
                </Rows>
                <Rows spacing="0.5u">
                  <Text size="xsmall">{intl.formatMessage(messages.shadowTint)}</Text>
                  <ColorSelector color={shadowTint} onChange={setShadowTint} />
                </Rows>
                <Rows spacing="0.5u">
                  <Text size="xsmall">{intl.formatMessage(messages.lightColor)}</Text>
                  <ColorSelector color={lightColor} onChange={setLightColor} />
                </Rows>
              </Rows>
              <FormField<number>
                label={intl.formatMessage(messages.shadowIntensity, {
                  shadowIntensity: shadowIntensity.toFixed(2),
                })}
                value={shadowIntensity}
                control={(controlProps) => (
                  <Slider
                    value={shadowIntensity}
                    min={0}
                    max={2}
                    step={0.1}
                    onChange={setShadowIntensity}
                    {...controlProps}
                  />
                )}
              />
              <FormField<number>
                label={intl.formatMessage(messages.ambientIntensity, {
                  ambientIntensity: ambientIntensity.toFixed(2),
                })}
                value={ambientIntensity}
                control={(controlProps) => (
                  <Slider
                    value={ambientIntensity}
                    min={0}
                    max={2}
                    step={0.1}
                    onChange={setAmbientIntensity}
                    {...controlProps}
                  />
                )}
              />
              <Checkbox
                label={intl.formatMessage(messages.transparentBackground)}
                checked={isTransparent}
                onChange={(_, checked) => setIsTransparent(checked)}
              />
              {!isTransparent && (
                <Rows spacing="1u">
                  <Rows spacing="0.5u">
                    <Text size="xsmall">
                      {intl.formatMessage(messages.backgroundColor)}
                    </Text>
                    <ColorSelector
                      color={backgroundColor}
                      onChange={setBackgroundColor}
                    />
                  </Rows>
                  <FormField<number>
                    label={intl.formatMessage(messages.backgroundOpacity, {
                      opacity: Math.round(backgroundOpacity * 100),
                    })}
                    value={backgroundOpacity}
                    control={(controlProps) => (
                      <Slider
                        value={backgroundOpacity}
                        min={0}
                        max={1}
                        step={0.01}
                        onChange={setBackgroundOpacity}
                        {...controlProps}
                      />
                    )}
                  />
                </Rows>
              )}
            </Rows>
          </AccordionItem>

          <AccordionItem title={intl.formatMessage(messages.exportSettings)}>
            <Rows spacing="1.5u">
              <FormField<number>
                label={intl.formatMessage(messages.exportSize)}
                value={exportSize}
                control={(controlProps) => (
                  <Select
                    value={exportSize}
                    options={[
                      {
                        value: 512,
                        label: intl.formatMessage(messages.size512),
                      },
                      {
                        value: 1024,
                        label: intl.formatMessage(messages.size1024),
                      },
                      {
                        value: 2048,
                        label: intl.formatMessage(messages.size2048),
                      },
                      {
                        value: 4096,
                        label: intl.formatMessage(messages.size4096),
                      },
                    ]}
                    onChange={(value) => setExportSize(value as number)}
                    {...controlProps}
                  />
                )}
              />
            </Rows>
          </AccordionItem>

          <AccordionItem title={intl.formatMessage(messages.keyboardShortcuts)}>
            <Rows spacing="1.5u">
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Text size="xsmall">
                  {intl.formatMessage(messages.shortcutAddToDesign)}
                </Text>
                <span
                  style={{
                    display: "inline-flex",
                    padding: "2px 6px",
                    background: "var(--ui-kit-color-ui-neutral-strong-bg)",
                    border: "1px solid var(--ui-kit-color-ui-border)",
                    borderRadius: 6,
                    fontFamily:
                      "var(--ui-kit-typography-font-family-monospace)",
                    fontSize: 13,
                    color: "var(--ui-kit-color-content-fg)",
                  }}
                >
                  {intl.formatMessage(messages.keyEnter)}
                </span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Text size="xsmall">
                  {intl.formatMessage(messages.shortcutReset)}
                </Text>
                <span
                  style={{
                    display: "inline-flex",
                    padding: "2px 6px",
                    background: "var(--ui-kit-color-ui-neutral-strong-bg)",
                    border: "1px solid var(--ui-kit-color-ui-border)",
                    borderRadius: 6,
                    fontFamily:
                      "var(--ui-kit-typography-font-family-monospace)",
                    fontSize: 13,
                    color: "var(--ui-kit-color-content-fg)",
                  }}
                >
                  {intl.formatMessage(messages.keyR)}
                </span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Text size="xsmall">
                  {intl.formatMessage(messages.shortcutCycleShapes)}
                </Text>
                <span
                  style={{
                    display: "inline-flex",
                    padding: "2px 6px",
                    background: "var(--ui-kit-color-ui-neutral-strong-bg)",
                    border: "1px solid var(--ui-kit-color-ui-border)",
                    borderRadius: 6,
                    fontFamily:
                      "var(--ui-kit-typography-font-family-monospace)",
                    fontSize: 13,
                    color: "var(--ui-kit-color-content-fg)",
                  }}
                >
                  {intl.formatMessage(messages.keyC)}
                </span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Text size="xsmall">
                  {intl.formatMessage(messages.shortcutCycleMaterials)}
                </Text>
                <span
                  style={{
                    display: "inline-flex",
                    padding: "2px 6px",
                    background: "var(--ui-kit-color-ui-neutral-strong-bg)",
                    border: "1px solid var(--ui-kit-color-ui-border)",
                    borderRadius: 6,
                    fontFamily:
                      "var(--ui-kit-typography-font-family-monospace)",
                    fontSize: 13,
                    color: "var(--ui-kit-color-content-fg)",
                  }}
                >
                  {intl.formatMessage(messages.keyM)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <Text size="xsmall">
                  {intl.formatMessage(messages.shortcutRotateX)}
                </Text>
                <span
                  style={{
                    display: "inline-flex",
                    padding: "2px 6px",
                    background: "var(--ui-kit-color-ui-neutral-strong-bg)",
                    border: "1px solid var(--ui-kit-color-ui-border)",
                    borderRadius: 6,
                    fontFamily:
                      "var(--ui-kit-typography-font-family-monospace)",
                    fontSize: 13,
                    color: "var(--ui-kit-color-content-fg)",
                  }}
                >
                  {intl.formatMessage(messages.keyQ)}
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    padding: "2px 6px",
                    background: "var(--ui-kit-color-ui-neutral-strong-bg)",
                    border: "1px solid var(--ui-kit-color-ui-border)",
                    borderRadius: 6,
                    fontFamily:
                      "var(--ui-kit-typography-font-family-monospace)",
                    fontSize: 13,
                    color: "var(--ui-kit-color-content-fg)",
                  }}
                >
                  {intl.formatMessage(messages.keyA)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <Text size="xsmall">
                  {intl.formatMessage(messages.shortcutRotateY)}
                </Text>
                <span
                  style={{
                    display: "inline-flex",
                    padding: "2px 6px",
                    background: "var(--ui-kit-color-ui-neutral-strong-bg)",
                    border: "1px solid var(--ui-kit-color-ui-border)",
                    borderRadius: 6,
                    fontFamily:
                      "var(--ui-kit-typography-font-family-monospace)",
                    fontSize: 13,
                    color: "var(--ui-kit-color-content-fg)",
                  }}
                >
                  {intl.formatMessage(messages.keyW)}
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    padding: "2px 6px",
                    background: "var(--ui-kit-color-ui-neutral-strong-bg)",
                    border: "1px solid var(--ui-kit-color-ui-border)",
                    borderRadius: 6,
                    fontFamily:
                      "var(--ui-kit-typography-font-family-monospace)",
                    fontSize: 13,
                    color: "var(--ui-kit-color-content-fg)",
                  }}
                >
                  {intl.formatMessage(messages.keyS)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <Text size="xsmall">
                  {intl.formatMessage(messages.shortcutRotateZ)}
                </Text>
                <span
                  style={{
                    display: "inline-flex",
                    padding: "2px 6px",
                    background: "var(--ui-kit-color-ui-neutral-strong-bg)",
                    border: "1px solid var(--ui-kit-color-ui-border)",
                    borderRadius: 6,
                    fontFamily:
                      "var(--ui-kit-typography-font-family-monospace)",
                    fontSize: 13,
                    color: "var(--ui-kit-color-content-fg)",
                  }}
                >
                  {intl.formatMessage(messages.keyE)}
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    padding: "2px 6px",
                    background: "var(--ui-kit-color-ui-neutral-strong-bg)",
                    border: "1px solid var(--ui-kit-color-ui-border)",
                    borderRadius: 6,
                    fontFamily:
                      "var(--ui-kit-typography-font-family-monospace)",
                    fontSize: 13,
                    color: "var(--ui-kit-color-content-fg)",
                  }}
                >
                  {intl.formatMessage(messages.keyD)}
                </span>
              </div>
              <Box paddingTop="1u">
                <Alert tone="info">
                  {intl.formatMessage(messages.shortcutsInfo)}
                </Alert>
              </Box>
            </Rows>
          </AccordionItem>
        </Accordion>
      </Rows>
    </div>
  );
};

export default App;
