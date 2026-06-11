import cv2
import time
import pyautogui

from hand_tracker import HandTracker
from mouse_controller import MouseController

cap = cv2.VideoCapture(0)

tracker = HandTracker()

screen_w, screen_h = pyautogui.size()

prev_time = 0

control_enabled = True

while True:

    success, img = cap.read()

    if not success:
        break

    img = cv2.flip(img,1)

    img = tracker.findHands(img)

    lmList = tracker.findPosition(img)

    status = "READY"

    if len(lmList) != 0:

        ix, iy = lmList[8][1], lmList[8][2]
        tx, ty = lmList[4][1], lmList[4][2]
        mx, my = lmList[12][1], lmList[12][2]

        frame_h, frame_w, _ = img.shape

        screen_x = screen_w / frame_w * ix
        screen_y = screen_h / frame_h * iy

        if control_enabled:

            MouseController.move(screen_x, screen_y)

        click_dist = MouseController.distance(
            tx, ty,
            ix, iy
        )

        right_dist = MouseController.distance(
            tx, ty,
            mx, my
        )

        if click_dist < 35:

            status = "LEFT CLICK"

            MouseController.left_click()

            time.sleep(0.3)

        elif right_dist < 35:

            status = "RIGHT CLICK"

            MouseController.right_click()

            time.sleep(0.3)

        elif click_dist < 60 and right_dist < 60:

            status = "DOUBLE CLICK"

            MouseController.double_click()

            time.sleep(0.5)

        if iy < 100:

            status = "SCROLL UP"

            MouseController.scroll_up()

        elif iy > 350:

            status = "SCROLL DOWN"

            MouseController.scroll_down()

        pinky_y = lmList[20][2]

        if abs(pinky_y - iy) < 20:

            control_enabled = not control_enabled

            status = "PAUSE" if not control_enabled else "RESUME"

            time.sleep(1)

    current_time = time.time()

    fps = 1/(current_time-prev_time) if prev_time != 0 else 0

    prev_time = current_time

    cv2.putText(
        img,
        f"FPS : {int(fps)}",
        (10,40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0,255,0),
        2
    )

    cv2.putText(
        img,
        f"STATUS : {status}",
        (10,80),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (255,0,0),
        2
    )

    cv2.imshow("AI Virtual Mouse", img)

    key = cv2.waitKey(1)

    if key == 27:
        break

cap.release()
cv2.destroyAllWindows()