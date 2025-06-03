let video;
let handPose;
let hands = [];

function preload() {
  // Initialize HandPose model with flipped video input
  handPose = ml5.handPose({ flipped: true });
}

let gameStartTime = 0; // 新增：紀錄遊戲開始時間

function mousePressed() {
  if (gameState === "intro") {
    // 檢查是否點擊卡片
    let cardW = 160, cardH = 220;
    let gap = 30;
    let startX = (width - (cardW * 4 + gap * 3)) / 2;
    let y = 100;
    for (let i = 0; i < 4; i++) {
      let x = startX + i * (cardW + gap);
      if (mouseX > x && mouseX < x + cardW && mouseY > y && mouseY < y + cardH) {
        flippedIndex = (flippedIndex === i) ? -1 : i;
        return;
      }
    }
    // 檢查是否點擊開始遊戲按鈕
    let btn = startButtonRect;
    if (mouseX > btn.x && mouseX < btn.x + btn.w && mouseY > btn.y && mouseY < btn.y + btn.h) {
      gameState = "play";
      flippedIndex = -1;
      score = 0;
      hp = 5;
      fallingIcons = [];
      showIntro = "";
      introTimer = 0;
      lastIconTime = millis();
      gameStartTime = millis(); // 新增：開始計時
      return;
    }
  }
  // 其餘 debug 用
  if (gameState === "play") {
    console.log(hands);
  }
}

function gotHands(results) {
  hands = results;
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO, { flipped: true });
  video.hide();

  // Start detecting hands
  handPose.detectStart(video, gotHands);
}

// emoji 項目清單
const iconList = [
  { emoji: "💻", label: "多媒體教材設計", isCorrect: true, intro: "運用多媒體技術設計教學內容。" },
  { emoji: "🎮", label: "教育遊戲設計", isCorrect: true, intro: "將遊戲元素融入教學，提升學習動機。" },
  { emoji: "🤖", label: "AI輔助教學", isCorrect: true, intro: "利用人工智慧技術輔助教學與學習。" },
  { emoji: "📷", label: "數位學習研究", isCorrect: true, intro: "探討數位學習相關理論與實踐。" },
  { emoji: "🍵", label: "飲食", isCorrect: false, intro: "" },
  { emoji: "🐶", label: "小狗", isCorrect: false, intro: "" }
];

let fallingIcons = [];
let lastIconTime = 0;
const iconInterval = 1500; // 1.5 秒

let score = 0;
let hp = 5; // 初始 5 滴血
let showIntro = "";
let introTimer = 0;
let gameOver = false;

let gameState = "intro"; // intro: 介紹卡片, play: 遊戲中, end: 遊戲結束
let flippedIndex = -1;   // -1 表示沒有翻牌
let startButtonRect = { x: 0, y: 0, w: 0, h: 0 }; // 記錄開始按鈕位置

// 在 draw() 外部加上特效 icon 變數
let effectIcon;
let effectIconTime;

function draw() {
  background(30);

  if (gameState === "intro") {
    // 顯示介紹卡片
    textAlign(CENTER, TOP);
    textSize(26); // 標題字體縮小
    fill(255);
    text("教育科技學系介紹遊戲", width / 2, 30);

    let cardW = 110, cardH = 140; // 卡片縮小
    let gap = 18;                 // 間距縮小
    let startX = (width - (cardW * 4 + gap * 3)) / 2;
    let y = 100;
    for (let i = 0; i < 4; i++) {
      let x = startX + i * (cardW + gap);
      fill(255);
      stroke(120);
      rect(x, y, cardW, cardH, 12);

      if (flippedIndex === i) {
        // 顯示詳細介紹
        textSize(15); // 標題縮小
        fill(0);
        textAlign(CENTER, TOP);
        // 標題置中於卡片上半部
        text(iconList[i].label, x + cardW / 2, y + 24);

        // 介紹字每七個字分行，最多兩行
        textSize(11);
        fill(30);
        let intro = iconList[i].intro;
        let introLines = [];
        for (let j = 0; j < intro.length && introLines.length < 2; j += 7) {
          introLines.push(intro.substring(j, j + 7));
        }
        // 讓介紹文字整體置中於卡片
        let totalLines = introLines.length;
        let introBlockHeight = totalLines * 16;
        let introStartY = y + cardH / 2 - introBlockHeight / 2 + 10;
        textAlign(CENTER, TOP);
        for (let j = 0; j < introLines.length; j++) {
          // 每一行都置中於卡片
          text(introLines[j], x + cardW / 2, introStartY + j * 16);
        }
        textAlign(CENTER, CENTER);
      } else {
        // 顯示 emoji
        textSize(32); // emoji 縮小
        textAlign(CENTER, CENTER);
        // emoji 置中於卡片
        text(iconList[i].emoji, x + cardW / 2, y + cardH / 2 - 18);
        textSize(12); // 標籤縮小
        fill(50);
        // 標籤置中於卡片下方
        text(iconList[i].label, x + cardW / 2, y + cardH / 2 + 22);
        textAlign(CENTER, CENTER);
      }
    }

    // 顯示開始遊戲按鈕
    let btnW = 120, btnH = 36; // 按鈕縮小
    let btnX = width / 2 - btnW / 2;
    let btnY = height - 60;
    startButtonRect = { x: btnX, y: btnY, w: btnW, h: btnH };
    fill(0, 180, 80);
    rect(btnX, btnY, btnW, btnH, 8);
    fill(255);
    textSize(16);
    textAlign(CENTER, CENTER);
    text("開始遊戲", width / 2, btnY + btnH / 2 - 4);

    return;
  }

  if (gameState === "play") {
    // 新增：判斷是否超過 1 分鐘
    if (millis() - gameStartTime > 60000) {
      hp = 0; // 直接結束遊戲
    }

    image(video, 0, 0);

    if (hp <= 0) {
      fill(0, 180);
      rect(0, 0, width, height);
      fill(255, 0, 0);
      textSize(48);
      textAlign(CENTER, CENTER);
      text("遊戲結束", width / 2, height / 2);
      textSize(28);
      text("分數：" + score, width / 2, height / 2 + 50);
      return;
    }

    let indexTips = [];
    if (hands.length > 0) {
      for (let hand of hands) {
        if (hand.confidence > 0.1) {
          let tip = hand.keypoints[8];
          if (tip) {
            indexTips.push({ x: tip.x, y: tip.y });
          }
          for (let i = 0; i < hand.keypoints.length; i++) {
            let keypoint = hand.keypoints[i];
            if (hand.handedness == "Left") {
              fill(255, 0, 255);
            } else {
              fill(255, 255, 0);
            }
            noStroke();
            circle(keypoint.x, keypoint.y, 16);
          }
        }
      }
    }

    // 畫紅線（加粗+glow）
    let lineStart, lineEnd;
    if (indexTips.length === 2) {
      push();
      stroke(255, 0, 0);
      strokeWeight(12); // 加粗
      drawingContext.shadowColor = "red";
      drawingContext.shadowBlur = 32; // glow
      line(indexTips[0].x, indexTips[0].y, indexTips[1].x, indexTips[1].y);
      drawingContext.shadowBlur = 0;
      pop();
      lineStart = indexTips[0];
      lineEnd = indexTips[1];
    }

    if (millis() - lastIconTime > iconInterval) {
      let item = random(iconList);
      let x = random(40, width - 40);
      let speed = random(2, 4);
      fallingIcons.push(new FallingIcon(item.emoji, item.label, item.isCorrect, x, speed, item.intro));
      lastIconTime = millis();
    }

    for (let i = fallingIcons.length - 1; i >= 0; i--) {
      let icon = fallingIcons[i];

      // 判斷是否剛被接中
      let justHit = false;
      if (lineStart && lineEnd) {
        if (lineCircleCollide(lineStart.x, lineStart.y, lineEnd.x, lineEnd.y, icon.x, icon.y, 24)) {
          justHit = true;
          if (icon.isCorrect) {
            showIntro = icon.label + "：" + icon.intro;
            introTimer = millis();
            score += 1;
          } else {
            hp -= 1;
            showIntro = "答錯囉！扣 1 滴血";
            introTimer = millis();
          }
          fallingIcons.splice(i, 1);
          // 顯示特效
          icon.showEffect = millis();
          // 將特效 icon 暫存顯示
          effectIcon = icon;
          effectIconTime = millis();
          continue;
        }
      }

      icon.update();
      icon.display();
    }

    // 顯示被接中的圖示特效（放大或閃爍）
    if (typeof effectIcon !== "undefined" && millis() - effectIconTime < 300) {
      push();
      textAlign(CENTER, CENTER);
      let scaleVal = 1.5 + 0.5 * sin(millis() * 0.05);
      translate(effectIcon.x, effectIcon.y);
      scale(scaleVal);
      textSize(40);
      fill(255, 255, 0);
      text(effectIcon.emoji, 0, 0);
      textSize(16);
      fill(255);
      text(effectIcon.label, 0, 30);
      pop();
    }

    // 清除特效 icon
    if (typeof effectIcon !== "undefined" && millis() - effectIconTime >= 300) {
      effectIcon = undefined;
    }

    // 只移除正確項目掉到底部，錯誤項目掉到底部不處理
    for (let i = fallingIcons.length - 1; i >= 0; i--) {
      if (fallingIcons[i].isOffScreen()) {
        if (fallingIcons[i].isCorrect) {
          fallingIcons.splice(i, 1);
        }
      }
    }

    fill(255);
    textSize(20);
    textAlign(LEFT, TOP);
    text("分數：" + score, 10, 10);

    textSize(28);
    let hearts = "";
    for (let i = 0; i < hp; i++) {
      hearts += "❤️";
    }
    text(hearts, 10, 40);

    if (showIntro && millis() - introTimer < 2000) {
      fill(0, 200);
      rect(0, height - 60, width, 60);
      fill(255);
      textSize(22);
      textAlign(CENTER, CENTER);
      text(showIntro, width / 2, height - 30);
    }
  }
}

// 簡單的線段與圓形碰撞判斷
function lineCircleCollide(x1, y1, x2, y2, cx, cy, r) {
  // 最近點公式
  let dx = x2 - x1;
  let dy = y2 - y1;
  let l2 = dx * dx + dy * dy;
  if (l2 === 0) return dist(x1, y1, cx, cy) < r;
  let t = ((cx - x1) * dx + (cy - y1) * dy) / l2;
  t = max(0, min(1, t));
  let px = x1 + t * dx;
  let py = y1 + t * dy;
  return dist(px, py, cx, cy) < r;
}

// 修改 FallingIcon 類別，加入 intro
class FallingIcon {
  constructor(emoji, label, isCorrect, x, speed, intro = "") {
    this.emoji = emoji;
    this.label = label;
    this.isCorrect = isCorrect;
    this.x = x;
    this.y = 0;
    this.speed = speed;
    this.intro = intro;
  }

  update() {
    this.y += this.speed;
  }

  display() {
    textSize(40);
    textAlign(CENTER, CENTER);
    text(this.emoji, this.x, this.y);
    textSize(16);
    text(this.label, this.x, this.y + 30);
  }

  isOffScreen() {
    return this.y > height + 40;
  }
}
