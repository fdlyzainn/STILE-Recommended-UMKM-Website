import cv2
import mediapipe as mp

class HandTracker:

    def __init__(self,
                 mode=False,
                 maxHands=1,
                 detectionCon=0.7,
                 trackCon=0.7):

        self.mode = mode
        self.maxHands = maxHands
        self.detectionCon = detectionCon
        self.trackCon = trackCon

        self.mpHands = mp.solutions.hands

        self.hands = self.mpHands.Hands(
            static_image_mode=self.mode,
            max_num_hands=self.maxHands,
            min_detection_confidence=self.detectionCon,
            min_tracking_confidence=self.trackCon
        )

        self.mpDraw = mp.solutions.drawing_utils

    def findHands(self, img, draw=True):

        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        self.results = self.hands.process(rgb)

        if self.results.multi_hand_landmarks:

            for handLms in self.results.multi_hand_landmarks:

                if draw:
                    self.mpDraw.draw_landmarks(
                        img,
                        handLms,
                        self.mpHands.HAND_CONNECTIONS
                    )

        return img

    def findPosition(self, img):

        lmList = []

        if self.results.multi_hand_landmarks:

            hand = self.results.multi_hand_landmarks[0]

            h, w, c = img.shape

            for id, lm in enumerate(hand.landmark):

                cx = int(lm.x * w)
                cy = int(lm.y * h)

                lmList.append([id, cx, cy])

        return lmList