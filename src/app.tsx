import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Rows, Text, Select, Button, ColorSelector, Box, Slider } from "@canva/app-ui-kit";
import { addElementAtPoint } from "@canva/design";
import "styles/components.css";

type Preset =
  | "isometric"
  | "clay"
  | "extrude"
  | "low-poly"
  | "organic"
  | "emoji";

type Shape = "cube" | "sphere" | "cylinder" | "donut" | "cone" | "text" | "svg";

const App = () => {
  const [preset, setPreset] = useState<Preset>("isometric");
  const [shape, setShape] = useState<Shape>("cube");
  const [twist, setTwist] = useState(0);
  const [roundness, setRoundness] = useState(0);
  const [fatten, setFatten] = useState(1);
  const [angle, setAngle] = useState("isometric-left");
  const [mainColor, setMainColor] = useState("#ff8a80");
  const [shadowTint, setShadowTint] = useState("#444444");
  const [shadowIntensity, setShadowIntensity] = useState(0.5);

  const mountRef = useRef<HTMLDivElement>(null);

  // Apply preset configurations
  useEffect(() => {
    switch (preset) {
      case "isometric":
        setShape("cube");
        setTwist(0);
        setRoundness(0.1);
        setFatten(1);
        setAngle("isometric-left");
        setMainColor("#4A90E2");
        setShadowTint("#2C3E50");
        setShadowIntensity(0.6);
        break;
      case "clay":
        setShape("sphere");
        setTwist(0);
        setRoundness(0.8);
        setFatten(1.1);
        setAngle("isometric-right");
        setMainColor("#E67E22");
        setShadowTint("#D35400");
        setShadowIntensity(0.4);
        break;
      case "extrude":
        setShape("cylinder");
        setTwist(0);
        setRoundness(0);
        setFatten(1);
        setAngle("isometric-left");
        setMainColor("#9B59B6");
        setShadowTint("#8E44AD");
        setShadowIntensity(0.7);
        break;
      case "low-poly":
        setShape("cone");
        setTwist(0);
        setRoundness(0);
        setFatten(1);
        setAngle("isometric-right");
        setMainColor("#2ECC71");
        setShadowTint("#27AE60");
        setShadowIntensity(0.5);
        break;
      case "organic":
        setShape("sphere");
        setTwist(15);
        setRoundness(0.9);
        setFatten(1.15);
        setAngle("isometric-left");
        setMainColor("#E91E63");
        setShadowTint("#C2185B");
        setShadowIntensity(0.45);
        break;
      case "emoji":
        setShape("sphere");
        setTwist(0);
        setRoundness(1);
        setFatten(1.05);
        setAngle("top-down");
        setMainColor("#FFD700");
        setShadowTint("#FFA500");
        setShadowIntensity(0.3);
        break;
    }
  }, [preset]);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    // No background for transparency

    const width = 328;
    const height = 328;

    // --- Camera Setup ---
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    switch (angle) {
      case "isometric-left":
        camera.position.set(-5, 5, 5);
        break;
      case "isometric-right":
        camera.position.set(5, 5, 5);
        break;
      case "top-down":
        camera.position.set(0, 7, 2);
        break;
      default:
        camera.position.set(-5, 5, 5);
    }
    camera.lookAt(scene.position);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, shadowIntensity);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);


    // --- Geometry ---
    let geometry: THREE.BufferGeometry;
    switch (shape) {
      case "cube":
        geometry = new RoundedBoxGeometry(1.5, 1.5, 1.5, 6, roundness * 10);
        break;
      case "sphere":
        geometry = new THREE.SphereGeometry(1, 32, 16);
        break;
      case "cylinder":
        geometry = new THREE.CylinderGeometry(1, 1, 2, 32);
        break;
      case "donut":
        geometry = new THREE.TorusGeometry(1, 0.4, 16, 100);
        break;
      case "cone":
        geometry = new THREE.ConeGeometry(1, 2, 32);
        break;
      default:
        geometry = new RoundedBoxGeometry(1.5, 1.5, 1.5, 6, roundness * 10);
    }

    // --- Material & Mesh ---
    const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(mainColor),
        roughness: 0.5,
        metalness: 0.1,
        emissive: new THREE.Color(shadowTint).multiplyScalar(0.2)
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // --- Deformations ---
    const positionAttribute = mesh.geometry.getAttribute('position');
    const vertex = new THREE.Vector3();
    for (let i = 0; i < positionAttribute.count; i++) {
        vertex.fromBufferAttribute(positionAttribute, i);
        
        // Twist
        const twistAngle = vertex.y * (twist * Math.PI / 180);
        const sin = Math.sin(twistAngle);
        const cos = Math.cos(twistAngle);
        const x = vertex.x * cos - vertex.z * sin;
        const z = vertex.x * sin + vertex.z * cos;
        vertex.x = x;
        vertex.z = z;

        // Fatten
        vertex.multiplyScalar(fatten);

        positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    positionAttribute.needsUpdate = true;
    mesh.geometry.computeVertexNormals(); // Important for lighting after deformation

    // --- WebGL Renderer with transparent background ---
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      preserveDrawingBuffer: true 
    });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // Transparent background
    renderer.render(scene, camera);
    
    // Clear previous render and append new one
    if (mountRef.current) {
        mountRef.current.innerHTML = '';
        mountRef.current.appendChild(renderer.domElement);
    }

    // Cleanup
    return () => {
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };

  }, [shape, twist, roundness, fatten, angle, mainColor, shadowTint, shadowIntensity, preset]);

  const exportToSvg = async () => {
    if (mountRef.current) {
      const canvas = mountRef.current.querySelector('canvas');
      if (canvas) {
        // Export directly as PNG with transparency (most reliable method)
        const dataUrl = canvas.toDataURL('image/png');
        
        await addElementAtPoint({
          type: 'image',
          dataUrl,
          top: 0,
          left: 0,
          width: 328,
          height: 328
        });
      }
    }
  };

  return (
    <div className="scrollContainer">
      <Rows spacing="2u">
        {/* Preview at the top */}
        <Box>
          <div ref={mountRef} className="renderPreview" />
        </Box>
        <Button variant="primary" onClick={exportToSvg} stretch>
          Add to Canva
        </Button>

        <Rows spacing="1.5u">
          <Text size="small" tone="tertiary">Style Preset</Text>
          <Select
            value={preset}
            options={[
              { value: "isometric", label: "Isometric 3D Icon" },
              { value: "clay", label: "Clay 3D Object" },
              { value: "extrude", label: "Minimal Extruded Object" },
              { value: "low-poly", label: "Low Poly Object" },
              { value: "organic", label: "Round/Organic Object" },
              { value: "emoji", label: "3D Emoji Style" },
            ]}
            onChange={(value) => setPreset(value as Preset)}
          />
        </Rows>

        <Rows spacing="1.5u">
          <Text size="small" tone="tertiary">Shape</Text>
          <Select
            value={shape}
            options={[
              { value: "cube", label: "Cube" },
              { value: "sphere", label: "Sphere" },
              { value: "cylinder", label: "Cylinder" },
              { value: "donut", label: "Donut" },
              { value: "cone", label: "Cone" },
            ]}
            onChange={(value) => setShape(value as Shape)}
          />
        </Rows>

        <Rows spacing="1.5u">
          <Text size="small" tone="tertiary">Camera Angle</Text>
          <Select
            value={angle}
            options={[
              { value: "isometric-left", label: "Isometric Left" },
              { value: "isometric-right", label: "Isometric Right" },
              { value: "top-down", label: "Slightly Top-Down" },
            ]}
            onChange={setAngle}
          />
        </Rows>

        <Rows spacing="1u">
          <Text size="small" tone="tertiary">Deformations</Text>
          
          <Box>
            <Text size="xsmall">Twist: {twist}°</Text>
            <Slider
              min={0}
              max={40}
              step={1}
              value={twist}
              onChange={setTwist}
            />
          </Box>

          <Box>
            <Text size="xsmall">Roundness: {roundness.toFixed(2)}</Text>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={roundness}
              onChange={setRoundness}
            />
          </Box>

          <Box>
            <Text size="xsmall">Fatten: {fatten.toFixed(2)}</Text>
            <Slider
              min={0.8}
              max={1.2}
              step={0.01}
              value={fatten}
              onChange={setFatten}
            />
          </Box>
        </Rows>

        <Rows spacing="1u">
          <Text size="small" tone="tertiary">Colors</Text>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <Box>
                <Text size="xsmall">Main Color</Text>
                <ColorSelector
                  color={mainColor}
                  onChange={setMainColor}
                />
              </Box>
            </div>

            <div style={{ flex: 1 }}>
              <Box>
                <Text size="xsmall">Shadow Tint</Text>
                <ColorSelector
                  color={shadowTint}
                  onChange={setShadowTint}
                />
              </Box>
            </div>

            <div style={{ flex: 1 }}>
              <Box>
                <Text size="xsmall">Shadow Intensity</Text>
                <div style={{ paddingTop: '4px' }}>
                  <Text size="xsmall">{shadowIntensity.toFixed(2)}</Text>
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={shadowIntensity}
                    onChange={setShadowIntensity}
                  />
                </div>
              </Box>
            </div>
          </div>
        </Rows>
      </Rows>
    </div>
  );
};

export default App;
