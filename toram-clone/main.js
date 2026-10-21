// --- 1. シーン・カメラ・レンダラー初期化 ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#gameCanvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

// --- 2. ライト ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);

// --- 3. 地面 ---
const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x33aa33 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// --- 4. 視点操作 (OrbitControls) ---
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.05;
controls.minDistance = 2;
controls.maxDistance = 15;

// --- 5. プレイヤー作成 (簡易メッシュ/GLTF対応) ---
let player = new THREE.Group();
const playerMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 2, 1),
    new THREE.MeshStandardMaterial({ color: 0x3366ff })
);
playerMesh.position.y = 1;
playerMesh.castShadow = true;
player.add(playerMesh);
scene.add(player);

camera.position.set(0, 3, -5);
controls.target.copy(player.position);

// GLTFモデルがある場合は上書き
let mixer = null;
const animations = {};
let activeAction = null;
const loader = new THREE.GLTFLoader();
loader.load('./models/player.glb', (gltf) => {
    scene.remove(player);
    player = gltf.scene;
    player.scale.set(1, 1, 1);
    player.position.set(0, 0, 0);
    player.traverse((child) => { if (child.isMesh) child.castShadow = true; });
    scene.add(player);

    mixer = new THREE.AnimationMixer(player);
    gltf.animations.forEach((clip) => { animations[clip.name] = mixer.clipAction(clip); });
    if (animations['Idle']) { activeAction = animations['Idle']; activeAction.play(); }
}, undefined, () => console.log('デフォルトのプレイヤーオブジェクトを使用します。'));

// --- 6. 敵（モブ）の管理と生成 ---
const enemies = [];
let selectedEnemy = null; // 現在ターゲット中の敵

class Enemy {
    constructor(id, name, position, hp = 100) {
        this.id = id;
        this.name = name;
        this.maxHp = hp;
        this.currentHp = hp;

        // 敵の見た目 (赤いカプセル)
        const geometry = new THREE.CapsuleGeometry(0.6, 1.2, 4, 8);
        const material = new THREE.MeshStandardMaterial({ color: 0xff3333 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.mesh.castShadow = true;
        this.mesh.userData = { enemyInstance: this }; // レイキャスト識別用

        scene.add(this.mesh);
    }

    takeDamage(amount) {
        this.currentHp -= amount;
        console.log(`${this.name} に ${amount} ダメージ！ 残りHP: ${this.currentHp}`);
        
        // ダメージ時の一時的な色の変化（赤→白）
        this.mesh.material.color.setHex(0xffffff);
        setTimeout(() => {
            if (this.mesh) this.mesh.material.color.setHex(selectedEnemy === this ? 0xffff00 : 0xff3333);
        }, 150);

        if (this.currentHp <= 0) {
            this.destroy();
        }
    }

    destroy() {
        scene.remove(this.mesh);
        const index = enemies.indexOf(this);
        if (index > -1) enemies.splice(index, 1);
        
        if (selectedEnemy === this) {
            selectedEnemy = null;
            updateTargetUI();
        }
        console.log(`${this.name} を倒した！`);
    }
}

// モンスターを複数体配置
enemies.push(new Enemy(1, "ポトゥム A", new THREE.Vector3(5, 1.2, 5), 100));
enemies.push(new Enemy(2, "ポトゥム B", new THREE.Vector3(-6, 1.2, 8), 100));
enemies.push(new Enemy(3, "ポトゥム C", new THREE.Vector3(0, 1.2, 12), 150));

// --- 7. マウスクリックによるターゲット選択 (Raycaster) ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('pointerdown', (e) => {
    // UI上のクリックは無視する
    if (e.target.tagName === 'BUTTON' || e.target.closest('#ui-container')) return;

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const enemyMeshes = enemies.map(e => e.mesh);
    const intersects = raycaster.intersectObjects(enemyMeshes);

    if (intersects.length > 0) {
        // 以前の選択解除（色を元に戻す）
        if (selectedEnemy) selectedEnemy.mesh.material.color.setHex(0xff3333);

        // 新しい敵を選択
        const hitMesh = intersects[0].object;
        selectedEnemy = hitMesh.userData.enemyInstance;
        selectedEnemy.mesh.material.color.setHex(0xffff00); // 選択中は黄色にハイライト
    } else {
        // 何もない場所をクリックしたらターゲット解除
        if (selectedEnemy) selectedEnemy.mesh.material.color.setHex(0xff3333);
        selectedEnemy = null;
    }
    updateTargetUI();
});

function updateTargetUI() {
    const targetUI = document.getElementById('target-info');
    if (selectedEnemy) {
        targetUI.innerText = `Target: ${selectedEnemy.name} (HP: ${selectedEnemy.currentHp}/${selectedEnemy.maxHp})`;
    } else {
        targetUI.innerText = `Target: None`;
    }
}

// --- 8. 攻撃処理システム ---
function performAttack() {
    if (!selectedEnemy) {
        alert("ターゲットを選択してください！（敵をクリック）");
        return;
    }

    // プレイヤーと敵の距離チェック
    const distance = player.position.distanceTo(selectedEnemy.mesh.position);
    const attackRange = 3.5; // 攻撃届く距離

    if (distance > attackRange) {
        console.log("敵が遠すぎます！もっと近づいてください。");
        return;
    }

    // 攻撃時のプレイヤーの向きを敵に向ける
    const angle = Math.atan2(
        selectedEnemy.mesh.position.x - player.position.x,
        selectedEnemy.mesh.position.z - player.position.z
    );
    player.rotation.y = angle;

    // 攻撃モーション再生 (GLTFの場合)
    switchAnimation('Attack');

    // ダメージを与える (例: 35ダメージ)
    selectedEnemy.takeDamage(35);
    updateTargetUI();
}

// 1キーまたはスキルボタンで攻撃
window.addEventListener('keydown', (e) => {
    if (e.code === 'Digit1') performAttack();
});
document.getElementById('skill-btn-1').addEventListener('click', performAttack);

// --- 9. 移動・メインループ ---
const keys = {};
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

const moveSpeed = 0.1;
let clock = new THREE.Clock();

function updatePlayer() {
    if (!player) return;

    let moveX = 0, moveZ = 0;
    if (keys['KeyW'] || keys['ArrowUp']) moveZ -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) moveZ += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

    if (moveX !== 0 || moveZ !== 0) {
        const cameraAngle = controls.getAzimuthalAngle();
        const moveDir = new THREE.Vector3(moveX, 0, moveZ).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraAngle).normalize();
        
        player.position.addScaledVector(moveDir, moveSpeed);
        player.rotation.y = Math.atan2(moveDir.x, moveDir.z);
        
        switchAnimation('Run');
    } else {
        switchAnimation('Idle');
    }

    const targetPos = player.position.clone();
    targetPos.y += 1;
    controls.target.copy(targetPos);
    controls.update();
}

function switchAnimation(name) {
    if (!animations[name]) return;
    const newAction = animations[name];
    if (activeAction !== newAction) {
        if (activeAction) activeAction.fadeOut(0.2);
        newAction.reset().fadeIn(0.2).play();
        activeAction = newAction;
    }
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);

    updatePlayer();
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
