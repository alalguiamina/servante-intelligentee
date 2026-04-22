// =====================================
// SERVANTE INTELLIGENTE - V3
// =====================================
//
// CORRECTIFS v3
// ─────────────
//  1. MM_PER_REV = 8.0 (vis T8 : 4 filets × 2 mm = 8 mm/tour)
//     Ancienne valeur (2.0) × 4 fois trop de pas → moteurs indéfiniment.
//
//  2. Serial.read() char par char dans la boucle de mouvement
//     (Serial.readStringUntil bloquait 1 s si pas de '\n' → dérive temps)
//
//  3. Homing avec compteur de pas par axe (panne capteur détectée proprement)
//
// CALIBRATION
// ───────────
//  Moteur  : 0.9°/pas → 400 pas/tour
//  Driver  : 1/8 microstepping → 3 200 micropas/tour
//  Vis T8  : lead = 8 mm/tour  → STEPS_PER_MM = 3200/8 = 400 pas/mm
//  Course  : 340 mm → 136 000 micropas
//  Ouverture : course réduite à OPEN_STROKE_MM (modifiable)
//
// COMMANDES SÉRIE
// ───────────────
//  xo / xf / yo / yf / zo / zf / ao / af  — ouvre / ferme
//  home  — relancer le homing
//  s     — stop d'urgence (fonctionne même pendant un mouvement)
//  e     — état brut des fin de course
// =====================================

#include <SPI.h>
#include <MFRC522.h>
#include <math.h>

// ──────────────────────────────────────
//  STOP GLOBAL
// ──────────────────────────────────────
volatile bool STOP_REQUESTED = false;

// ──────────────────────────────────────
//  RFID  (NE PAS MODIFIER)
// ──────────────────────────────────────
#define SS_PIN   53
#define RST_PIN   9

MFRC522 rfid(SS_PIN, RST_PIN);

byte          lastUID[4];
unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 3000;

// ──────────────────────────────────────
//  BROCHES MOTEURS
// ──────────────────────────────────────
#define EN_PIN   14

#define STEP_X    2
#define DIR_X     3
#define END_X    26

#define STEP_Y    4
#define DIR_Y     5
#define END_Y    28

#define STEP_Z    6
#define DIR_Z     7
#define END_Z    30

#define STEP_A   22
#define DIR_A    24
#define END_A    32

#define END_ACTIVE  LOW
#define DIR_CLOSE   HIGH
#define DIR_OPEN    LOW

// ──────────────────────────────────────
//  CALIBRATION MÉCANIQUE  ← FIX ICI
// ──────────────────────────────────────
//
//  Vis T8 (diamètre 8 mm) : 4 filets × 2 mm de pas = 8 mm d'avance par tour.
//  Utiliser MM_PER_REV = 2.0 revenait à calculer 4× trop de pas → course infinie.
//
const int   STEPS_PER_REV = 400;    // moteur 0.9°
const int   MICROSTEP     = 8;      // driver 1/8
const float MM_PER_REV    = 8.0f;   // ← CORRIGÉ (était 2.0, doit être 8.0)

const float STEPS_PER_MM  = (float)(STEPS_PER_REV * MICROSTEP) / MM_PER_REV;
//                                   = 3200 / 8.0 = 400 pas/mm

// Course complète (fermeture / homing)
const float STROKE_MM     = 340.0f;
const long  STEPS_STROKE  = (long)(STROKE_MM * STEPS_PER_MM);   // 136 000 pas

// Course d'ouverture — peut être différente de la course totale
// 340 mm si tu veux ouvrir complètement, moins si tu veux une ouverture partielle.
const float OPEN_STROKE_MM = 340.0f;
const long  STEPS_OPEN     = (long)(OPEN_STROKE_MM * STEPS_PER_MM); // 136 000 pas

// Surmodulation fermeture pour garantir le contact capteur (= 8 mm)
const long  CLOSE_EXTRA_STEPS = (long)(8.0f * STEPS_PER_MM);    // 3 200 pas

// ──────────────────────────────────────
//  PROFILS DE VITESSE
// ──────────────────────────────────────

// Ouverture — trapèze doux
const float VMAX_OPEN   = 200000.0f;   // pas/s
const float ACCEL_OPEN  = 120000.0f;   // pas/s²

// Fermeture — trapèze avec décélération vers capteur
const float VMAX_CLOSE  = 200000.0f;  // pas/s
const float ACCEL_CLOSE =  120000.0f;  // pas/s²

// Plancher commun
const float MIN_SPEED   =   1000.0f;  // pas/s

// Homing — vitesse lente et constante
const float HOME_SPEED      = 2500.0f;
const unsigned long HOME_PERIOD_US = (unsigned long)(1000000.0f / HOME_SPEED); // 400 µs

// Sécurité homing : distance max avant déclaration de panne capteur
const long HOME_MAX_STEPS = (long)((STROKE_MM + 60.0f) * STEPS_PER_MM); // 160 000 pas

// ──────────────────────────────────────
//  STRUCTURE MOTEUR
// ──────────────────────────────────────
struct Motor {
  int  stepPin;
  int  dirPin;
  int  endPin;
  char id;
};

Motor M[4] = {
  { STEP_X, DIR_X, END_X, 'x' },
  { STEP_Y, DIR_Y, END_Y, 'y' },
  { STEP_Z, DIR_Z, END_Z, 'z' },
  { STEP_A, DIR_A, END_A, 'a' },
};

// ──────────────────────────────────────
//  UTILITAIRES
// ──────────────────────────────────────
inline bool endPressed(int pin) {
  return digitalRead(pin) == END_ACTIVE;
}

void pulseStep(int stepPin, unsigned long periodUs) {
  if (periodUs < 12) periodUs = 12;
  digitalWrite(stepPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(stepPin, LOW);
  delayMicroseconds(periodUs - 10);
}

// Profil trapézoïdal générique
float trapSpeed(long done, long remain, float vmax, float accel) {
  float v_up   = sqrtf(2.0f * accel * (float)done);
  float v_down = sqrtf(2.0f * accel * (float)remain);
  float v      = min(v_up, v_down);
  return constrain(v, MIN_SPEED, vmax);
}

// ──────────────────────────────────────
//  LECTURE SÉRIE NON BLOQUANTE  ← FIX
// ──────────────────────────────────────
//  Appelée dans les boucles de mouvement.
//  Lit UN seul char par appel → pas de blocage 1 s avec readStringUntil.
//  Positionne STOP_REQUESTED si 's' reçu.
void checkSerialStop() {
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == 's' || c == 'S') {
      STOP_REQUESTED = true;
    }
  }
}

// ──────────────────────────────────────
//  HOMING — tous axes simultanés
// ──────────────────────────────────────
void homeAll() {
  Serial.println("[HOMING] Démarrage...");

  STOP_REQUESTED = false;

  for (int i = 0; i < 4; i++)
    digitalWrite(M[i].dirPin, DIR_CLOSE);

  digitalWrite(EN_PIN, LOW);
  delayMicroseconds(50);

  bool    done[4]   = { false, false, false, false };
  bool    fault[4]  = { false, false, false, false };
  uint8_t stable[4] = { 0, 0, 0, 0 };
  long    steps[4]  = { 0, 0, 0, 0 };

  while (!(done[0] && done[1] && done[2] && done[3])) {

    // Vérification capteurs
    for (int i = 0; i < 4; i++) {
      if (done[i]) continue;

      if (endPressed(M[i].endPin)) {
        if (++stable[i] >= 3) {
          done[i] = true;
          Serial.print("[HOMING] OK  axe "); Serial.println(M[i].id);
        }
      } else {
        stable[i] = 0;
        // Sécurité : si le capteur ne se déclenche jamais
        if (++steps[i] >= HOME_MAX_STEPS) {
          done[i]  = true;
          fault[i] = true;
          Serial.print("[HOMING] ⚠ PANNE capteur axe "); Serial.println(M[i].id);
        }
      }
    }

    // Impulsions simultanées
    for (int i = 0; i < 4; i++)
      if (!done[i]) digitalWrite(M[i].stepPin, HIGH);
    delayMicroseconds(10);
    for (int i = 0; i < 4; i++)
      if (!done[i]) digitalWrite(M[i].stepPin, LOW);
    delayMicroseconds(HOME_PERIOD_US - 10);
  }

  digitalWrite(EN_PIN, HIGH);

  if (!fault[0] && !fault[1] && !fault[2] && !fault[3])
    Serial.println("[HOMING] Tous les axes calés. PRÊT.");
  else
    Serial.println("[HOMING] Terminé avec pannes — vérifier fin de course.");
}

// ──────────────────────────────────────
//  OUVERTURE — trapèze + stop réactif
// ──────────────────────────────────────
void openAxis(int idx) {
  Motor &m = M[idx];
  Serial.print("[MOTOR] OUVERTURE axe "); Serial.println(m.id);

  STOP_REQUESTED = false;

  digitalWrite(m.dirPin, DIR_OPEN);
  digitalWrite(EN_PIN, LOW);
  delayMicroseconds(50);

  long remain = STEPS_OPEN;   // ← course fixe, calculée depuis OPEN_STROKE_MM

  unsigned long t0 = millis();

  while (remain > 0) {

    checkSerialStop();          // lecture non bloquante ← FIX
    if (STOP_REQUESTED) {
      Serial.println("[STOP] Ouverture interrompue");
      break;
    }

    long  done = STEPS_OPEN - remain;
    float v    = trapSpeed(done, remain, VMAX_OPEN, ACCEL_OPEN);
    pulseStep(m.stepPin, (unsigned long)(1000000.0f / v));
    remain--;
  }

  digitalWrite(EN_PIN, HIGH);

  if (!STOP_REQUESTED) {
    Serial.print("[MOTOR] Ouverture terminée en ");
    Serial.print((millis() - t0) / 1000.0f, 2);
    Serial.println(" s");
  }
}

// ──────────────────────────────────────
//  FERMETURE — trapèze, stop sur capteur
// ──────────────────────────────────────
void closeAxis(int idx) {
  Motor &m = M[idx];
  Serial.print("[MOTOR] FERMETURE axe "); Serial.println(m.id);

  STOP_REQUESTED = false;

  digitalWrite(m.dirPin, DIR_CLOSE);
  digitalWrite(EN_PIN, LOW);
  delayMicroseconds(50);

  long plannedSteps = STEPS_STROKE + CLOSE_EXTRA_STEPS;
  long remain       = plannedSteps;

  unsigned long t0 = millis();

  while (remain > 0) {

    if (endPressed(m.endPin)) {
      Serial.println("[MOTOR] Fin de course atteint.");
      break;
    }

    checkSerialStop();
    if (STOP_REQUESTED) {
      Serial.println("[STOP] Fermeture interrompue");
      break;
    }

    long  done = plannedSteps - remain;
    float v    = trapSpeed(done, remain, VMAX_CLOSE, ACCEL_CLOSE);
    pulseStep(m.stepPin, (unsigned long)(1000000.0f / v));
    remain--;
  }

  digitalWrite(EN_PIN, HIGH);

  if (!STOP_REQUESTED) {
    Serial.print("[MOTOR] Fermeture terminée en ");
    Serial.print((millis() - t0) / 1000.0f, 2);
    Serial.println(" s");
  }
}

// ──────────────────────────────────────
//  RFID  (NE PAS MODIFIER)
// ──────────────────────────────────────
void printHex(byte *buf, byte len) {
  for (byte i = 0; i < len; i++) {
    if (buf[i] < 0x10) Serial.print("0");
    Serial.print(buf[i], HEX);
  }
}

void readRFID() {
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial())   return;

  bool changed = false;
  for (byte i = 0; i < 4; i++)
    if (rfid.uid.uidByte[i] != lastUID[i]) { changed = true; break; }

  unsigned long now = millis();
  if (changed || (now - lastSendTime >= SEND_INTERVAL)) {
    for (byte i = 0; i < 4; i++) lastUID[i] = rfid.uid.uidByte[i];
    Serial.print("UID:");
    printHex(rfid.uid.uidByte, rfid.uid.size);
    Serial.println();
    lastSendTime = now;
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

// ──────────────────────────────────────
//  PARSEUR DE COMMANDES SÉRIE
// ──────────────────────────────────────
void processCommand(String cmd) {
  cmd.trim();
  cmd.toLowerCase();

  if (cmd == "home") { homeAll(); return; }

  if (cmd == "s" || cmd == "stop") {
    STOP_REQUESTED = true;
    digitalWrite(EN_PIN, HIGH);
    Serial.println("[STOP] Moteurs désactivés");
    return;
  }

  if (cmd == "e") {
    Serial.print("[FDC] X="); Serial.print(digitalRead(END_X));
    Serial.print(" Y="); Serial.print(digitalRead(END_Y));
    Serial.print(" Z="); Serial.print(digitalRead(END_Z));
    Serial.print(" A="); Serial.println(digitalRead(END_A));
    return;
  }

  if (cmd.length() < 2) {
    Serial.println("[CMD] xo xf yo yf zo zf ao af | home | s | e");
    return;
  }

  char axis   = cmd.charAt(0);
  char action = cmd.charAt(1);

  int idx = -1;
  for (int i = 0; i < 4; i++)
    if (M[i].id == axis) { idx = i; break; }

  if (idx < 0) { Serial.println("[CMD] Axe inconnu (x/y/z/a)"); return; }

  if      (action == 'o') openAxis(idx);
  else if (action == 'f') closeAxis(idx);
  else    Serial.println("[CMD] Action : o = ouverture, f = fermeture");
}

// ──────────────────────────────────────
//  SETUP
// ──────────────────────────────────────
void setup() {
  Serial.begin(9600);
  while (!Serial) {}

  SPI.begin();
  rfid.PCD_Init();
  for (byte i = 0; i < 4; i++) lastUID[i] = 0xFF;

  pinMode(EN_PIN, OUTPUT);
  digitalWrite(EN_PIN, HIGH);

  for (int i = 0; i < 4; i++) {
    pinMode(M[i].stepPin, OUTPUT);
    pinMode(M[i].dirPin,  OUTPUT);
    pinMode(M[i].endPin,  INPUT_PULLUP);
    digitalWrite(M[i].stepPin, LOW);
  }

  Serial.println("=====================================");
  Serial.println("  SERVANTE INTELLIGENTE - V3");
  Serial.println("=====================================");
  Serial.print(  "  STEPS_PER_MM = "); Serial.println(STEPS_PER_MM);
  Serial.print(  "  STEPS_OPEN   = "); Serial.println(STEPS_OPEN);
  Serial.print(  "  STEPS_STROKE = "); Serial.println(STEPS_STROKE);
  Serial.println("  CMD : xo xf yo yf zo zf ao af | home | s | e");
  Serial.println();

  homeAll();

  Serial.println("SYSTÈME PRÊT.");
}

// ──────────────────────────────────────
//  LOOP
// ──────────────────────────────────────
void loop() {
  readRFID();

  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    if (!cmd.startsWith("UID:")) {
      processCommand(cmd);
    }
  }

  delay(50);
}
