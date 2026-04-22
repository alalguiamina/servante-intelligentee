#include <Arduino.h>
#include <SPI.h>
#include <MFRC522.h>
#include <math.h>

// ==================== RFID PINS ====================
#define SS_PIN  53      // SDA du RC522
#define RST_PIN 9       // RST du RC522

MFRC522 rfid(SS_PIN, RST_PIN);

// Tableau pour mémoriser le dernier UID lu
byte lastUID[4];
bool uidChanged = true;
unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 3000; // Renvoyer toutes les 3 secondes

// ==================== MOTOR PINS ====================
#define EN_PIN  14

#define STEP_X  2
#define DIR_X   3
#define END_X   26

#define STEP_Y  4
#define DIR_Y   5
#define END_Y   28

#define STEP_Z  6
#define DIR_Z   7
#define END_Z   30

#define STEP_A  22
#define DIR_A   24
#define END_A   32

// ==================== ENDSTOP LOGIC ====================
#define END_PRESSED LOW

// ==================== CALIBRATION ====================
const int   stepsPerRev = 400;
const int   microstep   = 2;
const float mmPerRev    = 8.0;

const float stepsPer_mm = (float)(stepsPerRev * microstep) / mmPerRev;

const long STROKE_MM     = 400;
const long STEPS_STROKE  = (long)(STROKE_MM * stepsPer_mm);
const long CLOSE_EXTRA_STEPS = 5000;

// ==================== SPEED PROFILES ====================
float Vmax_open  = 12000.0f;
float accel_open = 25000.0f;

float Vmax_close  = 0.90f * 12000.0f;
float accel_close = 0.90f * 25000.0f;

float Vmax  = 4500.0f;
float accel = 4000.0f;

const float MIN_SPEED = 250.0f;
const float VMAX_CAP  = 20000.0f;
const float ACCEL_CAP = 25000.0f;

// ==================== BOOT RECOVERY ====================
const unsigned int HOME_DELAY_US      = 200;
const unsigned long HOME_TIMEOUT_MS   = 6000;

// ==================== MOTOR STRUCT ====================
struct MotorPins {
  int stepPin;
  int dirPin;
  int endPin;
  char id;
};

MotorPins M[4] = {
  {STEP_X, DIR_X, END_X, 'x'},
  {STEP_Y, DIR_Y, END_Y, 'y'},
  {STEP_Z, DIR_Z, END_Z, 'z'},
  {STEP_A, DIR_A, END_A, 'a'}
};

unsigned long lastCmdMs = 0;
String lastCmd = "";

// ==================== MOTOR UTILS ====================
inline bool endPressed(int pin) {
  return (digitalRead(pin) == END_PRESSED);
}

void pulseStep(int pin, unsigned long delayUs) {
  digitalWrite(pin, HIGH);
  delayMicroseconds(delayUs / 2);
  digitalWrite(pin, LOW);
  delayMicroseconds(delayUs / 2);
}

float speedTrapezoid(long done, long remain) {
  float v1 = sqrtf(2.0f * accel * (float)done);
  float v2 = sqrtf(2.0f * accel * (float)remain);
  float v  = (v1 < v2) ? v1 : v2;

  if (v > Vmax) v = Vmax;
  if (v < MIN_SPEED) v = MIN_SPEED;
  return v;
}

void printEndstopsRaw() {
  Serial.print("[MOTOR] RAW endstops: ");
  Serial.print("X="); Serial.print(digitalRead(END_X));
  Serial.print(" Y="); Serial.print(digitalRead(END_Y));
  Serial.print(" Z="); Serial.print(digitalRead(END_Z));
  Serial.print(" A="); Serial.println(digitalRead(END_A));
}

// ==================== BOOT RECOVERY ====================
void autoCloseAllTogether() {
  Serial.println("[MOTOR] === RECOVERY: close all axes to endstops ===");

  for (int i=0;i<4;i++) digitalWrite(M[i].dirPin, LOW);

  digitalWrite(EN_PIN, LOW);
  delayMicroseconds(50);

  bool done[4] = {false,false,false,false};
  uint8_t stableCnt[4] = {0,0,0,0};

  unsigned long t0 = millis();

  while (!(done[0] && done[1] && done[2] && done[3])) {
    if (millis() - t0 > HOME_TIMEOUT_MS) {
      Serial.println("[MOTOR] ⚠️ RECOVERY TIMEOUT (check wiring/endstops)");
      Serial.print("[MOTOR] done: X="); Serial.print(done[0]);
      Serial.print(" Y="); Serial.print(done[1]);
      Serial.print(" Z="); Serial.print(done[2]);
      Serial.print(" A="); Serial.println(done[3]);
      printEndstopsRaw();
      break;
    }

    for (int i=0;i<4;i++) {
      if (done[i]) continue;

      if (endPressed(M[i].endPin)) {
        if (stableCnt[i] < 3) stableCnt[i]++;
        if (stableCnt[i] >= 3) {
          done[i] = true;
          Serial.print("[MOTOR] ✅ Endstop reached for axis ");
          Serial.println(M[i].id);
        }
      } else {
        stableCnt[i] = 0;
      }
    }

    for (int i=0;i<4;i++) {
      if (!done[i]) digitalWrite(M[i].stepPin, HIGH);
    }
    delayMicroseconds(HOME_DELAY_US);
    for (int i=0;i<4;i++) {
      if (!done[i]) digitalWrite(M[i].stepPin, LOW);
    }
    delayMicroseconds(HOME_DELAY_US);
  }

  digitalWrite(EN_PIN, LOW);  // Enable motors

  if (done[0] && done[1] && done[2] && done[3]) {
    Serial.println("[MOTOR] ✅ RECOVERY OK (all endstops reached)");
  } else {
    Serial.println("[MOTOR] ⚠️ RECOVERY finished with warnings");
  }
}

// ==================== RFID FUNCTIONS ====================
void printHex(byte *buffer, byte bufferSize);

void readRFID() {
  if (!rfid.PICC_IsNewCardPresent())
    return;

  if (!rfid.PICC_ReadCardSerial())
    return;

  uidChanged = false;
  for (byte i = 0; i < 4; i++) {
    if (rfid.uid.uidByte[i] != lastUID[i]) {
      uidChanged = true;
      break;
    }
  }

  unsigned long currentTime = millis();
  bool shouldSend = uidChanged || (currentTime - lastSendTime >= SEND_INTERVAL);

  if (shouldSend) {
    for (byte i = 0; i < 4; i++) {
      lastUID[i] = rfid.uid.uidByte[i];
    }

    Serial.print("UID:");
    printHex(rfid.uid.uidByte, rfid.uid.size);
    Serial.println();
    
    lastSendTime = currentTime;
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

void printHex(byte *buffer, byte bufferSize) {
  for (byte i = 0; i < bufferSize; i++) {
    if (buffer[i] < 0x10) Serial.print("0");
    Serial.print(buffer[i], HEX);
  }
}

// ==================== MOTOR COMMANDS ====================
void processMotorCommand(String cmd) {
  cmd.trim();
  cmd.toLowerCase();

  unsigned long now = millis();
  if (cmd == lastCmd && (now - lastCmdMs) < 250) {
    Serial.println("[MOTOR] ⚠️ Duplicate command ignored");
    return;
  }
  lastCmd = cmd;
  lastCmdMs = now;

  if (cmd == "e") {
    printEndstopsRaw();
    return;
  }

  if (cmd == "s" || cmd == "stop") {
    digitalWrite(EN_PIN, HIGH);
    Serial.println("[MOTOR] 🛑 STOP");
    return;
  }

  if (cmd.length() < 2) {
    Serial.println("[MOTOR] Format: xo/xf/yo/yf/zo/zf/ao/af");
    return;
  }

  char axis = cmd.charAt(0);
  char action = cmd.charAt(1);

  int stepPin=-1, dirPin=-1, endPin=-1;
  if (axis=='x') { stepPin=STEP_X; dirPin=DIR_X; endPin=END_X; }
  else if (axis=='y') { stepPin=STEP_Y; dirPin=DIR_Y; endPin=END_Y; }
  else if (axis=='z') { stepPin=STEP_Z; dirPin=DIR_Z; endPin=END_Z; }
  else if (axis=='a') { stepPin=STEP_A; dirPin=DIR_A; endPin=END_A; }
  else {
    Serial.println("[MOTOR] Axis must be x y z a");
    return;
  }

  if (endPressed(endPin)) {
    Serial.println("[MOTOR] 🛑 Endstop already pressed -> refusing motion");
    return;
  }

  long plannedSteps = 0;

  if (action=='o') {
    Vmax  = Vmax_open;
    accel = accel_open;
    digitalWrite(dirPin, LOW);
    plannedSteps = STEPS_STROKE;
  } else if (action=='f') {
    Vmax  = Vmax_close;
    accel = accel_close;
    digitalWrite(dirPin, HIGH);
    plannedSteps = STEPS_STROKE + CLOSE_EXTRA_STEPS;
  } else {
    Serial.println("[MOTOR] Action must be o or f");
    return;
  }

  digitalWrite(EN_PIN, LOW);
  delayMicroseconds(50);

  Serial.print("[MOTOR] ▶ "); Serial.print(axis);
  Serial.print(action=='o' ? " OPEN" : " CLOSE");
  Serial.print(" | steps="); Serial.println(plannedSteps);

  unsigned long t0 = millis();
  long stepsRemaining = plannedSteps;

  while (stepsRemaining > 0) {
    if (endPressed(endPin)) {
      Serial.println("[MOTOR] 🛑 ENDSTOP");
      break;
    }

    long done = plannedSteps - stepsRemaining;
    float v = speedTrapezoid(done, stepsRemaining);
    unsigned long delayUs = (unsigned long)(1000000.0f / v);
    if (delayUs < 2) delayUs = 2;

    pulseStep(stepPin, delayUs);
    stepsRemaining--;
  }

  digitalWrite(EN_PIN, HIGH);

  float t = (millis() - t0)/1000.0f;
  Serial.print("[MOTOR] ✅ DONE in "); Serial.print(t,2);
  Serial.print(" s"); Serial.println();
}

// ==================== SETUP ====================
void setup() {
  Serial.begin(9600);
  while (!Serial) { ; }

  // ===== RFID SETUP =====
  SPI.begin();
  rfid.PCD_Init();
  
  for (byte i = 0; i < 4; i++) {
    lastUID[i] = 255;
  }

  // ===== MOTOR SETUP =====
  pinMode(EN_PIN, OUTPUT);
  digitalWrite(EN_PIN, HIGH);

  pinMode(STEP_X, OUTPUT); pinMode(DIR_X, OUTPUT); pinMode(END_X, INPUT_PULLUP);
  pinMode(STEP_Y, OUTPUT); pinMode(DIR_Y, OUTPUT); pinMode(END_Y, INPUT_PULLUP);
  pinMode(STEP_Z, OUTPUT); pinMode(DIR_Z, OUTPUT); pinMode(END_Z, INPUT_PULLUP);
  pinMode(STEP_A, OUTPUT); pinMode(DIR_A, OUTPUT); pinMode(END_A, INPUT_PULLUP);

  digitalWrite(STEP_X, LOW);
  digitalWrite(STEP_Y, LOW);
  digitalWrite(STEP_Z, LOW);
  digitalWrite(STEP_A, LOW);

  if (Vmax_open  > VMAX_CAP)  Vmax_open  = VMAX_CAP;
  if (accel_open > ACCEL_CAP) accel_open = ACCEL_CAP;
  if (Vmax_close > VMAX_CAP)  Vmax_close = VMAX_CAP;
  if (accel_close> ACCEL_CAP) accel_close= ACCEL_CAP;

  Serial.println("=====================================");
  Serial.println("SERVANTE INTELLIGENTE - COMPLETE V1");
  Serial.println("=====================================");
  Serial.println("[MOTOR] BOOT OK.");
  Serial.println("[MOTOR] Commands: xo xf yo yf zo zf ao af | stop=s | e=raw endstops");
  Serial.println("[RFID] En attente d'une carte ou badge...");

  autoCloseAllTogether();

  Serial.println("[MOTOR] READY.");
  Serial.println("System ready for RFID and motor commands.");
}

// ==================== LOOP ====================
void loop() {
  // Check for RFID cards
  readRFID();

  // Check for motor commands via Serial
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    
    // Only process if it's not a UID message (avoid processing our own RFID output)
    if (!cmd.startsWith("UID:")) {
      processMotorCommand(cmd);
    }
  }

  delay(50); // Small delay to prevent overwhelming the system
}
