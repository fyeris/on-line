// --- 1. シーン・カメラ・レンダラーの初期化 ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#gameCanvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // 影を有効化

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

// --- 4. 3Dモデル（プレイヤー）とアニメーションの読み込み ---
let player = null;
let mixer = null; // アニメーションを管理するミキサー
const animations = {}; // アニメーションを格納するオブジェクト
let activeAction = null; // 現在再生中のアニメーション

const loader = new THREE.GLTFLoader();
loader.load(
    './models/player.glb', // 読み込むモデルのパス
    (gltf) => {
        player = gltf.scene;
        player.scale.set(1, 1, 1); // 必要に応じてサイズ調整
        player.position.set(0, 0, 0);
        
        // 影の設定
        player.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        scene.add(player);

        // アニメーションのセットアップ
        mixer = new THREE.AnimationMixer(player);
        
        gltf.animations.forEach((clip) => {
            animations[clip.name] = mixer.clipAction(clip);
        });

        // デフォルトで「Idle（待機）」モーションを再生（名前はモデルによって異なります）
        if (animations['Idle']) {
            activeAction = animations['Idle'];
            activeAction.play();
        }

        console.log('モデルの読み込み成功:', gltf.animations.map(a => a.name));
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => {
        console.error('モデルの読み込みに失敗しました:', error);
    }
);

// --- 5. 操作・移動の仕組み ---
const keys = {};
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

const moveSpeed = 0.1;
const cameraOffset = new THREE.Vector3(0, 3, -5); // カメラの位置
let clock = new THREE.Clock(); // アニメーションの時間を測る時計

function updatePlayer() {
    if (!player) return; // モデルがまだ読み込まれていない場合はスキップ

    let moveX = 0;
    let moveZ = 0;

    if (keys['KeyW'] || keys['ArrowUp']) moveZ -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) moveZ += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

    const isMoving = (moveX !== 0 || moveZ !== 0);

    if (isMoving) {
        // 移動処理
        player.position.x += moveX * moveSpeed;
        player.position.z += moveZ * moveSpeed;

        // 向きの変更
        const angle = Math.atan2(moveX, moveZ);
        player.rotation.y = angle;

        // 走るアニメーションに切り替え（アニメーション名が 'Run' の場合）
        switchAnimation('Run');
    } else {
        // 待機アニメーションに切り替え（アニメーション名が 'Idle' の場合）
        switchAnimation('Idle');
    }

    // カメラの追従
    const targetCameraPos = player.position.clone().add(cameraOffset);
    camera.position.copy(targetCameraPos);
    camera.lookAt(player.position.clone().add(new THREE.Vector3(0, 1, 0)));
}

// アニメーションをなめらかに切り替える関数
function switchAnimation(name) {
    if (!animations[name]) return;
    const newAction = animations[name];

    if (activeAction !== newAction) {
        if (activeAction) {
            activeAction.fadeOut(0.2); // 前のアニメーションをフェードアウト
        }
        newAction.reset().fadeIn(0.2).play(); // 新しいアニメーションをフェードイン
        activeAction = newAction;
    }
}

// --- 6. ゲームループ ---
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta(); // 前フレームからの経過時間
    if (mixer) {
        mixer.update(delta); // アニメーションを進める
    }

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