#include <Arduino.h>
#include <math.h>

// ==================== PINS ====================
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
// You confirmed: pressed = 0
#define END_PRESSED LOW

// ==================== CALIBRATION ====================
const int   stepsPerRev = 400;
const int   microstep   = 2;
const float mmPerRev    = 8.0;

const float stepsPer_mm = (float)(stepsPerRev * microstep) / mmPerRev;

const long STROKE_MM     = 400;                     // 40 cm fixed
const long STEPS_STROKE  = (long)(STROKE_MM * stepsPer_mm);
const long MAX_CLOSE_STEPS = 500000;                    // Close until endstop (very large limit)
const unsigned long MAX_CLOSE_TIME_MS = 120000;         // 120 sec safety timeout for close

// ==================== SPEED PROFILES ====================
float Vmax_open  = 12000.0f;
float accel_open = 25000.0f;

float Vmax_close  = 0.90f * 12000.0f;
float accel_close = 0.90f * 25000.0f;

// Active profile
float Vmax  = 4500.0f;
float accel = 4000.0f;

const float MIN_SPEED = 250.0f;
const float VMAX_CAP  = 20000.0f;
const float ACCEL_CAP = 25000.0f;

// ==================== BOOT RECOVERY (ALL AXES CLOSE TOGETHER) ====================
const unsigned int HOME_DELAY_US      = 200;   // lower=faster
const unsigned long HOME_TIMEOUT_MS   = 5000;  // 5 sec timeout

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

// ==================== UTILS ====================
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
  Serial.print("RAW endstops: ");
  Serial.print("X="); Serial.print(digitalRead(END_X));
  Serial.print(" Y="); Serial.print(digitalRead(END_Y));
  Serial.print(" Z="); Serial.print(digitalRead(END_Z));
  Serial.print(" A="); Serial.println(digitalRead(END_A));
}

// ==================== BOOT RECOVERY: CLOSE ALL TOGETHER (FIXED) ====================
// Non-blocking debounce per axis using counters
void autoCloseAllTogether() {
  Serial.println("=== RECOVERY: close all axes to endstops (simultaneous) ===");

  // CLOSE direction for all
  for (int i=0;i<4;i++) digitalWrite(M[i].dirPin, LOW);

  // enable driver
  digitalWrite(EN_PIN, LOW);
  delayMicroseconds(50);

  bool done[4] = {false,false,false,false};
  uint8_t stableCnt[4] = {0,0,0,0};  // debounce counters (0..3)

  unsigned long t0 = millis();

  while (!(done[0] && done[1] && done[2] && done[3])) {
    if (millis() - t0 > HOME_TIMEOUT_MS) {
      // Force any remaining axis to done (no endstop detected)
      for (int i=0;i<4;i++) {
        if (!done[i]) {
          done[i] = true;
          Serial.print("⏭️ Skipped axis ");
          Serial.println(M[i].id);
        }
      }
      break;
    }

    // ----- Update debounce per axis -----
    for (int i=0;i<4;i++) {
      if (done[i]) continue;

      if (endPressed(M[i].endPin)) {
        if (stableCnt[i] < 3) stableCnt[i]++;
        if (stableCnt[i] >= 3) {
          done[i] = true;
          Serial.print("✅ Endstop reached for axis ");
          Serial.println(M[i].id);
        }
      } else {
        stableCnt[i] = 0;
      }
    }

    // ----- STEP only axes not done -----
    for (int i=0;i<4;i++) {
      if (!done[i]) digitalWrite(M[i].stepPin, HIGH);
    }
    delayMicroseconds(HOME_DELAY_US);
    for (int i=0;i<4;i++) {
      if (!done[i]) digitalWrite(M[i].stepPin, LOW);
    }
    delayMicroseconds(HOME_DELAY_US);
  }

  digitalWrite(EN_PIN, HIGH); // disable after recovery (optional)

  if (done[0] && done[1] && done[2] && done[3]) {
    Serial.println("✅ RECOVERY OK (all endstops reached)");
  } else {
    Serial.println("⚠️ RECOVERY finished with warnings");
  }
}

// ==================== SETUP ====================
void setup() {
  Serial.begin(9600);

  pinMode(EN_PIN, OUTPUT);
  digitalWrite(EN_PIN, HIGH);

  // pins
  pinMode(STEP_X, OUTPUT); pinMode(DIR_X, OUTPUT); pinMode(END_X, INPUT_PULLUP);
  pinMode(STEP_Y, OUTPUT); pinMode(DIR_Y, OUTPUT); pinMode(END_Y, INPUT_PULLUP);
  pinMode(STEP_Z, OUTPUT); pinMode(DIR_Z, OUTPUT); pinMode(END_Z, INPUT_PULLUP);
  pinMode(STEP_A, OUTPUT); pinMode(DIR_A, OUTPUT); pinMode(END_A, INPUT_PULLUP);

  digitalWrite(STEP_X, LOW);
  digitalWrite(STEP_Y, LOW);
  digitalWrite(STEP_Z, LOW);
  digitalWrite(STEP_A, LOW);

  // caps
  if (Vmax_open  > VMAX_CAP)  Vmax_open  = VMAX_CAP;
  if (accel_open > ACCEL_CAP) accel_open = ACCEL_CAP;
  if (Vmax_close > VMAX_CAP)  Vmax_close = VMAX_CAP;
  if (accel_close> ACCEL_CAP) accel_close= ACCEL_CAP;

  Serial.println("BOOT OK.");
  Serial.println("Commands: xo xf yo yf zo zf ao af | stop=s | e=raw endstops");

  autoCloseAllTogether();

  Serial.println("READY.");
}

// ==================== LOOP ====================
void loop() {
  if (!Serial.available()) return;

  String cmd = Serial.readStringUntil('\n');
  cmd.trim(); cmd.toLowerCase();

  unsigned long now = millis();
  if (cmd == lastCmd && (now - lastCmdMs) < 250) {
    Serial.println("⚠️ Duplicate command ignored");
    return;
  }
  lastCmd = cmd; lastCmdMs = now;

  if (cmd == "e") { printEndstopsRaw(); return; }

  if (cmd == "s" || cmd == "stop") {
    digitalWrite(EN_PIN, HIGH);
    Serial.println("🛑 STOP");
    return;
  }

  if (cmd.length() < 2) { Serial.println("Format: xo/xf/..."); return; }

  char axis = cmd.charAt(0);
  char action = cmd.charAt(1);

  int stepPin=-1, dirPin=-1, endPin=-1;
  if (axis=='x') { stepPin=STEP_X; dirPin=DIR_X; endPin=END_X; }
  else if (axis=='y') { stepPin=STEP_Y; dirPin=DIR_Y; endPin=END_Y; }
  else if (axis=='z') { stepPin=STEP_Z; dirPin=DIR_Z; endPin=END_Z; }
  else if (axis=='a') { stepPin=STEP_A; dirPin=DIR_A; endPin=END_A; }
  else { Serial.println("Axis must be x y z a"); return; }

  if (endPressed(endPin)) {
    Serial.println("🛑 Endstop already pressed -> refusing motion");
    return;
  }

  long plannedSteps = 0;
  bool closeMotor = false;

  if (action=='o') {
    Vmax  = Vmax_open;
    accel = accel_open;
    digitalWrite(dirPin, LOW);
    plannedSteps = STEPS_STROKE;
    closeMotor = false;
  } else if (action=='f') {
    Vmax  = Vmax_close;
    accel = accel_close;
    digitalWrite(dirPin, HIGH);
    plannedSteps = MAX_CLOSE_STEPS;  // Continue until endstop
    closeMotor = true;
  } else {
    Serial.println("Action must be o or f");
    return;
  }

  digitalWrite(EN_PIN, LOW);
  delayMicroseconds(50);

  Serial.print("▶ "); Serial.print(axis);
  Serial.print(action=='o' ? " OPEN" : " CLOSE");
  Serial.print(" | steps="); Serial.println(plannedSteps);

  unsigned long t0 = millis();
  long stepsRemaining = plannedSteps;

  while (stepsRemaining > 0) {
    // Safety timeout for close operations
    if (closeMotor && (millis() - t0) > MAX_CLOSE_TIME_MS) {
      Serial.println("⏱️ CLOSE TIMEOUT - safety stop");
      break;
    }

    if (endPressed(endPin)) {
      Serial.println("🛑 ENDSTOP");
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
  Serial.print("✅ DONE in "); Serial.print(t,2);
  Serial.print(" s"); Serial.println();
}