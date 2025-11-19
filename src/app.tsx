import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Rows, Text, Select, Button, ColorSelector, Box, Slider, Columns, Column } from "@canva/app-ui-kit";
import { addElementAtPoint } from "@canva/design";
import { useIntl } from "react-intl";
import "styles/components.css";
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import venice_sunset from 'assets/hdr/venice_sunset_1k.hdr';

type Shape = "cube" | "sphere" | "cylinder" | "donut" | "cone";
type MaterialType = "matte" | "metal" | "glass" | "velvet" | "toon" | "wireframe";

const App = () => {
  const intl = useIntl();
  const [shape, setShape] = useState<Shape>("cube");
  const [twist, setTwist] = useState(0);
  const [roundness, setRoundness] = useState(0.1);
  const [angle, setAngle] = useState("isometric-left");
  const [mainColor, setMainColor] = useState("#4A90E2");
  const [shadowTint, setShadowTint] = useState("#1E3A5F");
  const [shadowIntensity, setShadowIntensity] = useState(0.8);
  const [materialType, setMaterialType] = useState<MaterialType>("matte");

  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Initialize Scene and Renderer once on mount
  useEffect(() => {
    if (!mountRef.current || rendererRef.current) return;

    const width = 328;
    const height = 328;
    const renderScale = 4;

    // --- Scene, Camera, Renderer Setup ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width * renderScale, height * renderScale);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    const canvas = renderer.domElement;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    mountRef.current.appendChild(canvas);

    // --- Environment Map ---
    new RGBELoader().load(venice_sunset, function (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      if (sceneRef.current) {
        sceneRef.current.environment = texture;
      }
    });

    // --- Cleanup on unmount ---
    return () => {
      renderer.dispose();
      if (mountRef.current) {
        mountRef.current.innerHTML = "";
      }
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
    };
  }, []);


  // Update and Render scene on property change
  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;

    if (!scene || !camera || !renderer) return;

    // --- Clear previous objects ---
    while (scene.children.length > 0) {
      const object = scene.children[0];
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
      scene.remove(object);
    }

    // --- Camera ---
    switch (angle) {
      case "isometric-left": camera.position.set(-5, 5, 5); break;
      case "isometric-right": camera.position.set(5, 5, 5); break;
      case "top-down": camera.position.set(0, 7, 2); break;
      default: camera.position.set(-5, 5, 5);
    }
    camera.lookAt(scene.position);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, shadowIntensity);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    const createMesh = (geometry: THREE.BufferGeometry) => {
      let material: THREE.Material;
      switch (materialType) {
        case 'metal':
          material = new THREE.MeshStandardMaterial({ color: new THREE.Color(mainColor), roughness: 0.1, metalness: 0.9, emissive: new THREE.Color(shadowTint).multiplyScalar(0.1) });
          break;
        case 'glass':
          material = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(mainColor), roughness: 0, metalness: 0.1, transmission: 1.0, ior: 1.5, thickness: 1.0 });
          break;
        case 'velvet':
          material = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(mainColor), roughness: 1, metalness: 0.1, sheen: 0.7, sheenRoughness: 0.3, sheenColor: new THREE.Color(shadowTint) });
          break;
        case 'toon':
          material = new THREE.MeshToonMaterial({ color: new THREE.Color(mainColor) });
          break;
        case 'wireframe':
          material = new THREE.MeshBasicMaterial({ color: new THREE.Color(mainColor), wireframe: true });
          break;
        case 'matte':
        default:
          material = new THREE.MeshStandardMaterial({ color: new THREE.Color(mainColor), roughness: 0.9, metalness: 0.1, emissive: new THREE.Color(shadowTint).multiplyScalar(0.2) });
          break;
      }

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      // Deformations
      const positionAttribute = mesh.geometry.getAttribute('position');
      const vertex = new THREE.Vector3();
      for (let i = 0; i < positionAttribute.count; i++) {
        vertex.fromBufferAttribute(positionAttribute, i);
        const twistAngle = vertex.y * (twist * Math.PI / 180);
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
        geometry = new THREE.CylinderGeometry(1.4, 1.4, 2.8, 32);
        break;
      case "donut":
        geometry = new THREE.TorusGeometry(1.4, 0.6, 16, 100);
        break;
      case "cone":
        geometry = new THREE.ConeGeometry(1.4, 2.8, 32);
        break;
      default:
        geometry = new RoundedBoxGeometry(2.2, 2.2, 2.2, 6, roundness * 10);
    }

    if (geometry) {
      createMesh(geometry);
    }

    renderer.render(scene, camera);

  }, [shape, twist, roundness, angle, mainColor, shadowTint, shadowIntensity, materialType]);

  const addToCanva = async () => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    // Force a render to ensure the canvas is up-to-date
    if (sceneRef.current && cameraRef.current) {
      renderer.render(sceneRef.current, cameraRef.current);
    }

    const canvas = renderer.domElement;
    const dataUrl = canvas.toDataURL("image/png");

    await addElementAtPoint({
      type: "image",
      dataUrl,
      width: 1312,
      height: 1312,
      top: 0,
      left: 0,
    });
  };

  return (
    <div className="container">
      <Rows spacing="1u">
        <Box>
          <div ref={mountRef} className="renderPreview" />
        </Box>
        
        <Columns spacing="1u" align="center">
            <Column>
                <Rows spacing="0.5u">
                    <Text size="xsmall">{intl.formatMessage({ defaultMessage: "Main Color", description: "Label for the main color selector" })}</Text>
                    <ColorSelector
                        color={mainColor}
                        onChange={setMainColor}
                    />
                </Rows>
            </Column>
            <Column>
                <Rows spacing="0.5u">
                    <Text size="xsmall">{intl.formatMessage({ defaultMessage: "Shadow Tint", description: "Label for the shadow tint color selector" })}</Text>
                    <ColorSelector
                        color={shadowTint}
                        onChange={setShadowTint}
                    />
                </Rows>
            </Column>
        </Columns>

        <Button variant="primary" onClick={addToCanva} stretch>
          {intl.formatMessage({ defaultMessage: "Add to Canva", description: "Button to add the 3D element to the Canva design" })}
        </Button>

        <Rows spacing="1.5u">
          <Text size="small" tone="tertiary">{intl.formatMessage({ defaultMessage: "Shape", description: "Label for the shape selection dropdown" })}</Text>
          <Select
            value={shape}
            options={[
              { value: "cube", label: intl.formatMessage({ defaultMessage: "Cube", description: "Cube shape option" }) },
              { value: "sphere", label: intl.formatMessage({ defaultMessage: "Sphere", description: "Sphere shape option" }) },
              { value: "cylinder", label: intl.formatMessage({ defaultMessage: "Cylinder", description: "Cylinder shape option" }) },
              { value: "donut", label: intl.formatMessage({ defaultMessage: "Donut", description: "Donut shape option" }) },
              { value: "cone", label: intl.formatMessage({ defaultMessage: "Cone", description: "Cone shape option" }) },
            ]}
            onChange={(value) => setShape(value as Shape)}
          />
        </Rows>

        <Rows spacing="1.5u">
          <Text size="small" tone="tertiary">{intl.formatMessage({ defaultMessage: "Material", description: "Label for the material selection dropdown" })}</Text>
          <Select
            value={materialType}
            options={[
              { value: "matte", label: intl.formatMessage({ defaultMessage: "Matte", description: "Matte material option" }) },
              { value: "metal", label: intl.formatMessage({ defaultMessage: "Metal", description: "Metal material option" }) },
              { value: "glass", label: intl.formatMessage({ defaultMessage: "Glass", description: "Glass material option" }) },
              { value: "velvet", label: intl.formatMessage({ defaultMessage: "Velvet", description: "Velvet material option" }) },
              { value: "toon", label: intl.formatMessage({ defaultMessage: "Toon", description: "Toon material option" }) },
              { value: "wireframe", label: intl.formatMessage({ defaultMessage: "Wireframe", description: "Wireframe material option" }) },
            ]}
            onChange={(value) => setMaterialType(value as MaterialType)}
          />
        </Rows>

        <Rows spacing="1.5u">
          <Text size="small" tone="tertiary">{intl.formatMessage({ defaultMessage: "Camera Angle", description: "Label for the camera angle selection dropdown" })}</Text>
          <Select
            value={angle}
            options={[
              { value: "isometric-left", label: intl.formatMessage({ defaultMessage: "Isometric Left", description: "Isometric Left camera angle" }) },
              { value: "isometric-right", label: intl.formatMessage({ defaultMessage: "Isometric Right", description: "Isometric Right camera angle" }) },
              { value: "top-down", label: intl.formatMessage({ defaultMessage: "Slightly Top-Down", description: "Slightly Top-Down camera angle" }) },
            ]}
            onChange={setAngle}
          />
        </Rows>

        <Rows spacing="1.5u">
          <Text size="small" tone="tertiary">{intl.formatMessage({ defaultMessage: "Deformations", description: "Section title for deformation controls" })}</Text>
          <Box>
            <Text size="xsmall">{intl.formatMessage({ defaultMessage: "Twist: {twist}°", description: "Label for the twist slider" }, { twist })}</Text>
            <Slider
              value={twist}
              min={-180}
              max={180}
              onChange={setTwist}
            />
          </Box>
          {shape === 'cube' && (
            <Box>
              <Text size="xsmall">{intl.formatMessage({ defaultMessage: "Roundness: {roundness}", description: "Label for the roundness slider" }, { roundness: roundness.toFixed(2) })}</Text>
              <Slider
                value={roundness}
                min={0}
                max={1}
                step={0.05}
                onChange={setRoundness}
              />
            </Box>
          )}
        </Rows>

        <Rows spacing="1.5u">
          <Text size="small" tone="tertiary">{intl.formatMessage({ defaultMessage: "Lighting", description: "Section title for lighting controls" })}</Text>
          <Box>
            <Text size="xsmall">{intl.formatMessage({ defaultMessage: "Shadow Intensity: {shadowIntensity}", description: "Label for the shadow intensity slider" }, { shadowIntensity: shadowIntensity.toFixed(2) })}</Text>
            <Slider
              value={shadowIntensity}
              min={0}
              max={2}
              step={0.1}
              onChange={setShadowIntensity}
            />
          </Box>
        </Rows>
      </Rows>
    </div>
  );
};

export default App;
