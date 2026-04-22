// =====================================
// SERVANTE INTELLIGENTE - CODE RFID V2
// Envoie: UID:0A1B2C3D (au lieu de logs séparés)
// =====================================

#include <SPI.h>
#include <MFRC522.h>

// -------------------- PINS --------------------
#define SS_PIN  53      // SDA du RC522
#define RST_PIN 9       // RST du RC522

MFRC522 rfid(SS_PIN, RST_PIN);

// Tableau pour mémoriser le dernier UID lu
byte lastUID[4];
bool uidChanged = true;
unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 3000; // Renvoyer toutes les 3 secondes

void setup() {
  Serial.begin(9600);
  while (!Serial) { ; }

  SPI.begin();
  rfid.PCD_Init();

  Serial.println("--- Servante Intelligente - RFID Reader V2 ---");
  Serial.println("En attente d'une carte ou badge...");
  
  // Initialiser lastUID avec des valeurs impossibles
  for (byte i = 0; i < 4; i++) {
    lastUID[i] = 255;
  }
}

void loop() {
  readRFID();
  delay(200);
}

// -------------------- FONCTIONS --------------------

// Lecture d'une carte et envoi de son UID au format UID:XXYYZZ...
void readRFID() {
  // Y a-t-il une nouvelle carte ?
  if (!rfid.PICC_IsNewCardPresent())
    return;

  // Peut-on lire son UID ?
  if (!rfid.PICC_ReadCardSerial())
    return;

  // Est-ce un nouvel UID ?
  uidChanged = false;
  for (byte i = 0; i < 4; i++) {
    if (rfid.uid.uidByte[i] != lastUID[i]) {
      uidChanged = true;
      break;
    }
  }

  // Vérifier si assez de temps s'est écoulé depuis le dernier envoi
  unsigned long currentTime = millis();
  bool shouldSend = uidChanged || (currentTime - lastSendTime >= SEND_INTERVAL);

  if (shouldSend) {
    // Sauvegarder le nouvel UID
    for (byte i = 0; i < 4; i++) {
      lastUID[i] = rfid.uid.uidByte[i];
    }

    // ⭐ NOUVEAU: Envoyer au format UID:XXYYZZ...
    Serial.print("UID:");
    printHex(rfid.uid.uidByte, rfid.uid.size);
    Serial.println();
    
    // Mettre à jour le temps du dernier envoi
    lastSendTime = currentTime;
  }

  // Arrêter la communication avec la carte
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

// Affiche un tableau d'octets en hexadécimal (format compact)
void printHex(byte *buffer, byte bufferSize) {
  for (byte i = 0; i < bufferSize; i++) {
    if (buffer[i] < 0x10) Serial.print("0");
    Serial.print(buffer[i], HEX);
  }
}
