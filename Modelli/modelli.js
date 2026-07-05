 // =========================================================================
        // CONFIGURAZIONE ENGINE 3D PER OGNI CONTENITORE
        // =========================================================================
        function setupAtomEngine(containerId) {
            const container = document.getElementById(containerId);
            if (!container) return null;

            // Recupera le dimensioni reali (con fallback se 0)
            const width = container.clientWidth || 400;
            const height = container.clientHeight || 450;

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
            camera.position.z = 6;

            const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            container.appendChild(renderer.domElement);

            const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
            scene.add(ambientLight);

            const dirLight1 = new THREE.DirectionalLight(0x00f2fe, 1.5);
            dirLight1.position.set(5, 5, 5);
            scene.add(dirLight1);

            const dirLight2 = new THREE.DirectionalLight(0xff00ff, 1);
            dirLight2.position.set(-5, -5, 3);
            scene.add(dirLight2);

            // Gestione ridimensionamento locale dinamico
            window.addEventListener('resize', () => {
                const w = container.clientWidth;
                const h = container.clientHeight;
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
                renderer.setSize(w, h);
            });

            return { scene, camera, renderer };
        }

        // Funzione helper per creare particelle sferiche morbide e perfette
        function createCircleMaterial(color, size, opacity) {
            const mat = new THREE.PointsMaterial({
                color: color, size: size, transparent: true, opacity: opacity, blending: THREE.AdditiveBlending, depthWrite: false
            });
            mat.onBeforeCompile = (shader) => {
                shader.fragmentShader = shader.fragmentShader.replace(
                    'void main() {',
                    `void main() { 
                        vec2 coord = gl_PointCoord - vec2(0.5); 
                        float dist = length(coord); 
                        if (dist > 0.5) discard; 
                        float alpha = smoothstep(0.5, 0.1, dist);`
                );
                shader.fragmentShader = shader.fragmentShader.replace(
                    'gl_FragColor = vec4( diffuse, opacity );', 
                    'gl_FragColor = vec4( diffuse, opacity * alpha );'
                );
            };
            return mat;
        }

        // VARIABILI GLOBALI DEI MODELLI
        const clock = new THREE.Clock();
        const electronGeo = new THREE.SphereGeometry(0.08, 16, 16);
        const electronMat = new THREE.MeshPhongMaterial({ color: 0x00f2fe, emissive: 0x00f2fe, emissiveIntensity: 0.8 });

        let d3d, t3d, r3d, b3d, s3d;
        let daltonMesh, thomsonGroup, pudding, ruthGroup, re1, re2, bohrGroup, be1, be2, be3, schroGroup, qCloud;

        // INIZIALIZZAZIONE QUANDO IL LAYOUT È PRONTO E CARICATO
        window.addEventListener('load', () => {
            
            // 1. DALTON
            d3d = setupAtomEngine('canvas-dalton');
            if(d3d) {
                daltonMesh = new THREE.Mesh(
                    new THREE.SphereGeometry(1.4, 32, 32),
                    new THREE.MeshPhongMaterial({ color: 0x4a4e69, roughness: 0.6, metalness: 0.4 })
                );
                d3d.scene.add(daltonMesh);
            }

            // 2. THOMSON
            t3d = setupAtomEngine('canvas-thomson');
            if(t3d) {
                thomsonGroup = new THREE.Group();
                t3d.scene.add(thomsonGroup);

                pudding = new THREE.Mesh(
                    new THREE.SphereGeometry(1.5, 32, 32),
                    new THREE.MeshPhongMaterial({ color: 0xff0055, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false })
                );
                thomsonGroup.add(pudding);

                for (let i = 0; i < 12; i++) {
                    const el = new THREE.Mesh(electronGeo, electronMat);
                    const u = Math.random(); const v = Math.random(); 
                    const theta = u * 2 * Math.PI; const phi = Math.acos(2 * v - 1); 
                    const r = Math.random() * 1.1;
                    el.position.set(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
                    thomsonGroup.add(el);
                }
            }

            // 3. RUTHERFORD
            r3d = setupAtomEngine('canvas-rutherford');
            if(r3d) {
                ruthGroup = new THREE.Group();
                r3d.scene.add(ruthGroup);

                const ruthNucleus = new THREE.Mesh(new THREE.IcosahedronGeometry(0.25, 2), new THREE.MeshPhongMaterial({ color: 0xff00ff, roughness: 0.2 }));
                ruthGroup.add(ruthNucleus);

                const createOrbitLine = (radiusX, radiusY, rotX, rotY) => {
                    const points = [];
                    for(let i=0; i<=100; i++) { 
                        const t = (i/100)*Math.PI*2; 
                        points.push(new THREE.Vector3(Math.cos(t)*radiusX, Math.sin(t)*radiusY, 0)); 
                    }
                    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0xffffff, transparent:true, opacity:0.25 }));
                    line.rotation.x = rotX; line.rotation.y = rotY;
                    return line;
                };
                
                ruthGroup.add(createOrbitLine(1.8, 0.8, 0.6, 0.4));
                ruthGroup.add(createOrbitLine(1.8, 0.8, -0.6, 1.2));
                
                re1 = new THREE.Mesh(electronGeo, electronMat); 
                re2 = new THREE.Mesh(electronGeo, electronMat);
                ruthGroup.add(re1, re2);
            }

            // 4. BOHR (FIX DEFINITIVO ASSI)
            b3d = setupAtomEngine('canvas-bohr');
            if(b3d) {
                bohrGroup = new THREE.Group();
                b3d.scene.add(bohrGroup);

                const bohrNucleus = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 2), new THREE.MeshPhongMaterial({ color: 0xff00ff }));
                bohrGroup.add(bohrNucleus);

                // Orbite visive (piane su X-Y e inclinate su X di Math.PI / 2.5)
                const bO1 = new THREE.Mesh(new THREE.RingGeometry(0.98, 1.02, 64), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent:true, opacity:0.15 }));
                const bO2 = new THREE.Mesh(new THREE.RingGeometry(1.58, 1.62, 64), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent:true, opacity:0.15 }));
                const bO3 = new THREE.Mesh(new THREE.RingGeometry(2.18, 2.22, 64), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent:true, opacity:0.15 }));
                
                bO1.rotation.x = bO2.rotation.x = bO3.rotation.x = Math.PI / 2.5;
                bohrGroup.add(bO1, bO2, bO3);

                be1 = new THREE.Mesh(electronGeo, electronMat); 
                be2 = new THREE.Mesh(electronGeo, electronMat); 
                be3 = new THREE.Mesh(electronGeo, electronMat);
                
                bohrGroup.add(be1, be2, be3);
            }

            // 5. SCHRÖDINGER
            s3d = setupAtomEngine('canvas-schrodinger');
            if(s3d) {
                schroGroup = new THREE.Group();
                s3d.scene.add(schroGroup);

                const schroNucleus = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 2), new THREE.MeshPhongMaterial({ color: 0xff00ff }));
                schroGroup.add(schroNucleus);

                const qCount = 2000;
                const qGeometry = new THREE.BufferGeometry();
                const qPositions = new Float32Array(qCount * 3);
                
                for (let i = 0; i < qCount; i++) {
                    const theta = Math.random() * Math.PI * 2; 
                    const phi = Math.acos((Math.random() * 2) - 1);
                    const r = Math.pow(Math.random(), 2.5) * 1.8 + 0.1;
                    
                    qPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta); 
                    qPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta); 
                    qPositions[i * 3 + 2] = r * Math.cos(phi);
                }
                
                qGeometry.setAttribute('position', new THREE.BufferAttribute(qPositions, 3));
                qCloud = new THREE.Points(qGeometry, createCircleMaterial(0x00f2fe, 0.08, 0.8));
                schroGroup.add(qCloud);
            }

            // Avvia il loop di rendering continuo
            animate();
        });

        // =========================================================================
        // LOOP DI ANIMAZIONE UNIFICATO
        // =========================================================================
        function animate() {
            requestAnimationFrame(animate);
            const time = clock.getElapsedTime();

            // Render Dalton
            if (d3d && daltonMesh) {
                daltonMesh.rotation.y = time * 0.4;
                daltonMesh.rotation.x = time * 0.2;
                d3d.renderer.render(d3d.scene, d3d.camera);
            }

            // Render Thomson
            if (t3d && thomsonGroup) {
                thomsonGroup.rotation.y = time * 0.3;
                pudding.scale.setScalar(1 + Math.sin(time * 2) * 0.03);
                t3d.renderer.render(t3d.scene, t3d.camera);
            }

            // Render Rutherford
            if (r3d && ruthGroup) {
                ruthGroup.rotation.y = time * 0.1;
                
                const posE1 = new THREE.Vector3(Math.cos(time * 3.5) * 1.8, Math.sin(time * 3.5) * 0.8, 0)
                    .applyAxisAngle(new THREE.Vector3(1,0,0), 0.6)
                    .applyAxisAngle(new THREE.Vector3(0,1,0), 0.4);
                    
                const posE2 = new THREE.Vector3(Math.cos(time * 2.8) * 1.8, Math.sin(time * 2.8) * 0.8, 0)
                    .applyAxisAngle(new THREE.Vector3(1,0,0), -0.6)
                    .applyAxisAngle(new THREE.Vector3(0,1,0), 1.2);
                    
                re1.position.copy(posE1); 
                re2.position.copy(posE2);
                r3d.renderer.render(r3d.scene, r3d.camera);
            }

            // Render Bohr (Sincronizzazione geometrica perfetta sul piano X-Y ruotato)
            if (b3d && bohrGroup) {
                bohrGroup.rotation.y = time * 0.05; // Rotazione lenta globale dell'atomo
                
                const inclinazioneX = Math.PI / 2.5;

                // Calcolo esatto: orbita nativa in 2D (X, Y) inclinata poi sull'asse X
                const posB1 = new THREE.Vector3(Math.cos(time * 4.0) * 1.0, Math.sin(time * 4.0) * 1.0, 0)
                    .applyAxisAngle(new THREE.Vector3(1, 0, 0), inclinazioneX);
                    
                const posB2 = new THREE.Vector3(Math.cos(time * 2.5) * 1.6, Math.sin(time * 2.5) * 1.6, 0)
                    .applyAxisAngle(new THREE.Vector3(1, 0, 0), inclinazioneX);
                    
                const posB3 = new THREE.Vector3(Math.cos(time * 1.8) * 2.2, Math.sin(time * 1.8) * 2.2, 0)
                    .applyAxisAngle(new THREE.Vector3(1, 0, 0), inclinazioneX);
                
                be1.position.copy(posB1); 
                be2.position.copy(posB2); 
                be3.position.copy(posB3);
                
                b3d.renderer.render(b3d.scene, b3d.camera);
            }

            // Render Schrödinger
            if (s3d && qCloud) {
                qCloud.rotation.y = time * 0.15;
                qCloud.rotation.z = Math.sin(time * 0.3) * 0.15;
                s3d.renderer.render(s3d.scene, s3d.camera);
            }
        }
