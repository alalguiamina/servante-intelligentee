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

#define END_PRESSED LOW

// ==================== CALIBRATION ====================
const int   stepsPerRev = 400;
const int   microstep   = 8;   // ✅ 1/8 microstepping
const float mmPerRev    = 8.0;

// 👉 course 28 cm
const long STROKE_MM = 280;

const float stepsPer_mm = (float)(stepsPerRev * microstep) / mmPerRev;
const long STEPS_STROKE = (long)(STROKE_MM * stepsPer_mm);

const long CLOSE_EXTRA_STEPS = 4000;

// ==================== VITESSE ====================
// stable et rapide (~6000 équivalent)
#define STEP_DELAY_US 80    // ouverture
#define STEP_DELAY_CLOSE_US 90

#define HOME_DELAY_US 150   // homing plus safe

// ==================== STRUCT ====================
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

// ==================== UTILS ====================
inline bool endPressed(int pin) {
  return (digitalRead(pin) == END_PRESSED);
}

void pulseStep(int pin, unsigned int delayUs) {
  digitalWrite(pin, HIGH);
  delayMicroseconds(5);
  digitalWrite(pin, LOW);
  delayMicroseconds(delayUs);
}

// ==================== HOMING (SANS LIMITE) ====================
void autoCloseAllTogether() {

  Serial.println("HOMING...");

  // ✅ sens validé : fermeture = HIGH
  for (int i=0;i<4;i++) digitalWrite(M[i].dirPin, HIGH);

  digitalWrite(EN_PIN, LOW);
  delayMicroseconds(50);

  bool done[4] = {false,false,false,false};
  uint8_t stable[4] = {0,0,0,0};

  while (!(done[0] && done[1] && done[2] && done[3])) {

    for (int i=0;i<4;i++) {
      if (done[i]) continue;

      if (endPressed(M[i].endPin)) {
        if (++stable[i] >= 3) {
          done[i] = true;
          Serial.print("OK ");
          Serial.println(M[i].id);
        }
      } else stable[i] = 0;
    }

    for (int i=0;i<4;i++)
      if (!done[i]) digitalWrite(M[i].stepPin, HIGH);

    delayMicroseconds(5);

    for (int i=0;i<4;i++)
      if (!done[i]) digitalWrite(M[i].stepPin, LOW);

    delayMicroseconds(HOME_DELAY_US);
  }

  digitalWrite(EN_PIN, HIGH);
  Serial.println("HOMING DONE");
}

// ==================== MOVE ====================
void runMove(char axis, char action) {

  int stepPin=-1, dirPin=-1, endPin=-1;

  for (int i=0;i<4;i++) {
    if (M[i].id == axis) {
      stepPin = M[i].stepPin;
      dirPin  = M[i].dirPin;
      endPin  = M[i].endPin;
      break;
    }
  }

  if (stepPin == -1) return;

  long steps;
  unsigned int speedDelay;

  // ================= OPEN =================
  if (action=='o') {
    digitalWrite(dirPin, LOW);   // ✅ ouverture
    steps = STEPS_STROKE;
    speedDelay = STEP_DELAY_US;
  }

  // ================= CLOSE =================
  else if (action=='f') {
    digitalWrite(dirPin, HIGH);  // ✅ fermeture
    steps = STEPS_STROKE + CLOSE_EXTRA_STEPS;
    speedDelay = STEP_DELAY_CLOSE_US;
  }
  else return;

  digitalWrite(EN_PIN, LOW);
  delayMicroseconds(50);

  for (long i=0; i<steps; i++) {

    // ✅ capteur ignoré en ouverture
    if (action=='f' && endPressed(endPin)) {
      Serial.println("ENDSTOP");
      break;
    }

    pulseStep(stepPin, speedDelay);
  }

  digitalWrite(EN_PIN, HIGH);
}

// ==================== SETUP ====================
void setup() {

  Serial.begin(9600);

  pinMode(EN_PIN, OUTPUT);
  digitalWrite(EN_PIN, HIGH);

  for (int i=0;i<4;i++) {
    pinMode(M[i].stepPin, OUTPUT);
    pinMode(M[i].dirPin, OUTPUT);
    pinMode(M[i].endPin, INPUT_PULLUP);
  }

  Serial.println("READY");

  autoCloseAllTogether();
}

// ==================== LOOP ====================
void loop() {

  if (!Serial.available()) return;

  String cmd = Serial.readStringUntil('\n');
  cmd.trim();
  cmd.toLowerCase();

  if (cmd.length() < 2) return;

  runMove(cmd.charAt(0), cmd.charAt(1));
} 