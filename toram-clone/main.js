// --- 1. シーン・カメラ・レンダラーの初期化 ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#gameCanvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

// --- 2. ライトの追加 ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);

// --- 3. 地面の作成 ---
const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x33aa33 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// --- 4. 視点操作（OrbitControls）の設定 ---
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // 動きをなめらかにする
dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.05; // 地面の下にカメラが潜り込まないように制限
controls.minDistance = 2; // カメラの最小ズーム距離
controls.maxDistance = 15; // カメラの最大ズーム距離

// --- 5. 3Dモデル（プレイヤー）の読み込み ---
let player = null;
let mixer = null;
const animations = {};
let activeAction = null;

const loader = new THREE.GLTFLoader();
loader.load(
    './models/player.glb',
    (gltf) => {
        player = gltf.scene;
        player.scale.set(1, 1, 1);
        player.position.set(0, 0, 0);
        
        player.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        scene.add(player);

        // カメラの注視点をプレイヤーに合わせ、初期位置を設定
        camera.position.set(0, 3, -5);
        controls.target.copy(player.position);
        controls.target.y += 1; // プレイヤーの胸元あたりを見る

        // アニメーション設定
        mixer = new THREE.AnimationMixer(player);
        gltf.animations.forEach((clip) => {
            animations[clip.name] = mixer.clipAction(clip);
        });

        if (animations['Idle']) {
            activeAction = animations['Idle'];
            activeAction.play();
        }
    },
    undefined,
    (error) => { console.error('モデルの読み込みエラー:', error); }
);

// --- 6. 操作・移動の仕組み ---
const keys = {};
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

const moveSpeed = 0.1;
let clock = new THREE.Clock();

function updatePlayer() {
    if (!player) return;

    let moveX = 0;
    let moveZ = 0;

    if (keys['KeyW'] || keys['ArrowUp']) moveZ -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) moveZ += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

    const isMoving = (moveX !== 0 || moveZ !== 0);

    if (isMoving) {
        // カメラの向いている方向を基準に移動方向を計算する（カメラ視点連動移動）
        const cameraAngle = controls.getAzimuthalAngle(); // カメラの水平方向の角度
        
        const moveDirection = new THREE.Vector3(moveX, 0, moveZ);
        moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraAngle);
        moveDirection.normalize();

        // プレイヤーの位置を移動
        player.position.addScaledVector(moveDirection, moveSpeed);

        // プレイヤーの向きを進行方向に合わせる
        const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
        player.rotation.y = targetRotation;

        switchAnimation('Run');
    } else {
        switchAnimation('Idle');
    }

    // カメラの注視点をプレイヤーに追従させる
    const targetPos = player.position.clone();
    targetPos.y += 1; // プレイヤーの中心を基準にする
    controls.target.copy(targetPos);
    
    controls.update(); // コントローラーの状態を更新
}

// アニメーション切り替え関数
function switchAnimation(name) {
    if (!animations[name]) return;
    const newAction = animations[name];

    if (activeAction !== newAction) {
        if (activeAction) activeAction.fadeOut(0.2);
        newAction.reset().fadeIn(0.2).play();
        activeAction = newAction;
    }
}

// --- 7. ゲームループ ---
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);

    updatePlayer();
    renderer.render(scene, camera);
}

animate();

// ウィンドウリサイズ対応
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
