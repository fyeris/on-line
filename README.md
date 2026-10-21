# 🗡️ Toram-Style 3D Browser RPG

HTML5, Three.js, JavaScriptで作成した、トーラムオンライン風の三人称視点（TPS）3DアクションRPGのモックアップです。

## 🎮 主な機能 (Features)

- **3D空間表現**: Three.jsを使用したリアルタイム3Dグラフィック
- **三人称視点（TPS）カメラ**: プレイヤーを追従するカメラシステム
- **キャラクター操作**: キーボードによる自由移動（WASD / 矢印キー）
- **3Dモデル・アニメーション**: `.glb`モデルの読み込みとアニメーション切り替え（Idle / Run）
- **トーラム風UI**: オーバーレイUI（HPバー、スキルアイコン等）

## 🛠️ 使用技術 (Tech Stack)

- **Language**: JavaScript (ES6+), HTML5, CSS3
- **3D Engine**: [Three.js](https://threejs.org/) (v128)
- **3D Loader**: GLTFLoader
- **IDE**: Visual Studio Code

## 🚀 起動・実行手順 (Getting Started)

本プロジェクトはブラウザのセキュリティ制限（CORS）を回避するため、ローカルWebサーバー上で実行する必要があります。

### VS Code の Live Server を使う場合（推奨）

1. VS Codeの拡張機能 **「Live Server」** をインストールします。
2. プロジェクトフォルダをVS Codeで開きます。
3. `index.html` を右クリックし、**「Open with Live Server」** を選択します。
4. ブラウザが自動的に開き、ゲームが開始されます。

## 🕹️ 操作方法 (Controls)

| 操作 | キー |
| :--- | :--- |
| **移動** | `W` / `A` / `S` / `D` または `方向キー` |
| **カメラ** | プレイヤーに自動追従 |

## 📁 ディレクトリ構造 (Project Structure)

```text
toram-clone/
 ├── index.html        # エントリーポイント・UI構成
 ├── style.css         # ゲーム画面・UIのスタイリング
 ├── main.js           # 3D描画・プレイヤー制御・ゲームループ
 ├── models/           # 3Dモデル(.glb)配置用フォルダ
 │   └── player.glb
 └── README.md         # プロジェクト説明書
